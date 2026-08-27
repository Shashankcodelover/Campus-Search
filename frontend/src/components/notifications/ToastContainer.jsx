import React, { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

export function ToastContainer({ event }) {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!event) return;
    setToast(event);
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [event]);

  if (!toast) return null;

  return (
    <div style={{
      position: "fixed",
      top: "16px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      animation: "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      width: "90%",
      maxWidth: "400px"
    }}>
      <div className="card card-glow" style={{ padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: "12px", background: "var(--bg-elevated)", border: "1px solid var(--signal)" }}>
        <div style={{ color: "var(--signal)", marginTop: "2px" }}><Bell size={18} /></div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: "14px", marginBottom: "4px" }}>{toast.title}</h4>
          <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.4 }}>{toast.message}</p>
        </div>
        <button className="btn-icon" onClick={() => setToast(null)} style={{ padding: 4 }}><X size={14} /></button>
      </div>
    </div>
  );
}
