const express = require("express");
const { v4: uuid } = require("uuid");
const { db } = require("../db");
const { requireAuth } = require("../middleware/auth");
const moderationService = require("../services/moderationService");
const notificationService = require("../services/notificationService");

const router = express.Router();
const LISTING_LIFETIME_DAYS = 60; // stale-listing sweep, see roadmap "listing decay" edge case

// GET /api/listings?search=&category=&status=available&sort=newest&min_price=&max_price=&condition=
router.get("/", async (req, res) => {
  const {
    search = "",
    category = "All",
    status = "available",
    sort = "newest",
    min_price,
    max_price,
    condition,
  } = req.query;

  let query = `
    SELECT l.*, u.name as seller_name, u.department as seller_department, u.year as seller_year,
           u.verified as seller_verified, u.rating_avg as seller_rating, u.rating_count as seller_rating_count
    FROM listings l JOIN users u ON u.id = l.seller_id
    WHERE l.moderation_status != 'removed'
  `;
  const params = [];

  if (status !== "all") {
    query += " AND l.status = ?";
    params.push(status);
  }
  if (category !== "All") {
    query += " AND l.category = ?";
    params.push(category);
  }
  if (search) {
    query += " AND (l.item_name LIKE ? OR l.description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  if (min_price !== undefined && min_price !== "") {
    query += " AND l.price >= ?";
    params.push(Number(min_price));
  }
  if (max_price !== undefined && max_price !== "") {
    query += " AND l.price <= ?";
    params.push(Number(max_price));
  }
  if (condition) {
    query += " AND l.condition_notes LIKE ?";
    params.push(`%${condition}%`);
  }

  // Sorting
  switch (sort) {
    case "price_low":
      query += " ORDER BY l.price ASC";
      break;
    case "price_high":
      query += " ORDER BY l.price DESC";
      break;
    case "rating":
      query += " ORDER BY u.rating_avg DESC, l.created_at DESC";
      break;
    case "popular":
      query += " ORDER BY l.view_count DESC, l.created_at DESC";
      break;
    default:
      query += " ORDER BY l.created_at DESC";
  }

  const listings = await db.prepare(query).all(...params);
  res.json(listings);
});

router.post("/", requireAuth, async (req, res) => {
  const { item_name, category, condition_notes, description, price, quantity, listing_type, return_by, parent_kit_id, image_data } = req.body;
  if (!item_name || !category) return res.status(400).json({ error: "item_name and category are required." });

  const id = uuid();
  const expiresAt = new Date(Date.now() + LISTING_LIFETIME_DAYS * 86400000).toISOString();
  const qty = parseInt(quantity, 10) > 0 ? parseInt(quantity, 10) : 1;

  await db.prepare(
    `INSERT INTO listings (id, seller_id, item_name, category, condition_notes, description, price, quantity, listing_type, return_by, parent_kit_id, image_data, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.id, item_name, category, condition_notes || "", description || "", price || 0, qty, listing_type || "sale", return_by || null, parent_kit_id || null, image_data || null, expiresAt);


  const listing = await db.prepare("SELECT * FROM listings WHERE id = ?").get(id);
  const flags = moderationService.screenListing(listing, req.user);

  // Auto-match wishlists: notify buyers looking for this type of item
  try {
    const matchingWishes = await db.prepare(
      `SELECT w.*, u.id as wish_user_id, u.name as wish_user_name
       FROM wishlists w JOIN users u ON u.id = w.user_id
       WHERE w.status = 'open'
         AND (w.category = ? OR w.category = 'Any')
         AND (w.max_budget = 0 OR w.max_budget >= ?)
         AND w.user_id != ?`
    ).all(category, price || 0, req.user.id);

    for (const wish of matchingWishes) {
      // Check if the item name is somewhat relevant (simple keyword match)
      const wishWords = wish.item_name.toLowerCase().split(/\s+/);
      const listingWords = item_name.toLowerCase().split(/\s+/);
      const overlap = wishWords.some((w) => listingWords.some((l) => l.includes(w) || w.includes(l)));

      if (overlap || wish.category === category) {
        const wisher = await db.prepare("SELECT * FROM users WHERE id = ?").get(wish.user_id);
        notificationService.notify(wisher, {
          type: "wishlist_match",
          title: "Wishlist match!",
          message: `"${item_name}" was just listed — matches your wish for "${wish.item_name}"`,
          data: { listingId: id, wishlistId: wish.id },
        });
      }
    }
  } catch (e) {
    console.error("[listings] wishlist match error:", e.message);
  }

  res.status(201).json({ listing, flagged: flags.length > 0 });
});

router.get("/:id", async (req, res) => {
  const listing = await db
    .prepare(
      `SELECT l.*, u.name as seller_name, u.department as seller_department,
              u.verified as seller_verified, u.rating_avg as seller_rating, u.rating_count as seller_rating_count
       FROM listings l JOIN users u ON u.id = l.seller_id WHERE l.id = ?`
    )
    .get(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found." });

  // Increment view count
  await db.prepare("UPDATE listings SET view_count = view_count + 1 WHERE id = ?").run(req.params.id);

  res.json(listing);
});

// DELETE /api/listings/:id — seller can remove their own listing
router.delete("/:id", requireAuth, async (req, res) => {
  const listing = await db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found." });
  if (listing.seller_id !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Not your listing." });
  }

  await db.prepare("UPDATE listings SET status = 'removed' WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// PATCH /api/listings/:id — edit listing details
router.patch("/:id", requireAuth, async (req, res) => {
  const { item_name, description, price, quantity, condition_notes, listing_type, return_by } = req.body;
  const listing = await db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found." });
  if (listing.seller_id !== req.user.id) return res.status(403).json({ error: "Not your listing." });

  await db.prepare(`
    UPDATE listings 
    SET item_name = ?, description = ?, price = ?, quantity = ?, condition_notes = ?, listing_type = ?, return_by = ?
    WHERE id = ?
  `).run(
    item_name || listing.item_name,
    description || listing.description,
    price !== undefined ? price : listing.price,
    quantity !== undefined ? quantity : listing.quantity,
    condition_notes || listing.condition_notes,
    listing_type || listing.listing_type,
    return_by || listing.return_by,
    req.params.id
  );
  res.json({ ok: true });
});

// Sweep stale listings — call from a scheduled job (see server.js)
async function sweepExpiredListings() {
  await db.prepare(`UPDATE listings SET status = 'expired' WHERE status = 'available' AND expires_at::timestamp < CURRENT_TIMESTAMP`).run();
}

module.exports = router;
module.exports.sweepExpiredListings = sweepExpiredListings;
