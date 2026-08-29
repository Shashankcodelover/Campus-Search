import React, { useState } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { api } from "../../api";
import { CATEGORIES } from "../../constants/categories";

export function ListItemModal({ onClose, onCreated, editItem }) {
  const [form, setForm] = useState(editItem ? {
    item_name: editItem.item_name,
    category: editItem.category,
    condition_notes: editItem.condition_notes,
    description: editItem.description || "",
    price: editItem.price,
    quantity: editItem.quantity,
    listing_type: editItem.listing_type || "sale",
    return_by: editItem.return_by || "",
    image_data: editItem.image_data || null
  } : {
    item_name: "",
    category: CATEGORIES[0],
    condition_notes: "",
    description: "",
    price: "",
    quantity: "1",
    listing_type: "sale",
    return_by: "",
    image_data: null
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = form.item_name && form.condition_notes;

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError("Image too large (max 5MB)");

    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image_data: reader.result }));
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        quantity: Number(form.quantity) || 1,
      };
      
      if (editItem) {
        await api.updateListing(editItem.id, payload);
      } else {
        await api.createListing(payload);
      }
      onCreated();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="card card-glow modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <button onClick={onClose} className="modal__close"><X size={16} /></button>
        <h3 className="modal__title">{editItem ? "✏️ Edit Listing" : "📦 List a Component"}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="input" placeholder="Item name * (e.g. Arduino Uno R3)" value={form.item_name} onChange={set("item_name")} id="list-name" />
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 4 }}>
            <button className={`btn ${form.listing_type === 'sale' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setForm(f => ({...f, listing_type: 'sale'}))}>💰 For Sale</button>
            <button className={`btn ${form.listing_type === 'rent' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setForm(f => ({...f, listing_type: 'rent'}))}>⏱ For Rent/Borrow</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <select className="input" value={form.category} onChange={set("category")} id="list-category">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input className="input" type="number" placeholder={form.listing_type === 'rent' ? "Rental Fee (₹)" : "Price (₹)"} value={form.price} onChange={set("price")} id="list-price" />
            <input className="input" type="number" min="1" placeholder="Qty (Units)" value={form.quantity} onChange={set("quantity")} id="list-quantity" title="Available stock quantity" />
          </div>

          {form.listing_type === 'rent' && (
            <input className="input" placeholder="Return by? (e.g. End of Semester, 3 Days)" value={form.return_by || ""} onChange={set("return_by")} />
          )}

          <input className="input" placeholder="Condition * (e.g. Working, like new)" value={form.condition_notes} onChange={set("condition_notes")} id="list-condition" />
          <textarea className="input" placeholder="Description (pinout details, cables included, etc.)" value={form.description} onChange={set("description")} id="list-description" rows={3} />
          
          <div style={{ border: "1px dashed var(--trace)", borderRadius: "var(--radius-md)", padding: "12px", textAlign: "center" }}>
            <input type="file" id="component-image" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
            {form.image_data ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <img src={form.image_data} alt="Component Preview" style={{ maxHeight: "120px", borderRadius: "8px", border: "1px solid var(--trace)" }} />
                <button className="btn btn-ghost" style={{ fontSize: 12, padding: "4px 8px" }} onClick={() => setForm(f => ({...f, image_data: null}))}>Remove Image</button>
              </div>
            ) : (
              <button className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }} onClick={() => document.getElementById("component-image").click()}>
                <Upload size={16} style={{ marginRight: 6 }} /> Add Photo (Optional)
              </button>
            )}
          </div>

          {error && <div style={{ color: "var(--red)", fontSize: 13 }}>{error}</div>}
          <button onClick={submit} className="btn btn-primary" disabled={!valid || loading} id="list-submit" style={{ marginTop: 8 }}>
            {loading ? "Saving..." : (editItem ? "Save Changes" : "Post Listing")}
          </button>
        </div>
      </div>
    </div>
  );
}
