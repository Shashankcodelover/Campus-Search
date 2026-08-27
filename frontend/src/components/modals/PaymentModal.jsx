import React, { useEffect, useState } from "react";
import { X, CheckCircle, QrCode, AlertCircle, ShieldCheck, Copy, Phone } from "lucide-react";
import QRCode from "qrcode";
import { api } from "../../api";

export function PaymentModal({ requestId, onClose, onPaymentConfirmed }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [intent, setIntent] = useState(null);
  const [qrCanvasRef, setQrCanvasRef] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);

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
    if (intent && intent.qr_data && qrCanvasRef && !intent.sellerQrImage) {
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

  const copyVpa = () => {
    if (intent?.upi_vpa) {
      navigator.clipboard.writeText(intent.upi_vpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
        <div className="modal-header">
          <h3>
            <QrCode size={18} style={{ verticalAlign: "middle", marginRight: "6px" }} />
            Campus Direct UPI Payment
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div className="spinner" />
              <p style={{ marginTop: "12px", color: "var(--muted)" }}>Loading Payment Details...</p>
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
                You marked ₹{intent?.amount} paid to <strong>{intent?.sellerName}</strong>. The seller has been notified.
              </p>
              <button className="btn btn-primary" onClick={onClose} style={{ width: "100%" }}>
                Done
              </button>
            </div>
          ) : (
            <div>
              <div style={{ background: "var(--raised)", padding: "12px 16px", borderRadius: "var(--radius-md)", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "var(--muted)" }}>Component:</span>
                  <strong>{intent?.item_name}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "var(--muted)" }}>Seller Name:</span>
                  <strong>{intent?.sellerName}</strong>
                </div>
                {intent?.sellerPhone && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
                    <span style={{ color: "var(--muted)" }}>Phone / Contact:</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Phone size={12} color="var(--signal)" /> {intent.sellerPhone}
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", paddingTop: "8px", borderTop: "1px solid var(--trace)" }}>
                  <span>Amount to Pay:</span>
                  <strong style={{ color: "var(--signal)" }}>₹{intent?.amount}</strong>
                </div>
              </div>

              <div className="qr-container">
                {intent?.sellerQrImage ? (
                  <img
                    src={intent.sellerQrImage}
                    alt="Seller Custom UPI QR"
                    style={{ width: "200px", height: "200px", objectFit: "contain", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  />
                ) : (
                  <canvas ref={(ref) => setQrCanvasRef(ref)} />
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f3f4f6", padding: "6px 12px", borderRadius: "20px" }}>
                  <span style={{ fontSize: "13px", color: "#1f2937", fontWeight: "600" }}>
                    {intent?.upi_vpa}
                  </span>
                  <button onClick={copyVpa} className="btn-ghost" style={{ padding: "2px 6px", fontSize: "11px", color: "var(--signal-dim)" }}>
                    <Copy size={12} /> {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                <p style={{ fontSize: "11px", color: "#6b7280", textAlign: "center", marginTop: "4px" }}>
                  Scan with GPay, PhonePe, Paytm, or BHIM app to complete peer-to-peer payment.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--muted)", margin: "14px 0" }}>
                <ShieldCheck size={16} color="var(--signal)" />
                <span>Verified peer-to-peer transaction. Zero platform fees for students.</span>
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
