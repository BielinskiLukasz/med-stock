---
phase: 08-full-location-management
plan: 02
subsystem: database
tags: [dexie, indexeddb, locationOps, tdd]

# Dependency graph
requires:
  - phase: 08-full-location-management (Plan 08-01)
    provides: "Location.hidden/order fields, db.version(6), renameLocation() unblocked for isDefault locations"
provides:
  - "addCustomLocation/renameLocation reject case-insensitive, trimmed name collisions (D-03)"
  - "addCustomLocation assigns order = max(existing)+1, replacing the 999 sentinel"
  - "countActiveLocationReferences(locationName) — counts only deletedAt===null medicines"
  - "deleteLocationWithReassign(locationId, reassignTo) — atomic reassign-or-clear + delete, replaces deleteLocation, no isDefault guard, no minimum-location floor"
  - "toggleLocationHidden(locationId, hidden) — single-field update, works identically regardless of isDefault"
  - "reorderLocations(orderedIds) — bulkUpdate renumbers to contiguous 1..N, no-op on empty/single-element arrays"
affects: [08-03-full-location-management, 08-04-full-location-management, 08-05-full-location-management]

# Actuals (#2632)
actuals:
  tokens: 4678
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - "Case-insensitive, trimmed name collision check via db.locations.toCollection().filter(loc => loc.name.toLowerCase() === trimmed.toLowerCase()) — 'order' stays unindexed so max-order lookup also uses toCollection().sortBy('order') rather than orderBy('order')"
    - "Atomic reassign-then-delete pattern: db.transaction('rw', db.locations, db.medicines, ...) does the bulk .modify() before .delete(), mirroring the existing renameLocation shape"
    - "db.locations.bulkUpdate(orderedIds.map((id, i) => ({ key: id, changes: { order: i + 1 } }))) for contiguous renumbering (Dexie 4.x)"

key-files:
  created: []
  modified:
    - src/lib/locationOps.ts
    - src/lib/db.test.ts
    - src/routes/locations/index.tsx

key-decisions:
  - "deleteLocation removed entirely and replaced by deleteLocationWithReassign — the one remaining call site (LocationsScreen.handleDelete) was updated to deleteLocationWithReassign(id, null) to preserve current UI behavior (clear-to-null, still isDefault-guarded in the UI) until Plan 08-04 wires the full reassign-or-clear picker"
  - "addCustomLocation's max-order lookup uses db.locations.toCollection().sortBy('order') instead of orderBy('order').reverse().first() — 'order' is intentionally unindexed (Plan 08-01 precedent), and orderBy() throws SchemaError on a non-indexed keyPath"

requirements-completed: [LOC-01, LOC-02, LOC-03, LOC-04]

coverage:
  - id: D1
    description: "addCustomLocation and renameLocation both reject a case-insensitive, trimmed name collision with any other existing location, and leave the offending name untouched on rejection"
    requirement: "LOC-01"
    verification:
      - kind: unit
        ref: "src/lib/db.test.ts#addCustomLocation > rejects a name that collides case-insensitively with an existing location"
        status: pass
      - kind: unit
        ref: "src/lib/db.test.ts#renameLocation > rejects a rename that collides case-insensitively with a different existing location"
        status: pass
      - kind: unit
        ref: "src/lib/db.test.ts#renameLocation > allows renaming a location to its own current name (case-insensitive self-match is not a collision)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Location names are stored trimmed-only, never title-cased"
    requirement: "LOC-01"
    verification:
      - kind: unit
        ref: "src/lib/db.test.ts#addCustomLocation > stores the name trimmed but otherwise verbatim (no title-casing)"
        status: pass
    human_judgment: false
  - id: D3
    description: "addCustomLocation assigns order = max(existing)+1, or 1 on an empty table"
    requirement: "LOC-04"
    verification:
      - kind: unit
        ref: "src/lib/db.test.ts#addCustomLocation > assigns order = max(existing order) + 1"
        status: pass
      - kind: unit
        ref: "src/lib/db.test.ts#addCustomLocation > assigns order = 1 on an empty locations table"
        status: pass
    human_judgment: false
  - id: D4
    description: "countActiveLocationReferences counts only active (deletedAt===null) medicines; deleteLocationWithReassign reassigns/clears active refs and deletes the location atomically, excluding soft-deleted rows, with no isDefault guard and no minimum-location floor"
    requirement: "LOC-03"
    verification:
      - kind: unit
        ref: "src/lib/db.test.ts#countActiveLocationReferences > counts only active (non-soft-deleted) medicines referencing the location"
        status: pass
      - kind: unit
        ref: "src/lib/db.test.ts#deleteLocationWithReassign > reassigns active references to the target location, leaves soft-deleted ones untouched, and deletes the location row"
        status: pass
      - kind: unit
        ref: "src/lib/db.test.ts#deleteLocationWithReassign > clears active references to null (\"Other\") when reassignTo is null, never the string \"Other\""
        status: pass
      - kind: unit
        ref: "src/lib/db.test.ts#deleteLocationWithReassign > deletes a location with zero active references successfully, no special-case throw"
        status: pass
      - kind: unit
        ref: "src/lib/db.test.ts#deleteLocationWithReassign > throws \"Location not found\" on a second call with the same (already-deleted) id"
        status: pass
      - kind: unit
        ref: "src/lib/db.test.ts#deleteLocationWithReassign > deletes the last remaining location with no minimum-floor check"
        status: pass
      - kind: unit
        ref: "src/lib/db.test.ts#deleteLocationWithReassign > works identically on an isDefault:true location (no isDefault guard)"
        status: pass
    human_judgment: false
  - id: D5
    description: "toggleLocationHidden flips hidden independent of isDefault; reorderLocations renumbers to contiguous, unique order values and is a safe no-op on empty/single-element arrays"
    requirement: "LOC-02"
    verification:
      - kind: unit
        ref: "src/lib/db.test.ts#toggleLocationHidden > sets hidden=true and leaves other fields (including isDefault) untouched"
        status: pass
      - kind: unit
        ref: "src/lib/db.test.ts#toggleLocationHidden > works identically on an isDefault: true location"
        status: pass
      - kind: unit
        ref: "src/lib/db.test.ts#reorderLocations > renumbers three locations to contiguous integers matching the array order"
        status: pass
      - kind: unit
        ref: "src/lib/db.test.ts#reorderLocations > produces unique order values across all rows after a reorder"
        status: pass
      - kind: unit
        ref: "src/lib/db.test.ts#reorderLocations > is a no-op on an empty array"
        status: pass
      - kind: unit
        ref: "src/lib/db.test.ts#reorderLocations > is a no-op on a single-element array"
        status: pass
    human_judgment: false

