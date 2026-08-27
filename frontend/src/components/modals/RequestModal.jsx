import React, { useState, useEffect } from "react";
import { Radio, CheckCircle2, Phone, ShieldAlert, X } from "lucide-react";
import { api } from "../../api";
import { ChatBox } from "../common/ChatBox";

function StepRow({ active, done, icon, label, sub }) {
  const state = done ? "done" : active ? "active" : "pending";
  return (
    <div className={`step-row step-row--${state}`}>
      <div className="step-row__icon">{icon}</div>
      <div>
        <div className="step-row__label">{label}</div>
        <div className="step-row__sub">{sub}</div>
      </div>
    </div>
  );
}

export function RequestModal({ listing, onClose, onRefresh }) {
  const [request, setRequest] = useState(null);
  const [contact, setContact] = useState(null);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!request) return;
    const poll = setInterval(async () => {
      try {
        const { asBuyer } = await api.myRequests();
        const mine = asBuyer.find((r) => r.id === request.id);
        if (mine && mine.status !== request.status) {
          setRequest(mine);
          if (mine.status === "accepted") {
            const c = await api.getContact(mine.id);
            setContact(c);
          }
        }
      } catch (e) {}
    }, 3000);
    return () => clearInterval(poll);
  }, [request]);

  const handleCreateRequest = async () => {
    setCreating(true);
    try {
      const r = await api.createRequest(listing.id, quantity);
      setRequest(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const close = () => { onRefresh(); onClose(); };

  return (
    <div className="overlay" onClick={close}>
      <div className="card card-glow modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="modal__close"><X size={16} /></button>
        <div className="font-mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>REQUEST · {listing.id?.slice(0, 8)}</div>
        <h3 className="modal__title">{listing.item_name}</h3>

        {error && <div style={{ color: "var(--red)", fontSize: 13, marginBottom: 16 }}>{error}</div>}

        {!request && !error && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
            {listing.listing_type === 'rent' && (
              <div style={{ background: "rgba(110, 231, 160, 0.1)", padding: 12, borderRadius: 8, color: "var(--signal)", fontSize: 13 }}>
                <strong>⚠️ Rental Agreement:</strong> You are borrowing this item. It must be returned by: <strong>{listing.return_by || "Arranged via chat"}</strong>.
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Quantity to request:</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: "4px 8px" }}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >-</button>
                <span style={{ fontSize: 16, fontWeight: 600, width: 24, textAlign: "center" }}>{quantity}</span>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: "4px 8px" }}
                  onClick={() => setQuantity(Math.min(listing.quantity || 1, quantity + 1))}
                  disabled={quantity >= (listing.quantity || 1)}
                >+</button>
              </div>
            </div>
            
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {listing.quantity || 1} available in stock. Total price: ₹{(listing.price || 0) * quantity}
            </div>

            <button 
              onClick={handleCreateRequest} 
              disabled={creating || quantity > (listing.quantity || 1)} 
              className="btn btn-primary" 
              style={{ width: "100%" }}
            >
              {creating ? "Sending Request..." : "Request Item"}
            </button>
          </div>
        )}

        {request && !error && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <StepRow done icon={<Radio size={15} />} label={`Seller notified (Qty: ${request.quantity || quantity})`} sub="No payment or contact shared yet" />
            <StepRow
              done={request?.status === "accepted"}
              active={request?.status === "notified"}
              icon={<CheckCircle2 size={15} />}
              label={request?.status === "accepted" ? "Seller accepted" : request?.status === "declined" ? "Seller declined" : "Waiting for seller response"}
              sub={request?.status === "accepted" ? `Committed to ${request.delivery_day}` : request?.status === "declined" ? "Try another seller" : "Usually responds within 24 hours"}
            />
            <StepRow done={!!contact} active={request?.status === "accepted" && !contact} icon={<Phone size={15} />} label="Contact revealed" sub={contact ? "Coordinate pickup" : "Unlocks once accepted"} />
          </div>
        )}

        {contact && (
          <div style={{ marginTop: 20, padding: 16, borderRadius: 10, background: "var(--bg-elevated)", border: "1px solid var(--trace)" }}>
            <div className="font-mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>SELLER CONTACT</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{contact.name} · {contact.department}</div>
                <div className="font-mono" style={{ color: "var(--signal)", fontSize: 15, marginTop: 4 }}>+91 {contact.phone}</div>
              </div>
              <a href={`tel:${contact.phone}`} className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 12.5 }}><Phone size={13} /> Call</a>
            </div>
            <div className="alert alert--warn" style={{ marginTop: 12, fontSize: 11.5 }}>
              <ShieldAlert size={14} className="alert__icon" />
              Pay only after you receive and check the item. Never pay upfront.
            </div>
            
            <div style={{ marginTop: 16 }}>
              <ChatBox requestId={request.id} />
            </div>

            <button
              onClick={async () => { 
                await api.confirmDelivered(request.id); 
                onClose(); // close the request modal
                // If there's a global way to open payment, or we can just tell them to check their inbox.
                // Actually, let's just trigger a custom event or let the user go to inbox.
                window.dispatchEvent(new CustomEvent('open_payment', { detail: request.id }));
              }}
              className="btn btn-ghost" style={{ width: "100%", marginTop: 12 }}
            >
              <CheckCircle2 size={14} /> I've received the item & Pay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
