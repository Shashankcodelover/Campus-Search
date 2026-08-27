import React, { useState } from "react";
import { X, Send, Radio, Calendar, DollarSign, Sparkles } from "lucide-react";
import { api } from "../../api";

export function InquiryModal({ initialCategory = "Microcontrollers", initialQuery = "", onClose, onCreated }) {
  const [itemQuery, setItemQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [neededByDate, setNeededByDate] = useState("Tomorrow 2 PM");
  const [maxBudget, setMaxBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const categories = ["Microcontrollers", "Sensors", "Motors & Actuators", "Power & Wiring", "Tools", "Full Kits", "Any"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemQuery.trim()) return setError("Please enter what component you are looking for.");

    try {
      setLoading(true);
      setError("");
      const res = await api.createInquiry({
        itemQuery: itemQuery.trim(),
        category,
        neededByDate,
        maxBudget: maxBudget ? parseInt(maxBudget, 10) : 0,
        notes: notes.trim(),
      });
      setResult(res);
      if (onCreated) onCreated(res);
    } catch (err) {
      setError(err.message || "Failed to broadcast inquiry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
        <div className="modal-header">
          <h3>
            <Sparkles size={18} color="var(--signal)" style={{ verticalAlign: "middle", marginRight: "6px" }} />
            Broadcast Availability Inquiry
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {result ? (
            <div style={{ textAlign: "center", padding: "20px 10px" }}>
              <Radio size={48} color="var(--signal)" style={{ marginBottom: "12px", animation: "pulse 2s infinite" }} />
              <h3>Inquiry Broadcasted!</h3>
              <p style={{ color: "var(--muted)", margin: "10px 0 20px" }}>
                Sent to <strong>{result.notifiedCount}</strong> campus seller(s) with matching items. You will receive an instant notification as soon as someone confirms availability!
              </p>
              <button className="btn btn-primary" onClick={onClose} style={{ width: "100%" }}>
                View Inquiries
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
                Can't find a listed item? Send a broadcast inquiry to <strong>all campus sellers</strong> at once to check who has it available!
              </p>

              {error && <div className="alert alert-error" style={{ marginBottom: "12px" }}>{error}</div>}

              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted)" }}>COMPONENT / ITEM NEEDED *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. STM32 Nucleo board, L298N Motor Driver, Ultrasonic Sensor"
                  value={itemQuery}
                  onChange={(e) => setItemQuery(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted)" }}>CATEGORY</label>
                <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted)" }}>NEEDED BY DATE / TIME</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Today 5 PM"
                      value={neededByDate}
                      onChange={(e) => setNeededByDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted)" }}>MAX BUDGET (₹)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0 = any price"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted)" }}>NOTES / REASON</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="e.g. Needed urgently for Lab exam submission tomorrow morning."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Send size={14} /> {loading ? "Broadcasting..." : "Broadcast Inquiry"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
