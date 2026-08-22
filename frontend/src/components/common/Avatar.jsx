import React from "react";

export function Avatar({ name, size = "" }) {
  const cls = size ? `avatar avatar--${size}` : "avatar";
  return <div className={cls}>{(name || "?")[0]}</div>;
}
