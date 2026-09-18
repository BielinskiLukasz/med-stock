---
phase: 08-full-location-management
plan: 01
subsystem: database
tags: [dexie, indexeddb, schema-migration, i18n, react]

# Dependency graph
requires:
  - phase: 07-i18n-polish-language
    provides: LOCATION_KEYS[name] ?? name fallback pattern, useLang()/t() dictionary, TranslationDict structural typing
provides:
  - "Location.hidden: boolean and Location.order: number fields on the Location interface"
  - "db.version(6) schema + upgrade migration (additive-only, mirrors v1-v5 precedent)"
  - "renameLocation() usable on isDefault: true locations (LOC-01 unlocked)"
  - "LocationsScreen sorted by order field via toCollection().sortBy('order')"
  - "Full 17-key locations.*/aria.* i18n vocabulary for the rest of Phase 8 (08-03/08-04/08-05)"
affects: [08-02-full-location-management, 08-03-full-location-management, 08-04-full-location-management, 08-05-full-location-management]

# Actuals (#2632)
actuals:
  tokens: 4264
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - "db.version(N).upgrade(tx => ...) performs read+write entirely inside the versionchange transaction (tx.table().toCollection().sortBy() then per-row tx.table().update()) — no second db.transaction() chained after .upgrade() completes"
    - "Non-indexed sortable fields use .toCollection().sortBy(field) instead of .orderBy(field) — Dexie's orderBy() requires an actual IndexedDB index and throws SchemaError otherwise"
    - "Order-field sentinel (999) on ad-hoc location inserts (addCustomLocation, MedicineForm/StockFields inline add) — real order assignment on add deferred to a later plan"

key-files:
  created: []
  modified:
    - src/lib/db.ts
    - src/lib/locationOps.ts
    - src/lib/db.test.ts
    - src/routes/locations/index.tsx
    - src/i18n/types.ts
    - src/i18n/en.ts
    - src/i18n/pl.ts
    - src/components/MedicineForm.tsx
    - src/components/StockFields.tsx

key-decisions:
  - "orderBy('order') replaced with toCollection().sortBy('order') everywhere this plan touches — order is intentionally unindexed (matches the non-indexed precedent set by packCount in v5), and Dexie's orderBy() requires an index"
  - "addCustomLocation and the two inline add-location handlers (MedicineForm, StockFields) use order: 999 as a placeholder sentinel; real max+1 order assignment on add is deferred to Plan 08-02 per the plan's own scope note"

patterns-established:
  - "Schema migrations that add a derived/computed field must do all read+write inside the tx argument of .upgrade() — Dexie's Version builder has no public post-upgrade hook"

requirements-completed: [LOC-01]

coverage:
  - id: D1
    description: "Fresh install seeds all 7 predefined locations with hidden=false and order 1-7 in existing display order"
    requirement: "LOC-01"
    verification:
      - kind: unit
        ref: "src/lib/db.test.ts#db.version(6) migration > seeds fresh installs with hidden=false and sequential order 1..7 (Bathroom Cabinet..Travel Kit)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Existing (pre-v6) database upgrades in place: every location row gets hidden=false and a unique contiguous order matching alphabetical name order, no data loss"
    requirement: "LOC-01"
    verification:
      - kind: unit
        ref: "src/lib/db.test.ts#db.version(6) migration > upgrades an existing pre-v6 database in place..."
        status: pass
    human_judgment: false
  - id: D3
    description: "renameLocation() succeeds on an isDefault:true location and bulk-updates referencing medicines in the same transaction"
    requirement: "LOC-01"
    verification:
      - kind: unit
        ref: "src/lib/db.test.ts#renameLocation > renames a predefined (isDefault) location and updates referencing medicines"
        status: pass
    human_judgment: false
  - id: D4
    description: "LocationsScreen renders rows sorted by the new order field, and the Edit button renders unconditionally (delete stays isDefault-guarded until Plan 08-04)"
    verification:
      - kind: other
        ref: "npx tsc --noEmit; grep -n \"sortBy('order')\" src/routes/locations/index.tsx"
        status: pass
    human_judgment: true
    rationale: "Visual layout/interaction change on a screen with no component test — confirming the Edit button now appears on predefined rows and the list order is visually correct benefits from a human glance, even though the query/JSX structure is verified mechanically."
  - id: D5
    description: "Full 17-key locations.*/aria.* i18n vocabulary added to types.ts/en.ts/pl.ts for later Phase 8 plans to consume"
    verification:
      - kind: other
        ref: "npx tsc --noEmit (TranslationDict structural typing catches missing/extra keys)"
        status: pass
    human_judgment: false