duration: 17min
completed: 2026-09-18
status: complete
---

# Phase 8 Plan 2: locationOps.ts Business-Logic Hardening Summary

**Hardened `locationOps.ts` into the full mutation surface for Phase 8: case-insensitive collision checks on add/rename, order assignment on add, atomic delete-with-reassign (replacing the isDefault-guarded `deleteLocation`), a hide/show toggle, and contiguous-order reordering — all under TDD, all pure/testable with no UI involved.**

## Performance

- **Duration:** ~17 min
- **Started:** 2026-09-18T10:28:23Z
- **Completed:** 2026-09-18T10:45:34Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- `addCustomLocation`/`renameLocation` reject case-insensitive, trimmed name collisions with any other existing location (D-03), while allowing a rename to a location's own current name
- `addCustomLocation` assigns a real `order` value (`max(existing)+1`, or `1` on an empty table), replacing the `999` sentinel Plan 08-01 left as a placeholder
- `countActiveLocationReferences` and `deleteLocationWithReassign` added; the old `deleteLocation` (which threw on `isDefault` locations) is removed entirely — delete now reassigns or clears (never the string `'Other'`) only active (`deletedAt === null`) stock inside one `db.transaction`, then deletes the location row, with no minimum-location floor
- `toggleLocationHidden` (single-field update) and `reorderLocations` (contiguous 1..N renumbering via `bulkUpdate`, no-op on 0/1-element arrays) added
- `locationOps.ts` now exports exactly the 6 functions required by Phase 8's downstream UI plans: `addCustomLocation`, `renameLocation`, `countActiveLocationReferences`, `deleteLocationWithReassign`, `toggleLocationHidden`, `reorderLocations`

## Task Commits

Each task followed TDD RED → GREEN:

1. **Task 1 RED: failing tests for collision + order assignment** - `e7c1e38` (test)
2. **Task 1 GREEN: collision-safe add/rename + order assignment** - `e032d6a` (feat)
3. **Task 2 RED: failing tests for delete-with-reassign** - `81f1e07` (test)
4. **Task 2 GREEN: atomic delete-with-reassign, drop isDefault guard** - `1632650` (feat, includes Rule 3 fix to LocationsScreen call site)
5. **Task 3 RED: failing tests for hide toggle + reorder** - `d891e2d` (test)
6. **Task 3 GREEN: hide/show toggle + contiguous reorder** - `ac5a76c` (feat)

**Plan metadata:** (this commit, created after this SUMMARY)

