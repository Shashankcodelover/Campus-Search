/**
 * payments.js (v2.0)
 * ------------------
 * UPI Payment Intents & QR generation layer.
 */
const express = require("express");
const { v4: uuid } = require("uuid");
const { requireAuth } = require("../middleware/auth");
const { db } = require("../db");

const router = express.Router();

// GET /api/payments/intent/:requestId — Get or create payment intent with UPI QR data
router.get("/intent/:requestId", requireAuth, async (req, res) => {
  const request = await db.prepare(
    `SELECT r.*, l.item_name, l.price, l.seller_id 
     FROM requests r JOIN listings l ON l.id = r.listing_id 
     WHERE r.id = ?`
  ).get(req.params.requestId);

  if (!request) return res.status(404).json({ error: "Request not found." });

  const isBuyer = request.buyer_id === req.user.id;
  const isSeller = request.seller_id === req.user.id;
  if (!isBuyer && !isSeller) return res.status(403).json({ error: "Unauthorized access to payment intent." });

  let intent = await db.prepare("SELECT * FROM payment_intents WHERE request_id = ?").get(req.params.requestId);
  const seller = await db.prepare("SELECT name, phone, department, upi_vpa, qr_image_data FROM users WHERE id = ?").get(request.seller_id);

  if (!intent) {
    const upiVpa = seller.upi_vpa || `${seller.phone || "campus"}@upi`;
    const amount = request.price || 0;
    
    const encodedName = encodeURIComponent(seller.name);
    const encodedNote = encodeURIComponent(`CampusSearch - ${request.item_name}`);
    const qrData = `upi://pay?pa=${upiVpa}&pn=${encodedName}&am=${amount}&tn=${encodedNote}&cu=INR`;

    const id = uuid();
    await db.prepare(
      `INSERT INTO payment_intents (id, request_id, seller_id, buyer_id, amount, upi_vpa, qr_data, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`
    ).run(id, req.params.requestId, request.seller_id, request.buyer_id, amount, upiVpa, qrData);

    intent = await db.prepare("SELECT * FROM payment_intents WHERE id = ?").get(id);
  }

  res.json({
    ...intent,
    sellerName: seller.name,
    sellerPhone: seller.phone,
    sellerQrImage: seller.qr_image_data || null,
    item_name: request.item_name,
  });
});


// POST /api/payments/confirm/:intentId — Buyer marks UPI payment as completed
router.post("/confirm/:intentId", requireAuth, async (req, res) => {
  const intent = await db.prepare("SELECT * FROM payment_intents WHERE id = ?").get(req.params.intentId);
  if (!intent) return res.status(404).json({ error: "Payment intent not found." });
  if (intent.buyer_id !== req.user.id) return res.status(403).json({ error: "Only buyer can confirm payment." });

  await db.prepare(
    `UPDATE payment_intents SET status = 'paid', paid_at = datetime('now') WHERE id = ?`
  ).run(req.params.intentId);

  // Notify seller of payment completion
  const notificationService = require("../services/notificationService");
  const buyer = await db.prepare("SELECT name FROM users WHERE id = ?").get(req.user.id);
  const seller = await db.prepare("SELECT * FROM users WHERE id = ?").get(intent.seller_id);

  notificationService.notify(seller, {
    type: "payment_confirmed",
    title: "💵 Payment Received!",
    message: `${buyer.name} marked payment of ₹${intent.amount} as complete. Please verify your UPI app.`,
    data: { intentId: intent.id, requestId: intent.request_id },
  });

  res.json({ ok: true, status: "paid" });
});

module.exports = router;
