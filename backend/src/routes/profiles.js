/**
 * Profile routes
 * ---------------
 * Rich user profiles with transaction history, reputation badges,
 * and trust signals visible to other users.
 */
const express = require("express");
const { db } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/profiles/me — current user's full profile
router.get("/me", requireAuth, async (req, res) => {
  res.json(buildProfile(req.user.id, true));
});

// PATCH /api/profiles/me — update profile (bio, phone, upi_vpa, qr_image_data)
router.patch("/me", requireAuth, async (req, res) => {
  const { bio, phone, upi_vpa, qr_image_data } = req.body;
  
  if (bio !== undefined) await db.prepare("UPDATE users SET bio = ? WHERE id = ?").run(bio, req.user.id);
  if (phone !== undefined) await db.prepare("UPDATE users SET phone = ? WHERE id = ?").run(phone, req.user.id);
  if (upi_vpa !== undefined) await db.prepare("UPDATE users SET upi_vpa = ? WHERE id = ?").run(upi_vpa, req.user.id);
  if (qr_image_data !== undefined) await db.prepare("UPDATE users SET qr_image_data = ? WHERE id = ?").run(qr_image_data, req.user.id);

  res.json(buildProfile(req.user.id, true));
});

function buildProfile(userId, isOwner) {
  const user = await db.prepare(
    `SELECT id, name, email, phone, department, year, role, verified, usn, upi_vpa, qr_image_data,
            rating_avg, rating_count, bio, avatar_url, created_at, suspended
     FROM users WHERE id = ?`
  ).get(userId);


  // Listing stats
  const listingCount = await db.prepare("SELECT COUNT(*) as c FROM listings WHERE seller_id = ?").get(userId).c;
  const activeListings = await db.prepare("SELECT COUNT(*) as c FROM listings WHERE seller_id = ? AND status = 'available'").get(userId).c;

  // Transaction stats
  const sold = await db.prepare(
    `SELECT COUNT(*) as c FROM requests r JOIN listings l ON l.id = r.listing_id
     WHERE l.seller_id = ? AND r.status = 'delivered'`
  ).get(userId).c;
  const bought = await db.prepare(
    `SELECT COUNT(*) as c FROM requests WHERE buyer_id = ? AND status = 'delivered'`
  ).get(userId).c;

  // Response time (avg time from created_at to responded_at for seller's requests)
  const avgResponse = await db.prepare(
    `SELECT AVG(
       (julianday(r.responded_at) - julianday(r.created_at)) * 24 * 60
     ) as avg_minutes
     FROM requests r JOIN listings l ON l.id = r.listing_id
     WHERE l.seller_id = ? AND r.responded_at IS NOT NULL`
  ).get(userId).avg_minutes;

  // Recent ratings received
  const ratings = await db.prepare(
    `SELECT ra.score, ra.comment, ra.created_at, u.name as rater_name
     FROM ratings ra JOIN users u ON u.id = ra.rater_id
     WHERE ra.ratee_id = ? ORDER BY ra.created_at DESC LIMIT 10`
  ).all(userId);

  // No-show count
  const noShows = await db.prepare(
    `SELECT COUNT(*) as c FROM requests WHERE buyer_id = ? AND status = 'no_show'`
  ).get(userId).c;

  // Free items donated
  const freeItems = await db.prepare(
    `SELECT COUNT(*) as c FROM requests r JOIN listings l ON l.id = r.listing_id
     WHERE l.seller_id = ? AND r.status = 'delivered' AND l.price = 0`
  ).get(userId).c;

  // Compute badges
  const badges = [];
  if (user.verified) badges.push({ id: "verified", label: "Verified Student", icon: "🎓" });
  if (sold >= 5) badges.push({ id: "trusted_seller", label: "Trusted Seller", icon: "⭐" });
  if (avgResponse && avgResponse < 30) badges.push({ id: "quick_responder", label: "Quick Responder", icon: "⚡" });
  if (freeItems >= 3) badges.push({ id: "campus_hero", label: "Campus Hero", icon: "🦸" });
  if (sold + bought >= 10) badges.push({ id: "power_user", label: "Power User", icon: "🔥" });
  if (noShows === 0 && bought >= 3) badges.push({ id: "reliable", label: "Reliable Buyer", icon: "✅" });

  // Recent activity (listings)
  const recentListings = await db.prepare(
    `SELECT id, item_name, category, price, status, created_at
     FROM listings WHERE seller_id = ? ORDER BY created_at DESC LIMIT 5`
  ).all(userId);

  const profile = {
    ...user,
    // Remove sensitive fields for public profiles
    phone: isOwner ? user.phone : undefined,
    email: isOwner ? user.email : undefined,
    stats: {
      listings: listingCount,
      activeListings,
      sold,
      bought,
      avgResponseMinutes: avgResponse ? Math.round(avgResponse) : null,
      freeItemsDonated: freeItems,
      noShows,
    },
    badges,
    ratings,
    recentListings,
  };

  return profile;
}

module.exports = router;
