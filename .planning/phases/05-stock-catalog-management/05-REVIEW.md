---
phase: 05-stock-catalog-management
reviewed: 2026-08-26T00:00:00Z
depth: standard
files_reviewed: 40
files_reviewed_list:
  - .claude/hooks/lib/cursor-workspace.js
  - .claude/hooks/lib/injection-patterns.js
  - .claude/hooks/lib/isolation-deny-reason.js
  - .claude/hooks/lib/isolation-sentinel.js
  - .claude/hooks/managed-hooks-registry.cjs
  - .claude/hooks/package.json
  - .claude/scripts/changeset/lint.cjs
  - .claude/scripts/changeset/serialize.cjs
  - .claude/scripts/gen-capability-registry.cjs
  - .claude/scripts/gen-loop-host-contract.cjs
  - .claude/scripts/lib/alias-drift-families.cjs
  - .claude/scripts/lib/drift-scan.cjs
  - CLAUDE.md
  - README.md
  - src/components/CatalogAutocomplete.tsx
  - src/components/CatalogEditSheet.tsx
  - src/components/CatalogFields.tsx
  - src/components/MedicineCard.tsx
  - src/components/MedicineCardAggregate.tsx
  - src/components/MedicineForm.tsx
  - src/components/MoveStockSheet.tsx
  - src/components/StockEditSheet.tsx
  - src/components/StockFields.test.ts
  - src/components/StockFields.tsx
  - src/lib/aggregation.test.ts
  - src/lib/aggregation.ts
  - src/lib/csvOps.test.ts
  - src/lib/csvOps.ts
  - src/lib/dataOps.ts
  - src/lib/db.test.ts
  - src/lib/db.ts
  - src/lib/expiry.test.ts
  - src/lib/historyOps.test.ts
  - src/lib/historyOps.ts
  - src/lib/stockOps.test.ts
  - src/lib/stockOps.ts
  - src/routes/medicines/[id].edit.tsx
  - src/routes/medicines/[id].tsx
  - src/routes/medicines/index.tsx
  - src/routes/medicines/new.tsx
  - src/routes/trash/index.tsx
  - src/stores/uiStore.ts
findings:
  critical: 5
  warning: 4
  info: 0
  total: 9
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-08-26
**Depth:** standard
**Files Reviewed:** 40
**Status:** issues_found

## Summary

Reviewed 40 changed source files covering the stock/catalog management phase. The `.claude/hooks/` and `.claude/scripts/` files are infrastructure-layer code (GSD tooling) and are well-structured with no application-level defects. All application-logic defects are concentrated in the React/Dexie layer.

Five blockers were found. The two most critical are: (1) a TypeScript compilation error in `csvOps.ts` that would prevent `npm run build` from succeeding, and (2) a silent data-loss path in `dataOps.ts` where the `BackupSchema` strips `packCount` during JSON import, corrupting aggregate totals for any multi-box medicine entry after a round-trip. The remaining three blockers are behavioral correctness failures: a double-toast bug in Open Box, an orphan-record bug in catalog deletion, and a hardcoded invalid foreign key in CSV imports.

---

## Critical Issues

### CR-01: `csvOps.ts` — `packCount` absent from pushed medicine object (TypeScript build error)

**File:** `src/lib/csvOps.ts:80-94`

**Issue:** `mergeCSVRowsToMedicines` declares its return type as `{ medicines: Omit<Medicine, 'id'>[] }`. The `Medicine` interface defines `packCount: number | null` as a required field (not optional). The object literal pushed into `medicines` at line 80 omits `packCount` entirely. TypeScript strict mode must reject this with "Property 'packCount' is missing in type '...' but required in type 'Omit<Medicine, 'id'>'". `npm run build` (which runs `tsc -b` first) cannot succeed with this error present.

**Fix:**
```typescript
medicines.push({
  catalogId: 1,  // TODO Phase 5: derive from CSV name/category
  location: locationVal || null,
  expiryDate: expiryDateVal || null,
  openedDate: openedDateVal || null,
  pao: null,
  quantity,
  quantityUnit: quantityUnitVal || null,
  packCount: null,  // CSV cannot represent pack count — always null for imported rows
  notes: notesVal || null,
  manualStatus: null,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
})
```

---

### CR-02: `dataOps.ts` — `BackupSchema.medicines` missing `packCount`; silent data loss on import

**File:** `src/lib/dataOps.ts:10-68`

**Issue:** `BackupSchema`'s medicines array schema does not declare a `packCount` field. Zod `z.object()` strips unknown keys by default. When a user exports their data (which includes `packCount` for each medicine row) and later imports the same file, Zod silently drops every `packCount` value. Medicines are then stored without `packCount`, so `stock.packCount` evaluates as `undefined`. `computeCatalogAggregate` uses `packCount ?? 1`, so `undefined ?? 1 = 1` — a medicine with `packCount: 3, quantity: 30` (contributing 90 to totalQty) is silently imported as contributing 30. Aggregate totals are wrong after any import round-trip.

