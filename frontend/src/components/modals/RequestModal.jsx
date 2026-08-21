import React, { useState, useEffect } from "react";
import { Radio, CheckCircle2, Phone, ShieldAlert, X } from "lucide-react";
import { api } from "../../api";

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

  useEffect(() => {
    (async () => {
      try {
        const r = await api.createRequest(listing.id);
        setRequest(r);
      } catch (e) { setError(e.message); }
    })();
  }, [listing.id]);

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

  const close = () => { onRefresh(); onClose(); };

  return (
    <div className="overlay" onClick={close}>
      <div className="card card-glow modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="modal__close"><X size={16} /></button>
        <div className="font-mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>REQUEST · {listing.id?.slice(0, 8)}</div>
        <h3 className="modal__title">{listing.item_name}</h3>

        {error && <div style={{ color: "var(--red)", fontSize: 13 }}>{error}</div>}

        {!error && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <StepRow done icon={<Radio size={15} />} label="Seller notified" sub="No payment or contact shared yet" />
            <StepRow
              done={request?.status === "accepted"}
              active={request?.status === "notified"}
              icon={<CheckCircle2 size={15} />}
              label={request?.status === "accepted" ? "Seller accepted" : request?.status === "declined" ? "Seller declined" : "Waiting for seller response"}
              sub={request?.status === "accepted" ? `Committed to ${request.delivery_day}` : request?.status === "declined" ? "Try another seller" : "Usually responds within 2 hours"}
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
            <button
              onClick={async () => { await api.confirmDelivered(request.id); close(); }}
              className="btn btn-ghost" style={{ width: "100%", marginTop: 12 }}
            >
              <CheckCircle2 size={14} /> I've received the item
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
