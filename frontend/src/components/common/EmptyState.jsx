import React from "react";

export function EmptyState({ icon, title, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <div className="empty-state__title">{title}</div>
      <div className="empty-state__sub">{sub}</div>
    </div>
  );
}