**Fix:** Add `packCount` to the Zod medicines schema:
```typescript
medicines: z.array(
  z.object({
    id: z.number(),
    catalogId: z.number().optional().default(0),
    location: z.string().nullable(),
    expiryDate: z.string().nullable(),
    openedDate: z.string().nullable(),
    pao: z.object({ value: z.number(), unit: z.enum(['days', 'weeks', 'months']) }).nullable(),
    quantity: z.number().nullable(),
    quantityUnit: z.string().nullable(),
    packCount: z.number().nullable().optional().default(null),  // add this
    notes: z.string().nullable(),
    manualStatus: z.enum(['UsedUp', 'Disposed', 'Archived']).nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: z.string().nullable(),
  })
),
```

---

### CR-03: `[id].tsx` — `toast.success('Box opened')` fires unconditionally after `toast.error` abort

**File:** `src/routes/medicines/[id].tsx:127-188`

**Issue:** In `handleOpenBoxClick`, the pack-level path contains an early-return guard:

```typescript
await db.transaction('rw', db.medicines, db.history, async () => {
  if (stock.packCount && stock.packCount > 1) {
    if (!stock.quantity) {
      toast.error('Cannot open box: quantity not set.')
      return  // returns from the transaction callback — does NOT throw
    }
    // ... DB writes ...
  }
})
toast.success('Box opened')  // executes unconditionally, even after the early return
```

When `stock.packCount > 1` and `stock.quantity` is falsy (null/0), `toast.error()` fires and the callback returns without throwing. The transaction commits cleanly (no DB changes). Control then reaches `toast.success('Box opened')` on line 188. The user sees both an error toast and a success toast simultaneously.

**Fix:** Throw an `Error` instead of calling `toast.error` inside the transaction, and catch it outside:
```typescript
async function handleOpenBoxClick(stock: Medicine) {
  if (!catalog) return
  try {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()
    await db.transaction('rw', db.medicines, db.history, async () => {
      if (stock.packCount && stock.packCount > 1) {
        if (!stock.quantity) {
          throw new Error('Cannot open box: quantity not set.')
        }
        // ... rest of pack-level path ...
      } else {
        // ... unit-level path ...
      }
    })
    toast.success('Box opened')
  } catch (err) {
    console.error('Failed to open box:', err)
    const msg = err instanceof Error ? err.message : 'Failed to open box. Please try again.'
    toast.error(msg)
  }
}
```

---

### CR-04: `stockOps.ts` — `deleteCatalogEntry` ignores soft-deleted stock; creates orphaned trash entries

**File:** `src/lib/stockOps.ts:107-118`

**Issue:** `deleteCatalogEntry` guards deletion with:
```typescript
const activeCount = await db.medicines
  .where('catalogId').equals(catalogId)
  .filter(m => m.deletedAt === null)
  .count()
if (activeCount > 0) throw new Error('Cannot delete catalog with active stock entries')
await db.medicine_catalog.delete(catalogId)
```

It only counts ACTIVE stock. If all stock entries for a catalog have been soft-deleted (moved to Trash), `activeCount === 0` and the catalog is deleted. The soft-deleted medicine rows in `db.medicines` still reference the now-deleted `catalogId`. In `TrashScreen`, `catalogs.find(c => c.id === med.catalogId)` returns `undefined`, so the entry shows as "Unknown Medicine". The "View" button links to `/medicines/<deletedCatalogId>`, which renders "Catalog not found." and blocks restore from the detail view.

**Fix:** Count ALL non-permanently-deleted stock (both active and soft-deleted):
```typescript
export async function deleteCatalogEntry(catalogId: number): Promise<void> {
  await db.transaction('rw', db.medicine_catalog, db.medicines, async () => {
    const totalCount = await db.medicines
      .where('catalogId')
      .equals(catalogId)
      .count()  // no filter — includes soft-deleted
    if (totalCount > 0) {
      throw new Error(
        'Cannot delete catalog: stock entries exist (including trashed). Permanently delete all stock entries first.'
      )
    }
    await db.medicine_catalog.delete(catalogId)
  })
}
```

The `[id].tsx` UI check at line 438 that gates the Delete button on `stockEntries.length === 0` also needs updating to account for trashed entries. Query all entries (including soft-deleted) for the disable check.

---

### CR-05: `csvOps.ts` — `catalogId: 1` hardcoded; invalid foreign key for most users

**File:** `src/lib/csvOps.ts:81`

**Issue:** Every medicine created by CSV import is assigned `catalogId: 1`. This is noted as a TODO but the code ships and runs in production. If the user's database does not have a catalog with `id = 1` (e.g., the first catalog was added then deleted and auto-increment is at 2+), every imported medicine has a broken foreign key. `useLiveQuery` queries for `where('catalogId').equals(catalogId)` will return nothing, the medicines will not appear in the medicine list, and history entries will be stranded.

