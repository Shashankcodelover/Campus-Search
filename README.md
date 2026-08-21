# CampusSearch

A campus-restricted marketplace for reusable engineering-project components (Arduino boards, sensors, motors, full elective kits) that would otherwise sit idle after a project is submitted.

This repo is a **working prototype**, not a hosted product: it has a real backend, a real database, and real business logic for every edge case discussed in planning. It's meant to run locally and be extended by whoever picks it up next.

## Why this exists

Engineering electives assign hands-on projects (robotics, embedded systems). Students buy components in the city, use them once, and the parts go idle — while next semester's batch buys the exact same parts again. CampusSearch is the exchange layer that was missing: a searchable board, verified-student identity, a matching flow that never asks a buyer to pay before a seller confirms, and moderation for scam patterns (especially fake "pay to confirm" internship posts).

## Architecture

```
campussearch/
├── backend/     Node.js + Express API, SQLite database
└── frontend/    React (Vite), mobile-responsive
```

**Backend → Frontend** over a REST API (`/api/*`). The frontend never talks to the database directly — all matching/moderation logic lives server-side so it can't be bypassed by tampering with the UI.

### Data model (`backend/src/db/schema.sql`)
- `users` — campus-email-gated accounts, rating aggregate, suspension flag
- `listings` — supports sale vs. rent, kit-vs-part linking (`parent_kit_id`), auto-expiry
- `requests` — the buyer→seller matching lifecycle (see below)
- `flags` — moderation queue, auto- and human-reported
- `ratings` — simple thumbs up/down, only after confirmed delivery
- `fee_ledger` — platform fee owed per completed order, settled in batches (not per-transaction)

### The matching flow (`backend/src/services/matchingService.js`)
This is the core mechanism from planning, implemented as real transactional logic:

1. Buyer requests a listing → listing locks to `pending`, seller is notified — **no payment, no contact shared yet**
2. Seller **accepts** (commits a delivery day) or **declines** within a response window
3. Decline, or no response in time → auto-expires, listing reopens automatically (handled by a scheduled sweep, not manually)
4. Only on accept is the seller's contact revealed to that buyer
5. Buyer confirms delivery in-app → this is what unlocks the "pay now" moment client-side, and is when the platform fee is recorded
6. Accepted but never confirmed within a few days → marked `no_show`, listing reopens (the no-show edge case flagged during planning)
7. **Race condition handling:** a listing can only have one active request at a time — enforced inside a DB transaction, not just in the UI, so two buyers can't both "win" the same item

### Moderation (`backend/src/services/moderationService.js`)
Every new listing is screened against scam-pattern keywords (`"pay to confirm"`, `"registration fee"`, `"guaranteed internship"`, etc.) and flagged automatically for admin review — this is the internship-scam protection from planning, implemented as a real filter rather than a policy note.

### Notifications (`backend/src/services/notificationService.js`)
Deliberately abstracted behind one `notify()` function. Runs in console-log mode for the prototype; swapping in Twilio/MSG91 for real SMS is a one-function change, not a rewrite — this was intentional, since we decided not to pay for SMS infrastructure until real usage numbers justify it.

## Running it locally

### Backend
```bash
cd backend
cp .env.example .env      # edit CAMPUS_EMAIL_DOMAIN to your college's domain
npm install
npm run seed               # populates demo users + listings
npm run dev                 # http://localhost:4000
```
Demo login after seeding: any seeded email (e.g. `aravind.k@college.edu`) / password `demo1234`.

### Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173, proxies /api to :4000
```

## What's deliberately NOT built yet (see roadmap doc)
- Real SMS delivery (interface is ready, provider isn't wired up)
- Real payment collection (by design — platform never holds funds, see planning notes)
- Production-grade auth (JWT in localStorage is fine for a prototype; a real deployment should move to httpOnly cookies)
- Postgres migration for multi-server scale (schema is written to make this a small change, not a rewrite)
- Faculty/lab surplus as a separate supply source
- Full roadmap and open decisions: see the linked Notion page.

## Tech choices, briefly
- **SQLite over Postgres for now** — zero setup, fine for hundreds of concurrent users on one campus; the schema is portable if this needs to scale past that.
- **JWT auth over sessions** — stateless, simple to reason about for a small team maintaining this after the original author graduates.
- **No payment processor integrated** — collecting/holding student payments has real licensing implications; peer-to-peer UPI keeps this a listing/matching tool, not a payments company.
