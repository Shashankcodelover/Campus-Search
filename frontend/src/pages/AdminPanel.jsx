import React, { useState, useEffect, useCallback } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Trash2 } from "lucide-react";
import { api } from "../api";
import { Badge } from "../components/common/Badge";
import { EmptyState } from "../components/common/EmptyState";
import { Skeleton } from "../components/common/Skeleton";

export function AdminPanel() {
  const [stats, setStats] = useState({});
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, f] = await Promise.all([api.adminStats(), api.adminFlags()]);
      setStats(s);
      setFlags(f);
    } catch (e) {}
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const resolve = async (id, action) => {
    await api.resolveFlag(id, action);
    load();
  };

  if (loading) return <Skeleton type="card" count={3} />;

  return (
    <div className="page-enter">
      <div className="section-header">
        <h2 className="section-title"><ShieldCheck size={22} /> Moderation & Trust</h2>
      </div>

      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {[
          { label: "Active listings", value: stats.active ?? "—", color: "var(--signal)" },
          { label: "Pending requests", value: stats.pending ?? "—", color: "var(--amber)" },
          { label: "Flagged for review", value: stats.openFlags ?? "—", color: "var(--red)" },
          { label: "Verified sellers", value: `${stats.verifiedPct ?? "—"}%`, color: "var(--text)" },
        ].map((s) => (
          <div key={s.label} className="card card-glow stat-card">
            <div className="stat-card__value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-card__label">{s.label}</div>
          </div>
        ))}
      </div>

      <h4 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <ShieldAlert size={16} color="var(--red)" /> Moderation Queue
      </h4>

      {flags.length === 0 ? (
        <div className="card">
          <EmptyState icon="✅" title="Queue is clear" sub="No flagged listings right now." />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {flags.map((f) => (
            <div key={f.id} className="card card-hover" style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <Badge tone={f.severity === "high" ? "red" : "amber"}>{f.severity} risk</Badge>
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 8 }}>{f.item_name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{f.reason}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => resolve(f.id, "remove")} className="btn btn-danger" style={{ padding: "8px 14px", fontSize: 12 }}><Trash2 size={13} /> Remove</button>
                <button onClick={() => resolve(f.id, "clear")} className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 12 }}>Clear</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="alert alert--warn" style={{ marginTop: 24 }}>
        <AlertTriangle size={15} className="alert__icon" />
        <div>Internship/job postings are admin-verified only. Never pay to confirm a placement.</div>
      </div>
    </div>
  );
}