**Fix:** The minimum safe fix until Phase 5 catalog-from-CSV is implemented is to fail the import with a user-visible error rather than silently creating invalid references:
```typescript
// In the caller (DataScreen or wherever CSV import is triggered):
// Before calling mergeCSVRowsToMedicines, require the user to select a target catalog:
// const targetCatalogId = selectedCatalog.id  // from a UI picker
// Then pass it through to mergeCSVRowsToMedicines instead of hardcoding 1.
```

At minimum, gate the CSV import UI behind a catalog-selection step, or surface a clear error in the UI explaining that CSV import requires a target catalog to be chosen.

---

## Warnings

### WR-01: `MedicineForm.tsx` — `handleAddLocation` swallows errors silently; no user feedback

**File:** `src/components/MedicineForm.tsx:96-100`

**Issue:** When adding a new location inline fails (duplicate name, DB error), the error handler only calls `console.error`:
```typescript
} catch (err) {
  console.error('Failed to add location:', err)
  // No toast here
}
```
The identical function in `StockFields.tsx:64-67` correctly calls `toast.error('Failed to add location. Please try again.')`. Users of the legacy `MedicineForm` route get no feedback on failure and cannot distinguish a DB error from a slow save.

**Fix:** Mirror the `StockFields.tsx` pattern:
```typescript
} catch (err) {
  console.error('Failed to add location:', err)
  toast.error('Failed to add location. Please try again.')
}
```

---

### WR-02: `csvOps.ts` — `skippedCount` always returns 0; never incremented

**File:** `src/lib/csvOps.ts:49`

**Issue:** `skippedCount` is declared and initialized to 0 at line 49. No code path in `mergeCSVRowsToMedicines` ever increments it. The function always returns `{ medicines: [...], skippedCount: 0 }`. Any caller showing the user "N rows skipped" would always display 0, misleading users when rows genuinely cannot be mapped.

**Fix:** Increment `skippedCount` when a row is unmappable (e.g., required fields missing) and skip that row:
```typescript
// After the getMappedValue calls — if expiryDate is required and empty:
if (!expiryDateVal) {
  skippedCount++
  continue
}
```
Or at minimum, remove the counter from the return type until the skipping logic is implemented, so callers don't rely on a perpetual zero.

---

### WR-03: `new.tsx` — No error feedback if catalog.get returns undefined post-creation

**File:** `src/routes/medicines/new.tsx:64-70`

**Issue:** After `db.medicine_catalog.add(...)` succeeds, the code fetches the new catalog with `db.medicine_catalog.get(newId)`. If this returns `undefined` (theoretically impossible but defensively worth handling), the code silently does nothing — no toast, no state update, the user is stuck on the create-catalog step with the form still submitted:
```typescript
const newCatalog = await db.medicine_catalog.get(newId)
if (newCatalog) {
  setSelectedCatalog(newCatalog)
  setStep('stock-form')
}
// If newCatalog is undefined, nothing happens — no error shown
```

**Fix:**
```typescript
const newCatalog = await db.medicine_catalog.get(newId)
if (newCatalog) {
  setSelectedCatalog(newCatalog)
  setStep('stock-form')
} else {
  toast.error('Failed to load new catalog. Please try again.')
}
```

---

### WR-04: `[id].edit.tsx` — No user feedback on save success or failure

**File:** `src/routes/medicines/[id].edit.tsx:20-41`

**Issue:** `handleSubmit` navigates away on success with no toast confirmation, and on error calls only `console.error` with no toast:
```typescript
} catch (err) {
  console.error('Failed to update medicine:', err)
  // User sees nothing — form stays populated, no error message
}
```
Every other save operation in this codebase shows a `toast.success` on success and `toast.error` on failure. This screen is inconsistent and leaves users unable to know whether their save worked (navigation is the only signal) or failed (no signal at all).

**Fix:**
```typescript
async function handleSubmit(data: MedicineFormData) {
  if (!medicine || !catalog) return
  try {
    await updateMedicineWithHistory(Number(id), medicine, {
      expiryDate: data.expiryDate,
      location: data.location ?? null,
      openedDate: data.openedDate ?? null,
      pao: data.paoValue && data.paoUnit
        ? { value: data.paoValue, unit: data.paoUnit }
        : null,
      quantity: data.quantity ?? null,
      quantityUnit: data.quantityUnit ?? null,
      notes: data.notes ?? null,
    }, catalog.name)
    toast.success('Medicine updated')
    void navigate(`/medicines/${id}`)
  } catch (err) {
    console.error('Failed to update medicine:', err)
    toast.error('Failed to save. Please try again.')
  }
}
```

---

_Reviewed: 2026-08-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
