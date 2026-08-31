---
phase: 05-stock-catalog-management
fixed_at: 2026-08-26T00:00:00Z
review_path: .planning/phases/05-stock-catalog-management/05-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Phase 05: Code Review Fix Report

**Fixed at:** 2026-08-26
**Source review:** .planning/phases/05-stock-catalog-management/05-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 9
- Fixed: 9
- Skipped: 0

## Fixed Issues

### CR-01: `csvOps.ts` — `packCount` absent from pushed medicine object (TypeScript build error)

**Files modified:** `src/lib/csvOps.ts`
**Commit:** ef9448a
**Applied fix:** Added `packCount: null` field to the object literal inside `medicines.push()` in `mergeCSVRowsToMedicines`. The field was required by the `Omit<Medicine, 'id'>` return type but was missing, causing a TypeScript strict-mode compilation error that blocked `npm run build`.

---

### CR-02: `dataOps.ts` — `BackupSchema.medicines` missing `packCount`; silent data loss on import

**Files modified:** `src/lib/dataOps.ts`
**Commit:** a8e132d
**Applied fix:** Added `packCount: z.number().nullable().optional().default(null)` to the Zod medicines schema in `BackupSchema`. Without this field, Zod's default `z.object()` behavior stripped `packCount` from every imported row, causing `computeCatalogAggregate` to compute wrong totals after a JSON export/import round-trip.

---

### CR-03: `[id].tsx` — `toast.success('Box opened')` fires unconditionally after `toast.error` abort

**Files modified:** `src/routes/medicines/[id].tsx`
**Commit:** 17e3aff
**Applied fix:** Changed the early-exit inside the Dexie transaction callback from `toast.error(...) + return` to `throw new Error('Cannot open box: quantity not set.')`. The thrown error is caught by the outer `catch` block, which now uses `err instanceof Error ? err.message : 'Failed to open box. Please try again.'` to show the specific message. This ensures only one toast fires and the success toast never appears after an error condition.

---

### CR-04: `stockOps.ts` — `deleteCatalogEntry` ignores soft-deleted stock; creates orphaned trash entries

**Files modified:** `src/lib/stockOps.ts`, `src/routes/medicines/[id].tsx`
**Commit:** 523c3d7
**Applied fix:** In `stockOps.ts`, replaced the filtered `activeCount` query (which only checked `deletedAt === null`) with an unfiltered `.count()` that counts all stock entries including soft-deleted ones. Updated the error message to explain that trashed entries must be permanently deleted first. In `[id].tsx`, added a new `allStockCount` `useLiveQuery` that counts all entries (no `deletedAt` filter) and updated the catalog Delete button guard from `(stockEntries?.length ?? 0) === 0` to `(allStockCount ?? 1) === 0`, so the button is hidden when any stock — active or trashed — still references the catalog.

---

### CR-05: `csvOps.ts` — `catalogId: 1` hardcoded; invalid foreign key for most users

**Files modified:** `src/components/ImportCSVSection.tsx`
**Commit:** de5c524
**Applied fix:** Added a guard at the start of `handleCommit()` in `ImportCSVSection.tsx` that queries `db.medicine_catalog.get(1)` before proceeding. If no catalog with id=1 exists, it shows a clear error toast ("CSV import requires at least one medicine catalog. Please add a medicine first, then retry the import.") and aborts the import. This prevents silently creating medicine records with broken foreign keys. The underlying TODO (Phase 5 catalog-from-CSV) remains; this is the minimum safe guard.

---

### WR-01: `MedicineForm.tsx` — `handleAddLocation` swallows errors silently; no user feedback

**Files modified:** `src/components/MedicineForm.tsx`
**Commit:** 8e341e8
**Applied fix:** Added `import { toast } from 'sonner'` and added `toast.error('Failed to add location. Please try again.')` in the `handleAddLocation` catch block, mirroring the existing pattern in `StockFields.tsx`. Users now receive visible feedback when a location add fails due to a duplicate name or DB error.

---

### WR-02: `csvOps.ts` — `skippedCount` always returns 0; never incremented

**Files modified:** `src/lib/csvOps.ts`
**Commit:** 2c5cde4
**Applied fix:** Added a check after parsing all mapped values: if all fields (`location`, `expiryDate`, `openedDate`, `quantity`, `quantityUnit`, `notes`) are empty after column mapping, the row is treated as unmappable, `skippedCount` is incremented, and the row is skipped via `continue`. This prevents phantom "0 rows skipped" counts when empty rows or fully-unmapped rows are present in the CSV.

---

### WR-03: `new.tsx` — No error feedback if catalog.get returns undefined post-creation

**Files modified:** `src/routes/medicines/new.tsx`
**Commit:** 21d80c9
**Applied fix:** Added an `else` branch after `if (newCatalog)` that calls `toast.error('Failed to load new catalog. Please try again.')`. Previously, if `db.medicine_catalog.get(newId)` returned `undefined` (theoretically impossible but defensive), the user would be stuck on the create-catalog step with no feedback.

---

### WR-04: `[id].edit.tsx` — No user feedback on save success or failure

**Files modified:** `src/routes/medicines/[id].edit.tsx`
**Commit:** 81daa63
**Applied fix:** Added `import { toast } from 'sonner'`, added `toast.success('Medicine updated')` before `void navigate(...)` on the success path, and added `toast.error('Failed to save. Please try again.')` in the catch block. The edit screen now provides the same feedback pattern as all other save operations in the codebase.

---

_Fixed: 2026-08-26_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
_Verification ran in: main checkout (workflow.use_worktrees=false)_
