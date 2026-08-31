# MedStock

![Status](https://img.shields.io/badge/status-v1.1_shipped-brightgreen)
![Version](https://img.shields.io/badge/version-1.1.0-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-offline--first-5A0FC8?logo=pwa&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

A privacy-first Progressive Web App for managing a household medicine inventory.  
No backend. No accounts. No cloud. Works fully offline on any device.

> **Status:** v1.1 shipped (2026-08-31) — catalog + stock model complete. v1.0 shipped 2026-07-13.

---

## The Problem

Two people in a household buy medicines independently. Stock accumulates across multiple locations, some of it expired, and no one knows what is actually on hand until they are already at the pharmacy.

**MedStock answers one question:** *Do I already have this medicine, where is it, and is it still safe to use?*

---

## Features

### Phase 1 — PWA Foundation & Inventory CRUD
- Add medicine packages with name, category, location, expiry date, opened date, period-after-opening, quantity, and notes
- Automatic validity status: **Active**, **Opened**, **Expired**, **Used Up**
- Edit and soft-delete packages (Trash Bin with restore)
- Batch creation — add multiple packages of the same medicine in one flow
- Custom location and category management
- Installable offline PWA on Android, iOS, Windows, macOS, and Linux
- iOS persistent-storage prompt on first launch (prevents Safari's 7-day silent data eviction)

### Phase 2 — Search, Dashboard & Audit
- Instant name search with stock and validity status — no drill-down required
- Filter by category, location, and status; sort by name, expiry, or category
- Dashboard with expiry alert cards: total, expired, expiring within 30 days, exceeded open period
- Per-medicine change history with timestamps, changed fields, and old/new values

### Phase 3 — Data & Household Sync
- Export full inventory as a single JSON backup file
- Import JSON backup with schema validation
- CSV bulk import with interactive column mapping and preview
- Step-by-step "Sync Now" guide for sharing inventory between devices via a shared OneDrive folder

### Phase 4 — Database Migration & Schema v4 *(v1.1)*
- Automatic one-time migration on first open after upgrade — existing medicines are split into catalog entries (one per unique medicine name) and stock entries (one per physical package)
- Duplicate medicine names deduplicated by case-insensitive match; no data loss

### Phase 5 — Catalog & Stock Management *(v1.1)*
- Catalog/stock data model: one catalog entry per medicine identity, multiple stock entries per physical package
- Aggregate medicine cards: worst-case status and total quantity rolled up per catalog entry
- 3-step add flow: select or create a catalog entry, then enter stock details
- Per-stock edit, move/split, and delete actions from the detail view
- Catalog rename propagates to all associated stock entries
- Delete catalog entry with safety guard (requires all stock deleted first)

### Phase 6 — Backup & Restore v2 *(v1.1)*
- JSON export includes `medicine_catalog` table alongside stock entries
- JSON import of v1.1 backups restores catalog and stock in a single atomic transaction
- Backward-compatible import of pre-v1.1 backups — catalog entries inferred automatically from stock name/category fields

---

## Privacy

All data lives in IndexedDB on your device. Nothing is transmitted to any server. The only way data leaves your device is via an explicit JSON or CSV export that you initiate. There is no analytics, no crash reporting, and no user accounts.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Storage | Dexie.js 4 (IndexedDB) |
| State | Zustand 5 |
| Forms | React Hook Form 7 + Zod 4 |
| UI | shadcn/ui (Radix UI + Tailwind CSS 4) |
| PWA | vite-plugin-pwa + Workbox |
| CSV | Papa Parse 5 |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 LTS or 20 LTS
- npm 9+ (bundled with Node.js)

### Installation

```bash
git clone https://github.com/BielinskiLukasz/med-stock.git
cd med-stock
npm install
```

### Running locally

```bash
npm run dev
```

Open `http://localhost:5173/med-stock/` in your browser. The dev server supports Hot Module Replacement (HMR).

### Installing as a PWA

Open the development or production URL in Chrome, Edge, or Safari and use the browser's **"Add to Home Screen"** or **"Install"** prompt to install MedStock as a standalone app.

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server with HMR |
| `npm run build` | Type-check and produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally for final verification |
| `npm run lint` | Run oxlint across all source files |
| `npm test` | Run the Vitest test suite in watch mode |
| `npx vitest run` | Single Vitest run (CI / no watch) |

### Project Structure

```
med-stock/
├── public/               # Static assets and PWA icons
├── src/
│   ├── components/       # Reusable UI components (shadcn/ui + custom)
│   │   └── ui/           # shadcn/ui primitives (Button, Input, Select, …)
│   ├── routes/           # Top-level route/screen components
│   │   ├── dashboard/    # Dashboard screen
│   │   ├── medicines/    # Medicine list, detail, add/edit screens
│   │   ├── locations/    # Location management screen
│   │   ├── trash/        # Trash Bin screen
│   │   └── data/         # Import / Export / Sync screen
│   ├── stores/           # Zustand state stores (UI state only)
│   ├── lib/              # Business logic and database helpers
│   │   ├── db.ts         # Dexie.js schema (v4) and database instance
│   │   ├── expiry.ts     # Validity status calculation (pure function)
│   │   ├── aggregation.ts# Per-catalog status + quantity roll-up
│   │   ├── historyOps.ts # All medicine mutations + atomic history writes
│   │   ├── stockOps.ts   # Stock entry add / edit / move operations
│   │   ├── locationOps.ts# Location CRUD helpers
│   │   ├── dataOps.ts    # JSON export / import
│   │   └── csvOps.ts     # CSV parse and column-mapping logic
│   └── types/            # Shared TypeScript type definitions
├── vite.config.ts        # Vite + PWA plugin configuration
└── tsconfig.json         # TypeScript configuration (strict mode)
```

---

## Roadmap

| Phase | Goal | Status |
|-------|------|--------|
| 1 — PWA Foundation & Inventory CRUD | Installable offline app with full add/edit/delete and expiry calculation | Complete |
| 2 — Search, Dashboard & Audit | Pharmacy-use-case search, expiry dashboard, trash bin, change history | Complete |
| 3 — Data & Household Sync | JSON backup, CSV import, OneDrive shared-folder sync flow | Complete |
| 4 — Database Migration & Schema v4 | Two-layer catalog + stock schema, automatic v1.0 data migration with deduplication | Complete |
| 5 — Catalog & Stock Management | Catalog/stock split, aggregate cards, stock-level actions, 3-step add flow | Complete |
| 6 — Backup & Restore v2 | v1.1 JSON export/import with catalog table; backward-compatible legacy import | Complete |
| v1.2 backlog | Last-write-wins JSON merge, interactive sync flow, CSV auto-mapping | Backlog |

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Local-first with IndexedDB | Ensures privacy, offline support, and zero server cost or account requirements |
| Catalog/stock separation | One catalog entry per medicine identity; multiple stock entries per physical package. Prevents duplication and lets a catalog rename propagate automatically |
| Manual sync via shared folder | Simplest cross-device household sharing model without introducing a backend |
| PWA over native app | One codebase covers Android, iOS, Windows, macOS, and Linux |
| Soft delete (Trash Bin) | Preserves history and prevents accidental permanent data loss |
| No photos in v1 | Reduces scope without affecting the core value of knowing what you have and whether it is valid |

---

## Troubleshooting

**The app does not work offline after installation.**  
Ensure you have visited the app at least once while online so the service worker can cache the app shell. If the issue persists, try unregistering the service worker in browser DevTools → Application → Service Workers, then reload.

**Safari on iOS is clearing my data.**  
This is Safari's 7-day inactivity eviction policy for sites that have not requested persistent storage. MedStock prompts for persistent storage permission on first launch. If you dismissed the prompt, re-install the app or grant storage permission manually in iOS Settings → Safari → Advanced.

**The PWA install prompt does not appear.**  
Browsers only show the install prompt over HTTPS (or `localhost`). Make sure you are accessing the app via a secure origin. The prompt may also be suppressed if you previously dismissed it — in Chrome, you can re-trigger it from the address bar menu.

**`npm run build` fails with type errors.**  
The build pipeline runs `tsc -b` first and enforces TypeScript strict mode. Fix all type errors before the bundle step will run.

---

## Contributing

MedStock is a personal household tool in active development. Contributions, issues, and feature suggestions are welcome.

1. Fork the repository and create a branch from `develop`.
2. Follow the existing code style — TypeScript strict mode, no `any`, named exports.
3. Run `npm run build` and `npm run lint` before opening a pull request.
4. Open a pull request against `develop`, not `main`.

For larger changes, open an issue first to discuss the approach.

---

## License

Released under the [MIT License](LICENSE).
