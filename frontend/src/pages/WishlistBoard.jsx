import React, { useState, useEffect, useCallback } from "react";
import { Heart, Plus, Trash2, ShoppingCart, Radio } from "lucide-react";
import { api } from "../api";
import { CATEGORIES } from "../constants/categories";
import { Badge } from "../components/common/Badge";
import { EmptyState } from "../components/common/EmptyState";
import { Skeleton } from "../components/common/Skeleton";
import { StatusDot } from "../components/common/StatusDot";

export function WishlistBoard({ onRequestListing }) {
  const [activeSubTab, setActiveSubTab] = useState("favorites");
  const [wishlists, setWishlists] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ item_name: "", category: "Any", max_budget: "", notes: "" });
  const [loading, setLoading] = useState(true);

  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("campus_favorites") || "[]");
    } catch {
      return [];
    }
  });

  const load = useCallback(async () => {
    try {
      const data = await api.getWishlists();
      setWishlists(data);
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const handleFavUpdate = () => {
      try {
        setFavorites(JSON.parse(localStorage.getItem("campus_favorites") || "[]"));
      } catch {}
    };
    window.addEventListener("favorites_updated", handleFavUpdate);
    return () => window.removeEventListener("favorites_updated", handleFavUpdate);
  }, [load]);

  const removeFavorite = (id) => {
    const updated = favorites.filter((f) => f.id !== id);
    setFavorites(updated);
    localStorage.setItem("campus_favorites", JSON.stringify(updated));
  };

  const submit = async () => {
    if (!form.item_name) return;
    await api.createWishlist({ ...form, max_budget: Number(form.max_budget) || 0 });
    setShowForm(false);
    setForm({ item_name: "", category: "Any", max_budget: "", notes: "" });
    load();
  };

  return (
    <div className="page-enter">
      {/* Top Header & Sub-tab navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h2 className="section-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Heart size={22} color="var(--red)" /> Favorites & Wanted Alerts
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            Manage your saved hardware items and custom component search alerts.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div style={{ display: "flex", gap: 6, background: "var(--bg-elevated)", padding: 4, borderRadius: "var(--radius-md)", border: "1px solid var(--trace)" }}>
          <button
            className={`btn ${activeSubTab === "favorites" ? "btn-primary" : "btn-ghost"}`}
            style={{ padding: "6px 14px", fontSize: 13 }}
            onClick={() => setActiveSubTab("favorites")}
          >
            ❤️ Saved Favorites ({favorites.length})
          </button>
          <button
            className={`btn ${activeSubTab === "wanted" ? "btn-primary" : "btn-ghost"}`}
            style={{ padding: "6px 14px", fontSize: 13 }}
            onClick={() => setActiveSubTab("wanted")}
          >
            🎯 Wanted Board ({wishlists.length})
          </button>
        </div>
      </div>

      {/* VIEW A: SAVED FAVORITES */}
      {activeSubTab === "favorites" && (
        <div>
          {favorites.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: "center" }}>
              <EmptyState
                icon="💔"
                title="No saved favorites yet"
                sub="Browse components and click the heart icon on any item to save it here for fast access!"
              />
            </div>
          ) : (
            <div className="listing-grid">
              {favorites.map((l) => (
                <div key={l.id} className="card card-hover listing-card" style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ position: "relative", height: "140px", overflow: "hidden", background: "var(--raised)" }}>
                    <img
                      src={l.image_data || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80"}
                      alt={l.item_name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <button
                      onClick={() => removeFavorite(l.id)}
                      className="btn-icon"
                      title="Remove from favorites"
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "rgba(0,0,0,0.65)",
                        borderRadius: "50%",
                        padding: 6,
                        border: "none",
                        color: "var(--red)",
                        cursor: "pointer"
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="listing-card__body" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <div className="listing-card__header">
                      <div className="listing-card__title">{l.item_name}</div>
                      <span className="listing-card__price">{l.price === 0 ? "FREE" : `₹${l.price}`}</span>
                    </div>
                    <div className="listing-card__meta" style={{ marginBottom: 12 }}>
                      <Badge tone="muted">{l.category}</Badge>
                      <span style={{ fontSize: 11 }}>{l.seller_name ? `by ${l.seller_name}` : ""}</span>
                    </div>
                    <div className="listing-card__footer" style={{ marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--trace)" }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => onRequestListing && onRequestListing(l)}
                        style={{ width: "100%", justifyContent: "center", fontSize: 12, padding: "6px 12px" }}
                      >
                        <ShoppingCart size={13} style={{ marginRight: 6 }} /> Request Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW B: WANTED BOARD & ALERTS */}
      {activeSubTab === "wanted" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
              Can't find what you need? Post a request below. All matching campus peers will get notified!
            </p>
            <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
              <Plus size={14} /> Create Alert
            </button>
          </div>

          {showForm && (
            <div className="card card-glow" style={{ padding: 20, marginBottom: 20 }}>
              <h4 style={{ marginBottom: 14 }}>What are you looking for?</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input className="input" placeholder="Item name *" value={form.item_name} onChange={(e) => setForm(f => ({ ...f, item_name: e.target.value }))} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <select className="input" value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option>Any</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <input className="input" style={{ maxWidth: 140 }} type="number" placeholder="Max budget ₹" value={form.max_budget} onChange={(e) => setForm(f => ({ ...f, max_budget: e.target.value }))} />
                </div>
                <input className="input" placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
                <button onClick={submit} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>Post Wish / Alert</button>
              </div>
            </div>
          )}

          {loading ? (
            <Skeleton type="card" count={3} />
          ) : wishlists.length === 0 ? (
            <div className="card">
              <EmptyState icon="💭" title="No wanted requests yet" sub="Be the first to post what component you are looking for!" />
            </div>
          ) : (
            <div className="wishlist-grid">
              {wishlists.map((w) => (
                <div key={w.id} className="card card-hover wishlist-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div className="wishlist-card__title">{w.item_name}</div>
                      <div className="wishlist-card__meta">
                        <Badge tone="blue">{w.category}</Badge>
                        <span style={{ marginLeft: 4 }}>by {w.user_name} · {w.user_department}</span>
                      </div>
                      {w.notes && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>{w.notes}</div>}
                      {w.max_budget > 0 && <div className="wishlist-card__budget">Budget: ₹{w.max_budget}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
