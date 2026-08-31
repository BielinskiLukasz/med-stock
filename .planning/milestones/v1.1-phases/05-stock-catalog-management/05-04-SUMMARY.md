---
phase: 05
plan: 04
status: complete
completed_at: "2026-07-30"
commits:
  - 32e85a8  # feat(stockOps): TDD stock mutations — add, edit, soft-delete, move
---

# 05-04 Summary — TDD: Stock Entry Mutations

## Outcome

TDD cycle complete (RED → GREEN). 22/22 tests pass. Full suite 100/100.

## Functions

```ts
addStockEntry(catalogId, data, medicineName): Promise<number>
editStockEntry(stockId, before, changes, medicineName): Promise<void>
softDeleteStock(stockId, stock, medicineName): Promise<void>
moveStock(stockId, quantityToMove, targetLocation, stock, medicineName): Promise<number>
```

## Behavior Summary

| Function | DB write | History | Atomic |
|----------|----------|---------|--------|
| `addStockEntry` | `db.medicines.add()` | `action='created'` | ✓ transaction |
| `editStockEntry` | `db.medicines.update()` | `action='updated'` + changedFields | ✓ via `updateMedicineWithHistory` |
| `softDeleteStock` | sets `deletedAt` | `action='deleted'` | ✓ via `softDeleteMedicine` |
| `moveStock` | decrement original qty + add new entry | `action='updated'` + `action='created'` | ✓ transaction |

## Assumptions Documented

- `D-ASUM-01`: null original quantity treated as 0 in `moveStock` validation — test verifies this throws when moveQty > 0
- Move to same location: allowed (creates duplicate entry at same location with different ID)
- Move validation: integer-only (no fractional checking; caller responsibility)

## Test Coverage (22 tests)

- `addStockEntry`: 7 tests (basic insert, deletedAt null, history created, null expiry, null qty, null location, return ID)
- `editStockEntry`: 4 tests (field update, history updated, changed location, updatedAt newer)
- `softDeleteStock`: 3 tests (deletedAt non-null, history deleted, appears in trash)
- `moveStock`: 8 tests (decrement qty, new entry created, return ID, throw on excess, move all, null location, history both entries, null-qty error)
