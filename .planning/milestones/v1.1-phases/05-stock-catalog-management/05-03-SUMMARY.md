---
phase: 05
plan: 03
status: complete
completed_at: "2026-07-30"
commits:
  - 26ac2f2  # feat(components): Extract CatalogFields, StockFields; add MedicineCardAggregate
---

# 05-03 Summary — List View Redesign with Catalog-First Join

## Outcome

All tasks complete. Build passes with 0 TypeScript errors. 100/100 tests pass. List view now uses
two-query pattern with `computeCatalogAggregate` from Plan 2. Component decomposition done.

## Artifacts Created

### `src/components/CatalogFields.tsx`
- Exports `CatalogFields` component + `catalogSchema` (Zod) + `CatalogFormData` type
- Fields: name (required), category (Select + NULL_SENTINEL), form (Select from MedicineForm enum), notes (Textarea)
- Ready for use in Plan 05-05 (add flow) and Plan 05-06 (edit sheets)

### `src/components/StockFields.tsx`
- Exports `StockFields` component + `stockSchema` (Zod) + `StockFormData` type
- Fields: expiryDate (required), location (Select + inline quick-add), openedDate, pao (value+unit), quantity+quantityUnit, notes
- Internal `useLiveQuery` for location list; location quick-add pattern copied exactly from MedicineForm

### `src/components/MedicineCardAggregate.tsx`
- Props: `{ catalog: MedicineCatalog, nearestExpiryStock: Medicine | null, totalQuantity: number, stockCount: number }`
- Calls `calculateStatus(nearestExpiryStock)` at render time (D-12 compliant)
- Displays: catalog name, StatusBadge, quantity line with "across N locations" when `stockCount > 1`

## Updates Applied

### `src/routes/medicines/index.tsx`
- Now imports `computeCatalogAggregate` from `@/lib/aggregation` (Plan 2 function)
- Now imports `MedicineCardAggregate` component
- `useMemo` calls `computeCatalogAggregate(catalog, stockForCatalog)` for `{ status, totalQty }` — no duplicated logic
- Renders `<MedicineCardAggregate>` instead of inline JSX

### `src/stores/uiStore.ts`
- `SortField` union extended with `'status'` (fixes TS2367 on existing sort case)
- `toggleLocation` comment added: "Location filter uses match-any semantics: a catalog passes if ANY of its stock entries is at the selected location (not ALL)"

### `src/components/MedicineForm.tsx`
- TODO comment added: CatalogFields + StockFields extracted; MedicineForm kept for backward compat until Plans 05-05 and 05-06 replace it

## Key Decisions

- `MedicineCardAggregate` receives `nearestExpiryStock` (not pre-computed status) so it remains self-contained and D-12 compliant (status at render time)
- `computeCatalogAggregate` called for `{ status, totalQty }`; `nearestExpiryStock` still computed inline for card prop — avoids modifying the committed aggregation function
- `'status'` added to `SortField` to resolve the existing TS2367 that was masked by non-strict comparisons

## Patterns Established

| Pattern | Location |
|---------|----------|
| CatalogFields reuse | `src/components/CatalogFields.tsx` |
| StockFields reuse | `src/components/StockFields.tsx` |
| computeCatalogAggregate call | `index.tsx:54` |
| Location match-any comment | `uiStore.ts:toggleLocation` |
| MedicineCardAggregate render | `index.tsx:202-209` |
