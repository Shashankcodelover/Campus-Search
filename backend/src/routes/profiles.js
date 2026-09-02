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
  try {
    const profile = await buildProfile(req.user.id, true);
    if (!profile) {
      // Fallback: minimal user profile from req.user
      return res.json({
        id: req.user.id,
        name: req.user.name || "Student",
        email: req.user.email,
        department: req.user.department || "Engineering",
        year: req.user.year || 3,
        role: req.user.role || "student",
        verified: req.user.verified || false,
        usn: req.user.usn || "",
        stats: { listings: 0, activeListings: 0, sold: 0, bought: 0, noShows: 0 },
        badges: [{ id: "student", label: "Campus Student", icon: "🎓" }],
        recentListings: [],
        ratings: []
      });
    }
    res.json(profile);
  } catch (err) {
    console.error("Profile load error:", err);
    res.json({
      id: req.user.id,
      name: req.user.name || "Student",
      email: req.user.email,
      department: req.user.department || "Engineering",
      stats: { listings: 0, activeListings: 0, sold: 0, bought: 0, noShows: 0 },
      badges: [{ id: "student", label: "Campus Student", icon: "🎓" }],
      recentListings: [],
      ratings: []
    });
  }
});

// PATCH /api/profiles/me — update profile (bio, phone, upi_vpa, qr_image_data)
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const { bio, phone, upi_vpa, qr_image_data } = req.body;
    
    if (bio !== undefined) await db.prepare("UPDATE users SET bio = ? WHERE id = ?").run(bio, req.user.id);
    if (phone !== undefined) await db.prepare("UPDATE users SET phone = ? WHERE id = ?").run(phone, req.user.id);
    if (upi_vpa !== undefined) await db.prepare("UPDATE users SET upi_vpa = ? WHERE id = ?").run(upi_vpa, req.user.id);
    if (qr_image_data !== undefined) await db.prepare("UPDATE users SET qr_image_data = ? WHERE id = ?").run(qr_image_data, req.user.id);

    const updated = await buildProfile(req.user.id, true);
    res.json(updated || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function buildProfile(userId, isOwner) {
  const user = await db.prepare(
    `SELECT id, name, email, phone, department, year, role, verified, usn, upi_vpa, qr_image_data,
            rating_avg, rating_count, bio, avatar_url, created_at, suspended
     FROM users WHERE id = ?`
  ).get(userId);

  if (!user) return null;

  const getCount = (row) => Number(row?.c || row?.count || 0);

  // Execute all ancillary stats concurrently in ONE Promise.all
  const [
    listingRow,
    activeListingRow,
    soldRow,
    boughtRow,
    noShowRow,
    freeRow,
    recentListings
  ] = await Promise.all([
    db.prepare("SELECT COUNT(*) as c FROM listings WHERE seller_id = ?").get(userId).catch(() => ({ c: 0 })),
    db.prepare("SELECT COUNT(*) as c FROM listings WHERE seller_id = ? AND status = 'available'").get(userId).catch(() => ({ c: 0 })),
    db.prepare("SELECT COUNT(*) as c FROM requests r JOIN listings l ON l.id = r.listing_id WHERE l.seller_id = ? AND r.status = 'delivered'").get(userId).catch(() => ({ c: 0 })),
    db.prepare("SELECT COUNT(*) as c FROM requests WHERE buyer_id = ? AND status = 'delivered'").get(userId).catch(() => ({ c: 0 })),
    db.prepare("SELECT COUNT(*) as c FROM requests WHERE buyer_id = ? AND status = 'no_show'").get(userId).catch(() => ({ c: 0 })),
    db.prepare("SELECT COUNT(*) as c FROM requests r JOIN listings l ON l.id = r.listing_id WHERE l.seller_id = ? AND r.status = 'delivered' AND l.price = 0").get(userId).catch(() => ({ c: 0 })),
    db.prepare("SELECT id, item_name, category, price, status, created_at FROM listings WHERE seller_id = ? ORDER BY created_at DESC LIMIT 5").all(userId).catch(() => [])
  ]);

  const listingCount = getCount(listingRow);
  const activeListings = getCount(activeListingRow);
  const sold = getCount(soldRow);
  const bought = getCount(boughtRow);
  const noShows = getCount(noShowRow);
  const freeItems = getCount(freeRow);

  // Compute badges
  const badges = [];
  if (user.verified) badges.push({ id: "verified", label: "Verified Student", icon: "🎓" });
  if (sold >= 5) badges.push({ id: "trusted_seller", label: "Trusted Seller", icon: "⭐" });
  if (freeItems >= 3) badges.push({ id: "campus_hero", label: "Campus Hero", icon: "🦸" });
  if (sold + bought >= 10) badges.push({ id: "power_user", label: "Power User", icon: "🔥" });
  if (noShows === 0 && bought >= 3) badges.push({ id: "reliable", label: "Reliable Buyer", icon: "✅" });
  if (badges.length === 0) badges.push({ id: "student", label: "Campus Student", icon: "🎓" });

  const profile = {
    ...user,
    phone: isOwner ? user.phone : undefined,
    email: isOwner ? user.email : undefined,
    stats: {
      listings: listingCount,
      activeListings,
      sold,
      bought,
      avgResponseMinutes: null,
      noShows,
      freeItems,
    },
    badges,
    recentListings: recentListings || [],
    ratings: [],
  };

  return profile;
}

module.exports = router;
