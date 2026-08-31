---
phase: 04
plan: 02
subsystem: mutation-layer
status: complete
metrics:
  duration: 40 minutes
  tasks_completed: 2
  files_modified: 6
  commits: 1
  tests_passed: 20
---

# Phase 04 Plan 02: Update historyOps Mutation Signatures - Summary

**Explicit medicineName parameter added to all 5 mutation functions; historyOps decoupled from medicine object for Phase 5 callers**

## Objective

Update historyOps.ts mutation functions to accept explicit `medicineName` parameter, decoupling history recording from catalog/stock relationship. This prepares the mutation layer for Phase 5 callers that have catalog context and can supply the name explicitly.

## What Was Built

### Core Changes (src/lib/historyOps.ts)

All 5 mutation functions updated to accept explicit `medicineName: string` parameter:

1. **updateMedicineWithHistory**
   - New signature: `(id, before, changes, medicineName)`
   - Parameter added as 4th position
   - Line 51 uses explicit parameter instead of `before.name`

2. **softDeleteMedicine**
   - New signature: `(medicine, medicineName)`
   - Parameter added as 2nd position
   - Line 69 uses explicit parameter instead of `medicine.name`

3. **restoreMedicine**
   - New signature: `(medicine, medicineName)`
   - Parameter added as 2nd position
   - Line 88 uses explicit parameter instead of `medicine.name`

4. **permanentDeleteMedicine**
   - New signature: `(medicine, medicineName)`
   - Parameter added as 2nd position
   - Line 106 uses explicit parameter instead of `medicine.name`

5. **addMedicineHistory**
   - New signature: `(medicine, medicineName, action)`
   - Parameter added as 2nd position (shifts action to 3rd)
   - Line 127 uses explicit parameter instead of `medicine.name`

### Test Updates (src/lib/historyOps.test.ts)

Updated all 20 test calls to pass explicit `medicineName` argument:
- softDeleteMedicine tests: 2 calls updated to pass `medicine.name`
- restoreMedicine tests: 3 calls updated to pass `medicine.name`
- permanentDeleteMedicine tests: 3 calls updated to pass `medicine.name`
- updateMedicineWithHistory tests: 3 calls updated to pass `before.name` as 4th parameter
- addMedicineHistory tests: 1 call updated to pass `medicine.name` as 2nd parameter

All test expectations remain unchanged (medicineName assertions still verified).

### Route Handler Updates (Rule 3 - Auto-fix Blocking Issues)

Updated callers in 4 route files to pass medicine.name parameter:
- `src/routes/medicines/[id].edit.tsx`: Added `before.name` to updateMedicineWithHistory call
- `src/routes/medicines/[id].tsx`: Added `medicine.name` to softDeleteMedicine call
- `src/routes/medicines/new.tsx`: Added `newMedicine.name` to addMedicineHistory call
- `src/routes/trash/index.tsx`: Added `medicine.name` to restoreMedicine and permanentDeleteMedicine calls

## Verification

✓ All 20 historyOps tests pass (`npm test`)
✓ TypeScript strict mode compilation succeeds (`npm run build`)
✓ All 5 function signatures updated with medicineName parameter
✓ All test calls updated to pass explicit medicineName argument
✓ All route handlers updated to match new signatures
✓ No breaking changes to transaction pattern or HistoryEntry structure

## Design Rationale

**Per Decision D-06 (Phase 4 Context):** All historyOps.ts functions that currently read `medicine.name` are updated to accept `medicineName: string` as an explicit parameter. Callers (routes and forms, written in Phase 5) supply the name from their catalog context. `historyOps.ts` does not read from `medicine_catalog` internally.

**Benefits for Phase 5:**
- Forms and routes can provide medicineName from catalog context without historyOps importing MedicineCatalog
- No circular dependency between mutation layer and schema layer
- Explicit parameter makes the caller's responsibility clear
- History entries maintain denormalized medicineName for readability after catalog changes

## Files Changed

| File | Role | Changes |
|------|------|---------|
| src/lib/historyOps.ts | utility | Added medicineName parameter to all 5 mutation functions |
| src/lib/historyOps.test.ts | test | Updated 20 test calls to pass explicit medicineName argument |
| src/routes/medicines/[id].edit.tsx | route | Added before.name parameter to updateMedicineWithHistory call |
| src/routes/medicines/[id].tsx | route | Added medicine.name parameter to softDeleteMedicine call |
| src/routes/medicines/new.tsx | route | Added newMedicine.name parameter to addMedicineHistory call |
| src/routes/trash/index.tsx | route | Added medicine.name parameters to restoreMedicine and permanentDeleteMedicine calls |

## Commits

1. **feat(04-02): add explicit medicineName parameter to historyOps mutation functions** (76e7d6c)
   - All 5 mutation function signatures updated
   - All 20 test calls updated
   - All route handler calls updated
   - Build succeeds; all tests pass

## Deviations from Plan

### Rule 3: Auto-fix Blocking Issues

Route handler updates (`src/routes/medicines/*.tsx`, `src/routes/trash/index.tsx`) were required to resolve TypeScript compilation errors after signature changes. These files were not in the original `files_modified` list but were blocking the build:

- **Root cause:** Function signature changes introduced new required parameters that existing callers didn't provide
- **Resolution:** Updated all callers to pass `medicine.name` (or `before.name` for edit route)
- **Impact:** All TypeScript errors resolved; build and tests pass
- **Reversibility:** Reversible — callers can revert to old signature if needed before Phase 5 ships

## Known Stubs

None — plan executed without stubs.

## Readiness for Phase 5

✓ historyOps mutation signatures ready to be called from Phase 5 form/route handlers
✓ Callers can have both catalog and stock in scope, can supply medicineName directly
✓ No historyOps imports needed from MedicineCatalog or any catalog-related tables
✓ History recording fully decoupled from music object, ready for catalog-driven workflows

## Next Steps

**Phase 04 Complete:** Both plans executed (04-01 migration schema, 04-02 mutation signatures)
**Phase 05:** Stock & Catalog Management can now begin with production-ready mutation layer
