import React, { useState, useEffect } from "react";
import { Star, Package } from "lucide-react";
import { api } from "../api";
import { Avatar } from "../components/common/Avatar";
import { StatusDot } from "../components/common/StatusDot";
import { EmptyState } from "../components/common/EmptyState";
import { Skeleton } from "../components/common/Skeleton";

export function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMyProfile();
        setProfile(data);
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <Skeleton type="card" count={2} />;
  if (!profile) return <EmptyState icon="😕" title="Could not load profile" sub="Try refreshing the page." />;

  return (
    <div className="page-enter">
      <div className="card card-glow profile-header">
        <Avatar name={profile.name} size="xl" />
        <div className="profile-header__info">
          <h2 className="profile-header__name">{profile.name}</h2>
          <div className="profile-header__meta">
            {profile.department} · {profile.year} · {profile.email}
          </div>
          {profile.bio && <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6 }}>{profile.bio}</div>}
          <div className="profile-badges">
            {profile.badges?.map((b) => (
              <div key={b.id} className="profile-badge">
                <span className="profile-badge__icon">{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Items Listed", value: profile.stats.listings, color: "var(--signal)" },
          { label: "Sold", value: profile.stats.sold, color: "var(--amber)" },
          { label: "Bought", value: profile.stats.bought, color: "var(--blue)" },
          { label: "Rating", value: profile.rating_avg ? `${profile.rating_avg.toFixed(1)} ★` : "—", color: "var(--amber)" },
          { label: "Free Donated", value: profile.stats.freeItemsDonated, color: "var(--signal)" },
          { label: "Avg Response", value: profile.stats.avgResponseMinutes ? `${profile.stats.avgResponseMinutes}m` : "—", color: "var(--text)" },
        ].map((s) => (
          <div key={s.label} className="card stat-card">
            <div className="stat-card__value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-card__label">{s.label}</div>
          </div>
        ))}
      </div>

      {profile.ratings?.length > 0 && (
        <>
          <h4 style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Star size={15} /> Recent Reviews</h4>
          <div className="card" style={{ overflow: "hidden", marginBottom: 24 }}>
            {profile.ratings.map((r, i) => (
              <div key={i} style={{ padding: "12px 16px", borderBottom: i < profile.ratings.length - 1 ? "1px solid var(--trace)" : "none", display: "flex", gap: 10 }}>
                <Avatar name={r.rater_name} size="sm" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {r.rater_name} {r.score === 5 ? "👍" : "👎"}
                  </div>
                  {r.comment && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{r.comment}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {profile.recentListings?.length > 0 && (
        <>
          <h4 style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Package size={15} /> Recent Listings</h4>
          <div className="card" style={{ overflow: "hidden" }}>
            {profile.recentListings.map((l) => (
              <div key={l.id} className="listing-row" style={{ gridTemplateColumns: "1fr auto auto" }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{l.item_name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{l.category}</div>
                </div>
                <span className="font-mono" style={{ fontSize: 13, color: "var(--signal)" }}>{l.price === 0 ? "Free" : `₹${l.price}`}</span>
                <StatusDot status={l.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
