import React, { useState } from "react";
import { X } from "lucide-react";
import { api } from "../../api";
import { CATEGORIES } from "../../constants/categories";

export function ListItemModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ item_name: "", category: CATEGORIES[0], condition_notes: "", description: "", price: "", listing_type: "sale" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = form.item_name && form.condition_notes;

  const submit = async () => {
    setLoading(true);
    try {
      await api.createListing({ ...form, price: Number(form.price) || 0 });
      onCreated();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="card card-glow modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal__close"><X size={16} /></button>
        <h3 className="modal__title">📦 List a component</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="input" placeholder="Item name *" value={form.item_name} onChange={set("item_name")} id="list-name" />
          <div style={{ display: "flex", gap: 10 }}>
            <select className="input" value={form.category} onChange={set("category")} id="list-category">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input className="input" style={{ maxWidth: 110 }} type="number" placeholder="Price ₹" value={form.price} onChange={set("price")} id="list-price" />
          </div>
          <input className="input" placeholder="Condition * (e.g. Working, minor wear)" value={form.condition_notes} onChange={set("condition_notes")} id="list-condition" />
          <textarea className="input" placeholder="Description (optional)" value={form.description} onChange={set("description")} id="list-description" rows={3} />
        </div>
        {error && <div style={{ color: "var(--red)", fontSize: 12.5, marginTop: 10 }}>{error}</div>}
        <button disabled={!valid || loading} onClick={submit} className="btn btn-primary" style={{ width: "100%", marginTop: 16 }} id="list-submit">
          {loading ? "Publishing…" : "Publish listing"}
        </button>
      </div>
    </div>
  );
}
