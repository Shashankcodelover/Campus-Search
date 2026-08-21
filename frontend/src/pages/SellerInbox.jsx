import React, { useState, useEffect, useCallback } from "react";
import { Inbox, Clock, TrendingUp, CheckCircle2 } from "lucide-react";
import { api } from "../api";
import { StatusDot } from "../components/common/StatusDot";
import { Badge } from "../components/common/Badge";
import { EmptyState } from "../components/common/EmptyState";

export function SellerInbox() {
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState({ asBuyer: [], asSeller: [] });
  const load = useCallback(async () => {
    const data = await api.myRequests();
    setAllRequests(data);
    setRequests(data.asSeller.filter((r) => r.status === "notified"));
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);

  const respond = async (id, decision) => {
    const delivery_day = decision === "accept" ? prompt("What day can you deliver? (e.g. Wednesday)") : null;
    if (decision === "accept" && !delivery_day) return;
    await api.respondToRequest(id, decision, delivery_day);
    load();
  };

  return (
    <div className="page-enter">
      <div className="section-header">
        <h2 className="section-title"><Inbox size={22} /> My Requests</h2>
      </div>

      <h4 style={{ color: "var(--amber)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <Clock size={15} /> Pending Response ({requests.length})
      </h4>
      {requests.length === 0 ? (
        <div className="card" style={{ marginBottom: 24 }}>
          <EmptyState icon="📭" title="No pending requests" sub="When buyers request your listings, they'll appear here." />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {requests.map((r) => (
            <div key={r.id} className="card card-hover" style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{r.item_name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  <Clock size={11} style={{ verticalAlign: "middle" }} /> {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => respond(r.id, "accept")} className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 12 }}>
                  <CheckCircle2 size={13} /> Accept
                </button>
                <button onClick={() => respond(r.id, "decline")} className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 12 }}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h4 style={{ color: "var(--muted)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <TrendingUp size={15} /> History
      </h4>
      <div className="card" style={{ overflow: "hidden" }}>
        {[...allRequests.asBuyer, ...allRequests.asSeller]
          .filter((r) => r.status !== "notified")
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 20)
          .map((r) => (
            <div key={r.id} className="listing-row" style={{ gridTemplateColumns: "1fr auto auto" }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{r.item_name}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{new Date(r.created_at).toLocaleDateString()}</div>
              </div>
              <StatusDot status={r.status === "delivered" ? "claimed" : r.status === "accepted" ? "pending" : "expired"} />
              <Badge tone={r.status === "delivered" ? "green" : r.status === "accepted" ? "amber" : "muted"}>{r.status}</Badge>
            </div>
          ))
        }
        {allRequests.asBuyer.length + allRequests.asSeller.length === 0 && (
          <EmptyState icon="📋" title="No history yet" sub="Your completed, declined, and expired requests will show here." />
        )}
      </div>
    </div>
  );
}
