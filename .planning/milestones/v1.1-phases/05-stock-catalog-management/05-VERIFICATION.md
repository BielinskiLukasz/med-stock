---
phase: 05-stock-catalog-management
verified: 2026-08-29T00:00:00Z
status: passed
score: 10/10
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "Medicines list shows one aggregate row per catalog entry, with status derived from the nearest-expiry active stock entry; count badge shows total quantity"
    reason: "G-05-4 gap closure replaced nearest-expiry with priority-reduce — fixes missed ExceededOpenPeriod (no expiryDate entries). Algorithm is strictly correct and superior; ROADMAP SC4 wording was not updated after the fix."
    accepted_by: "lukasz.bielinski"
    accepted_at: "2026-08-29T00:00:00Z"
gaps:
  - truth: "Medicines list shows one aggregate row per catalog entry, with status derived from the nearest-expiry active stock entry; count badge shows total quantity"
    status: failed
    reason: "Implementation uses priority-reduce worst-case status across all active stock entries (computeCatalogAggregate), not the nearest-expiry stock entry's status. The deviation was intentional — gap closure G-05-4 (plan 05-08) explicitly replaced nearest-expiry with priority-reduce to fix an issue where ExceededOpenPeriod entries (no expiryDate) were missed. ROADMAP SC4 wording was not updated after the fix."
    artifacts:
      - path: "src/lib/aggregation.ts"
        issue: "computeCatalogAggregate iterates all active stocks and returns the worst-case AutoStatus via PRIORITY map — this is NOT nearest-expiry behaviour as ROADMAP SC4 specifies"
    missing:
      - "Either update ROADMAP SC4 wording to reflect the priority-reduce algorithm, or add an override entry accepting the G-05-4 improvement"
---

# Phase 5: Stock & Catalog Management — Verification Report

**Phase Goal:** Users can add stock entries linked to existing or newly-created catalog entries, view and edit both catalog and stock fields, split stock across locations, and see medicines aggregated by catalog in the main list and detail views.
**Verified:** 2026-08-29T00:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can search for existing catalog entry by name via autocomplete; matching is case-insensitive | VERIFIED | `CatalogAutocomplete.tsx` line 19: `cat.name.toLowerCase().includes(searchText.toLowerCase())`. Loads all catalogs via `useLiveQuery`, filters on typed text. |
| 2 | User can create new catalog entry inline when no autocomplete match exists | VERIFIED | `new.tsx` 3-step state machine. `CatalogAutocomplete` shows "Create [name]" button when `filtered.length === 0 && searchText.trim().length > 0`. Creates catalog in `db.medicine_catalog` then proceeds to stock form. |
| 3 | User can edit catalog entry's name, category, and form from medicine detail screen (affects all stock entries) | VERIFIED | `CatalogEditSheet.tsx` wired in `[id].tsx`. `handleCatalogEditSave` calls `db.medicine_catalog.update()`. All stock entries see the name change automatically via the catalogId join — no stock entry rows modified. |
| 4 | Medicines list shows one aggregate row per catalog entry, with status derived from nearest-expiry active stock entry; count badge shows total quantity | FAILED | `computeCatalogAggregate` in `aggregation.ts` uses priority-reduce (Expired > ExceededOpenPeriod > Opened > Active) across ALL active stocks, not the nearest-expiry stock's status. G-05-4 gap closure (plan 05-08) intentionally changed the algorithm. Total quantity IS shown (multiplied by packCount). ROADMAP SC4 wording not updated after the fix. |
| 5 | Detail screen lists all stock entries for one catalog entry, each showing quantity, expiryDate, location, and calculated status | VERIFIED | `[id].tsx` renders `filteredStockEntries` (active entries filtered by UI store). Each row shows: `{packCount} boxes × {quantity}` or `{quantity} {unit}`, location text, "Expires: {expiryDate}", `<StatusBadge status={stockStatus}>`. All four required fields present. |
| 6 | User can add stock entry linked to catalog via two-step add flow (catalog autocomplete → stock fields) | VERIFIED | `new.tsx`: step 1 = `CatalogAutocomplete` (search or create), step 2 = optional `CatalogFields` (new catalog only), step 3 = `StockFields`. `addStockEntry(catalogId, stockData, medicineName)` in `stockOps.ts` inserts with `catalogId` reference. |
| 7 | User can edit stock entry's quantity, expiryDate, location, PAO, and notes without affecting the catalog | VERIFIED | `StockEditSheet.tsx` wired via `handleStockEditSave` → `editStockEntry` → `updateMedicineWithHistory`. Only updates `db.medicines` table; `medicine_catalog` table untouched. |
| 8 | User can move N units from one stock entry to a different location, splitting into two stock entries | VERIFIED | `MoveStockSheet.tsx` + `moveStock` in `stockOps.ts`. Box mode (packCount > 1): decrements packCount, new entry gets packCount=packCountToMove. Unit mode: decrements quantity, new entry gets quantityToMove. Both wrapped in `db.transaction`. |
| 9 | Soft-deleted stock entries appear in Trash and can be restored with full history preserved | VERIFIED | `TrashScreen` queries `deletedAt !== null`. Restore button calls `restoreMedicine` → sets `deletedAt = null`, writes `action='restored'` history entry. Permanent delete writes history first then removes the row (D-38). |
| 10 | Adding, editing, moving, and deleting stock entries record history with catalogId context | VERIFIED | All mutations in `stockOps.ts` and `historyOps.ts` write a `HistoryEntry` with `medicineId` (links to stock entry → `catalogId` join) and `medicineName` (denormalized catalog name per D-36, D-38). History entries are never deleted; `ChangeHistory` component renders per-stock history inline on the detail screen. |

