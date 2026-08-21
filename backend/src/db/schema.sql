-- CampusSearch database schema
-- SQLite (swap-compatible with Postgres for production — see README)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                 -- uuid
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,          -- must match campus domain, enforced in auth service
  phone TEXT NOT NULL,
  department TEXT,
  year TEXT,
  role TEXT NOT NULL DEFAULT 'student', -- student | moderator | admin
  password_hash TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,  -- 1 once college-email verified
  rating_avg REAL NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  suspended INTEGER NOT NULL DEFAULT 0  -- moderation: blocked users can't list/request
);

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES users(id),
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  condition_notes TEXT,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,     -- 0 = free
  listing_type TEXT NOT NULL DEFAULT 'sale', -- sale | rent
  return_by TEXT,                       -- only used when listing_type = rent
  parent_kit_id TEXT REFERENCES listings(id), -- lets a kit be listed once and parts individually, linked
  status TEXT NOT NULL DEFAULT 'available', -- available | pending | claimed | expired | removed
  moderation_status TEXT NOT NULL DEFAULT 'clear', -- clear | flagged | removed
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT                       -- auto-set on creation, e.g. +60 days; job sweeps stale listings
);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id),
  buyer_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'notified', -- notified | accepted | declined | expired | delivered | cancelled | no_show
  delivery_day TEXT,                    -- seller-committed date, set on accept
  accepted_at TEXT,
  delivered_confirmed_at TEXT,          -- buyer confirms receipt -> unlocks payment QR in UI
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  responded_at TEXT
);

-- One listing can only have ONE active (notified/accepted) request at a time.
-- Enforced at the application layer inside matchingService with a DB transaction,
-- so concurrent buyers hitting "Request" at the same moment can't both win it (race condition case).

CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES requests(id),
  rater_id TEXT NOT NULL REFERENCES users(id),
  ratee_id TEXT NOT NULL REFERENCES users(id),
  score INTEGER NOT NULL,               -- 1 (thumbs down) or 5 (thumbs up), kept simple by design
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS flags (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id),
  reason TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium', -- low | medium | high
  reported_by TEXT,                     -- user id or 'auto-filter'
  status TEXT NOT NULL DEFAULT 'open',  -- open | cleared | removed
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  resolved_by TEXT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS fee_ledger (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES requests(id),
  seller_id TEXT NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,              -- platform fee owed by seller for this completed order (e.g. flat ₹1-5)
  settled INTEGER NOT NULL DEFAULT 0,   -- batched weekly/monthly settlement, not per-transaction
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  settled_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_requests_listing ON requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
