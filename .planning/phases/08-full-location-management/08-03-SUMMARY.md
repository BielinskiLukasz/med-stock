---
phase: 08-full-location-management
plan: 03
subsystem: ui
tags: [dexie, indexeddb, zod, react, dropdown-filtering]

# Dependency graph
requires:
  - phase: 08-full-location-management (Plan 08-01)
    provides: "Location.hidden/order fields, db.version(6) schema, order intentionally unindexed"
provides:
  - "MedicineForm/StockFields/MoveStockSheet location dropdowns sorted by order, hidden locations excluded (D-06, D-17)"
  - "FilterBottomSheet location filter sorted by order, hidden locations still listed (D-07, D-17)"
  - "BackupSchema/LegacyBackupSchema locations carry hidden/order with backward-compatible defaults"
affects: [08-04-full-location-management, 08-05-full-location-management]

# Actuals (#2632)
actuals:
  tokens: 1853
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "db.locations.toCollection().sortBy('order') used everywhere order-sorting is needed, never orderBy('order') — order is intentionally unindexed (v6 precedent from Plan 08-01), and Dexie's orderBy() throws SchemaError on a non-indexed keyPath. sortBy() resolves to a plain array, so hidden-filtering chains via .then(locs => locs.filter(...)) inside the same useLiveQuery callback."

key-files:
  created: []
  modified:
    - src/components/MedicineForm.tsx
    - src/components/StockFields.tsx
    - src/components/MoveStockSheet.tsx
    - src/components/FilterBottomSheet.tsx
    - src/lib/dataOps.ts
    - src/lib/dataOps.test.ts

key-decisions:
  - "Plan action text specified db.locations.orderBy('order').filter(...).toArray(), but order is unindexed per Plan 08-01's own db.version(6) schema comment ('hidden/order are not indexed'). Used db.locations.toCollection().sortBy('order').then(locs => locs.filter(l => !l.hidden)) instead, matching the exact pattern Plan 08-01/08-02 already established for LocationsScreen and addCustomLocation's max-order lookup."
  - "FilterBottomSheet correspondingly uses toCollection().sortBy('order') with no .then()/.filter() chain — hidden locations must remain visible there (D-07), so no filtering step exists at all."

requirements-completed: [LOC-02, LOC-04]

coverage:
  - id: D1
    description: "MedicineForm's location dropdown sorts by order and never lists a hidden location"
    requirement: "LOC-02"
    verification:
      - kind: other
        ref: "npx tsc --noEmit; npm run build; grep -c \"orderBy('name')\" src/components/MedicineForm.tsx returns 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "StockFields' location dropdown sorts by order and never lists a hidden location"
    requirement: "LOC-02"
    verification:
      - kind: other
        ref: "npx tsc --noEmit; npm run build; grep -c \"orderBy('name')\" src/components/StockFields.tsx returns 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "MoveStockSheet's target-location dropdown sorts by order and never lists a hidden location"
    requirement: "LOC-02"
    verification:
      - kind: other
        ref: "npx tsc --noEmit; npm run build; grep -c \"orderBy('name')\" src/components/MoveStockSheet.tsx returns 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "FilterBottomSheet's location filter sorts by order but keeps hidden locations visible"
    requirement: "LOC-04"
    verification:
      - kind: other
        ref: "npx tsc --noEmit; grep -c \"orderBy('name')\" src/components/FilterBottomSheet.tsx returns 0; grep -c \"filter(l => !l.hidden)\" src/components/FilterBottomSheet.tsx returns 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "BackupSchema and LegacyBackupSchema accept locations with or without hidden/order, defaulting to false/0 when absent and preserving explicit values"
    requirement: "LOC-04"
    verification:
      - kind: unit
        ref: "src/lib/dataOps.test.ts#BackupSchema > defaults hidden/order to false/0 on a location item lacking those fields (pre-v6 backup)"
        status: pass
      - kind: unit
        ref: "src/lib/dataOps.test.ts#BackupSchema > preserves hidden/order exactly when a location item includes them"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-09-18
status: complete
---

# Phase 8 Plan 3: Hidden-Location Filtering + Backup Schema Round-Trip Summary

**Wired D-06 (exclude hidden) and D-07 (keep hidden) into the four remaining `db.locations` UI call sites, and made BackupSchema/LegacyBackupSchema forward- and backward-compatible with the new `hidden`/`order` fields.**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-09-18T10:46:00Z (approx, immediately following Plan 08-02)
- **Completed:** 2026-09-18T10:59:31Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- `MedicineForm.tsx`, `StockFields.tsx`, `MoveStockSheet.tsx` location dropdowns now sort by `order` and exclude hidden locations (D-06) — assignment surfaces never show a hidden location again
- `SelectItem` in all three assignment dropdowns gained `className="truncate"` so an unusually long location name (no `maxLength` enforced on the name input) elides with an ellipsis instead of overflowing
- `FilterBottomSheet.tsx` sorts by `order` while deliberately keeping hidden locations visible (D-07) — existing stock already sitting in a hidden location stays findable/filterable
- `BackupSchema.locations`/`LegacyBackupSchema.locations` both gained `hidden: z.boolean().optional().default(false)` and `order: z.number().optional().default(0)`, mirroring the existing `packCount` backward-compat precedent — pre-v6 backups (no hidden/order) import cleanly, and new backups round-trip both fields exactly
- Two new tests confirm the default-fill and pass-through cases for the new schema fields

