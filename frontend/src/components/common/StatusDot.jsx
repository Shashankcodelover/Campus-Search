import React from "react";

export function StatusDot({ status, qty }) {
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
  let s = map[status] || "available";
  let label = labels[s] || status;

  if (s === "available" && qty === 1) {
    s = "pending"; // Use the amber color class
    label = "1 Left";
  }

  return (
    <span className={`status-dot status-dot--${s}`}>
      <span className="status-dot__circle" />
      {label}
    </span>
  );
}
