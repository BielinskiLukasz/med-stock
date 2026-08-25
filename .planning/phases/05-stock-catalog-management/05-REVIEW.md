---
phase: 05-stock-catalog-management
reviewed: 2026-08-26T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - src/components/MoveStockSheet.tsx
  - src/components/StockEditSheet.tsx
  - src/components/StockFields.tsx
  - src/components/StockFields.test.ts
  - src/lib/aggregation.ts
  - src/lib/aggregation.test.ts
  - src/lib/db.ts
  - src/lib/stockOps.ts
  - src/routes/medicines/[id].tsx
  - src/routes/medicines/index.tsx
  - src/routes/medicines/new.tsx
findings:
  critical: 1
  warning: 7
  info: 3
  total: 11
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-08-26
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

The implementation covers catalog/stock separation, stock editing, move/split, open-box splitting, aggregation, and the multi-step new-medicine flow. The aggregation logic and priority-reduce approach are sound and well-tested. The overall structure follows project conventions.

One blocker is present: the seeded "Other" location in the `locations` table flows directly into the location dropdowns in both `StockFields` and `MoveStockSheet`, which will store the string `"Other"` in `Medicine.location` when selected — directly violating the documented critical invariant. Seven warnings cover data integrity gaps (null quantity on open-box split, missing `packCount` in `moveStock`), architectural violations (direct DB write bypassing historyOps), missing user feedback, and a TOCTOU gap. Three info items cover code duplication and minor style issues.

---

## Critical Issues

### CR-01: Seeded "Other" location causes string "Other" to be stored in Medicine.location

**Files:**
- `src/lib/db.ts:218`
- `src/components/StockFields.tsx:113-116`
- `src/components/MoveStockSheet.tsx:100-103`

**Issue:** `db.on('populate')` seeds a `Location` row with `name: 'Other'`. Both location dropdowns render all DB locations via `locations?.map(loc => <SelectItem value={loc.name}>)`. This places a `SelectItem value="Other"` in the dropdown alongside the sentinel `SelectItem value="__NULL__"`. If the user selects the DB "Other" row, `field.onChange("Other")` (StockFields) or `setTargetLocation("Other")` (MoveStockSheet) stores the string `"Other"` in `Medicine.location`, violating the project invariant: **"Never store the string 'Other' in Medicine.location. Store null instead."** The invariant is documented in CLAUDE.md and enforced throughout the codebase by display logic that maps `null` → `"Other"`.

**Fix — two equally valid approaches:**

Option A — filter out the "Other" row in both dropdowns:
```tsx
// StockFields.tsx line 113 and MoveStockSheet.tsx line 100
{locations
  ?.filter(loc => loc.name !== 'Other')   // "Other" is represented by NULL_SENTINEL above
  .map((loc) => (
    <SelectItem key={loc.id} value={loc.name}>
      {loc.name}
    </SelectItem>
  ))}
```

Option B — map the "Other" string to null in `onValueChange` handlers:
```tsx
// Both dropdowns
onValueChange={(val) =>
  setTargetLocation(
    val === NULL_SENTINEL || val === 'Other' ? null : val
  )
}
```

Option A is safer — it eliminates the ambiguous DB entry from the UI entirely. The seeded "Other" location in `locations` table provides no functional value given the `null` sentinel approach and should be removed from `db.on('populate')` to avoid future exposure in other dropdowns.

---

## Warnings

### WR-01: Open-box on multi-pack entry with null quantity creates a corrupt new entry

**File:** `src/routes/medicines/[id].tsx:296, 128-151`

**Issue:** The "Open box" button is shown when `(stock.packCount ?? 0) > 1`, regardless of whether `stock.quantity` is null. In the pack-level split path (lines 128-151), the new entry is created with `quantity: stock.quantity` (line 132), which can be null. This leaves the newly created "opened" entry with null quantity and packCount=1 — an inconsistent state that would display as `"1 box × null units"` and cause aggregation to treat it as 0 quantity (via `quantity ?? 0`).