## Task Commits

Each task was committed atomically:

1. **Task 1: Filter hidden locations out of the three assignment dropdowns** - `aba22c3` (feat)
2. **Task 2: Sort the Filter sheet by order while keeping hidden locations visible** - `5203e0a` (feat)
3. **Task 3: Round-trip hidden/order through BackupSchema** - `fcbbf43` (feat)

**Plan metadata:** (this commit, created after this SUMMARY)

## Files Created/Modified
- `src/components/MedicineForm.tsx` - location `useLiveQuery` switched to `toCollection().sortBy('order')` + hidden filter; `SelectItem` gains `className="truncate"`
- `src/components/StockFields.tsx` - same query/className change as MedicineForm; existing `.filter(loc => loc.name !== 'Other')` guard left in place
- `src/components/MoveStockSheet.tsx` - same query/className change; existing `'Other'` guard left in place
- `src/components/FilterBottomSheet.tsx` - location `useLiveQuery` switched to `toCollection().sortBy('order')`, no hidden filter added
- `src/lib/dataOps.ts` - `BackupSchema.locations` and `LegacyBackupSchema.locations` per-item schemas gain `hidden`/`order` optional-with-default fields
- `src/lib/dataOps.test.ts` - two new tests: defaults on a pre-v6-shaped location item, and pass-through on an item that already has `hidden`/`order`

## Decisions Made
- **`orderBy('order')` → `toCollection().sortBy('order')` (Rule 1 - Bug, plan text correction)**: the plan's action text for all four call sites literally specified `db.locations.orderBy('order')`, but `order` is intentionally unindexed per Plan 08-01's own `db.version(6)` schema (`// hidden/order are not indexed`). Dexie's `orderBy()` requires an indexed keyPath and throws `SchemaError` otherwise — the exact failure Plan 08-01 already hit and documented. Used the same fix Plan 08-01/08-02 established: `toCollection().sortBy('order')`, chaining `.then(locs => locs.filter(l => !l.hidden))` for the three assignment dropdowns (sortBy resolves to a plain array, so a subsequent `.filter()` is just a JS array method, not a further Dexie query).
- **No new locationOps function needed** — Plan 08-02's summary predicted this correctly: filtering by `hidden` and sorting by `order` is pure read-side query logic, entirely contained in each component's `useLiveQuery` callback.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan's literal `orderBy('order')` action text would throw SchemaError**
- **Found during:** Task 1, before writing any code — cross-checked against Plan 08-01's SUMMARY.md decision log (required reading) which documents this exact failure mode and its established fix
- **Issue:** All four `<action>` blocks in the plan specify `db.locations.orderBy('order')...`. `order` has no IndexedDB index (Plan 08-01 explicitly kept it unindexed, matching the `packCount` v5 precedent), so `orderBy('order')` throws `SchemaError: KeyPath order on object store locations is not indexed` at runtime — not caught by `tsc`, only surfaces on the actual query call.
- **Fix:** Used `db.locations.toCollection().sortBy('order')` everywhere the plan said `orderBy('order')`, exactly matching the pattern already in `LocationsScreen` (Plan 08-01) and `addCustomLocation`'s max-order lookup (Plan 08-02). For the three assignment dropdowns, chained `.then(locs => locs.filter(l => !l.hidden))` since `sortBy()` returns a `Promise<array>` and `useLiveQuery` accepts any promise-returning querier.
- **Files modified:** src/components/MedicineForm.tsx, src/components/StockFields.tsx, src/components/MoveStockSheet.tsx, src/components/FilterBottomSheet.tsx
- **Verification:** `npx tsc --noEmit` clean, `npm run build` succeeds, full `npx vitest run` (172/172) passes, grep confirms zero remaining `orderBy('name')` occurrences in all four files.
- **Committed in:** aba22c3 (Task 1), 5203e0a (Task 2)

---

**Total deviations:** 1 auto-fixed (1 bug — plan action text vs. established unindexed-field precedent)
**Impact on plan:** Necessary for the plan's own `<verify>` clauses (`npx tsc --noEmit`, `npm run build`) to hold under actual Dexie runtime behavior, and for the dropdowns to function at all rather than throwing at render time. No scope creep — no behavior added beyond making the stated D-06/D-07/D-17 wiring actually work.

## Issues Encountered
None beyond the deviation above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All four remaining `db.locations` UI call sites (of the six Plan 08-01/08-02/08-03 collectively cover) now read `order`/`hidden` correctly — D-06 and D-07 are fully wired
- `BackupSchema`/`LegacyBackupSchema` round-trip `hidden`/`order` in both directions; JSON export/import (Plan 06) needs no further changes for Phase 8
- Plan 08-04 (hide/delete management screen) and Plan 08-05 (reorder UI) can proceed independently — this plan touched no `locationOps.ts` exports and made no changes to `LocationsScreen`
- No blockers identified for the remaining Phase 8 waves

---
*Phase: 08-full-location-management*
*Completed: 2026-09-18*

## Self-Check: PASSED

All 6 modified files and the SUMMARY.md itself verified present on disk; all 3 task commits (aba22c3, 5203e0a, fcbbf43) verified present in `git log`.