duration: 33min
completed: 2026-09-18
status: complete
---

# Phase 8 Plan 1: db.version(6) Migration + Predefined-Location Rename Summary

**Landed the Location.hidden/order schema fields via a one-way db.version(6) migration, unlocked renaming predefined locations, and pre-loaded the full 17-key i18n vocabulary the rest of Phase 8 depends on.**

## Performance

- **Duration:** ~33 min
- **Started:** 2026-09-18T09:46:43Z (approx, per STATE.md session marker)
- **Completed:** 2026-09-18T10:19:32Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- `Location` interface gained `hidden: boolean` and `order: number`; `db.version(6)` upgrades every existing location row in place (hidden=false, order = alphabetical position) entirely inside the versionchange transaction, with `db.version(5)` left byte-for-byte unchanged
- Fresh installs seed all 7 predefined locations with `hidden: false` and `order: 1..7` matching their existing seed-array position
- `renameLocation()` no longer blocks on `isDefault` — predefined locations can be renamed exactly like custom ones, with the referencing `medicines` rows bulk-updated in the same transaction
- `LocationsScreen` sorts by the new `order` field and renders the Edit button on every row (delete stays behind the `isDefault` guard until Plan 08-04's reassign-or-clear flow)
- Full 17-key `locations.*`/`aria.*` translation vocabulary (EN + PL, verbatim from `08-UI-SPEC.md`) is in place for Plans 08-03/08-04/08-05 to wire up

## Task Commits

Each task was committed atomically (Task 1 followed TDD RED → GREEN):

1. **Task 1 RED: failing tests for rename + migration** - `6d2b5e2` (test)
2. **Task 1 GREEN: db.version(6) migration + rename unlock** - `0b781fd` (feat)
3. **Task 1 follow-up: Rule 3 compile fix in MedicineForm/StockFields** - `04b9eb9` (fix)
4. **Task 2: i18n key set** - `393f3fc` (feat)

**Plan metadata:** (this commit, created after this SUMMARY)

## Files Created/Modified
- `src/lib/db.ts` - `Location.hidden`/`Location.order` fields; `db.version(6)` upgrade migration; populated seed data includes hidden/order
- `src/lib/locationOps.ts` - `renameLocation` drops the `isDefault` guard; `addCustomLocation` supplies `hidden: false, order: 999` sentinel to satisfy the now-required fields
- `src/lib/db.test.ts` - new migration tests (fresh-install seed, pre-v6 upgrade), new isDefault-rename test, existing fixtures updated with `hidden`/`order`
- `src/routes/locations/index.tsx` - `useLiveQuery` sorts via `toCollection().sortBy('order')`; Edit button renders unconditionally, delete AlertDialog stays `isDefault`-guarded
- `src/i18n/types.ts`, `src/i18n/en.ts`, `src/i18n/pl.ts` - 12 new `locations.*` keys + 5 new `aria.*` keys
- `src/components/MedicineForm.tsx`, `src/components/StockFields.tsx` - inline "add new location" handlers updated with `hidden: false, order: 999` to satisfy the now-required `Location` fields (Rule 3 fix, outside this plan's declared file list but required for `npm run build` to pass)

## Decisions Made
- **`orderBy('order')` → `toCollection().sortBy('order')`**: the plan's action text specified `db.locations.orderBy('order')`, but Dexie's `orderBy()` requires an actual IndexedDB index, and the same action text explicitly keeps `order` unindexed ("index string unchanged — hidden/order are not indexed"), matching the existing non-indexed precedent for `packCount` (v5). The RED test caught this immediately (`SchemaError: KeyPath order on object store locations is not indexed`). `toCollection().sortBy('order')` achieves the same sorted-by-order result without requiring an index, preserving the deliberate "not indexed" design choice.
- **Order sentinel of 999 on ad-hoc adds**: `addCustomLocation` and the two inline "add new location" handlers in `MedicineForm`/`StockFields` now supply `order: 999` since the field is non-optional. Real order assignment on add (max existing + 1) is explicitly deferred to Plan 08-02 per this plan's own action text ("order assignment on add are deliberately deferred to Plan 08-02").

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `orderBy('order')` throws SchemaError on an unindexed field**
- **Found during:** Task 1 GREEN phase, first `npx vitest run` after reapplying the implementation
- **Issue:** Plan action text instructed `db.locations.orderBy('order')` in `routes/locations/index.tsx`, but the same action text keeps `order` unindexed in the `db.version(6)` schema. Dexie's `Table.orderBy(index)` requires the field to be an indexed keyPath; calling it on a non-indexed field throws `SchemaError: KeyPath order on object store locations is not indexed`.
- **Fix:** Changed `db.locations.orderBy('order').toArray()` to `db.locations.toCollection().sortBy('order')` in `routes/locations/index.tsx`, and used the same pattern in the two new `db.test.ts` migration test assertions.
- **Files modified:** src/routes/locations/index.tsx, src/lib/db.test.ts
- **Verification:** `npx vitest run src/lib/db.test.ts` — all 10 tests pass; full suite (151 tests) passes.
- **Committed in:** 0b781fd (Task 1 GREEN commit)

**2. [Rule 3 - Blocking] `npm run build`'s `tsc -b` failed on inline location adds missing new required fields**
- **Found during:** Post-Task-2 sanity build (`npm run build`), after `npx tsc --noEmit` had already passed clean
- **Issue:** `Location.hidden`/`Location.order` are non-optional. `src/components/MedicineForm.tsx` and `src/components/StockFields.tsx` each have an inline "add new location" handler calling `db.locations.add({ name, isDefault: false })` without the two new fields — a genuine compile error under `tsc -b`'s project-reference mode (not surfaced by plain `tsc --noEmit`, which uses a different tsconfig scope).
- **Fix:** Added `hidden: false, order: 999` to both inline `.add()` calls, matching the sentinel already used in `locationOps.addCustomLocation`.
- **Files modified:** src/components/MedicineForm.tsx, src/components/StockFields.tsx
- **Verification:** `npm run build` succeeds (tsc -b + vite build); full vitest suite still passes (151/151).
- **Committed in:** 04b9eb9

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking compile issue)
**Impact on plan:** Both fixes were necessary for the plan's own `<verification>` section ("npm run build succeeds") to hold. No scope creep — no behavior was added beyond making the stated migration/rename/i18n work actually compile and run correctly.

## Issues Encountered
- Confirmed `src/lib/dataOps.ts`'s `BackupSchema`/`LegacyBackupSchema` Zod schemas for `Location` do not yet include `hidden`/`order`, so JSON-imported locations from pre-Phase-8 backups will land without these fields. This is not a regression introduced by this plan (the import path already bypasses strict `Location` typing via `as Location[]`), and `dataOps.ts` is explicitly in Plan 08-03's `files_modified` list — left untouched here, no action needed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `Location.hidden`/`Location.order` exist and are populated correctly on every row (fresh installs and upgraded databases alike) — Plan 08-02 (case-insensitive collision check, delete-with-reassign, order assignment on add) can build directly on this schema.
- The full 17-key i18n vocabulary is in place and unused (as intended) — Plans 08-03/08-04/08-05 wire it into hide/show, delete-reassign, and reorder UI without needing further dictionary changes.
- No blockers identified for Wave 2 (Plans 08-02, 08-03).

---
*Phase: 08-full-location-management*
*Completed: 2026-09-18*

## Self-Check: PASSED

All 9 modified files and the SUMMARY.md itself verified present on disk; all 4 task/fix commits (6d2b5e2, 0b781fd, 04b9eb9, 393f3fc) verified present in `git log`.
