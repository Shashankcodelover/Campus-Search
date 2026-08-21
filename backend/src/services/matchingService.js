/**
 * matchingService
 * ----------------
 * Owns the buyer-request -> seller-accept/decline flow discussed in planning:
 *   1. Buyer requests a listing -> seller is notified (no payment, no contact shared yet)
 *   2. Seller accepts (commits a delivery day) or declines
 *   3. If declined / no response inside RESPONSE_WINDOW_MS, request auto-expires
 *      and the listing reopens for the next buyer
 *   4. Only on accept does the buyer get the seller's contact info
 *   5. Buyer confirms delivery -> payment QR unlocks in the UI (handled client-side,
 *      this service just flips status so the UI knows to show it)
 *   6. If accepted but never confirmed delivered within NO_SHOW_WINDOW_MS,
 *      auto-mark as no_show and reopen the listing (no-show edge case)
 *
 * Concurrency / race-condition handling:
 *   SQLite transactions here guarantee only one buyer can hold an active
 *   request on a listing at a time. A second buyer requesting a
 *   'pending' listing is rejected at the DB layer, not just in the UI.
 */
const { db } = require("../db");
const { v4: uuid } = require("uuid");
const notificationService = require("./notificationService");

const RESPONSE_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours for seller to respond
const NO_SHOW_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // 3 days after accept to confirm delivery

function createRequest(listingId, buyerId) {
  const tx = db.transaction(() => {
    const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(listingId);
    if (!listing) throw new HttpError(404, "Listing not found");
    if (listing.status !== "available") {
      throw new HttpError(409, "This item is no longer available — someone else already has an active request on it.");
    }
    if (listing.seller_id === buyerId) {
      throw new HttpError(400, "You can't request your own listing.");
    }

    const id = uuid();
    db.prepare(
      `INSERT INTO requests (id, listing_id, buyer_id, status) VALUES (?, ?, ?, 'notified')`
    ).run(id, listingId, buyerId);

    db.prepare(`UPDATE listings SET status = 'pending', updated_at = datetime('now') WHERE id = ?`).run(listingId);

    return id;
  });

  const requestId = tx();
  const request = getRequest(requestId);
  const seller = db.prepare("SELECT * FROM users WHERE id = ?").get(request.seller_id);

  notificationService.notify(seller, {
    type: "new_request",
    message: `${request.item_name}: a buyer wants this item. Accept or decline within 2 hours.`,
    requestId,
  });

  return request;
}

function respondToRequest(requestId, sellerId, decision, deliveryDay) {
  const tx = db.transaction(() => {
    const request = getRequestRaw(requestId);
    if (!request) throw new HttpError(404, "Request not found");

    const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(request.listing_id);
    if (listing.seller_id !== sellerId) throw new HttpError(403, "Only the seller can respond to this request.");
    if (request.status !== "notified") throw new HttpError(409, "This request has already been resolved.");

    if (decision === "accept") {
      if (!deliveryDay) throw new HttpError(400, "A delivery day is required to accept.");
      db.prepare(
        `UPDATE requests SET status = 'accepted', delivery_day = ?, accepted_at = datetime('now'), responded_at = datetime('now') WHERE id = ?`
      ).run(deliveryDay, requestId);
      // listing stays 'pending' — contact now revealed to buyer, but slot isn't free until delivered/cancelled
    } else {
      db.prepare(`UPDATE requests SET status = 'declined', responded_at = datetime('now') WHERE id = ?`).run(requestId);
      db.prepare(`UPDATE listings SET status = 'available', updated_at = datetime('now') WHERE id = ?`).run(request.listing_id);
    }
  });

  tx();
  const updated = getRequest(requestId);

  if (decision === "accept") {
    const buyer = db.prepare("SELECT * FROM users WHERE id = ?").get(updated.buyer_id);
    notificationService.notify(buyer, {
      type: "request_accepted",
      message: `${updated.item_name}: accepted for ${deliveryDay}. Seller contact is now visible in the app.`,
      requestId,
    });
  }

  return updated;
}

function confirmDelivered(requestId, buyerId) {
  const request = getRequestRaw(requestId);
  if (!request) throw new HttpError(404, "Request not found");
  if (request.buyer_id !== buyerId) throw new HttpError(403, "Only the buyer can confirm delivery.");
  if (request.status !== "accepted") throw new HttpError(409, "This request isn't in an accepted state.");

  db.prepare(`UPDATE requests SET status = 'delivered', delivered_confirmed_at = datetime('now') WHERE id = ?`).run(requestId);
  db.prepare(`UPDATE listings SET status = 'claimed', updated_at = datetime('now') WHERE id = (SELECT listing_id FROM requests WHERE id = ?)`).run(requestId);

  // Record the platform fee owed by the seller — flat, small, batched (not charged mid-transaction)
  const listing = db.prepare(`SELECT l.* FROM listings l JOIN requests r ON r.listing_id = l.id WHERE r.id = ?`).get(requestId);
  const FLAT_FEE = 3; // ₹3 flat, absorbed by seller — see README revenue model notes
  db.prepare(`INSERT INTO fee_ledger (id, request_id, seller_id, amount) VALUES (?, ?, ?, ?)`)
    .run(uuid(), requestId, listing.seller_id, FLAT_FEE);

  return getRequest(requestId);
}

/**
 * Sweep job — run on a schedule (see server.js cron section).
 * Handles two timeout edge cases in one pass:
 *  - seller never responded -> auto-decline, reopen listing
 *  - seller accepted but buyer never confirmed delivery -> mark no_show, reopen listing
 */
function sweepExpiredRequests() {
  const now = Date.now();

  const stuckNotified = db.prepare(`SELECT * FROM requests WHERE status = 'notified'`).all();
  for (const r of stuckNotified) {
    if (now - new Date(r.created_at + "Z").getTime() > RESPONSE_WINDOW_MS) {
      db.prepare(`UPDATE requests SET status = 'expired', responded_at = datetime('now') WHERE id = ?`).run(r.id);
      db.prepare(`UPDATE listings SET status = 'available', updated_at = datetime('now') WHERE id = ?`).run(r.listing_id);
    }
  }

  const stuckAccepted = db.prepare(`SELECT * FROM requests WHERE status = 'accepted'`).all();
  for (const r of stuckAccepted) {
    if (now - new Date(r.accepted_at + "Z").getTime() > NO_SHOW_WINDOW_MS) {
      db.prepare(`UPDATE requests SET status = 'no_show' WHERE id = ?`).run(r.id);
      db.prepare(`UPDATE listings SET status = 'available', updated_at = datetime('now') WHERE id = ?`).run(r.listing_id);
      // Optionally: flag buyer's account after repeated no-shows — left as a follow-up rule, see roadmap.
    }
  }
}

function getRequest(id) {
  return db
    .prepare(
      `SELECT r.*, l.item_name, l.seller_id, l.price
       FROM requests r JOIN listings l ON l.id = r.listing_id WHERE r.id = ?`
    )
    .get(id);
}
function getRequestRaw(id) {
  return db.prepare("SELECT * FROM requests WHERE id = ?").get(id);
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = { createRequest, respondToRequest, confirmDelivered, sweepExpiredRequests, HttpError };
