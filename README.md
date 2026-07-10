# MedStock

![Status](https://img.shields.io/badge/status-early_development-orange)
![Version](https://img.shields.io/badge/version-0.1.0-blue)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-offline--first-5A0FC8?logo=pwa&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

A privacy-first Progressive Web App for managing a household medicine inventory.  
No backend. No accounts. No cloud. Works fully offline on any device.

> **Status:** Early development — planning complete, implementation starting.

---

## The Problem

Two people in a household buy medicines independently. Stock accumulates across multiple locations, some of it expired, and no one knows what is actually on hand until they are already at the pharmacy.

**MedStock answers one question:** *Do I already have this medicine, where is it, and is it still safe to use?*

---

## Features

> Features below reflect the planned v1 scope. The app is under active development.

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
- Import JSON backup with last-write-wins merge and schema validation
- CSV bulk import with interactive column mapping and preview
- Guided "Sync Now" flow for sharing inventory between two devices via a shared OneDrive folder

---

## Privacy

All data lives in IndexedDB on your device. Nothing is transmitted to any server. The only way data leaves your device is via an explicit JSON or CSV export that you initiate. There is no analytics, no crash reporting, and no user accounts.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
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

Open `http://localhost:5173` in your browser. The dev server supports Hot Module Replacement (HMR).

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
| `npm run typecheck` | Run `tsc --noEmit` without emitting output |
| `npm run lint` | Run ESLint across all source files |
| `npm test` | Run the Vitest test suite |

### Project Structure

```
med-stock/
├── public/               # Static assets and PWA icons
├── src/
│   ├── components/       # Reusable UI components (shadcn/ui + custom)
│   ├── db/               # Dexie.js schema and database instance
│   ├── stores/           # Zustand state stores
│   ├── pages/            # Top-level route/page components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and helpers
│   └── types/            # Shared TypeScript type definitions
├── vite.config.ts        # Vite + PWA plugin configuration
└── tsconfig.json         # TypeScript configuration (strict mode)
```

> The structure above reflects planned conventions. It will be populated as Phase 1 is implemented.

---

## Roadmap

| Phase | Goal | Status |
|-------|------|--------|
| 1 — PWA Foundation & Inventory CRUD | Installable offline app with full add/edit/delete and expiry calculation | In planning |
| 2 — Search, Dashboard & Audit | Pharmacy-use-case search, expiry dashboard, trash bin, change history | Not started |
| 3 — Data & Household Sync | JSON backup, CSV import, OneDrive shared-folder sync flow | Not started |

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Local-first with IndexedDB | Ensures privacy, offline support, and zero server cost or account requirements |
| Each physical package is a separate record | Enables per-package expiry and location tracking; batch creation handles the UX overhead |
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
Run `npm run typecheck` to see the full list of type errors. Fix them before building; the build pipeline enforces TypeScript strict mode.

---

## Contributing

MedStock is a personal household tool in early development. Contributions, issues, and feature suggestions are welcome.

1. Fork the repository and create a branch from `develop`.
2. Follow the existing code style — TypeScript strict mode, no `any`, named exports.
3. Run `npm run typecheck` and `npm run lint` before opening a pull request.
4. Open a pull request against `develop`, not `main`.

For larger changes, open an issue first to discuss the approach.

---

## License

Released under the [MIT License](LICENSE).
