---
plan: 05-12
status: complete
gap_ids: [G-05-9]
---

# Plan 05-12 Summary — Fix catalog badge aggregateStatus prop

## What was built

Wired the pre-computed `aggregateStatus` from `computeCatalogAggregate` into `MedicineCardAggregate` as an explicit prop, eliminating the stale re-derivation from `nearestExpiryStock`.

**Changes:**

- `src/components/MedicineCardAggregate.tsx` — replaced `calculateStatus` import with `import type { MedicineStatus }`, added `aggregateStatus: MedicineStatus` to props interface, changed `const status = nearestExpiryStock ? calculateStatus(...) : 'Active'` to `const status = aggregateStatus`.
- `src/routes/medicines/index.tsx` — added `import type { MedicineStatus }` and passed `aggregateStatus={item.aggregateStatus as MedicineStatus}` to the card JSX.

## Key files

- `src/components/MedicineCardAggregate.tsx`
- `src/routes/medicines/index.tsx`

## Verification

- 111/113 Vitest tests pass; 2 pre-existing failures (csvOps skip logic, medicines-list timeout) unrelated to these changes.
- TypeScript: no errors in modified files; pre-existing `packCount` type errors in test fixtures from plan 05-09 remain unchanged.

## Self-Check: PASSED

Badge status and filter now share the same `aggregateStatus` value from `computeCatalogAggregate`. PAO-only entries with no `expiryDate` will correctly display `Opened` or `ExceededOpenPeriod` instead of defaulting to `Active`.
