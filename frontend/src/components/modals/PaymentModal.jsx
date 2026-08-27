import React, { useEffect, useState } from "react";
import { X, CheckCircle, QrCode, AlertCircle, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import { api } from "../../api";

export function PaymentModal({ requestId, onClose, onPaymentConfirmed }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [intent, setIntent] = useState(null);
  const [qrCanvasRef, setQrCanvasRef] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    fetchIntent();
  }, [requestId]);

  const fetchIntent = async () => {
    try {
      setLoading(true);
      const data = await api.getPaymentIntent(requestId);
      setIntent(data);
      if (data.status === "paid") setPaid(true);
    } catch (e) {
      setError(e.message || "Failed to load payment details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (intent && intent.qr_data && qrCanvasRef) {
      QRCode.toCanvas(qrCanvasRef, intent.qr_data, { width: 200, margin: 1 }, (err) => {
        if (err) console.error("QR Code generation error:", err);
      });
    }
  }, [intent, qrCanvasRef]);

  const handleConfirmPaid = async () => {
    try {
      setConfirming(true);
      await api.confirmPayment(intent.id);
      setPaid(true);
      if (onPaymentConfirmed) onPaymentConfirmed();
    } catch (e) {
      setError(e.message || "Could not confirm payment.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
        <div className="modal-header">
          <h3>
            <QrCode size={18} style={{ verticalAlign: "middle", marginRight: "6px" }} />
            Campus Peer Payment (UPI)
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div className="spinner" />
              <p style={{ marginTop: "12px", color: "var(--muted)" }}>Generating UPI QR...</p>
            </div>
          ) : error ? (
            <div className="alert alert-error">
              <AlertCircle size={16} /> {error}
            </div>
          ) : paid ? (
            <div style={{ textAlign: "center", padding: "30px 10px" }}>
              <CheckCircle size={54} color="var(--signal)" style={{ marginBottom: "12px" }} />
              <h3>Payment Completed!</h3>
              <p style={{ color: "var(--muted)", margin: "8px 0 20px" }}>
                You have marked ₹{intent?.amount} paid to {intent?.sellerName}. The seller has been notified.
              </p>
              <button className="btn btn-primary" onClick={onClose} style={{ width: "100%" }}>
                Done
              </button>
            </div>
          ) : (
            <div>
              <div style={{ background: "var(--raised)", padding: "12px 16px", borderRadius: "var(--radius-md)", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "var(--muted)" }}>Item:</span>
                  <strong>{intent?.item_name}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "var(--muted)" }}>Pay To (Seller):</span>
                  <strong>{intent?.sellerName}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", paddingTop: "8px", borderTop: "1px solid var(--trace)" }}>
                  <span>Amount Due:</span>
                  <strong style={{ color: "var(--signal)" }}>₹{intent?.amount}</strong>
                </div>
              </div>

              <div className="qr-container">
                <canvas ref={(ref) => setQrCanvasRef(ref)} />
                <span style={{ fontSize: "12px", color: "#4b5563", fontWeight: "600" }}>
                  UPI VPA: {intent?.upi_vpa}
                </span>
                <p style={{ fontSize: "11px", color: "#6b7280", textAlign: "center" }}>
                  Scan with Google Pay, PhonePe, Paytm, or BHIM app to complete direct peer transfer.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--muted)", margin: "16px 0" }}>
                <ShieldCheck size={16} color="var(--signal)" />
                <span>Peer-to-peer campus escrow. Zero transaction cut taken by platform.</span>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleConfirmPaid}
                disabled={confirming}
                style={{ width: "100%" }}
              >
                {confirming ? "Confirming..." : "I Have Completed Payment"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
