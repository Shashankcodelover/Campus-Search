# 🔍 CampusSearch v1.1 (Production v2.0) — Showcase & Architecture

[![Live Deployment](https://img.shields.io/badge/Live-campussearch.shashankj.tech-brightgreen?style=for-the-badge&logo=vercel)](https://campussearch.shashankj.tech)
[![Automated Tests](https://img.shields.io/badge/Tests-10%2F10%20Passing-brightgreen?style=for-the-badge&logo=node.js)](backend/tests/)
[![Database](https://img.shields.io/badge/Database-Neon%20Postgres%20v2.0-blue?style=for-the-badge&logo=postgresql)](https://neon.tech)
[![Status](https://img.shields.io/badge/Status-100%25%20Complete%20%26%20Certified-success?style=for-the-badge)]()

> **Campus-Restricted Reusable Engineering Hardware Marketplace**  
> Built to eliminate redundant semester-over-semester hardware component purchases across university engineering departments, featuring verified student identity, zero upfront payment escrow matching, real-time SSE notifications, and live Notion API docs integration.

---

## 🔗 Production Deployment
- **Live URL**: [https://campussearch.shashankj.tech](https://campussearch.shashankj.tech)
- **SSL / CDN**: Cloudflare + Vercel Edge CDN + Custom Domain
- **Backend API**: Node.js + Express on Cloud Postgres (Neon WAL v2.0)
- **PWA Status**: Service worker enabled with offline fallback manifest

---

## 🎬 Video Walkthroughs & Media
| Media | File Location | Description |
|---|---|---|
| **Mobile Video Walkthrough** | `videos/CampusSearch_Mobile_Walkthrough.webm` | Full portrait screen recording demonstrating navigation, search, listing modals, and inquiries feed. |
| **Phone Showcase** | `videos/CampusSearch_Phone_Showcase.mp4` | High-definition mobile recording showcasing responsive touch layouts. |
| **Voiceover Audio** | `videos/showcase_voiceover.mp3` | Professional narrative audio walkthrough of the platform vision and architecture. |

---

## 📸 Canonical Showcase Gallery

### 1. Desktop Experience (High-Resolution)
| Screen | Screenshot | Key Highlights |
|---|---|---|
| **Hero Landing** | ![Desktop Hero](screenshots/desktop/01_desktop_hero_landing.png) | High-contrast dark glassmorphism hero banner with instant CTA. |
| **Browse Catalog** | ![Browse Catalog](screenshots/desktop/02_desktop_browse_catalog.png) | Category chips, price range sliders, search filter, and component grid. |
| **List Item Modal** | ![List Item](screenshots/desktop/03_desktop_list_item_modal.png) | Hardware listing creation with condition grading, stock, and image upload. |
| **Requests Inbox** | ![Requests Inbox](screenshots/desktop/04_desktop_requests_inbox.png) | Buyer/seller request dispatch manager with status indicators. |
| **Chat & Inquiries** | ![Chat & Inbox](screenshots/desktop/05_desktop_chat_and_inbox.png) | Contextual buyer-seller negotiation channel scoped per request. |
| **Broadcast Feed** | ![Inquiries Broadcast](screenshots/desktop/06_desktop_inquiries_feed.png) | Real-time campus-wide availability inquiries and urgent component wants. |

### 2. Mobile Emulation (390 x 844 Responsive)
| Screen | Screenshot | Key Highlights |
|---|---|---|
| **Mobile Hero** | ![Mobile Hero](screenshots/phone/01_mobile_landing_hero.png) | Zero viewport clipping, mobile-optimized typography and CTA button. |
| **Hamburger Menu** | ![Mobile Menu](screenshots/phone/02_mobile_hamburger_menu.png) | Smooth overlay drawer providing access to all 7 platform sections. |
| **Mobile Catalog** | ![Mobile Catalog](screenshots/phone/03_mobile_catalog_browse.png) | Touch-friendly component cards with badge tags and seller reputation. |
| **Request Modal** | ![Mobile Modal](screenshots/phone/04_mobile_request_modal.png) | Ergonomic touch inputs with quantity selectors and stock info. |
| **Requests Inbox** | ![Mobile Requests](screenshots/phone/05_mobile_requests_inbox.png) | Mobile-adapted card view for active component deliveries. |
| **Inquiries Feed** | ![Mobile Inquiries](screenshots/phone/06_mobile_inquiries_feed.png) | Live stream of wanted hardware alerts across engineering batches. |

---

## 🔒 Security & Anti-Scam Architecture
1. **Verified Student Identity**: Mandatory USN (University Seat Number) validation and College ID verification workflow.
2. **Escrow Matching Flow**: Buyer contact info is strictly held until the seller formally accepts the handoff window.
3. **Zero Upfront Payment**: Blocks malicious "pay-to-confirm" advance payment scams.
4. **Stale Listing Sweeper**: Scheduled background sweeper automatically reopens lapsed requests and expires unfulfilled listings after 60 days.