**Fix:** Guard the button to require a positive quantity even when packCount > 1, and guard the handler:
```tsx
// line 296 — update button condition
{((stock.quantity ?? 0) > 1 || (stock.packCount ?? 0) > 1)
  && (stock.quantity ?? 0) > 0           // add this guard
  && !stock.openedDate && (
  <Button ...>Open box</Button>
)}
```
```ts
// line 128 — also guard the handler
if (stock.packCount && stock.packCount > 1) {
  if (!stock.quantity) {
    toast.error('Cannot open box: quantity not set.')
    return
  }
  // ... existing pack-level split
}
```

---

### WR-02: moveStock creates new stock entry without packCount (type violation, undefined in DB)

**File:** `src/lib/stockOps.ts:78-92`

**Issue:** The `db.medicines.add()` call in `moveStock` omits the `packCount` field entirely. The `Medicine` interface declares `packCount: number | null` — `undefined` is not a valid value. Dexie stores the record as-is, so the moved entry has `packCount: undefined` at the object level rather than `null`. This violates the TypeScript type contract. Downstream code that reads `packCount` via `?? 1` still works correctly, but `packCount && packCount > 1` on the moved entry yields `false` (as expected for a split unit), and the aggregation formula `(packCount ?? 1) * quantity` applies the correct fallback. Despite no runtime crash, the missing field is a correctness gap that will silently diverge from the schema if downstream code ever tightens null vs. undefined handling.

**Fix:**
```ts
newId = await db.medicines.add({
  catalogId: stock.catalogId,
  quantity: quantityToMove,
  quantityUnit: stock.quantityUnit,
  expiryDate: stock.expiryDate,
  openedDate: stock.openedDate,
  pao: stock.pao,
  location: targetLocation,
  manualStatus: null,
  packCount: null,          // add this
  notes: stock.notes,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
})
```

---

### WR-03: moveStock calls db.medicines.update() directly then calls updateMedicineWithHistory — double write

**File:** `src/lib/stockOps.ts:73-76, 95-99`

**Issue:** The original entry is updated twice within the same transaction. At line 73-76, `db.medicines.update(stockId, {quantity: newOriginalQty, updatedAt: now})` writes directly to the DB. Then at lines 95-99, `updateMedicineWithHistory()` is called with the same `stockId`, `before = stock`, and `changes = {quantity: newOriginalQty}` — which internally calls `db.medicines.update(id, changes)` again (confirmed in `historyOps.ts:47`). The second write is the authoritative one (it also records history). The first write is redundant. Additionally, CLAUDE.md documents that "all medicine mutations go through [historyOps] so every change is recorded atomically" — the direct `db.medicines` call violates this architectural invariant even though history does get recorded moments later.

**Fix:** Remove the direct `db.medicines.update()` call; let `updateMedicineWithHistory` be the only writer:
```ts
// Delete lines 73-76:
await db.medicines.update(stockId, {
  quantity: newOriginalQty,
  updatedAt: now,
})

// Keep lines 95-99 as-is — this covers both the DB write and history
await updateMedicineWithHistory(
  stockId,
  stock,
  { quantity: newOriginalQty, updatedAt: now },
  medicineName
)
```

---

### WR-04: handleAddLocation shows no user feedback on failure

**File:** `src/components/StockFields.tsx:55-66`

**Issue:** The catch block at line 63 only calls `console.error`. If adding a location fails (e.g., a Dexie write error), the user sees nothing — the inline input stays open with no indication of what went wrong. This is inconsistent with every other mutation in the codebase which calls `toast.error()` on failure.

**Fix:**
```ts
} catch (err) {
  console.error('Failed to add location:', err)
  toast.error('Failed to add location. Please try again.')
}
```
Also add `import { toast } from 'sonner'` to `StockFields.tsx`.

---

### WR-05: MoveStockSheet shows no validation message when quantity is 0 or empty

**File:** `src/components/MoveStockSheet.tsx:80-84`

**Issue:** When the user clears the quantity input, `Number('')` evaluates to `0`. `isQuantityValid` becomes `false` and the submit button is correctly disabled, but no error message is rendered for the `quantity < 1` case — only for the `quantity > maxQty` case (lines 82-84). The user sees the button go grey with no explanation.

**Fix:**
```tsx
{quantity < 1 && (
  <p className="text-sm text-red-500">Quantity must be at least 1</p>
)}
{quantity > maxQty && (
  <p className="text-sm text-red-500">Cannot exceed {maxQty}</p>
)}
```

