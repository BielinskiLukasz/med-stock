---
phase: 05
plan: 05
status: complete
completed_at: "2026-07-30"
commits:
  - ddd4642  # feat(add-flow): 3-step state machine for medicine add flow
---

# 05-05 Summary — Add Flow State Machine + CatalogAutocomplete

## Outcome

3-step add flow implemented. Build passes with 0 TypeScript errors. 100/100 tests pass.
User can add a medicine by searching existing catalogs or creating a new one, then adding a stock entry.

## Artifacts Created

### `src/components/CatalogAutocomplete.tsx`
- Search input showing all catalogs on focus (D-07: no character delay)
- Filters by substring as user types
- "Create [name]" button appears when search has text but 0 matches (D-08)
- `onMouseDown` + `e.preventDefault()` to prevent blur race condition with dropdown buttons
- 150ms delay on `handleBlur` as secondary safeguard for the same race

### `src/routes/medicines/new.tsx` (rewritten)
- 3-step state machine: `step: 'search' | 'create-catalog' | 'stock-form'`
- Both forms always initialized (hooks can't be conditional): `catalogForm` + `stockForm`
- Step 1 (search): `CatalogAutocomplete` → `handleCatalogSelect` or `handleCreateCatalogClick`
- Step 2 (create-catalog): `CatalogFields` form → creates entry in `db.medicine_catalog` → advances to step 3
- Step 3 (stock-form): `StockFields` form → calls `addStockEntry(selectedCatalog.id, data, selectedCatalog.name)` → navigates to detail view

## Key Decisions

- No new routes for the add flow — step state lives in `new.tsx` (simpler than router-driven wizard)
- Parent does not track search text; `CatalogAutocomplete` manages its own internal state
- `handleCreateCatalogClick(typedName)` pre-fills catalogForm via `catalogForm.reset({ name: typedName })` so step 2 starts with the typed name
- Back button always returns to step 1 and resets both forms

## Patterns Established

| Pattern | Location |
|---------|----------|
| CatalogAutocomplete component | `src/components/CatalogAutocomplete.tsx` |
| `onMouseDown + preventDefault` for blur-before-click | `CatalogAutocomplete.tsx:58–61`, `CatalogAutocomplete.tsx:83–86` |
| 3-step state machine (internal step state) | `src/routes/medicines/new.tsx` |
| `catalogForm.reset({ name: typedName })` pre-fill | `new.tsx:48` |
| Navigation to detail after stock add: `/medicines/${selectedCatalog.id}` | `new.tsx:94` |
