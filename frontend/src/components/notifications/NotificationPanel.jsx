import React, { useState, useEffect, useRef } from "react";
import { api } from "../../api";
import { Skeleton } from "../common/Skeleton";

export function NotificationPanel({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getNotifications();
        setNotifications(data);
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const markAllRead = async () => {
    await api.markAllRead();
    setNotifications((ns) => ns.map((n) => ({ ...n, read: 1 })));
  };

  const ref = useRef();
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="card notification-panel">
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--trace)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h4 style={{ fontSize: 14 }}>Notifications</h4>
        <button onClick={markAllRead} className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }}>Mark all read</button>
      </div>
      {loading ? (
        <div style={{ padding: 16 }}><Skeleton type="text" count={3} /></div>
      ) : notifications.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "var(--muted)" }}>No notifications yet.</div>
      ) : (
        notifications.slice(0, 15).map((n) => (
          <div key={n.id} className={`notification-item ${!n.read ? "notification-item--unread" : ""}`}>
            {!n.read && <div className="notification-item__dot" />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: "var(--text)" }}>{n.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, lineClamp: 3, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word" }}>{n.message}</div>
              <div className="font-mono" style={{ fontSize: 10, color: "var(--muted-dim)", marginTop: 4 }}>
                {new Date(n.created_at).toLocaleString()}
              </div>

            </div>
          </div>
        ))
      )}
    </div>
  );
}
