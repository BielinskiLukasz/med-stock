---
phase: 05-stock-catalog-management
fixed_at: 2026-08-26T00:00:00Z
review_path: .planning/phases/05-stock-catalog-management/05-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 05: Code Review Fix Report

**Fixed at:** 2026-08-26
**Source review:** .planning/phases/05-stock-catalog-management/05-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 8 (1 Critical + 7 Warnings; Info findings excluded per fix_scope=critical_warning)
- Fixed: 8
- Skipped: 0

## Fixed Issues

### CR-01: Seeded "Other" location causes string "Other" to be stored in Medicine.location

**Files modified:** `src/lib/db.ts`, `src/components/StockFields.tsx`, `src/components/MoveStockSheet.tsx`
**Commit:** 3db3a7c
**Applied fix:** Removed the `{ name: 'Other', isDefault: true }` entry from `db.on('populate')`. Added `.filter(loc => loc.name !== 'Other')` before `.map()` in both the StockFields location dropdown and the MoveStockSheet location dropdown. The NULL_SENTINEL SelectItem already represents the null/"Other" location; the DB entry added ambiguity without value.

---

### WR-01: Open-box on multi-pack entry with null quantity creates a corrupt new entry

**Files modified:** `src/routes/medicines/[id].tsx`
**Commit:** 9264417
**Applied fix:** Added `&& (stock.quantity ?? 0) > 0` to the Open box button condition so it only renders when quantity is set. Also added a guard in the pack-level split handler: if `!stock.quantity`, returns early with `toast.error('Cannot open box: quantity not set.')` before attempting the split.

---

### WR-02: moveStock creates new stock entry without packCount (type violation)

**Files modified:** `src/lib/stockOps.ts`
**Commit:** 56f2700
**Applied fix:** Added `packCount: null` to the `db.medicines.add()` call in `moveStock`. The field was previously omitted entirely, storing `undefined` in violation of the `Medicine` type contract (`packCount: number | null`).

---

### WR-03: moveStock calls db.medicines.update() directly then calls updateMedicineWithHistory — double write

**Files modified:** `src/lib/stockOps.ts`
**Commit:** cacbcc8
**Applied fix:** Removed the redundant `await db.medicines.update(stockId, { quantity: newOriginalQty, updatedAt: now })` call (lines 73-76). `updateMedicineWithHistory` already performs the same DB write and records history. The direct write violated the CLAUDE.md invariant that all mutations go through historyOps.

---

### WR-04: handleAddLocation shows no user feedback on failure

**Files modified:** `src/components/StockFields.tsx`
**Commit:** 1a2a35f
**Applied fix:** Added `import { toast } from 'sonner'` and `toast.error('Failed to add location. Please try again.')` to the catch block in `handleAddLocation`, consistent with every other mutation in the codebase.

---

### WR-05: MoveStockSheet shows no validation message when quantity is 0 or empty

**Files modified:** `src/components/MoveStockSheet.tsx`
**Commit:** 4cddb06
**Applied fix:** Added a `{quantity < 1 && <p className="text-sm text-red-500">Quantity must be at least 1</p>}` block before the existing `quantity > maxQty` message so the user sees an explanation when the input is empty or zero.

---

### WR-06: deleteCatalogEntry: count check is outside the delete transaction (TOCTOU)

**Files modified:** `src/lib/stockOps.ts`
**Commit:** edc1c56
**Applied fix:** Moved the `activeCount` fetch inside the transaction, and added `db.medicines` to the transaction's table list (`'rw', db.medicine_catalog, db.medicines`). The guard check and the delete now execute atomically, eliminating the TOCTOU window.

---

### WR-07: `any` usage in DB upgrade functions violates project "No any" rule

**Files modified:** `src/lib/db.ts`
**Commit:** dded9bd
**Applied fix:** Replaced `(m: any)` with `(m: Record<string, unknown>)` in the v2 and v5 `.modify()` callbacks. Replaced `(medicines: any[])` with `(medicines: Record<string, unknown>[])` in the v3 upgrade and updated the internal map type accordingly. Added `as number` and `as string` casts at property access sites where TypeScript cannot infer the narrowed type. All three changes verified clean with `npx tsc --noEmit`.

---

## Skipped Issues

None.

---

_Fixed: 2026-08-26_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
_Verification: npx tsc --noEmit run in main checkout after each fix — all passed clean_
