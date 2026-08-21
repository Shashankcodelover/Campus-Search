/**
 * moderationService
 * ------------------
 * Implements the safety rules from planning:
 *  - auto-flag listings matching scam patterns (esp. "pay to confirm" job/internship language)
 *  - new/unverified sellers posting unusually large quantities get flagged for human review
 *  - admins/moderators resolve flags (clear or remove) — see routes/admin.js
 *
 * This runs synchronously at listing-creation time (cheap keyword heuristics).
 * A production version would add a proper ML/rules pipeline, but the keyword
 * layer here already catches the exact "guaranteed internship, pay to confirm"
 * pattern flagged during planning.
 */
const { db } = require("../db");
const { v4: uuid } = require("uuid");

const SCAM_PATTERNS = [
  /pay.{0,15}(confirm|secure|reserve)/i,
  /registration fee/i,
  /guaranteed (internship|job|placement)/i,
  /processing fee/i,
  /advance payment/i,
];

function screenListing(listing, seller) {
  const flags = [];
  const text = `${listing.item_name} ${listing.description || ""}`;

  for (const pattern of SCAM_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({ reason: "Payment-for-opportunity language detected — classic scam pattern", severity: "high" });
      break;
    }
  }

  if (!seller.verified) {
    // unverified account + high quantity/price is a secondary risk signal
    if (/\bx\s?\d{2,}\b/i.test(listing.item_name) || listing.price > 5000) {
      flags.push({ reason: "Unverified account posting unusually large quantity/value", severity: "medium" });
    }
  }

  for (const f of flags) {
    db.prepare(
      `INSERT INTO flags (id, listing_id, reason, severity, reported_by, status) VALUES (?, ?, ?, ?, 'auto-filter', 'open')`
    ).run(uuid(), listing.id, f.reason, f.severity);

    if (f.severity === "high") {
      db.prepare(`UPDATE listings SET moderation_status = 'flagged' WHERE id = ?`).run(listing.id);
    }
  }

  return flags;
}

function resolveFlag(flagId, moderatorId, action) {
  const flag = db.prepare("SELECT * FROM flags WHERE id = ?").get(flagId);
  if (!flag) return null;

  const status = action === "remove" ? "removed" : "cleared";
  db.prepare(`UPDATE flags SET status = ?, resolved_at = datetime('now'), resolved_by = ? WHERE id = ?`).run(status, moderatorId, flagId);

  if (action === "remove") {
    db.prepare(`UPDATE listings SET status = 'removed', moderation_status = 'removed' WHERE id = ?`).run(flag.listing_id);
  } else {
    db.prepare(`UPDATE listings SET moderation_status = 'clear' WHERE id = ?`).run(flag.listing_id);
  }

  return flag;
}

module.exports = { screenListing, resolveFlag };
