const express = require("express");
const { requireAuth } = require("../middleware/auth");
const matchingService = require("../services/matchingService");
const { db } = require("../db");

const router = express.Router();

// Buyer requests a listing
router.post("/", requireAuth, (req, res) => {
  try {
    const { listing_id, quantity = 1 } = req.body;
    const request = matchingService.createRequest(listing_id, req.user.id, parseInt(quantity, 10));
    res.status(201).json(request);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// Seller accepts or declines
router.patch("/:id/respond", requireAuth, (req, res) => {
  try {
    const { decision, delivery_day } = req.body; // decision: 'accept' | 'decline'
    const updated = matchingService.respondToRequest(req.params.id, req.user.id, decision, delivery_day);
    res.json(updated);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// Buyer confirms they received the item -> unlocks payment QR client-side
router.patch("/:id/confirm-delivered", requireAuth, (req, res) => {
  try {
    const updated = matchingService.confirmDelivered(req.params.id, req.user.id);
    res.json(updated);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// Seller's contact — only returned if the request has been accepted, and only to that buyer
router.get("/:id/contact", requireAuth, (req, res) => {
  const request = db.prepare("SELECT * FROM requests WHERE id = ?").get(req.params.id);
  if (!request) return res.status(404).json({ error: "Request not found." });
  if (request.buyer_id !== req.user.id) return res.status(403).json({ error: "Not your request." });
  if (request.status !== "accepted" && request.status !== "delivered") {
    return res.status(403).json({ error: "Contact is only shared after the seller accepts." });
  }

  const listing = db.prepare("SELECT seller_id FROM listings WHERE id = ?").get(request.listing_id);
  const seller = db.prepare("SELECT name, phone, department FROM users WHERE id = ?").get(listing.seller_id);
  res.json(seller);
});

// Mine — for both buyer and seller dashboards
router.get("/mine", requireAuth, (req, res) => {
  const asBuyer = db
    .prepare(`SELECT r.*, l.item_name, l.listing_type, l.return_by FROM requests r JOIN listings l ON l.id = r.listing_id WHERE r.buyer_id = ? ORDER BY r.created_at DESC`)
    .all(req.user.id);
  const asSeller = db
    .prepare(
      `SELECT r.*, l.item_name, l.listing_type, l.return_by FROM requests r JOIN listings l ON l.id = r.listing_id WHERE l.seller_id = ? ORDER BY r.created_at DESC`
    )
    .all(req.user.id);
  res.json({ asBuyer, asSeller });
});

module.exports = router;
