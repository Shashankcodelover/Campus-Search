/**
 * Wishlist routes — "I'm looking for…" board
 * ---------------------------------------------
 * Buyers post what they need. When a seller lists a matching item,
 * matching buyers get notified automatically (handled in listings route).
 */
const express = require("express");
const { v4: uuid } = require("uuid");
const { db } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/wishlists — browse all open wants
router.get("/", (req, res) => {
  const { category = "All" } = req.query;
  let q = `SELECT w.*, u.name as user_name, u.department as user_department
            FROM wishlists w JOIN users u ON u.id = w.user_id
            WHERE w.status = 'open'`;
  const params = [];

  if (category !== "All") {
    q += ` AND w.category = ?`;
    params.push(category);
  }
  q += ` ORDER BY w.created_at DESC`;

  res.json(db.prepare(q).all(...params));
});

// POST /api/wishlists — post a want
router.post("/", requireAuth, (req, res) => {
  const { item_name, category, max_budget, notes } = req.body;
  if (!item_name) return res.status(400).json({ error: "item_name is required." });

  const id = uuid();
  db.prepare(
    `INSERT INTO wishlists (id, user_id, item_name, category, max_budget, notes)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.id, item_name, category || "Any", max_budget || 0, notes || "");

  const wish = db.prepare("SELECT * FROM wishlists WHERE id = ?").get(id);
  res.status(201).json(wish);
});

// DELETE /api/wishlists/:id — remove your own want
router.delete("/:id", requireAuth, (req, res) => {
  const wish = db.prepare("SELECT * FROM wishlists WHERE id = ?").get(req.params.id);
  if (!wish) return res.status(404).json({ error: "Not found." });
  if (wish.user_id !== req.user.id) return res.status(403).json({ error: "Not your wishlist item." });

  db.prepare("DELETE FROM wishlists WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// GET /api/wishlists/mine — my wish items
router.get("/mine", requireAuth, (req, res) => {
  const items = db.prepare(
    `SELECT * FROM wishlists WHERE user_id = ? ORDER BY created_at DESC`
  ).all(req.user.id);
  res.json(items);
});

module.exports = router;
