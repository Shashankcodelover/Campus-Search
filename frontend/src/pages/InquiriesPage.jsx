import React, { useEffect, useState } from "react";
import { Radio, Send, CheckCircle2, Clock, MessageSquare, AlertCircle, Plus } from "lucide-react";
import { api } from "../api";
import { InquiryModal } from "../components/modals/InquiryModal";

export function InquiriesPage() {
  const [activeTab, setActiveTab] = useState("incoming"); // 'incoming' | 'mine'
  const [incoming, setIncoming] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseMsg, setResponseMsg] = useState("");
  const [priceOffer, setPriceOffer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      if (activeTab === "incoming") {
        const data = await api.incomingInquiries();
        setIncoming(data);
      } else {
        const data = await api.myInquiries();
        setMine(data);
      }
    } catch (err) {
      setError(err.message || "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (inquiryId) => {
    try {
      setSubmitting(true);
      await api.respondToInquiry(inquiryId, {
        message: responseMsg,
        priceOffer: priceOffer ? parseInt(priceOffer, 10) : 0,
      });
      setRespondingTo(null);
      setResponseMsg("");
      setPriceOffer("");
      loadData();
    } catch (err) {
      alert(err.message || "Failed to send response");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptResponse = async (inquiryId, responseId) => {
    try {
      await api.acceptInquiryResponse(inquiryId, responseId);
      loadData();
    } catch (err) {
      alert(err.message || "Could not accept response");
    }
  };

  return (
    <div className="page-enter">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2>Broadcast Inquiries</h2>
          <p style={{ color: "var(--muted)", fontSize: "13px" }}>
            Check availability before booking, or respond to buyers looking for components you own.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Radio size={14} /> Ask Availability
        </button>
      </div>

      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--trace)", marginBottom: "20px" }}>
        <button
          className={`btn ${activeTab === "incoming" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("incoming")}
          style={{ borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}
        >
          Incoming Buyer Inquiries ({incoming.length})
        </button>
        <button
          className={`btn ${activeTab === "mine" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("mine")}
          style={{ borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}
        >
          My Inquiries ({mine.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div className="spinner" />
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : activeTab === "incoming" ? (
        <div>
          {incoming.length === 0 ? (
            <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
              <Radio size={36} style={{ marginBottom: "12px", opacity: 0.4 }} />
              <p>No active broadcast inquiries matching your listing categories right now.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {incoming.map((inq) => (
                <div key={inq.id} className="card inquiry-card" style={{ padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <span className="inquiry-badge">
                          <Radio size={12} /> BROADCAST
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>Category: {inq.category}</span>
                      </div>
                      <h4 style={{ fontSize: "16px", marginBottom: "4px" }}>{inq.item_query}</h4>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                        Buyer: <strong>{inq.buyer_name}</strong> ({inq.buyer_department})
                      </p>
                      {inq.notes && <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "6px" }}>"{inq.notes}"</p>}
                    </div>

                    <div style={{ textAlign: "right" }}>
                      {inq.needed_by_date && (
                        <div style={{ fontSize: "12px", color: "var(--amber)", fontWeight: "600", marginBottom: "4px" }}>
                          Needed: {inq.needed_by_date}
                        </div>
                      )}
                      {inq.max_budget > 0 && (
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--signal)" }}>
                          Budget: ₹{inq.max_budget}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--trace)", display: "flex", justifyContent: "flex-end" }}>
                    {inq.my_response_id ? (
                      <span style={{ fontSize: "12px", color: "var(--signal)", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle2 size={14} /> You Responded
                      </span>
                    ) : respondingTo === inq.id ? (
                      <div style={{ width: "100%", background: "var(--raised)", padding: "12px", borderRadius: "var(--radius-md)" }}>
                        <h5 style={{ marginBottom: "8px" }}>Confirm Availability to Buyer</h5>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                          <input
                            type="text"
                            className="input"
                            placeholder="Message (e.g. Yes, available at hostel block 2)"
                            value={responseMsg}
                            onChange={(e) => setResponseMsg(e.target.value)}
                          />
                          <input
                            type="number"
                            className="input"
                            placeholder="Your Price Offer (₹)"
                            value={priceOffer}
                            onChange={(e) => setPriceOffer(e.target.value)}
                          />
                        </div>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button className="btn btn-secondary" onClick={() => setRespondingTo(null)}>Cancel</button>
                          <button className="btn btn-primary" disabled={submitting} onClick={() => handleRespond(inq.id)}>
                            {submitting ? "Sending..." : "Confirm & Send"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn btn-primary" onClick={() => setRespondingTo(inq.id)}>
                        <Send size={14} /> I Have This Available
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {mine.length === 0 ? (
            <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
              <Radio size={36} style={{ marginBottom: "12px", opacity: 0.4 }} />
              <p>You haven't posted any broadcast inquiries yet.</p>
              <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: "12px" }}>
                Ask Availability
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {mine.map((inq) => (
                <div key={inq.id} className="card" style={{ padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div>
                      <h4 style={{ fontSize: "16px" }}>{inq.item_query}</h4>
                      <p style={{ fontSize: "12px", color: "var(--muted)" }}>
                        Category: {inq.category} | Status: <strong style={{ color: inq.status === "matched" ? "var(--signal)" : "var(--amber)" }}>{inq.status.toUpperCase()}</strong>
                      </p>
                    </div>
                    {inq.needed_by_date && <span style={{ fontSize: "12px", color: "var(--amber)" }}>Needed: {inq.needed_by_date}</span>}
                  </div>

                  {/* Sellers who responded */}
                  {inq.responses && inq.responses.length > 0 && (
                    <div style={{ background: "var(--raised)", padding: "12px", borderRadius: "var(--radius-md)", marginTop: "10px" }}>
                      <h5 style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>
                        RESPONSES FROM CAMPUS SELLERS ({inq.responses.length})
                      </h5>
                      {inq.responses.map((resp) => (
                        <div key={resp.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--trace)" }}>
                          <div>
                            <strong>{resp.seller_name}</strong> ({resp.seller_department})
                            {resp.message && <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>"{resp.message}"</p>}
                            {resp.price_offer > 0 && <span style={{ fontSize: "12px", color: "var(--signal)", fontWeight: "600" }}>Offer: ₹{resp.price_offer}</span>}
                          </div>

                          {inq.status === "open" && (
                            <button className="btn btn-primary" onClick={() => handleAcceptResponse(inq.id, resp.id)}>
                              Accept & Connect
                            </button>
                          )}
                          {resp.status === "accepted" && (
                            <span style={{ fontSize: "12px", color: "var(--signal)", fontWeight: "600" }}>✓ MATCHED</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && <InquiryModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); loadData(); }} />}
    </div>
  );
}
