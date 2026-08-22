import React, { useState, useEffect, useCallback } from "react";
import { Search, Grid3X3, List } from "lucide-react";
import { api } from "../api";
import { CATEGORIES, CATEGORY_ICONS } from "../constants/categories";
import { StatusDot } from "../components/common/StatusDot";
import { Badge } from "../components/common/Badge";
import { Avatar } from "../components/common/Avatar";
import { EmptyState } from "../components/common/EmptyState";
import { Skeleton } from "../components/common/Skeleton";

export function BrowsePage({ onRequestListing }) {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getListings({ search, category, sort });
      setListings(data);
    } catch (e) {}
    setLoading(false);
  }, [search, category, sort]);

  useEffect(() => { loadListings(); }, [loadListings]);

  return (
    <div className="page-enter">
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ marginBottom: 8 }}>Find campus components</h1>
        <p style={{ color: "var(--muted)", fontSize: 14, maxWidth: 500, margin: "0 auto" }}>
          Buy, sell, and trade engineering project components with verified students on your campus.
        </p>
      </div>

      <div className="search-bar" style={{ marginBottom: 20 }}>
        <div className="search-bar__input-wrapper">
          <Search size={14} className="search-bar__icon" />
          <input
            className="input search-bar__input"
            placeholder="Search components…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && loadListings()}
            id="search-input"
          />
        </div>
        <div className="search-bar__filters">
          <select className="input" style={{ width: "auto", minWidth: 140 }} value={category} onChange={(e) => setCategory(e.target.value)} id="filter-category">
            <option>All</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="input" style={{ width: "auto", minWidth: 120 }} value={sort} onChange={(e) => setSort(e.target.value)} id="filter-sort">
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low→High</option>
            <option value="price_high">Price: High→Low</option>
            <option value="rating">Top Rated</option>
            <option value="popular">Most Viewed</option>
          </select>
          <div style={{ display: "flex", gap: 2 }}>
            <button className={`btn-icon ${viewMode === "grid" ? "btn-primary" : ""}`} onClick={() => setViewMode("grid")} style={viewMode === "grid" ? { background: "var(--signal)", color: "var(--bg-deep)", border: "none" } : {}}><Grid3X3 size={14} /></button>
            <button className={`btn-icon ${viewMode === "list" ? "btn-primary" : ""}`} onClick={() => setViewMode("list")} style={viewMode === "list" ? { background: "var(--signal)", color: "var(--bg-deep)", border: "none" } : {}}><List size={14} /></button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        <button
          className={`btn ${category === "All" ? "btn-primary" : "btn-ghost"}`}
          style={{ padding: "6px 14px", fontSize: 12, flexShrink: 0 }}
          onClick={() => setCategory("All")}
        >All</button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`btn ${category === c ? "btn-primary" : "btn-ghost"}`}
            style={{ padding: "6px 14px", fontSize: 12, flexShrink: 0 }}
            onClick={() => setCategory(c)}
          >
            {CATEGORY_ICONS[c]} {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="listing-grid"><Skeleton type="card" count={6} /></div>
      ) : listings.length === 0 ? (
        <div className="card">
          <EmptyState icon="🔍" title="No components found" sub="Try a different search or category. Or be the first to list one!" />
        </div>
      ) : viewMode === "grid" ? (
        <div className="listing-grid">
          {listings.map((l) => (
            <div key={l.id} className="card card-hover listing-card" onClick={() => l.status === "available" && onRequestListing(l)}>
              <div className="listing-card__image-placeholder">
                {CATEGORY_ICONS[l.category] || "📦"}
              </div>
              <div className="listing-card__body">
                <div className="listing-card__header">
                  <div className="listing-card__title">{l.item_name}</div>
                  {l.price === 0 ? (
                    <span className="listing-card__price listing-card__price--free">FREE</span>
                  ) : (
                    <span className="listing-card__price">₹{l.price}</span>
                  )}
                </div>
                <div className="listing-card__meta">
                  <Badge tone="muted">{l.category}</Badge>
                  <span>{l.condition_notes}</span>
                </div>
                <div className="listing-card__footer">
                  <div className="listing-card__seller">
                    <Avatar name={l.seller_name} size="sm" />
                    <span>{l.seller_name}</span>
                    {l.seller_verified ? <Badge tone="green">✓</Badge> : null}
                  </div>
                  <StatusDot status={l.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          {listings.map((l) => (
            <div key={l.id} className="listing-row" style={{ cursor: l.status === "available" ? "pointer" : "default" }} onClick={() => l.status === "available" && onRequestListing(l)}>
              <span className="font-mono row-id" style={{ fontSize: 11, color: "var(--signal)" }}>{l.id.slice(0, 6)}</span>
              <div className="row-main">
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{l.item_name}</span>
                  {l.seller_verified ? <Badge tone="green">Verified</Badge> : null}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{l.condition_notes} · {l.seller_name}, {l.seller_department}</div>
              </div>
              <span className="font-mono row-price" style={{ fontSize: 14, justifySelf: "end" }}>{l.price === 0 ? "Free" : `₹${l.price}`}</span>
              <span className="row-status" style={{ justifySelf: "end" }}><StatusDot status={l.status} /></span>
              <span className="row-action" style={{ justifySelf: "end" }}>
                <button disabled={l.status !== "available"} className="btn btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }}>
                  {l.status === "available" ? "Request" : l.status}
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
