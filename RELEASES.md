# Release Notes

## 🟨 **v0.1.0-pre**
*Release date: 2026‑07‑06*

First pre-release of MedStock — a privacy-first Progressive Web App for managing a household medicine inventory. All data lives in IndexedDB on the device; nothing leaves the device without an explicit export action.

Built across 2 vertical-slice phases, both completed and UAT-verified.

## What's included

### Phase 1 — PWA Foundation & Inventory CRUD
- Installable PWA: service worker + web manifest; works fully offline; installable to home screen / taskbar
- Dexie v1 schema: `medicines` and `locations` tables with indexed queries for performance at 1,000+ records
- iOS persistent-storage safeguard: `navigator.storage.persist()` called once on first launch
- Full CRUD loop: add medicine (9 fields), view detail, edit, soft-delete (move to Trash)
- Status engine: `calculateStatus()` pure function computing `Active / Opened / Expired / ExceededOpenPeriod / UsedUp / Disposed` from expiry date + period-after-opening (PAO), with manual-override precedence
- Location management: 8 predefined locations seeded on first launch; add / rename / delete custom locations; delete cascades — affected medicines revert to "Other" atomically
- StatusBadge: colour-coded validity status on every list card and detail view

### Phase 2 — Search, Dashboard & Audit
- Name search: substring match typed from the medicines list; results update on every keystroke via `useLiveQuery`
- Filter & sort: filter by category, location, or status; sort by name, expiry date, or category; active filters shown as dismissible chips; state persists across navigation
- Filter bottom sheet: full shadcn Sheet panel for multi-select filter controls
- Dashboard: 4 tappable metric cards — Total medicines, Expired, Expiring within 30 days, Exceeded open period — each navigates to the filtered list
- Trash Bin: deleted medicines move here; user can restore or permanently delete
- Change History: every create / edit / delete writes a history entry; each medicine detail page shows a collapsible timeline of changes with timestamp, action, and old → new values
- Dexie v2 schema migration: adds `deletedAt` column to medicines and a `history` table; backwards-compatible

## Verified

- Phase 1 unit tests: `npm test` — 27/27 pass (expiry calculation, location ops, Zod schema)
- Phase 1 UAT: 26/26 human checkpoints passed (2026-07-05)
- Phase 2 verification: 16/16 must-haves verified (2026-07-01)
- Phase 2 UAT: 15/15 human checkpoints passed (2026-07-05)
- Build: `npm run build` — zero TypeScript errors, service worker generated, PWA manifest present
- Offline: app shell loads from cache with DevTools offline mode active

## Not yet included (Phase 3)

- JSON export / import (backup and restore)
- CSV bulk import with column mapping
- Manual OneDrive household sync flow
