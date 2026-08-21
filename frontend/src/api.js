const BASE = "/api";

function authHeaders() {
  const token = localStorage.getItem("cs_token"); // fine here: this is a real deployed app, not a Claude artifact sandbox
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
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  getListings: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/listings?${qs}`);
  },
  createListing: (body) => request("/listings", { method: "POST", body: JSON.stringify(body) }),

  createRequest: (listing_id) => request("/requests", { method: "POST", body: JSON.stringify({ listing_id }) }),
  respondToRequest: (id, decision, delivery_day) =>
    request(`/requests/${id}/respond`, { method: "PATCH", body: JSON.stringify({ decision, delivery_day }) }),
  confirmDelivered: (id) => request(`/requests/${id}/confirm-delivered`, { method: "PATCH" }),
  getContact: (id) => request(`/requests/${id}/contact`),
  myRequests: () => request("/requests/mine"),

  rate: (body) => request("/ratings", { method: "POST", body: JSON.stringify(body) }),

  adminStats: () => request("/admin/stats"),
  adminFlags: () => request("/admin/flags"),
  resolveFlag: (id, action) => request(`/admin/flags/${id}`, { method: "PATCH", body: JSON.stringify({ action }) }),
};

export function setToken(token) {
  localStorage.setItem("cs_token", token);
}
export function clearToken() {
  localStorage.removeItem("cs_token");
}
export function hasToken() {
  return !!localStorage.getItem("cs_token");
}
