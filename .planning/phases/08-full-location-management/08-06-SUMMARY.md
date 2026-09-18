---
phase: 08-full-location-management
plan: 06
subsystem: ui
tags: [locations, dexie, collision-safety]

requires:
  - phase: 08-full-location-management
    provides: addCustomLocation() collision-safe helper (Plan 08-02)
provides:
  - MedicineForm and StockFields quick-add-location paths that enforce D-03 collision safety identically to the Locations screen
affects: []

actuals:
  tokens: 3500
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Quick-add-location handlers delegate to addCustomLocation() instead of inserting into db.locations directly; error branching on err.message === 'Location name already exists' distinguishes the duplicate-name toast from the generic failure toast (mirrors src/routes/locations/index.tsx handleAdd)."

key-files:
  created: []
  modified: [src/components/MedicineForm.tsx, src/components/StockFields.tsx]

key-decisions:
  - "Both components keep their existing db import (still needed for the locations useLiveQuery dropdown query) while adding a separate addCustomLocation import from @/lib/locationOps for the write path."
  - "No new i18n key was needed — locations.errorDuplicate already existed in en.ts/pl.ts/types.ts from Plan 08-02's Locations screen work; this plan only wires two additional call sites to it."

requirements-completed: [LOC-01]

coverage:
  - id: D1
    description: "MedicineForm quick-add-location routes through addCustomLocation"
    requirement: "LOC-01"
    verification:
      - kind: unit
        ref: "npx tsc --noEmit; grep -c addCustomLocation src/components/MedicineForm.tsx"
        status: pass
    human_judgment: false
  - id: D2
    description: "StockFields quick-add-location routes through addCustomLocation"
    requirement: "LOC-01"
    verification:
      - kind: unit
        ref: "npx tsc --noEmit; npm run build; grep -c addCustomLocation src/components/StockFields.tsx"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-09-18
status: complete
---

# Phase 8 Plan 6: Quick-Add-Location Collision-Safety Fix Summary

**Closed the CR-01 gap by routing both MedicineForm's and StockFields' inline quick-add-location handlers through `addCustomLocation()`, so a case-insensitive duplicate name ("pantry" vs "Pantry") is now rejected everywhere in the app, not just on the dedicated Locations screen.**

## Performance
- **Duration:** 6min
- **Started:** 2026-09-18T12:51:00Z
- **Completed:** 2026-09-18T12:57:22Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `MedicineForm.tsx`'s `handleAddLocation` no longer inserts directly into `db.locations` with a hardcoded `order: 999` sentinel; it now calls `addCustomLocation(trimmed)`, which enforces the D-03 case-insensitive collision check and assigns the correct `max(order)+1` value.
- `StockFields.tsx`'s `handleAddLocation` received the identical fix.
- Both components' `catch` blocks now branch on `err.message === 'Location name already exists'` to surface `toast.error(t('locations.errorDuplicate'))` specifically for collisions, falling back to the generic `toasts.locationFailed` toast for any other failure — matching the existing pattern in `src/routes/locations/index.tsx`.
- Every location-creation code path in the app (Locations screen, Add/Edit Medicine form, Add/Edit Stock fields) now funnels through the single vetted `addCustomLocation()` helper.

## Task Commits
1. **Task 1: Route MedicineForm quick-add-location through addCustomLocation** - `49b4be1` (fix)
2. **Task 2: Route StockFields quick-add-location through addCustomLocation** - `c194183` (fix)

## Files Created/Modified
- `src/components/MedicineForm.tsx` - Added `addCustomLocation` import; `handleAddLocation` now calls `addCustomLocation(trimmed)` instead of `db.locations.add({..., order: 999})`; catch block branches on the duplicate-name error message.
- `src/components/StockFields.tsx` - Same fix as MedicineForm.tsx.

## Decisions Made
- Kept the `db` import in both files unchanged since it is still used by the `locations` useLiveQuery dropdown query — only the write path was replaced.
- No new translation key was added; `locations.errorDuplicate` already existed from Plan 08-02 and is reused verbatim.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## Authentication Gates
None - no auth-gated operations in this plan.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Phase 8's CR-01 code gap is closed. The one remaining open item from 08-VERIFICATION.md (drag-active visual state at 360px) is a human-verification backstop already flagged in Plan 08-05's SUMMARY — not a code gap, and out of scope for this plan. Phase 8 is otherwise ready for final verification/closeout.

---
*Phase: 08-full-location-management*
*Completed: 2026-09-18*

## Self-Check: PASSED

- FOUND: src/components/MedicineForm.tsx
- FOUND: src/components/StockFields.tsx
- FOUND: .planning/phases/08-full-location-management/08-06-SUMMARY.md
- FOUND: 49b4be1 (Task 1 commit)
- FOUND: c194183 (Task 2 commit)
