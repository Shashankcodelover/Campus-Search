import React, { useState, useEffect, useCallback } from "react";
import { Inbox, Clock, TrendingUp, CheckCircle2, QrCode, MessageSquare } from "lucide-react";
import { api } from "../api";
import { StatusDot } from "../components/common/StatusDot";
import { Badge } from "../components/common/Badge";
import { EmptyState } from "../components/common/EmptyState";
import { ChatBox } from "../components/common/ChatBox";

export function SellerInbox({ onOpenPayment }) {
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState({ asBuyer: [], asSeller: [] });
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api.myRequests();
      const asBuyer = Array.isArray(data?.asBuyer) ? data.asBuyer : [];
      const asSeller = Array.isArray(data?.asSeller) ? data.asSeller : [];
      setAllRequests({ asBuyer, asSeller });
      setRequests(asSeller.filter((r) => r.status === "notified"));
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const respond = async (id, decision) => {
    const delivery_day = decision === "accept" ? prompt("What day can you deliver? (e.g. Wednesday 3 PM)") : null;
    if (decision === "accept" && !delivery_day) return;
    try {
      await api.respondToRequest(id, decision, delivery_day);
      load();
    } catch (e) {
      alert(e.message || "Failed to respond");
    }
  };

  const handleConfirmDelivery = async (id) => {
    if (!window.confirm("Confirm that you have received this item from the seller?")) return;
    try {
      await api.confirmDelivered(id);
      if (onOpenPayment) onOpenPayment(id);
      load();
    } catch (e) {
      alert(e.message || "Could not confirm delivery");
    }
  };

  return (
    <div className="page-enter">
      <div className="section-header">
        <h2 className="section-title"><Inbox size={22} color="var(--signal)" /> My Component Requests</h2>
      </div>

      <h4 style={{ color: "var(--amber)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <Clock size={15} /> Incoming Requests to Respond ({requests.length})
      </h4>

      {requests.length === 0 ? (
        <div className="card" style={{ marginBottom: 24 }}>
          <EmptyState icon="📭" title="No pending requests" sub="When buyers request your items, they will appear here for your approval." />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {requests.map((r) => (
            <div key={r.id} className="card card-hover" style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  {r.item_name}
                  {r.listing_type === 'rent' && <span className="tab-badge" style={{ position: "static", background: "var(--signal)", padding: "2px 6px" }}>RENTAL</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  Requested: {new Date(r.created_at).toLocaleString()}
                  {r.listing_type === 'rent' && (
                    <span style={{ display: "block", marginTop: 2, color: "var(--amber)" }}>Return expected by: <strong>{r.return_by || "Arranged"}</strong></span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => respond(r.id, "accept")} className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 12 }}>
                  <CheckCircle2 size={13} /> Accept Request
                </button>
                <button onClick={() => respond(r.id, "decline")} className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 12 }}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Incoming Requests (Seller View: Accepted, waiting for buyer to confirm delivery) */}
      {(allRequests?.asSeller || []).filter((r) => r.status === "accepted" || r.status === "delivered").length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h4 style={{ color: "var(--signal)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <MessageSquare size={15} /> Active Incoming Requests (To Deliver)
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(allRequests?.asSeller || [])
              .filter((r) => r.status === "accepted" || r.status === "delivered")
              .map((r) => (
                <div key={r.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <h4 style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                        {r.item_name}
                        {r.listing_type === 'rent' && <span className="tab-badge" style={{ position: "static", background: "var(--signal)", padding: "2px 6px" }}>RENTAL</span>}
                      </h4>
                      <p style={{ fontSize: 12, color: "var(--muted)" }}>
                        Committed Delivery: <strong style={{ color: "var(--signal)" }}>{r.delivery_day}</strong>
                        {r.listing_type === 'rent' && (
                          <span style={{ display: "block", marginTop: 2, color: "var(--amber)" }}>Must return by: <strong>{r.return_by || "Arranged"}</strong></span>
                        )}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-secondary" onClick={() => setActiveChat(activeChat === r.id ? null : r.id)}>
                        <MessageSquare size={14} /> {activeChat === r.id ? "Close Chat" : "Chat with Buyer"}
                      </button>
                    </div>
                  </div>
                  {activeChat === r.id && (
                    <div style={{ marginTop: 16 }}>
                      <ChatBox requestId={r.id} />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Active Accepted Requests (Buyer View) */}
      {(allRequests?.asBuyer || []).filter((r) => r.status === "accepted" || r.status === "delivered").length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h4 style={{ color: "var(--signal)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={15} /> Active Outgoing Requests (As Buyer)
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(allRequests?.asBuyer || [])
              .filter((r) => r.status === "accepted" || r.status === "delivered")
              .map((r) => (
                <div key={r.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <h4 style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                        {r.item_name}
                        {r.listing_type === 'rent' && <span className="tab-badge" style={{ position: "static", background: "var(--signal)", padding: "2px 6px" }}>RENTAL</span>}
                      </h4>
                      <p style={{ fontSize: 12, color: "var(--muted)" }}>
                        Delivery committed: <strong style={{ color: "var(--signal)" }}>{r.delivery_day || "Scheduled"}</strong>
                        {r.listing_type === 'rent' && (
                          <span style={{ display: "block", marginTop: 2, color: "var(--amber)" }}>Must return by: <strong>{r.return_by || "Arranged"}</strong></span>
                        )}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-secondary" onClick={() => setActiveChat(activeChat === r.id ? null : r.id)}>
                        <MessageSquare size={14} /> {activeChat === r.id ? "Close Chat" : "Chat"}
                      </button>
                      {r.status === "accepted" && (
                        <button className="btn btn-primary" onClick={() => handleConfirmDelivery(r.id)}>
                          <CheckCircle2 size={14} /> Confirm Delivery & Pay UPI
                        </button>
                      )}
                      {r.status === "delivered" && (
                        <button className="btn btn-secondary" onClick={() => onOpenPayment && onOpenPayment(r.id)}>
                          <QrCode size={14} /> View UPI QR Code
                        </button>
                      )}
                    </div>
                  </div>
                  {activeChat === r.id && (
                    <div style={{ marginTop: 16 }}>
                      <ChatBox requestId={r.id} />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      <h4 style={{ color: "var(--muted)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <TrendingUp size={15} /> Request History
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
          ))}
        {allRequests.asBuyer.length + allRequests.asSeller.length === 0 && (
          <EmptyState icon="📋" title="No history yet" sub="Your completed, declined, and expired requests will show here." />
        )}
      </div>
    </div>
  );
}
