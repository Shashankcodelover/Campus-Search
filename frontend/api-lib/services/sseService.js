/**
 * sseService
 * -----------
 * Server-Sent Events (SSE) manager for real-time push notifications.
 *
 * Replaces the polling-based approach from v1.0 with instant server→client
 * event delivery. Each authenticated user gets their own SSE stream.
 *
 * Usage:
 *   - Frontend opens GET /api/notifications/stream (with JWT)
 *   - Backend calls sseService.send(userId, eventData) from anywhere
 *   - Client receives events instantly
 */

// Map of userId → Set of response objects (a user can have multiple tabs open)
const clients = new Map();
const HEARTBEAT_INTERVAL = 30000; // 30s keep-alive

/**
 * Register an SSE connection for a user.
 * Called from the notifications route when a client connects.
 */
function addClient(userId, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Send initial connection confirmation
  res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);

  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);

  // Heartbeat to keep the connection alive through proxies
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, HEARTBEAT_INTERVAL);

  // Cleanup on disconnect
  res.on("close", () => {
    clearInterval(heartbeat);
    const set = clients.get(userId);
    if (set) {
      set.delete(res);
      if (set.size === 0) clients.delete(userId);
    }
  });
}

/**
 * Send an event to a specific user (all their open tabs/connections).
 */
function send(userId, event) {
  const set = clients.get(userId);
  if (!set || set.size === 0) return;

  const payload = `event: ${event.type || "notification"}\ndata: ${JSON.stringify(event)}\n\n`;
  for (const res of set) {
    try {
      res.write(payload);
    } catch (e) {
      // Client disconnected, will be cleaned up on 'close'
    }
  }
}

/**
 * Broadcast to all connected users.
 */
function broadcast(event) {
  const payload = `event: ${event.type || "notification"}\ndata: ${JSON.stringify(event)}\n\n`;
  for (const [, set] of clients) {
    for (const res of set) {
      try { res.write(payload); } catch (e) {}
    }
  }
}

function getConnectedCount() {
  let count = 0;
  for (const [, set] of clients) count += set.size;
  return count;
}

module.exports = { addClient, send, broadcast, getConnectedCount };
