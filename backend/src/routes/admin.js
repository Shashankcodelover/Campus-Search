/**
 * admin.js (v2.0)
 * ---------------
 * Admin panel endpoints: stats, moderation flags, user suspension,
 * and USN + College ID photo verification queue.
 */
const express = require("express");
const { db } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const moderationService = require("../services/moderationService");
const notificationService = require("../services/notificationService");

const router = express.Router();
router.use(requireAuth, requireRole("admin", "moderator"));

// GET /api/admin/flags — Open moderation flags
router.get("/flags", (req, res) => {
  const flags = db
    .prepare(
      `SELECT f.*, l.item_name FROM flags f JOIN listings l ON l.id = f.listing_id WHERE f.status = 'open' ORDER BY f.created_at DESC`
    )
    .all();
  res.json(flags);
});

// PATCH /api/admin/flags/:id — Resolve a flag (remove/clear)
router.patch("/flags/:id", (req, res) => {
  const { action } = req.body; // 'remove' | 'clear'
  const result = moderationService.resolveFlag(req.params.id, req.user.id, action);
  if (!result) return res.status(404).json({ error: "Flag not found." });
  res.json({ ok: true });
});

// GET /api/admin/pending-verifications — Users awaiting USN + ID card verification
router.get("/pending-verifications", (req, res) => {
  const pending = db
    .prepare(
      `SELECT id, name, email, usn, department, year, created_at, id_photo_data
       FROM users 
       WHERE admin_verified = 0 AND suspended = 0
       ORDER BY created_at ASC`
    )
    .all();
  res.json(pending);
});

// POST /api/admin/verify-user/:id — Admin approves user's ID
router.post("/verify-user/:id", (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found." });

  db.prepare("UPDATE users SET verified = 1, admin_verified = 1 WHERE id = ?").run(req.params.id);

  // Notify user via in-app notification
  notificationService.notify(user, {
    type: "account_verified",
    title: "🎉 Identity Verified!",
    message: `Your USN (${user.usn}) and College ID have been approved! You now have a Verified Student badge.`,
    data: { action: "go_to_profile" },
  });

  res.json({ ok: true, verified: true });
});

// POST /api/admin/reject-user/:id — Admin rejects verification
router.post("/reject-user/:id", (req, res) => {
  const { reason } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found." });

  // Reset ID photo data so user can re-upload if desired
  db.prepare("UPDATE users SET verified = 0, admin_verified = 0, id_photo_data = NULL WHERE id = ?").run(req.params.id);

  notificationService.notify(user, {
    type: "system",
    title: "⚠️ Identity Verification Update",
    message: `Your ID verification could not be approved${reason ? `: ${reason}` : "."} Please update your profile with a clear College ID photo.`,
    data: { action: "go_to_profile" },
  });

  res.json({ ok: true, rejected: true });
});

// GET /api/admin/stats — Dashboard summary statistics
router.get("/stats", (req, res) => {
  const active = db.prepare("SELECT COUNT(*) c FROM listings WHERE status = 'available'").get().c;
  const pending = db.prepare("SELECT COUNT(*) c FROM listings WHERE status = 'pending'").get().c;
  const openFlags = db.prepare("SELECT COUNT(*) c FROM flags WHERE status = 'open'").get().c;
  const totalUsers = db.prepare("SELECT COUNT(*) c FROM users").get().c;
  const verifiedUsers = db.prepare("SELECT COUNT(*) c FROM users WHERE admin_verified = 1").get().c;
  const pendingVerifications = db.prepare("SELECT COUNT(*) c FROM users WHERE admin_verified = 0 AND suspended = 0").get().c;
  const feesPending = db.prepare("SELECT COALESCE(SUM(amount),0) s FROM fee_ledger WHERE settled = 0").get().s;

  res.json({
    active,
    pending,
    openFlags,
    pendingVerifications,
    verifiedPct: totalUsers ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
    feesPendingSettlement: feesPending,
  });
});

// PATCH /api/admin/users/:id/suspend — Suspend a user
router.patch("/users/:id/suspend", (req, res) => {
  const { reason } = req.body;
  db.prepare("UPDATE users SET suspended = 1, suspension_reason = ? WHERE id = ?").run(reason || "Policy violation", req.params.id);
  res.json({ ok: true });
});

module.exports = router;
