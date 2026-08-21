/**
 * Notification routes
 * --------------------
 * Manages in-app notifications and the SSE stream endpoint.
 */
const express = require("express");
const { requireAuth } = require("../middleware/auth");
const notificationService = require("../services/notificationService");
const sseService = require("../services/sseService");

const router = express.Router();

// GET /api/notifications — list notifications for current user
router.get("/", requireAuth, (req, res) => {
  const unreadOnly = req.query.unread === "true";
  const notifications = notificationService.getNotifications(req.user.id, { unreadOnly });
  res.json(notifications);
});

// GET /api/notifications/unread-count
router.get("/unread-count", requireAuth, (req, res) => {
  res.json({ count: notificationService.getUnreadCount(req.user.id) });
});

// PATCH /api/notifications/:id/read — mark as read (or "all")
router.patch("/:id/read", requireAuth, (req, res) => {
  notificationService.markRead(req.user.id, req.params.id);
  res.json({ ok: true });
});

// GET /api/notifications/stream — SSE endpoint (keep-alive connection)
router.get("/stream", requireAuth, (req, res) => {
  sseService.addClient(req.user.id, res);
});

module.exports = router;
