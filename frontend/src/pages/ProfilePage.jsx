import React, { useState, useEffect } from "react";
import { Star, Package, QrCode, Upload, Save, Check } from "lucide-react";
import { api } from "../api";
import { Avatar } from "../components/common/Avatar";
import { StatusDot } from "../components/common/StatusDot";
import { EmptyState } from "../components/common/EmptyState";
import { Skeleton } from "../components/common/Skeleton";
import { ListItemModal } from "../components/modals/ListItemModal";

export function ProfilePage() {
  const [profile, setProfile] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("cs_user") || "null");
      if (u) {
        return {
          ...u,
          stats: { listings: 0, activeListings: 0, sold: 0, bought: 0, noShows: 0 },
          badges: [{ id: "student", label: "Campus Student", icon: "🎓" }],
          recentListings: [],
          ratings: []
        };
      }
      return null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [upiVpa, setUpiVpa] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("cs_user") || "null");
      return u?.upi_vpa || "";
    } catch {
      return "";
    }
  });
  const [qrImage, setQrImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.getMyProfile();
      if (data && data.name) {
        setProfile((prev) => ({ ...prev, ...data }));
        if (data.upi_vpa) setUpiVpa(data.upi_vpa);
        if (data.qr_image_data) setQrImage(data.qr_image_data);
      }
    } catch (e) {
      console.warn("Could not refresh live profile stats:", e);
    }
  };

  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setQrImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePaymentSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await api.updateMyProfile({
        upi_vpa: upiVpa.trim(),
        qr_image_data: qrImage,
      });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert("Failed to save UPI payment settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton type="card" count={2} />;
  if (!profile) return <EmptyState icon="😕" title="Could not load profile" sub="Try refreshing the page." />;

  return (
    <div className="page-enter">
      <div className="card card-glow profile-header">
        <Avatar name={profile.name} size="xl" />
        <div className="profile-header__info">
          <h2 className="profile-header__name">{profile.name}</h2>
          <div className="profile-header__meta">
            {profile.department} · {profile.year} · {profile.email} {profile.usn ? `· USN: ${profile.usn}` : ""}
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
          <div style={{ marginTop: 16 }}>
            <button 
              className="btn btn-ghost" 
              style={{ color: "var(--red)", fontSize: 13, padding: "6px 12px" }}
              onClick={() => window.dispatchEvent(new Event("auth_error"))}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Seller UPI Payment Setup Section */}
      <div className="card" style={{ padding: "20px", marginBottom: "24px", borderLeft: "4px solid var(--signal)" }}>
        <h4 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "8px" }}>
          <QrCode size={18} color="var(--signal)" /> My Peer Payment Setup (UPI & QR Code)
        </h4>
        <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "16px" }}>
          Configure your UPI ID or upload your custom GPay / PhonePe / Paytm QR image so buyers can pay you directly upon component delivery.
        </p>

        <form onSubmit={handleSavePaymentSettings}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted)", display: "block", marginBottom: "4px" }}>
                YOUR UPI VPA / ID
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. yourname@upi or 9876543210@ybl"
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted)", display: "block", marginBottom: "4px" }}>
                CUSTOM UPI QR CODE IMAGE
              </label>
              <input
                type="file"
                id="profile-qr-input"
                accept="image/*"
                onChange={handleQrUpload}
                style={{ display: "none" }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => document.getElementById("profile-qr-input").click()}
                style={{ width: "100%", justifyContent: "center" }}
              >
                <Upload size={14} /> {qrImage ? "Change QR Image" : "Upload QR Image"}
              </button>
            </div>
          </div>

          {qrImage && (
            <div style={{ textAlign: "center", background: "var(--raised)", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", color: "var(--signal)", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                Uploaded QR Image Preview:
              </span>
              <img src={qrImage} alt="Uploaded UPI QR" style={{ maxHeight: "140px", borderRadius: "8px" }} />
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : saved ? <><Check size={14} /> Saved Successfully</> : <><Save size={14} /> Save Payment Settings</>}
          </button>
        </form>
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
              <div key={l.id} className="listing-row" style={{ gridTemplateColumns: "1fr auto auto auto" }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{l.item_name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{l.category}</div>
                </div>
                <span className="font-mono" style={{ fontSize: 13, color: "var(--signal)" }}>{l.price === 0 ? "Free" : `₹${l.price}`}</span>
                <StatusDot status={l.status} />
                <button onClick={() => setEditItem(l)} className="btn-icon" style={{ padding: "4px" }} title="Edit Listing">✏️</button>
              </div>
            ))}
          </div>
        </>
      )}

      {editItem && (
        <ListItemModal 
          editItem={editItem} 
          onClose={() => setEditItem(null)} 
          onCreated={() => { setEditItem(null); loadProfile(); }} 
        />
      )}
    </div>
  );
}
