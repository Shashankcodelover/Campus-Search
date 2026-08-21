const express = require("express");
const { v4: uuid } = require("uuid");
const { db } = require("../db");
const { requireAuth } = require("../middleware/auth");
const moderationService = require("../services/moderationService");

const router = express.Router();
const LISTING_LIFETIME_DAYS = 60; // stale-listing sweep, see roadmap "listing decay" edge case

// GET /api/listings?search=&category=&status=available
router.get("/", (req, res) => {
  const { search = "", category = "All", status = "available" } = req.query;
  let query = `
    SELECT l.*, u.name as seller_name, u.department as seller_department, u.year as seller_year,
           u.verified as seller_verified, u.rating_avg as seller_rating
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
    query += " AND l.item_name LIKE ?";
    params.push(`%${search}%`);
  }
  query += " ORDER BY l.created_at DESC";

  const listings = db.prepare(query).all(...params);
  res.json(listings);
});

router.post("/", requireAuth, (req, res) => {
  const { item_name, category, condition_notes, description, price, listing_type, return_by, parent_kit_id } = req.body;
  if (!item_name || !category) return res.status(400).json({ error: "item_name and category are required." });

  const id = uuid();
  const expiresAt = new Date(Date.now() + LISTING_LIFETIME_DAYS * 86400000).toISOString();

  db.prepare(
    `INSERT INTO listings (id, seller_id, item_name, category, condition_notes, description, price, listing_type, return_by, parent_kit_id, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.id, item_name, category, condition_notes || "", description || "", price || 0, listing_type || "sale", return_by || null, parent_kit_id || null, expiresAt);

  const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(id);
  const flags = moderationService.screenListing(listing, req.user);

  res.status(201).json({ listing, flagged: flags.length > 0 });
});

router.get("/:id", (req, res) => {
  const listing = db
    .prepare(`SELECT l.*, u.name as seller_name, u.department as seller_department FROM listings l JOIN users u ON u.id = l.seller_id WHERE l.id = ?`)
    .get(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found." });
  res.json(listing);
});

// Sweep stale listings — call from a scheduled job (see server.js)
function sweepExpiredListings() {
  db.prepare(`UPDATE listings SET status = 'expired' WHERE status = 'available' AND expires_at < datetime('now')`).run();
}

module.exports = router;
module.exports.sweepExpiredListings = sweepExpiredListings;
