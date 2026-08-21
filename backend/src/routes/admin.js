const express = require("express");
const { db } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const moderationService = require("../services/moderationService");

const router = express.Router();
router.use(requireAuth, requireRole("admin", "moderator"));

router.get("/flags", (req, res) => {
  const flags = db
    .prepare(
      `SELECT f.*, l.item_name FROM flags f JOIN listings l ON l.id = f.listing_id WHERE f.status = 'open' ORDER BY f.created_at DESC`
    )
    .all();
  res.json(flags);
});

router.patch("/flags/:id", (req, res) => {
  const { action } = req.body; // 'remove' | 'clear'
  const result = moderationService.resolveFlag(req.params.id, req.user.id, action);
  if (!result) return res.status(404).json({ error: "Flag not found." });
  res.json({ ok: true });
});

router.get("/stats", (req, res) => {
  const active = db.prepare("SELECT COUNT(*) c FROM listings WHERE status = 'available'").get().c;
  const pending = db.prepare("SELECT COUNT(*) c FROM listings WHERE status = 'pending'").get().c;
  const openFlags = db.prepare("SELECT COUNT(*) c FROM flags WHERE status = 'open'").get().c;
  const totalUsers = db.prepare("SELECT COUNT(*) c FROM users").get().c;
  const verifiedUsers = db.prepare("SELECT COUNT(*) c FROM users WHERE verified = 1").get().c;
  const feesPending = db.prepare("SELECT COALESCE(SUM(amount),0) s FROM fee_ledger WHERE settled = 0").get().s;

  res.json({
    active,
    pending,
    openFlags,
    verifiedPct: totalUsers ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
    feesPendingSettlement: feesPending,
  });
});

// Suspend a user (e.g. repeated no-shows or scam listings)
router.patch("/users/:id/suspend", (req, res) => {
  db.prepare("UPDATE users SET suspended = 1 WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
