/**
 * CampusSearch v1.1 API client
 * All backend communication goes through here.
 * Includes: auth, listings, requests, ratings, admin,
 *           notifications (+ SSE), notion, wishlists, profiles, messages.
 */
const BASE = "/api";

function authHeaders() {
  const token = localStorage.getItem("cs_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  // ---- Auth ----
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  // ---- Listings ----
  getListings: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/listings?${qs}`);
  },
  getListing: (id) => request(`/listings/${id}`),
  createListing: (body) => request("/listings", { method: "POST", body: JSON.stringify(body) }),
  deleteListing: (id) => request(`/listings/${id}`, { method: "DELETE" }),

  // ---- Requests (matching flow) ----
  createRequest: (listing_id) => request("/requests", { method: "POST", body: JSON.stringify({ listing_id }) }),
  respondToRequest: (id, decision, delivery_day) =>
    request(`/requests/${id}/respond`, { method: "PATCH", body: JSON.stringify({ decision, delivery_day }) }),
  confirmDelivered: (id) => request(`/requests/${id}/confirm-delivered`, { method: "PATCH" }),
  getContact: (id) => request(`/requests/${id}/contact`),
  myRequests: () => request("/requests/mine"),

  // ---- Ratings ----
  rate: (body) => request("/ratings", { method: "POST", body: JSON.stringify(body) }),

  // ---- Admin ----
  adminStats: () => request("/admin/stats"),
  adminFlags: () => request("/admin/flags"),
  resolveFlag: (id, action) => request(`/admin/flags/${id}`, { method: "PATCH", body: JSON.stringify({ action }) }),

  // ---- Notifications (v1.1) ----
  getNotifications: (unreadOnly = false) =>
    request(`/notifications${unreadOnly ? "?unread=true" : ""}`),
  getUnreadCount: () => request("/notifications/unread-count"),
  markRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () => request("/notifications/all/read", { method: "PATCH" }),

  // ---- Notion (v1.1) ----
  notionHub: () => request("/notion/hub"),
  notionSearch: (q) => request(`/notion/search?q=${encodeURIComponent(q)}`),
  notionPage: (id) => request(`/notion/pages/${id}`),

  // ---- Wishlists (v1.1) ----
  getWishlists: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/wishlists?${qs}`);
  },
  getMyWishlists: () => request("/wishlists/mine"),
  createWishlist: (body) => request("/wishlists", { method: "POST", body: JSON.stringify(body) }),
  deleteWishlist: (id) => request(`/wishlists/${id}`, { method: "DELETE" }),

  // ---- Profiles (v1.1) ----
  getMyProfile: () => request("/profiles/me"),
  getProfile: (id) => request(`/profiles/${id}`),

  // ---- Messages (v1.1) ----
  getMessages: (requestId) => request(`/messages/${requestId}`),
  sendMessage: (requestId, body) =>
    request(`/messages/${requestId}`, { method: "POST", body: JSON.stringify({ body }) }),
};

// ---- SSE (Server-Sent Events) for real-time updates ----
export function connectSSE(onEvent) {
  const token = localStorage.getItem("cs_token");
  if (!token) return null;

  const es = new EventSource(`${BASE}/notifications/stream`, {
    // EventSource doesn't support custom headers natively.
    // We'll use a workaround: pass token as query param on the proxy.
    // For now, the SSE endpoint uses the auth middleware which reads
    // from the Authorization header — so we'll use fetch-event-source pattern.
  });

  // Note: Native EventSource doesn't support auth headers.
  // For the prototype, we'll use polling as fallback + SSE when available.
  // The SSE endpoint works behind the Vite proxy which forwards cookies/headers.

  // Actually, let's use a simple polling approach that checks for new notifications
  // This is more reliable across all browsers and proxy configurations.
  let interval = null;
  let lastCount = 0;

  const poll = async () => {
    try {
      const { count } = await api.getUnreadCount();
      if (count !== lastCount) {
        lastCount = count;
        onEvent({ type: "notification_count", count });
      }
    } catch (e) {
      // Silently fail, will retry
    }
  };

  poll(); // Initial check
  interval = setInterval(poll, 5000); // Check every 5 seconds

  return {
    close: () => {
      if (interval) clearInterval(interval);
    },
  };
}

// ---- Token management ----
export function setToken(token) {
  localStorage.setItem("cs_token", token);
}
export function clearToken() {
  localStorage.removeItem("cs_token");
}
export function hasToken() {
  return !!localStorage.getItem("cs_token");
}
