# MedStock

![Status](https://img.shields.io/badge/status-early_development-orange)
![Version](https://img.shields.io/badge/version-0.1.0-blue)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-offline--first-5A0FC8?logo=pwa&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

A privacy-first Progressive Web App for managing a household medicine inventory.  
No backend. No accounts. No cloud. Works fully offline on any device.

> **Early development** — planning complete, implementation starting.

---

## The Problem

Two people in a household buy medicines independently. Stock piles up in multiple locations, some of it expired, and no one knows what's actually on hand until they're already at the pharmacy.

**MedStock's core question:** *Do I already have this medicine, where is it, and is it still safe to use?*

---

## Features (Planned — v1)

### Phase 1 — PWA Foundation & Inventory CRUD
- Add medicine packages with name, category, location, expiry date, opened date, period-after-opening, quantity, and notes
- Automatic validity status: **Active**, **Opened**, **Expired**, **Used Up**
- Edit and soft-delete packages (Trash Bin with restore)
- Batch creation — add multiple packages of the same medicine in one flow
- Custom location and category management
- Installable offline PWA on Android, iOS, Windows, macOS, Linux
- iOS persistent-storage request on first launch (prevents Safari's 7-day silent eviction)

### Phase 2 — Search, Dashboard & Audit
- Instant name search with stock + validity status — no drill-down required
- Filter by category, location, status; sort by name, expiry, or category
- Dashboard with expiry alert cards: total, expired, expiring within 30 days, exceeded open period
- Per-medicine change history with timestamps, changed fields, and old/new values

### Phase 3 — Data & Household Sync
- Export full inventory as a single JSON backup file
- Import JSON backup with last-write-wins merge and schema validation
- CSV bulk import with interactive column mapping and preview
- "Sync Now" guided flow for sharing inventory between two devices via a shared OneDrive folder

---

## Privacy

All data lives in IndexedDB on your device. Nothing is sent to any server. The only way data leaves your device is via an explicit JSON or CSV export that you initiate. No analytics, no crash reporting, no accounts.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript 5.4 |
| Build | Vite 5 |
| Storage | Dexie.js 4 (IndexedDB) |
| State | Zustand 4 |
| Forms | React Hook Form 7 + Zod 3 |
| UI | shadcn/ui (Radix UI + Tailwind CSS 3) |
| PWA | vite-plugin-pwa + Workbox 7 |
| CSV | Papa Parse 5 |

---

## Getting Started

> **Note:** The app is not yet built. These are the planned setup steps once Phase 1 is complete.

```bash
git clone https://github.com/BielinskiLukasz/med-stock.git
cd med-stock
npm install
npm run dev
```

To install as a PWA, open the dev or production URL in Chrome/Edge/Safari and use the browser's "Add to Home Screen" / "Install" prompt.

---

## Roadmap

| Phase | Goal | Status |
|-------|------|--------|
| 1 — PWA Foundation & Inventory CRUD | Installable offline app with full add/edit/delete and expiry calculation | Planning complete |
| 2 — Search, Dashboard & Audit | Pharmacy use-case search, expiry dashboard, trash bin, change history | Not started |
| 3 — Data & Household Sync | JSON backup, CSV import, OneDrive shared-folder sync flow | Not started |

---

## Design Decisions

- **Local-first with IndexedDB** — Privacy, offline support, no server costs or accounts
- **Each physical package is a separate record** — Enables per-package expiry and location tracking; batch creation handles the UX
- **Manual sync via shared folder** — Simplest cross-device household sharing without a backend
- **PWA over native app** — One codebase covers Android, iOS, Windows, macOS, and Linux
- **Soft delete (Trash Bin)** — Preserves history; prevents accidental data loss
- **No photos in v1** — Reduces scope without affecting the core value of knowing what you have

---

## License

Released under the [MIT License](LICENSE).
