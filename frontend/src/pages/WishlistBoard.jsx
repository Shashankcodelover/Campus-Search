import React, { useState, useEffect, useCallback } from "react";
import { Heart, Plus } from "lucide-react";
import { api } from "../api";
import { CATEGORIES } from "../constants/categories";
import { Badge } from "../components/common/Badge";
import { EmptyState } from "../components/common/EmptyState";
import { Skeleton } from "../components/common/Skeleton";

export function WishlistBoard() {
  const [wishlists, setWishlists] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ item_name: "", category: "Any", max_budget: "", notes: "" });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.getWishlists();
      setWishlists(data);
    } catch (e) {}
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.item_name) return;
    await api.createWishlist({ ...form, max_budget: Number(form.max_budget) || 0 });
    setShowForm(false);
    setForm({ item_name: "", category: "Any", max_budget: "", notes: "" });
    load();
  };

  return (
    <div className="page-enter">
      <div className="section-header">
        <h2 className="section-title"><Heart size={22} /> Wanted Board</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary"><Plus size={14} /> Post a want</button>
      </div>

      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
        Looking for something specific? Post it here — sellers will be notified when matching items are listed.
      </p>

      {showForm && (
        <div className="card card-glow" style={{ padding: 20, marginBottom: 20 }}>
          <h4 style={{ marginBottom: 14 }}>What are you looking for?</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input className="input" placeholder="Item name *" value={form.item_name} onChange={(e) => setForm(f => ({ ...f, item_name: e.target.value }))} />
            <div style={{ display: "flex", gap: 8 }}>
              <select className="input" value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
                <option>Any</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input className="input" style={{ maxWidth: 140 }} type="number" placeholder="Max budget ₹" value={form.max_budget} onChange={(e) => setForm(f => ({ ...f, max_budget: e.target.value }))} />
            </div>
            <input className="input" placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
            <button onClick={submit} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>Post wish</button>
          </div>
        </div>
      )}

      {loading ? (
        <Skeleton type="card" count={3} />
      ) : wishlists.length === 0 ? (
        <div className="card">
          <EmptyState icon="💭" title="No wishes yet" sub="Be the first to post what you need!" />
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
  );
}
