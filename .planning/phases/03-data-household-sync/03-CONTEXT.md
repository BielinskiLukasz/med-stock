# Phase 3: Data & Household Sync - Context

**Gathered:** 2026-07-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Two household members on separate devices can share one inventory — one exports a JSON file (medstock-backup-YYYY-MM-DD.json) to a shared OneDrive folder, the other imports it. A separate CSV import flow lets users migrate existing spreadsheet data. All data operations are accessible from a new 5th "Data" tab in the bottom bar. No backend, no automatic sync — fully manual, fully offline-capable.

This phase adds: a Data tab (5th tab in the bottom bar), a single Data screen with three sections (Export backup / Import backup / Sync with household instructions), JSON export (medicines + locations + history), JSON import with full replace + confirmation dialog, CSV import with interactive column mapping + preview, and Papa Parse for CSV parsing.

</domain>

<decisions>
## Implementation Decisions

### Navigation & Data Screen Layout
- **D-42:** A 5th **"Data" tab** is added to the bottom tab bar. Final tab order: Medicines | Dashboard | Trash | Locations | Data. Trash stays in the bar — no tab is removed.
- **D-43:** The Data screen is a **single scrollable screen with three sections** — no sub-routes, no sub-tabs, no navigation away from the screen. Sections: "Export backup", "Import backup", "Sync with household".
- **D-44:** The Sync with household section is **instructions-only** — no extra buttons. Text explains: use Export above to save a backup to your shared OneDrive folder; use Import to load a backup your household member saved there. One Export button, one Import button across the whole screen; no duplication.

### JSON Export
- **D-45:** JSON export includes the **medicines table, locations table, and history table**. Categories are hardcoded in the UI (D-10) and not stored in a DB table — they are NOT included in the export. No settings table exists yet — not included.
- **D-46:** Exported filename: **`medstock-backup-YYYY-MM-DD.json`** (e.g., `medstock-backup-2026-07-13.json`). Date-stamped so multiple backups coexist without overwriting. Generated via the Blob API + anchor download (no library needed).

### JSON Import
- **D-47:** JSON import = **full replace**. The local DB (medicines, locations, history) is wiped and replaced entirely with the contents of the imported file. No merge, no conflict resolution.
- **D-48:** Before import executes, show a **confirmation dialog** with explicit consequences: "This will replace all {N} medicines, {M} locations, and full change history. This cannot be undone. Import anyway?" User must confirm before the replace proceeds.
- **D-49:** After successful import: **success toast** ("Imported: {N} medicines, {M} locations") + stay on the Data screen. No navigation. The toast confirms the import worked; the user can verify by switching to the Medicines tab.
- **D-50:** JSON import must include **schema validation** (Zod) that rejects malformed files with a clear error message before touching the DB. If validation fails, show an error message; do NOT modify the DB.

### CSV Import
- **D-51:** CSV import uses **Papa Parse** for parsing (already in CLAUDE.md recommended stack). The import flow: file picker → parse → column-mapping UI → preview → commit. All within the Data screen (no separate route).
- **D-52:** Column mapping UI: a **table of detected CSV columns** with a dropdown per column allowing the user to map it to a medicine field (name, category, location, expiryDate, openedDate, quantity, notes, etc.) or mark it as "Skip". Required field: `name` must be mapped before the preview is enabled.
- **D-53:** Preview shows the first 5 rows of mapped data so the user can verify the mapping is correct before committing. Commit replaces the mapped records (appends to existing DB — does not wipe existing medicines; CSV import is an addition, not a replace).