**Score:** 9/10 truths verified

---

### SC4 Gap — Intentional Algorithm Deviation (ROADMAP wording not updated)

SC4 states "status derived from the nearest-expiry active stock entry". The implementation uses `computeCatalogAggregate` (priority-reduce: returns worst-case `AutoStatus` across all active stock entries).

The deviation is **documented and intentional**: gap closure plan 05-08 (`gap_ids: [G-05-4]`) explicitly states:

> "The nearest-expiry approach misses ExceededOpenPeriod (which has no expiry date), lets manual statuses leak into the aggregate, and returns incorrect results when the nearest-expiry entry is not the most critical one."

The 05-08 PLAN frontmatter declares the correct behavior:
> "computeCatalogAggregate returns the worst-case AutoStatus using priority order: Expired(4) > ExceededOpenPeriod(3) > Opened(2) > Active(1)"

**This is a ROADMAP wording drift, not a functional gap.** The priority-reduce algorithm is strictly better for the stated user goal ("know if a medicine is valid"). To resolve without code changes, add an override:

```yaml
overrides:
  - must_have: "Medicines list shows one aggregate row per catalog entry, with status derived from the nearest-expiry active stock entry; count badge shows total quantity"
    reason: "G-05-4 gap closure replaced nearest-expiry with priority-reduce — fixes missed ExceededOpenPeriod (no expiryDate entries). Algorithm is strictly correct; ROADMAP SC4 wording was not updated after the fix."
    accepted_by: "lukasz.bielinski"
    accepted_at: "2026-08-29T00:00:00Z"
```

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/db.ts` | Schema v4 + v5 with packCount | VERIFIED | `db.version(4)` removes name/category from medicines index. `db.version(5)` adds packCount migration. Medicine interface has no name/category. |
| `src/lib/aggregation.ts` | computeCatalogAggregate | VERIFIED | Priority-reduce; excludes ManualStatus entries; totalQty multiplied by packCount. |
| `src/lib/stockOps.ts` | addStockEntry, editStockEntry, softDeleteStock, moveStock, deleteCatalogEntry | VERIFIED | All operations wrapped in `db.transaction`; history written atomically. |
| `src/lib/historyOps.ts` | updateMedicineWithHistory, softDeleteMedicine, restoreMedicine, permanentDeleteMedicine | VERIFIED | All write HistoryEntry with medicineName + diffMedicine changedFields. |
| `src/components/CatalogAutocomplete.tsx` | Case-insensitive autocomplete | VERIFIED | Filters via `toLowerCase().includes()`. Shows "Create [name]" when no match. |
| `src/components/CatalogEditSheet.tsx` | Catalog edit bottom sheet | VERIFIED | Pre-fills from catalog prop; resets on open; calls onSave callback. |
| `src/components/StockEditSheet.tsx` | Stock edit bottom sheet | VERIFIED | Pre-fills all stock fields including packCount; calls onSave with Partial<Medicine>. |
| `src/components/MoveStockSheet.tsx` | Move/split bottom sheet | VERIFIED | Box mode (packCount > 1) and unit mode. Prefills targetLocation from stock.location. |
| `src/components/CatalogFields.tsx` | Catalog form fields | VERIFIED | name, category, form (select), notes. Wired in new.tsx and CatalogEditSheet. |
| `src/components/StockFields.tsx` | Stock form fields incl. packCount | VERIFIED | packCount field added (G-05-2). Expiry, location, openedDate, pao, quantity, quantityUnit, packCount, notes. |
| `src/components/MedicineCardAggregate.tsx` | Aggregate list card | VERIFIED | Renders catalog.name, category, totalQuantity with unit, stockCount, StatusBadge. |
| `src/components/ChangeHistory.tsx` | Inline history per stock entry | VERIFIED | Queries db.history by medicineId; collapsible list rendered per-stock in detail view. |
| `src/routes/medicines/new.tsx` | 3-step add flow | VERIFIED | step: search → create-catalog → stock-form. Handles CatalogAutocomplete select and createClick. |
| `src/routes/medicines/[id].tsx` | Detail view (catalogId routing) | VERIFIED | Loads catalog + active stock by catalogId. filteredStockEntries via UIStore. CatalogEditSheet, StockEditSheet, MoveStockSheet, Open box, Delete all wired. |
| `src/routes/medicines/index.tsx` | List view catalog-first aggregation | VERIFIED | useLiveQuery for catalogs + activeStock; in-memory join + computeCatalogAggregate; MedicineCardAggregate per catalog. |
| `src/routes/trash/index.tsx` | Trash screen with restore | VERIFIED | Queries deletedAt !== null; shows catalogName via join; Restore and Delete Permanently buttons. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `CatalogAutocomplete` | `db.medicine_catalog` | `useLiveQuery(() => db.medicine_catalog.toArray())` | WIRED | All catalogs loaded on mount; case-insensitive filter in-memory |
| `new.tsx` | `stockOps.addStockEntry` | `handleStockSubmit → addStockEntry(selectedCatalog.id, ...)` | WIRED | catalogId passed from selectedCatalog.id |
| `[id].tsx` | `db.medicine_catalog` | `useLiveQuery(() => db.medicine_catalog.get(catalogId))` | WIRED | Loads catalog by catalogId from URL param |
| `[id].tsx` | `db.medicines` | `useLiveQuery(() => db.medicines.where('catalogId').equals(catalogId).filter(m => m.deletedAt === null).toArray())` | WIRED | Active stock entries for catalog |
| `[id].tsx CatalogEditSheet` | `db.medicine_catalog.update` | `handleCatalogEditSave → db.medicine_catalog.update(catalog.id, ...)` | WIRED | Direct Dexie update; no historyOps (catalog edits not tracked per design) |
| `[id].tsx StockEditSheet` | `stockOps.editStockEntry` | `handleStockEditSave → editStockEntry(id, before, changes, name)` | WIRED | Calls updateMedicineWithHistory |
| `[id].tsx MoveStockSheet` | `stockOps.moveStock` | `handleMoveSubmit → moveStock(id, qty, loc, stock, name, packCount)` | WIRED | Box and unit mode both routed |
| `[id].tsx Delete` | `stockOps.softDeleteStock` | `handleDeleteConfirm → softDeleteStock(id, stock, name)` | WIRED | Sets deletedAt; navigates to /medicines |
| `TrashScreen` | `historyOps.restoreMedicine` | `handleRestore → restoreMedicine(medicine, catalogName)` | WIRED | Sets deletedAt=null, writes restored history |
| `MedicineList` | `aggregation.computeCatalogAggregate` | `computeCatalogAggregate(catalog, stockForCatalog)` in useMemo | WIRED | Called per catalog in filtered array |
| `stockOps` | `historyOps` | All stock mutations call `addMedicineHistory`, `updateMedicineWithHistory`, or `softDeleteMedicine` | WIRED | Atomic via db.transaction |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `MedicineList` | `catalogs` | `useLiveQuery(() => db.medicine_catalog.toArray())` | Yes — live DB query | FLOWING |
| `MedicineList` | `activeStock` | `useLiveQuery(() => db.medicines.toCollection().filter(m => m.deletedAt === null).toArray())` | Yes — live DB query | FLOWING |
| `MedicineList` | `aggregateStatus` | `computeCatalogAggregate(catalog, stockForCatalog).status` | Yes — pure function over live data | FLOWING |
| `MedicineList` | `totalQuantity` | `computeCatalogAggregate(catalog, stockForCatalog).totalQty` | Yes — sum of packCount × quantity | FLOWING |
| `[id].tsx` | `catalog` | `useLiveQuery(() => db.medicine_catalog.get(catalogId))` | Yes — live DB query | FLOWING |
| `[id].tsx` | `stockEntries` | `useLiveQuery(() => db.medicines.where('catalogId').equals(catalogId).filter(...).toArray())` | Yes — live DB query | FLOWING |
| `[id].tsx` | `filteredStockEntries` | `useMemo(...)` over stockEntries with UIStore filter state | Yes — derived from live data | FLOWING |
| `TrashScreen` | `deletedMedicines` | `useLiveQuery(() => db.medicines.toCollection().filter(m => m.deletedAt !== null).toArray())` | Yes — live DB query | FLOWING |
| `CatalogAutocomplete` | `allCatalogs` | `useLiveQuery(() => db.medicine_catalog.toArray())` | Yes — live DB query | FLOWING |

---

### Behavioral Spot-Checks (Step 7b)

No runnable server or CLI entry point. Module-level spot-checks performed:

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| `addStockEntry` creates history | `stockOps.test.ts` test "creates a history entry with action=created" | PASS (verified from test run: 121/122 passed) | PASS |
| `moveStock` splits into two entries | `stockOps.test.ts` test "creates a new stock entry at the target location" | PASS | PASS |
| `computeCatalogAggregate` priority-reduce | `aggregation.test.ts` tests "priority: ExceededOpenPeriod wins over Opened and Active" + "Expired wins over ExceededOpenPeriod" | PASS | PASS |
| `restoreMedicine` preserves history | `historyOps.test.ts` test "sets deletedAt back to null" + "does NOT change manualStatus" | PASS | PASS |
| `filterStockEntries` AND-combined | `[id].test.tsx` tests "entry must pass both status AND location filters" | PASS | PASS |

---

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `aggregation.test.ts` | FLOW-01 | 13 | 0 | No | Value | PASS |
| `stockOps.test.ts` | STOCK-01..04 | 16 | 0 | No | Value | PASS |
| `historyOps.test.ts` | SC10 | 14 | 0 | No | Value | PASS |
| `[id].test.tsx` | SC5 / G-05-10 | 7 | 0 | No | Value | PASS |
| `medicines-list.test.ts` | FLOW-01 | 2/3 | 0 | No | Existence | WARNING |

**Test quality issue — medicines-list.test.ts structural test:**

Test: `MedicineList — component structure > medicines/index.tsx does not contain where(manualStatus) pattern`

- **Status:** FAILED (timeout at 5s)
- **Root cause:** `import('./index?t=' + Date.now())` — cache-busting query parameter causes dynamic import to hang in Vitest's jsdom environment
- **Assertion mismatch:** Test name claims to verify "no where(manualStatus)" structural pattern but body only asserts `typeof mod.MedicineList === 'function'` — this is an existence check, not a pattern check
- **Impact:** LOW — the underlying structural requirement (no manualStatus query in the list view) is verifiable by code inspection: `medicines/index.tsx` uses `db.medicines.toCollection().filter(m => m.deletedAt === null)`, not `where('manualStatus')`
- **Pre-existing:** acknowledged in 05-06-SUMMARY.md as "pre-existing flaky timeout"
- **Disabled tests on requirements:** 0 requirements have ONLY disabled tests
- **Circular patterns detected:** 0

**Overall test suite:** 121 passed, 1 failed (timeout) out of 122.

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CAT-01 | 05-05 | Autocomplete search for catalog by name | SATISFIED | `CatalogAutocomplete.tsx` case-insensitive filter |
| CAT-02 | 05-05 | Create catalog inline when no match | SATISFIED | `new.tsx` step 2 create-catalog; NOTE: REQUIREMENTS.md `[ ]` not updated |
| CAT-03 | 05-06 | Edit catalog from detail screen | SATISFIED | `CatalogEditSheet.tsx` + `db.medicine_catalog.update` |
| STOCK-01 | 05-04, 05-05 | Add stock entry linked to catalog | SATISFIED | `addStockEntry` in `stockOps.ts`; tests pass |
| STOCK-02 | 05-06 | Edit stock entry fields | SATISFIED | `StockEditSheet.tsx` + `editStockEntry`; tests pass |
| STOCK-03 | 05-06 | Move/split stock to different location | SATISFIED | `MoveStockSheet.tsx` + `moveStock`; tests pass |
| STOCK-04 | 05-06 | Soft-deleted entries appear in Trash with restore | SATISFIED | `TrashScreen` + `restoreMedicine`; tests pass |
| STOCK-05 | 05-13 | Detail view stock list respects UIStore filters | SATISFIED | `filteredStockEntries` useMemo in `[id].tsx` |
| FLOW-01 | 05-02, 05-03, 05-08 | Aggregate list row per catalog with status+qty | PARTIALLY SATISFIED | One row per catalog ✓; totalQty ✓; status algorithm = priority-reduce ≠ "nearest-expiry" literal |
| FLOW-02 | 05-01, 05-06 | Detail screen stock list with qty/expiry/location/status | SATISFIED | `[id].tsx` filteredStockEntries render; NOTE: REQUIREMENTS.md `[ ]` not updated |
| FLOW-03 | 05-05 | Add flow: autocomplete first → stock fields | SATISFIED | `new.tsx` 3-step flow; NOTE: REQUIREMENTS.md `[ ]` not updated |

**Orphaned requirements:** STOCK-05 was added to REQUIREMENTS.md post-UAT (G-05-10) and is not in the original ROADMAP requirements list. This is a requirements expansion, not an orphaned item.

---

### Decision Coverage Gate

No CONTEXT.md `<decisions>` block to check (not applicable for this phase's verifier run).

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `medicines-list.test.ts` line 9 | Dynamic import with cache-busting timestamp causes 5s timeout | WARNING | Test fails; underlying requirement is satisfied by code inspection |
| `medicines-list.test.ts` line 9 | Test name "does not contain where(manualStatus)" but body only checks function type | WARNING | Test assertion insufficient — doesn't verify the structural claim |

No TBD/FIXME/XXX debt markers found in any source file.
No placeholder/stub implementations found.
All `console.error` usages are in error-catch handlers (legitimate error logging).

---

### ROADMAP Tracking Inconsistencies (Informational)

These are documentation drift issues, not functional gaps:

1. `05-06-PLAN.md` is shown as `[ ]` (unchecked) in ROADMAP.md despite `05-06-SUMMARY.md` existing with `status: complete`. ROADMAP progress counter says "12/13 plans executed" — likely from before 05-06 was completed.
2. REQUIREMENTS.md shows `[ ]` for CAT-02, FLOW-02, and FLOW-03 despite all three being fully implemented.

---

### Human Verification Required

This phase is user-facing. The UAT file (`05-UAT.md`) shows all 10 test scenarios passed after gap closures. Human re-verification items below cover behaviors where automated tests give incomplete evidence:

#### 1. Catalog autocomplete — keyboard and mobile UX

**Test:** Navigate to `/medicines/new`. Focus the input. Type a partial medicine name. Verify the dropdown appears with matching entries. Press Escape. Verify dropdown closes.
**Expected:** Dropdown opens on focus, filters as you type (case-insensitive), closes on Escape and on selection.
**Why human:** Focus/blur timing, mobile keyboard behavior, and dropdown z-index stacking are not exercised by unit tests.

#### 2. Aggregate status badge on list view

**Test:** Add two stock entries for the same catalog — one with a far-future expiry (Active), one with an elapsed PAO but no expiry date (ExceededOpenPeriod). Check the list view card's status badge.
**Expected:** Status badge shows "ExceededOpenPeriod" (priority-reduce, not nearest-expiry Active).
**Why human:** This is the specific G-05-4 scenario. The unit tests prove the algorithm but not the rendered badge. Also confirms the SC4 deviation is user-visible.

#### 3. Move/Split sheet — box mode vs unit mode

**Test:** Create a stock entry with packCount=3, quantity=30. Open Move/Split. Verify the sheet shows "Boxes to move (max 3)" label with a unit hint ("= 30 units per box"). Move 1 box. Verify original becomes packCount=2 and a new entry appears with packCount=1, quantity=30 at the new location.
**Expected:** Box mode UI (not unit mode) appears when packCount > 1; split is pack-level.
**Why human:** UI rendering of box mode vs unit mode conditional logic requires visual confirmation.

---

### Gaps Summary

One gap blocks the `passed` verdict:

**SC4 — Aggregation algorithm wording mismatch:** ROADMAP SC4 specifies "status derived from the nearest-expiry active stock entry" but the implementation uses a priority-reduce algorithm (worst-case status across all active stocks). This change was the explicit and tested result of gap closure G-05-4 (plan 05-08), which fixed a genuine bug in the original nearest-expiry approach. The ROADMAP was not updated after the fix. The implementation is functionally correct and superior; the gap is a documentation drift.

**Resolution path:** Add the override shown above to the VERIFICATION.md frontmatter and re-run verification. No code changes needed.

---

_Verified: 2026-08-29T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