---

### WR-06: deleteCatalogEntry: count check is outside the delete transaction (TOCTOU)

**File:** `src/lib/stockOps.ts:111-123`

**Issue:** `activeCount` is fetched (lines 112-116) and then the delete happens inside a separate transaction (lines 120-122). A concurrent write that creates a new active stock entry between the count and the delete would allow the catalog to be deleted with orphaned stock. While simultaneous IndexedDB writes from one tab are extremely unlikely (PWA, single user), the safe pattern is to include both the guard check and the delete in the same transaction.

**Fix:**
```ts
export async function deleteCatalogEntry(catalogId: number): Promise<void> {
  await db.transaction('rw', db.medicine_catalog, db.medicines, async () => {
    const activeCount = await db.medicines
      .where('catalogId')
      .equals(catalogId)
      .filter(m => m.deletedAt === null)
      .count()
    if (activeCount > 0) {
      throw new Error('Cannot delete catalog with active stock entries')
    }
    await db.medicine_catalog.delete(catalogId)
  })
}
```

---

### WR-07: `any` usage in DB upgrade functions violates project "No any" rule

**File:** `src/lib/db.ts:102, 117, 205`

**Issue:** Three upgrade callbacks use `(m: any)` or iterate over `(medicines: any[])`. CLAUDE.md states: "TypeScript strict mode is on. No `any`." The migration code predates strict typing, but the pattern is still present in the shipped file.

**Fix — use a typed upgrade shape or `unknown` with a guard:**
```ts
// Line 102
tx.table('medicines').toCollection().modify((m: Record<string, unknown>) => {
  m.deletedAt = null
  m.catalogId = 0
})

// Line 117
return tx.table('medicines').toCollection().toArray().then((medicines: Record<string, unknown>[]) => {
  // Use (med as Record<string, unknown>) for property access
})

// Line 205
tx.table('medicines').toCollection().modify((m: Record<string, unknown>) => {
  m.packCount = null
})
```

---

## Info

### IN-01: NULL_SENTINEL constant duplicated across three component files

**Files:** `src/components/StockFields.tsx:25`, `src/components/MoveStockSheet.tsx:22`, `src/components/CatalogFields.tsx:22`

**Issue:** `const NULL_SENTINEL = '__NULL__'` is copy-pasted identically in all three files. A mismatch in any one copy (e.g., a future rename) would silently break sentinel detection only in that dropdown.

**Fix:** Extract to a shared constants module:
```ts
// src/lib/constants.ts
export const NULL_SENTINEL = '__NULL__'
```
Then import it in each component file.

---

### IN-02: Dual React import statements in MedicineDetail

**File:** `src/routes/medicines/[id].tsx:1, 4`

**Issue:** `useState` and `useMemo` are imported in two separate statements:
```ts
import { useState } from 'react'       // line 1
import { useMemo } from 'react'        // line 4
```
These should be merged into one import.

**Fix:**
```ts
import { useState, useMemo } from 'react'
```

---

### IN-03: makeStock test helper omits packCount (incomplete Medicine fixture)

**File:** `src/lib/aggregation.test.ts:15-31`

**Issue:** `makeStock()` does not include a `packCount` field in its return value. The `Medicine` type declares `packCount: number | null`, so fixtures are technically incomplete TypeScript objects. Tests that assert on `packCount`-sensitive logic (e.g., the G-05-2 tests at lines 168-181) work because `aggregation.ts` uses `packCount ?? 1`, and `undefined ?? 1` equals `1`. However, the missing field makes it harder to detect future changes where `undefined` and `null` are distinguished.

**Fix:** Add `packCount: null` to the base fixture:
```ts
function makeStock(overrides: Partial<Medicine> = {}): Medicine {
  return {
    id: 1,
    catalogId: 1,
    location: null,
    expiryDate: '2030-12-31',
    openedDate: null,
    pao: null,
    quantity: 10,
    packCount: null,       // add this
    quantityUnit: 'tablets',
    notes: null,
    manualStatus: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    deletedAt: null,
    ...overrides,
  }
}
```

---

_Reviewed: 2026-08-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
