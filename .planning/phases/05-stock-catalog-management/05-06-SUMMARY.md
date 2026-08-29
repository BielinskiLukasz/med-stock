---
phase: 05
plan: 06
status: complete
completed_at: "2026-08-29"
commits:
  - 522dd0e  # feat(detail): catalog + stock edit sheets, open-box, move/split, soft-delete
  - ac5c798  # feat(05-06): pass packCountToMove through moveStock
  - 5666fd6  # feat(05-06): box-aware move/split + packCount in trash
  - daa5758  # fix(05-06): quantity is per-box in box mode move/split
---

# 05-06 Summary — Detail View: Edit Sheets + Stock Row Actions

## Outcome

Detail view fully wired with all CRUD actions. Build passes, 121/122 tests pass (1 pre-existing flaky
timeout). UAT scenarios 1–10 pass after gap fixes. Items 7 (Move/Split box-aware) and 8 (packCount
in Trash) were fixed as part of this plan's checkpoint resolution.

## Artifacts Created / Modified

### `src/components/CatalogEditSheet.tsx` (new)
- Bottom sheet for editing catalog fields: name, category, form, notes
- Pre-fills from `catalog` prop; calls `onSave` callback on submit

### `src/components/StockEditSheet.tsx` (new)
- Bottom sheet for editing stock entry: quantity, expiry, location, pao, notes
- Pre-fills from `stock` prop; calls `onSave` callback on submit

### `src/components/MoveStockSheet.tsx` (new, box-aware)
- Box mode (`packCount > 1`): shows "Boxes to move (max N)" input; `quantity` is per-box so only
  `packCount` changes on both entries — quantity stays the same on original and new entry
- Unit mode: splits `quantity` between entries as before
- Helper text: "{N} {unit} per box"
- Button label: "Move N box(es)" / "Move N units"

### `src/lib/stockOps.ts` — `moveStock` updated
- Added `packCountToMove?: number` parameter
- Box mode path: new entry inherits `stock.quantity` unchanged; original only decrements `packCount`
- Unit mode path: original behavior (subtract quantity)

### `src/routes/medicines/[id].tsx` — detail view wiring
- Catalog header edit icon → `CatalogEditSheet`
- Stock rows: edit icon → `StockEditSheet`; "Open box" → inline transaction; "Move/Split" →
  `MoveStockSheet`; delete icon → `AlertDialog` → `softDeleteMedicine`
- "Open box" pack-level path: when `packCount > 1`, creates new entry with same per-box quantity and
  `packCount=1`; decrements original's `packCount` only
- `handleMoveSubmit` passes `packCountToMove` through to `moveStock`

### `src/routes/trash/index.tsx`
- Quantity line shows "2 boxes × 20 tablets" when `packCount > 1`

## Key Decisions

- **`quantity` is per-box when `packCount > 1`**: Matches "Open box" behaviour — the field stores
  how many units are in one box, not the total across all boxes. Move/Split must preserve this.
- **Box mode skips quantity arithmetic**: Only `packCount` changes. Total units (boxes × qty) are
  implicitly correct after the split without touching the `quantity` field.
- **MoveStockSheet is UI-only for box count**: It passes `packCountToMove` to the handler; the
  actual per-box quantity for the new entry comes from `stock.quantity` inside `moveStock`.

## Patterns Established

| Pattern | Location |
|---------|----------|
| `quantity` = per-box when `packCount > 1` | `stockOps.ts:moveStock`, `[id].tsx:handleOpenBoxClick` |
| Box mode: decrement packCount only | `stockOps.ts:moveStock` box path |
| Trash packCount display | `trash/index.tsx:83` |
| MoveStockSheet box/unit branching | `MoveStockSheet.tsx:33` |
