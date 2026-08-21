import React from "react";

export function Skeleton({ type = "card", count = 1 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className={`skeleton skeleton--${type}`} style={{ marginBottom: 12 }} />
  ));
}
