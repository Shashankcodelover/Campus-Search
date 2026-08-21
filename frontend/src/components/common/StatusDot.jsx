import React from "react";

export function StatusDot({ status }) {
  const map = {
    available: "available",
    pending: "pending",
    claimed: "claimed",
    expired: "expired",
    removed: "expired",
  };
  const labels = {
    available: "Available",
    pending: "Pending",
    claimed: "Claimed",
    expired: "Expired"
  };
  const s = map[status] || "available";
  return (
    <span className={`status-dot status-dot--${s}`}>
      <span className="status-dot__circle" />
      {labels[s] || status}
    </span>
  );
}
