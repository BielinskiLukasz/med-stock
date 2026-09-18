---
phase: 08-full-location-management
reviewed: 2026-09-18T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - package.json
  - package-lock.json
  - src/components/FilterBottomSheet.tsx
  - src/components/MedicineForm.tsx
  - src/components/MoveStockSheet.tsx
  - src/components/SortableLocationList.tsx
  - src/components/StockFields.tsx
  - src/i18n/en.ts
  - src/i18n/pl.ts
  - src/i18n/types.ts
  - src/lib/dataOps.test.ts
  - src/lib/dataOps.ts
  - src/lib/db.test.ts
  - src/lib/db.ts
  - src/lib/locationOps.ts
  - src/routes/locations/index.tsx
findings:
  critical: 1
  warning: 4
  info: 1
  total: 6
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-09-18
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Reviewed the full-location-management phase: the new `locationOps.ts` module (add/rename/reassign-delete/hide/reorder), the `LocationsScreen` + `SortableLocationList` drag/keyboard reorder UI, the `db.ts` v6 migration, backup schema updates in `dataOps.ts`, and the i18n dictionaries. The core new module (`locationOps.ts`) and its test suite (`db.test.ts`) are well designed — the case-insensitive collision check, the active-only reference counting (`deletedAt === null` filtering, never `.equals(null)`), the atomic transactions, and the contiguous-reorder logic all match the documented invariants and are exercised by solid unit tests.

However, two call sites that predate/parallel this phase — `MedicineForm.tsx` and `StockFields.tsx` — create locations via a direct `db.locations.add()` call instead of the vetted `addCustomLocation()` from `locationOps.ts`. This reintroduces exactly the duplicate-name bug that `addCustomLocation()` and its tests were written to prevent, and it is reachable from the live Add/Edit Medicine flows. This is the headline finding below (CR-01). In addition, the bulk `db.medicines.modify()` calls inside `renameLocation`/`deleteLocationWithReassign` bypass the project's `historyOps.ts` audit-trail convention, silently changing stock location fields with no history entry (WR-01).

## Critical Issues

### CR-01: Quick-add-location flows bypass `addCustomLocation()`, allowing duplicate location names

**File:** `src/components/MedicineForm.tsx:100-115`, `src/components/StockFields.tsx:65-78`

**Issue:**
Both components implement their own `handleAddLocation()` that calls `db.locations.add()` directly:

```ts
// order: 999 sentinel — real order assignment on add is deferred to Plan 08-02 (D-13)
await db.locations.add({ name: trimmed, isDefault: false, hidden: false, order: 999 })
```

This completely bypasses `addCustomLocation()` in `src/lib/locationOps.ts`, which is the module this same phase built specifically to enforce the D-03 invariant: "reject a case-insensitive, trimmed collision with any other existing location" (verified by `db.test.ts` — `'rejects a name that collides case-insensitively with an existing location'`). Because `Location.name` is an indexed but non-unique Dexie field, `db.locations.add()` performs no uniqueness check at all.

Concretely: a user adding or editing a medicine (`MedicineForm.tsx` is still live — used by `src/routes/medicines/[id].edit.tsx`) can quick-add "pantry" even though "Pantry" already exists as a location. The result is two distinct `Location` rows that render identically in the UI (translated/displayed the same way), cannot be merged, and fragment location-based filtering, aggregation, and the Locations management screen — directly contradicting the guarantee `locationOps.test.ts`/`db.test.ts` assert elsewhere in this same phase.

The `order: 999` magic-number sentinel is also stale: the code comment says real order assignment was "deferred to Plan 08-02", but Plan 08-02+ delivered `addCustomLocation()`'s proper `max(order) + 1` logic — these two call sites were never migrated to use it, so the deferral was never closed out.

**Fix:** Replace both `handleAddLocation` implementations with a call to the vetted helper, and update the error branch to distinguish the duplicate case (as `LocationsScreen` already does):

```ts
import { addCustomLocation } from '@/lib/locationOps'

async function handleAddLocation() {
  const trimmed = newLocationInput.trim()
  if (!trimmed) return
  try {
    await addCustomLocation(trimmed)
    form.setValue('location', trimmed)
    setNewLocationInput('')
    setShowQuickAddLocation(false)
  } catch (err) {
    console.error('Failed to add location:', err)
    toast.error(t('toasts.locationFailed'))
  }
}
```

## Warnings

### WR-01: Location rename/reassign-delete mutate `db.medicines` without recording history

**File:** `src/lib/locationOps.ts:35`, `src/lib/locationOps.ts:61-65`

**Issue:** `CLAUDE.md` states: "all medicine mutations (update, soft-delete, restore, permanent-delete) go through this module [`historyOps.ts`] so every change is recorded atomically in `db.history`. Always use these instead of calling `db.medicines` directly." Both `renameLocation` and `deleteLocationWithReassign` mutate the `location` field on potentially many `Medicine` rows via `.modify()`, entirely outside `historyOps.ts`:

```ts
await db.medicines.where('location').equals(loc.name).modify({ location: trimmed })
...
await db.medicines.where('location').equals(loc.name).filter(m => m.deletedAt === null).modify({ location: reassignTo })
```

Because `db.history` is documented as an "immutable change log" that should reflect every change to a medicine, a bulk location rename or a delete-with-reassign silently changes stock entries' `location` with zero audit trail — the medicine's history view will not explain why its location changed.

**Fix:** Either accept this as a deliberate, documented exception (and note it explicitly in `db.ts`/`historyOps.ts` comments so it isn't mistaken for an oversight), or write one `db.history` entry per affected medicine (or a single batched entry per bulk operation) inside the same transaction, e.g.:
```ts
const affected = await db.medicines.where('location').equals(loc.name).filter(m => m.deletedAt === null).toArray()
await db.medicines.where('location').equals(loc.name).filter(m => m.deletedAt === null).modify({ location: reassignTo })
await db.history.bulkAdd(affected.map(m => ({
  medicineId: m.id, medicineName: /* catalog name */, action: 'updated',
  changedFields: [{ field: 'location', oldValue: m.location, newValue: reassignTo }],
  timestamp: now,
})))
```

### WR-02: `handleAddLocation` logic duplicated verbatim across two components

**File:** `src/components/MedicineForm.tsx:100-115`, `src/components/StockFields.tsx:65-78`

**Issue:** Beyond the correctness bug in CR-01, the two implementations are near-identical copy-paste (same state variables `showQuickAddLocation`/`newLocationInput`, same JSX quick-add block, same `handleAddLocation` body). This duplication is exactly what let the two call sites drift from `locationOps.addCustomLocation()` in the first place, and it will drift again on the next change.

**Fix:** Extract a shared `useQuickAddLocation()` hook (or a small `<QuickAddLocationField />` component) that wraps `addCustomLocation()` and the show/hide input state, and have both `MedicineForm` and `StockFields` consume it.

### WR-03: No in-flight guard on location reorder buttons/drag

**File:** `src/routes/locations/index.tsx:145-158`

**Issue:** `handleReorder`/`handleMove` read from the `locations` array captured via `useLiveQuery` and immediately call `reorderLocations(...)` without disabling the up/down buttons or drag handle while the write is in flight. `useLiveQuery` re-renders asynchronously after the Dexie write resolves, so two rapid clicks (or a click during an in-progress drag commit) can both compute their target index from the same stale `locations` snapshot and issue two overlapping `reorderLocations` calls, which can converge on a result different from what either single click intended (last-write-wins on ids that both calls touch).

**Fix:** Track a `isReordering` boolean (or disable all move/drag controls) for the duration of the `await reorderLocations(...)` call:
```ts
const [isReordering, setIsReordering] = useState(false)
async function handleReorder(oldIndex: number, newIndex: number) {
  if (!locations || isReordering) return
  setIsReordering(true)
  try {
    const reordered = [...locations]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    await reorderLocations(reordered.map((l) => l.id))
  } finally {
    setIsReordering(false)
  }
}
```

### WR-04: `MoveStockSheet` resets in-progress input on any `stock` reference change while open

**File:** `src/components/MoveStockSheet.tsx:46-52`

**Issue:**
```ts
useEffect(() => {
  if (open) {
    setTargetLocation(stock.location)
    setBoxes(1)
    setQuantity(1)
  }
}, [open, stock])
```
`stock` comes from a parent `useLiveQuery`, which produces a brand-new object reference on every DB change even when the underlying values are equal for this record, and definitely whenever the record itself changes (e.g., a different browser tab imports a backup, or another mutation touches this stock entry) while the sheet is open. Because the effect depends on the `stock` object identity (not just `open`), any such background update wipes out whatever the user had already typed into `boxes`/`quantity`/`targetLocation` without any indication why.

**Fix:** Gate the reset on the open transition only, e.g. track previous `open` value with a ref, or depend on `open` and `stock.id` rather than the whole `stock` object:
```ts
useEffect(() => {
  if (open) {
    setTargetLocation(stock.location)
    setBoxes(1)
    setQuantity(1)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [open, stock.id])
```

## Info

### IN-01: Dead translation keys `filter.byStatus` / `filter.byCreated`

**File:** `src/i18n/en.ts:228,229`, `src/i18n/pl.ts:228,229`, `src/i18n/types.ts:230,231`

**Issue:** `filter.byStatus` and `filter.byCreated` are defined in both language dictionaries and the `TranslationDict` type but are not referenced anywhere in `src/` (the actual UI uses `filter.byStatusLabel`/`filter.byCategoryLabel` etc.). Not introduced by this phase, but present in the reviewed files and worth trimming while the location-management i18n keys were being added alongside them.

**Fix:** Remove the two unused keys from `TranslationDict`, `en.ts`, and `pl.ts`, or wire them up if a "sort by status"/"sort by date added" control is actually planned.

---

_Reviewed: 2026-09-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