## Files Created/Modified
- `src/lib/locationOps.ts` - Rewrote `addCustomLocation`/`renameLocation` with collision checks + order assignment; added `countActiveLocationReferences`, `deleteLocationWithReassign` (replaces `deleteLocation`), `toggleLocationHidden`, `reorderLocations`
- `src/lib/db.test.ts` - Replaced the obsolete `deleteLocation` describe block (including the now-invalid "throws when trying to delete a default location" test) with `countActiveLocationReferences`/`deleteLocationWithReassign` blocks; added collision/order-assignment tests to `addCustomLocation`/`renameLocation`; added `toggleLocationHidden`/`reorderLocations` blocks; introduced a shared `makeMedicine()` fixture factory to cut boilerplate across the new delete-with-reassign tests
- `src/routes/locations/index.tsx` - `handleDelete` now calls `deleteLocationWithReassign(id, null)` instead of the removed `deleteLocation(id)` (Rule 3 fix, outside declared file scope but required for `tsc -b` to pass)

## Decisions Made
- **`deleteLocation` → `deleteLocationWithReassign`, LocationsScreen updated now, not deferred to 08-04**: the plan's acceptance criteria required zero remaining `deleteLocation` call sites, but `src/routes/locations/index.tsx` (outside this plan's declared `files_modified`) imports and calls it. `npx tsc --noEmit` (root, `files: []` + references) reported no error, but `npx tsc -b` (the same project-reference mode `npm run build` uses, and the same gap Plan 08-01 hit) caught `TS2305: Module has no exported member 'deleteLocation'`. Fixed with a minimal one-line call-site swap to `deleteLocationWithReassign(id, null)`, preserving the exact current behavior (clear-to-null, still `isDefault`-guarded by the surrounding UI) — Plan 08-04 still owns building the full reassign-or-clear picker UI.
- **Max-order lookup uses `toCollection().sortBy('order')`, not `orderBy('order').reverse().first()`**: `order` is intentionally unindexed (Plan 08-01 precedent, matching `packCount` in v5). `orderBy()` requires an indexed keyPath and throws `SchemaError` otherwise, so the in-memory sort pattern established in 08-01 is reused here.
- **Order-assignment test needed `db.locations.clear()` first**: the seeded test db always has 7 predefined locations (order 1-7) before any test runs; a test asserting "next order after an existing max of 5" must clear the table first or the real max (7) makes the assertion fail. Caught immediately by the RED→GREEN cycle.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `tsc -b` failed on the removed `deleteLocation` export**
- **Found during:** Task 2 GREEN phase, immediately after removing `deleteLocation` and running `npx tsc -b`
- **Issue:** `src/routes/locations/index.tsx` (not in this plan's declared `files_modified`) imports and calls `deleteLocation`, which Task 2's action text required removing entirely. `npx tsc --noEmit` at the repo root passed silently (its `files: []` + `references` shape means it does nothing meaningful without `-b`, the same gap Plan 08-01's Deviation #2 identified), but `npx tsc -b` (equivalent to `npm run build`'s first step) failed with `TS2305`.
- **Fix:** Updated the import and the one call site in `handleDelete` to `deleteLocationWithReassign(id, null)`, which reproduces the old `deleteLocation` behavior (clear referencing medicines' `location` to `null`) exactly, since the surrounding `!loc.isDefault` UI guard is unchanged.
- **Files modified:** src/routes/locations/index.tsx
- **Verification:** `npx tsc -b` passes clean; full `npx vitest run` (170/170) still passes.
- **Committed in:** 1632650 (Task 2 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 blocking compile issue)
**Impact on plan:** Necessary for the plan's own `<verification>` clause ("`npx tsc --noEmit` passes ... no callers broken by the removed `deleteLocation` export") to actually hold under the project's real build tooling. No behavior change beyond making the removal compile — Plan 08-04 still owns the full reassign-or-clear UI redesign.

## Issues Encountered
None beyond the deviation above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `locationOps.ts` exports exactly the 6 functions Phase 8's UI plans need, all under test: `addCustomLocation`, `renameLocation`, `countActiveLocationReferences`, `deleteLocationWithReassign`, `toggleLocationHidden`, `reorderLocations`
- Plan 08-03 (dropdown filtering by `hidden`) can call `toggleLocationHidden`'s sibling read-side (`db.locations` query) directly — no new locationOps function needed for filtering, only UI wiring
- Plan 08-04 (hide/delete management screen) has `countActiveLocationReferences` + `deleteLocationWithReassign` ready to wire into the reassign-or-clear picker; the current `LocationsScreen.handleDelete` stub (`deleteLocationWithReassign(id, null)`, `isDefault`-guarded) is intentionally temporary and fully superseded by that plan
- Plan 08-05 (reorder UI) has `reorderLocations` ready to call with a drag-reordered id array
- No blockers identified for Wave 2 continuation (Plan 08-03, running independently in this same wave) or for Wave 3+ (08-04, 08-05)

---
*Phase: 08-full-location-management*
*Completed: 2026-09-18*

## Self-Check: PASSED

All 3 modified files and the SUMMARY.md itself verified present on disk; all 6 task commits (e7c1e38, e032d6a, 81f1e07, 1632650, d891e2d, ac5a76c) verified present in `git log`.
