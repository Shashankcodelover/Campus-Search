/**
 * notificationService v1.1
 * -------------------------
 * Now supports three channels:
 *   1. console — dev/demo (original behavior)
 *   2. in_app — persists to DB + pushes via SSE for instant delivery
 *   3. twilio — SMS (interface ready, not wired up yet)
 *
 * The in_app channel is always active alongside whichever primary
 * provider is set, so notifications are never lost.
 */
const { db } = require("../db");
const { v4: uuid } = require("uuid");
const sseService = require("./sseService");

function sendViaConsole(user, payload) {
  console.log(`[notify] -> ${user.name} (${user.phone}) :: ${payload.type} :: ${payload.message}`);
  return Promise.resolve({ ok: true, channel: "console-dev" });
}

// Example of what a real provider swap looks like — inactive until
// TWILIO_SID / TWILIO_TOKEN are set in .env, see README.
async function sendViaTwilio(user, payload) {
  throw new Error("Twilio not configured — set TWILIO_SID/TWILIO_TOKEN or keep using console mode for demo.");
}

/**
 * Persist notification to the database (always runs, regardless of provider).
 */
function persistNotification(userId, payload) {
  const id = uuid();
  const title = payload.title || payload.type.replace(/_/g, " ");
  db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, message, data_json)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, userId, payload.type, title, payload.message, JSON.stringify(payload.data || {}));
  return { id, user_id: userId, type: payload.type, title, message: payload.message, read: 0, created_at: new Date().toISOString() };
}

/**
 * Main notify function — persists + pushes via SSE + logs to console.
 */
async function notify(user, payload) {
  // Always persist to DB
  const notification = persistNotification(user.id, payload);

  // Always push via SSE (instant in-app delivery)
  sseService.send(user.id, {
    type: "notification",
    notification,
  });

  // Also log via configured provider
  const provider = process.env.NOTIFY_PROVIDER || "console";
  if (provider === "twilio") return sendViaTwilio(user, payload);
  return sendViaConsole(user, payload);
}

/**
 * Get all notifications for a user.
 */
function getNotifications(userId, { unreadOnly = false, limit = 50 } = {}) {
  let q = `SELECT * FROM notifications WHERE user_id = ?`;
  if (unreadOnly) q += ` AND read = 0`;
  q += ` ORDER BY created_at DESC LIMIT ?`;
  return db.prepare(q).all(userId, limit);
}

/**
 * Mark one or all notifications as read.
 */
function markRead(userId, notificationId) {
  if (notificationId === "all") {
    db.prepare(`UPDATE notifications SET read = 1 WHERE user_id = ?`).run(userId);
  } else {
    db.prepare(`UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?`).run(notificationId, userId);
  }
}

function getUnreadCount(userId) {
  return db.prepare(`SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0`).get(userId).count;
}

module.exports = { notify, getNotifications, markRead, getUnreadCount };