### Claude's Discretion
- Exact visual design of the Data screen sections (dividers, card style, icons for Export/Import/Sync)
- CSV import error handling for individual rows (e.g., skip malformed rows, show a count of skipped rows after import)
- Whether the Export button shows a spinner or disables during the Blob generation
- Exact wording of the Sync with household instructions section
- Whether to show a character count / row count in the preview before CSV commit

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/PROJECT.md` — Core value, constraints (IndexedDB-only, offline-first, privacy-first, no backend), household use-case context. The sync story is why the app exists as a shared tool.
- `.planning/REQUIREMENTS.md` — Phase 3 requirements: DATA-01, DATA-02, DATA-03, DATA-04
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, and requirement mapping

### Prior Phase Decisions (carry forward)
- `.planning/phases/01-pwa-foundation-inventory-crud/01-CONTEXT.md` — D-01 through D-19: routing, Dexie schema v1, navigation patterns, calculateStatus(), location management
- `.planning/phases/02-search-dashboard-audit/02-CONTEXT.md` — D-20 through D-41: Dexie schema v2 (deletedAt, history table), filter/sort state in Zustand, tab bar structure, history denormalization

### Stack Decisions
- `CLAUDE.md` §Technology Stack — Papa Parse (5.4+) for CSV, Blob API for JSON export. MUST read before selecting libraries.

### No external specs
- No ADRs, design docs, or external specs were referenced during discussion. All decisions are captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/db.ts` — Dexie schema with medicines, locations, history tables. The export must read all three. The import must use a Dexie transaction to wipe and replace all three atomically. `db.version(3)` will be needed if schema changes are required for Phase 3 (unlikely — no new fields discussed).
- `src/components/BottomTabBar.tsx` — Add a 5th NavLink for `/data`. Currently has 4 tabs using the established NavLink + cn() pattern.
- `src/App.tsx` — Add `{ path: 'data', element: <DataScreen /> }` as a child of RootLayout, following the same pattern as `dashboard` and `trash`.
- `src/lib/historyOps.ts` — History write functions. The import flow must understand the history table schema (D-36 in Phase 2 context) to correctly restore history entries.

### Established Patterns
- Dexie transactions (`db.transaction('rw', ...)`) — used in `locationOps.ts` for multi-table atomic operations. The JSON import full-replace must use a transaction spanning medicines + locations + history.
- `useLiveQuery` from `dexie-react-hooks` — reactive Dexie queries. The Data screen may show counts (e.g., "Export {N} medicines") using this pattern.
- Zustand `create<T>()()` curried form (Pitfall 7 from prior phases) — if the Data screen needs any UI state (loading, progress), use this pattern.
- shadcn/ui Dialog — used in Phase 2 for the filter bottom sheet; reuse for the import confirmation dialog (D-48).
- `shadcn/ui` Button, toast patterns — established in Phases 1–2.

### Integration Points
- `src/components/BottomTabBar.tsx` — Add 5th tab.
- `src/App.tsx` — Add `/data` route.
- New file: `src/routes/data/index.tsx` — DataScreen component (three sections).
- New file: `src/lib/dataOps.ts` — exportToJSON(), importFromJSON() with Zod validation, CSV import logic or a separate file.
- `src/lib/db.ts` — No schema changes expected; all three tables already exist in version 2.

### iOS Safari Note
- STATE.md flags: "iOS Safari standalone PWA File Picker behavior is unverified." The `<input type="file">` approach is the standard fallback. If File System Access API is unavailable (iOS Safari doesn't support it), fall back to the `<input type="file" accept=".json,.csv">` input. Design the import UI with this in mind — do NOT rely on `window.showOpenFilePicker()` without a fallback.

</code_context>

<specifics>
## Specific Ideas

- The household sync story (PROJECT.md): "Both adults need full read/write access on their own phones. Sync is not optional — it's what makes the app useful as a household tool." The Sync section's instructions should be clear enough that a non-technical user understands the manual export → OneDrive → import workflow.
- The confirmation dialog before import (D-48) must show ACTUAL counts from the current DB, not static text. Query `db.medicines.count()` and `db.locations.count()` to fill in the "{N} medicines, {M} locations" placeholders before showing the dialog.
- CSV import appends to existing DB (D-53) — it does NOT wipe medicines like JSON import does. This asymmetry should be clear in the UI labels: JSON = "Restore backup" (replaces everything), CSV = "Import from spreadsheet" (adds to existing).
- iOS Safari fallback (from STATE.md blocker): use `<input type="file">` for all file picking (not the File System Access API). Verify this works in iOS standalone PWA mode during execution.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 3-Data & Household Sync*
*Context gathered: 2026-07-13*
