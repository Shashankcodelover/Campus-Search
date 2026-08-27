/**
 * CampusSearch v2.0 API client
 * Handles: Auth (USN + ID photo), Listings, Requests, Ratings, Admin (ID Verification Queue),
 *          Notifications (+ SSE), Notion, Wishlists, Profiles, Messages,
 *          Inquiries (Broadcast availability flow), Payments (UPI QR).
 */
const BASE = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.endsWith("/api") ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
  : "/api";


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
  changePassword: (body) => request("/auth/change-password", { method: "POST", body: JSON.stringify(body) }),

  // ---- Listings ----
  getListings: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/listings?${qs}`);
  },
  getListing: (id) => request(`/listings/${id}`),
  createListing: (body) => request("/listings", { method: "POST", body: JSON.stringify(body) }),
  deleteListing: (id) => request(`/listings/${id}`, { method: "DELETE" }),

  // ---- Requests (direct matching flow) ----
  createRequest: (listing_id) => request("/requests", { method: "POST", body: JSON.stringify({ listing_id }) }),
  respondToRequest: (id, decision, delivery_day) =>
    request(`/requests/${id}/respond`, { method: "PATCH", body: JSON.stringify({ decision, delivery_day }) }),
  confirmDelivered: (id) => request(`/requests/${id}/confirm-delivered`, { method: "PATCH" }),
  getContact: (id) => request(`/requests/${id}/contact`),
  myRequests: () => request("/requests/mine"),

  // ---- Inquiries (v2.0: broadcast availability flow) ----
  createInquiry: (body) => request("/inquiries", { method: "POST", body: JSON.stringify(body) }),
  myInquiries: () => request("/inquiries/mine"),
  incomingInquiries: () => request("/inquiries/incoming"),
  respondToInquiry: (id, body) => request(`/inquiries/${id}/respond`, { method: "POST", body: JSON.stringify(body) }),
  acceptInquiryResponse: (inquiryId, response_id) =>
    request(`/inquiries/${inquiryId}/accept-response`, { method: "POST", body: JSON.stringify({ response_id }) }),

  // ---- Payments (v2.0: UPI QR) ----
  getPaymentIntent: (requestId) => request(`/payments/intent/${requestId}`),
  confirmPayment: (intentId) => request(`/payments/confirm/${intentId}`, { method: "POST" }),

  // ---- Ratings ----
  rate: (body) => request("/ratings", { method: "POST", body: JSON.stringify(body) }),

  // ---- Admin & Verification Queue (v2.0) ----
  adminStats: () => request("/admin/stats"),
  adminFlags: () => request("/admin/flags"),
  resolveFlag: (id, action) => request(`/admin/flags/${id}`, { method: "PATCH", body: JSON.stringify({ action }) }),
  getPendingVerifications: () => request("/admin/pending-verifications"),
  verifyUser: (id) => request(`/admin/verify-user/${id}`, { method: "POST" }),
  rejectUser: (id, reason) => request(`/admin/reject-user/${id}`, { method: "POST", body: JSON.stringify({ reason }) }),
  suspendUser: (id, reason) => request(`/admin/users/${id}/suspend`, { method: "PATCH", body: JSON.stringify({ reason }) }),

  // ---- Notifications ----
  getNotifications: (unreadOnly = false) =>
    request(`/notifications${unreadOnly ? "?unread=true" : ""}`),
  getUnreadCount: () => request("/notifications/unread-count"),
  markRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () => request("/notifications/all/read", { method: "PATCH" }),

  // ---- Notion Knowledge Hub ----
  notionHub: () => request("/notion/hub"),
  notionSearch: (q) => request(`/notion/search?q=${encodeURIComponent(q)}`),
  notionPage: (id) => request(`/notion/pages/${id}`),

  // ---- Wishlists ----
  getWishlists: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/wishlists?${qs}`);
  },
  getMyWishlists: () => request("/wishlists/mine"),
  createWishlist: (body) => request("/wishlists", { method: "POST", body: JSON.stringify(body) }),
  deleteWishlist: (id) => request(`/wishlists/${id}`, { method: "DELETE" }),

  // ---- Profiles ----
  getMyProfile: () => request("/profiles/me"),
  getProfile: (id) => request(`/profiles/${id}`),

  // ---- Messages ----
  getMessages: (requestId) => request(`/messages/${requestId}`),
  sendMessage: (requestId, body) =>
    request(`/messages/${requestId}`, { method: "POST", body: JSON.stringify({ body }) }),
};

// Polling fallback for notifications
export function connectSSE(onEvent) {
  const token = localStorage.getItem("cs_token");
  if (!token) return null;

  let interval = null;
  let lastCount = -1;

  const poll = async () => {
    try {
      const { count } = await api.getUnreadCount();
      if (count !== lastCount) {
        lastCount = count;
        onEvent({ type: "notification_count", count });
      }
    } catch (e) {}
  };

  poll();
  interval = setInterval(poll, 4000);

  return {
    close: () => {
      if (interval) clearInterval(interval);
    },
  };
}

export function setToken(token) {
  localStorage.setItem("cs_token", token);
}
export function clearToken() {
  localStorage.removeItem("cs_token");
}
export function hasToken() {
  return !!localStorage.getItem("cs_token");
}
