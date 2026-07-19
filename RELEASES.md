# Release Notes

## 🟩 **v1.0.0**
*Release date: 2026‑07‑13*

First stable release of MedStock. Completes all three planned phases across 12 plans and 121 commits. The app is fully installable, works offline, and covers the full inventory lifecycle from adding a package to exporting a household backup.

33/35 v1.0 requirements satisfied; two items deferred to v1.1 (see Known gaps below).

## What's included

### Phase 3 — Data & Household Sync

- **JSON export:** full backup of all medicines, locations, and change history as a single timestamped JSON file; download triggered client-side via Blob API
- **JSON import:** restore a backup from file; Zod schema validation runs before any DB write; full-replace semantics (clear all three tables, then bulkAdd from the backup)
- **CSV bulk import:** Papa Parse integration; interactive column mapper lets the user assign each CSV column to a medicine field or skip it; live row-count preview before committing; appended to existing inventory (not a replace)
- **Sync guide:** step-by-step "Sync Now" instructions for sharing inventory between two devices via a shared OneDrive folder
- Data tab added to bottom navigation (5th tab)

### Foundation (Phases 1 & 2 — shipped in v0.1.0-pre)

See the v0.1.0-pre entry below for details on the PWA install, full CRUD, expiry engine, search, dashboard, trash bin, and change history.

## Verified

- Unit + integration tests: 69/69 pass across 8 test files (2026-07-13)
- Phase 3 verification: 19/19 plan must-haves verified (2026-07-13)
- Phase 3 UAT: all human checkpoints passed (2026-07-13)
- Cross-phase integration: 8/8 integration points wired (2026-07-13)
- E2E flows: 8/8 complete (add → edit → delete → restore → export → import → CSV import → dashboard drill-down)
- Build: `npm run build` — zero TypeScript errors, PWA manifest and service worker generated

## Known gaps (deferred to v1.1)

| Backlog | Requirement | Gap |
|---------|------------|-----|
| B-002 | DATA-04 | Sync Now is static instructions only — no interactive triggered flow |
| B-003 | DATA-02 | JSON import does a full replace — last-write-wins merge not yet implemented |
| B-004 | — | CSV column mapper defaults all dropdowns to (skip); no auto-mapping by header name |
| B-005 | — | CSV column mapper has no column-header labels |

---

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
