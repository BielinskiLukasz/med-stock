---
status: complete
phase: 05-stock-catalog-management
source: 05-06-PLAN.md checkpoint:human-verify
started: 2026-08-01T00:00:00Z
updated: 2026-08-31T18:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Add flow — select existing catalog
expected: Navigate to /medicines/new. Type a name that matches an existing catalog entry. Select it from the dropdown. Stock form opens pre-filled with the catalog name. Fill in expiry date and submit. App navigates to the catalog's detail view showing the new stock entry.
result: pass
notes: "3 issues raised during this test — recorded as gaps G-05-1, G-05-2, G-05-3"

### 2. Add flow — create new catalog
expected: Navigate to /medicines/new. Type a medicine name that has no match in the catalog. A "Create [name]" option appears. Click it. Step 2 opens with the name pre-filled. Fill in category/form. Click "Next: Add Stock". Step 3 opens with the new catalog's name shown. Fill in expiry date and submit. App navigates to the new catalog's detail view.
result: pass

### 3. List view — catalog aggregates and filters
expected: The medicine list shows catalog cards with aggregated status (worst-case across stock entries) and total quantity. Category filter, location filter (match-any: catalog appears if ANY stock entry is at the selected location), and status filter all work correctly. Sort by name, expiry, category, and status all work.
result: pass
notes: "G-05-9 fix confirmed — list-level filter works. New issue found: detail view does not filter stock entries (recorded as G-05-10)"

### 4. Catalog edit
expected: Open a catalog's detail view. Click the pencil icon next to the catalog name. A bottom sheet opens with name, category, form, and notes pre-filled. Edit the name. Save. The catalog header on the detail view updates immediately. History is not recorded for catalog edits (catalog is shared metadata, not a stock entry).
result: pass

### 5. Stock entry edit
expected: On a detail view, click the pencil icon on a stock row. A bottom sheet opens pre-filled with quantity, expiry date, location, PAO, and notes for that entry. Edit a field (e.g. change quantity). Click "Update stock". Sheet closes, stock row updates, a history entry is recorded.
result: pass

### 6. Open box
expected: Find a stock entry with quantity ≥ 2. Click "Open box". No sheet or dialog appears — it fires immediately. The original entry's quantity decrements by 1. A new entry appears at the same location with quantity=1 and Opened date set to today. Both changes are visible in the stock list without refresh.
result: pass
notes: "confirms G-05-3 — open box operates on unit quantity (tablets), user expects a dialog with multiplier/box concept"

### 7. Move/Split
expected: Click "Move/Split" on a stock entry. A bottom sheet opens with a quantity input (max = available qty) and a location picker. Enter a quantity less than the full amount. Select a different location. Click "Move N units". The original entry decrements by N. A new entry appears at the target location with quantity=N. Both are visible.
result: pass

### 8. Delete stock entry — goes to Trash
expected: Click "Delete" on a stock entry. An alert dialog asks for confirmation. Click "Move to Trash". The entry disappears from the detail view. App navigates to /medicines. In the Trash screen, the deleted entry appears with the correct catalog name.
result: pass

### 9. Trash "View" link navigates correctly
expected: In the Trash screen, click "View" on a deleted stock entry. App navigates to /medicines/:catalogId (the catalog detail view), not to a 404 or the wrong page. The catalog detail view loads showing its remaining active stock entries.
result: pass

### 10. Form validation — required fields
expected: Open the Add flow or an edit sheet. Clear the required field (expiry date for stock, name for catalog). Try to submit. Validation errors appear inline under the relevant field. The form does not submit.
result: pass

## Summary

total: 10
passed: 10
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-05-1
  truth: "Providing an opened date in the Add Stock form should mark the entry as opened"
  status: resolved
  reason: "User reported: not opened even if I provide opened date in form, need to click open box"
  severity: major
  test: 1
  root_cause: "openedDate IS saved correctly and status IS set to Opened — but the 'Open box' button in [id].tsx line 241 has no guard for stock.openedDate !== null, so it stays visible even on already-opened entries, making the user think the form had no effect"
  artifacts:
    - path: "src/routes/medicines/[id].tsx"
      issue: "line 241: button guard checks only quantity > 1, missing && !stock.openedDate condition"
  missing:
    - "Add !stock.openedDate to Open box button visibility guard"

- gap_id: G-05-2
  truth: "The stock Add form should allow entering number of boxes (packs) in addition to quantity per box"
  status: resolved
  reason: "User reported: we have quantity where I can put number of tablets in the box but I dont see to field to provide number of boxes (entire medicine box)"
  severity: major
  test: 1
  root_cause: "Medicine schema has only quantity (units per pack) and quantityUnit — no packCount field exists anywhere in db.ts, StockFields.tsx, or stockSchema"
  artifacts:
    - path: "src/lib/db.ts"
      issue: "Medicine interface has no packCount field"
    - path: "src/components/StockFields.tsx"
      issue: "lines 242-311: single quantity section, no box/pack count input"
  missing:
    - "New packCount: number | null field via db.version(5) migration"
    - "Form field in StockFields.tsx and stockSchema update"
    - "addStockEntry / editStockEntry to persist packCount"
    - "computeCatalogAggregate and MedicineCardAggregate to show packCount × quantity totals"

- gap_id: G-05-3
  truth: "Open box should operate on the box/pack level, not the per-unit (tablet) level — needs a dialog with multiplier or box count so user can specify how many units are in one box"
  status: resolved
  reason: "User reported: 'opening' one unit like one tablet — should be separate window with multiplier/boxes concept; confirmed again in test 6"
  severity: major
  test: 1
  root_cause: "handleOpenBoxClick in [id].tsx hardcodes quantity: 1 for new entry and (stock.quantity - 1) decrement — no prompt and no packCount field to derive from. Shares root with G-05-2."
  artifacts:
    - path: "src/routes/medicines/[id].tsx"
      issue: "handleOpenBoxClick lines 115 and 130: both hardcoded to 1 unit"
  missing:
    - "Once G-05-2 packCount exists: Open box should decrement packCount by 1, create new entry with quantity=stock.quantity and packCount=1"
    - "Short-term: prompt asking 'Units per box?' before executing"

- gap_id: G-05-4
  truth: "Catalog aggregate status uses priority order: Expired > ExceededOpenPeriod > Opened > Active. Manual statuses (UsedUp, Disposed, Archived) excluded from worst-case or treated as resolved."
  status: resolved
  reason: "User reported: 'Expired' shows correctly as worst but 'ExceededOpenPeriod' is not ranked as second-worst. Priority order confirmed: Expired > ExceededOpenPeriod > Opened > Active."
  severity: major
  test: 3
  root_cause: "computeCatalogAggregate uses nearest-expiry-date proxy: picks whichever stock entry has soonest expiryDate, calls calculateStatus on that one. Drops entries with expiryDate: null (PAO-only), applies no priority ordering, lets manual statuses leak into aggregate."
  artifacts:
    - path: "src/lib/aggregation.ts"
      issue: "lines 9-18: nearest-expiry selection instead of priority-reduce over all entries"
    - path: "src/lib/aggregation.test.ts"
      issue: "tests only nearest-expiry contract — no PAO-only, manual-status, or priority-ordering coverage"
  missing:
    - "Rewrite computeCatalogAggregate: call calculateStatus() on every entry, filter out ManualStatus results, apply priority map {Expired:4, ExceededOpenPeriod:3, Opened:2, Active:1}, return highest"
    - "Update aggregation tests to cover new logic"

- gap_id: G-05-5
  truth: "Status filter is match-any: catalog appears if ANY stock entry matches the selected status (same logic as location filter)"
  status: resolved
  reason: "User reported: status filter only checks aggregated status, not individual stock entries like location filter does"
  severity: major
  test: 3
  root_cause: "src/routes/medicines/index.tsx lines 85-89: filter checks item.aggregateStatus (single value) instead of iterating all stock entries with calculateStatus()"
  artifacts:
    - path: "src/routes/medicines/index.tsx"
      issue: "lines 85-89: !selectedStatuses.includes(item.aggregateStatus) — should be match-any over stock entries"
  missing:
    - "Replace aggregate check with item.stockEntries.some(e => selectedStatuses.includes(calculateStatus(e)))"
    - "Import calculateStatus directly in index.tsx"

- gap_id: G-05-9
  truth: "Status badge on catalog card must reflect worst-case aggregateStatus (priority order: Expired > ExceededOpenPeriod > Opened > Active) — same value used by the filter"
  status: resolved
  resolved_by: 05-12-PLAN.md
  resolved_at: 2026-08-26
  reason: "User reported: order pass, filter still does not work (only filtering aggregated status). Root: G-05-5 filter fix is correct (.some() match-any at index.tsx:88), but MedicineCardAggregate badge uses calculateStatus(nearestExpiryStock) instead of aggregateStatus from computeCatalogAggregate. For PAO-only entries (no expiryDate), nearestExpiryStock skips them — so badge shows better status than actual worst-case, making the filter appear broken."
  severity: major
  test: 3
  root_cause: "MedicineCardAggregate.tsx line 18 derives badge from calculateStatus(nearestExpiryStock) — ignores the aggregateStatus prop already computed in index.tsx. Fix: pass aggregateStatus as a prop and render it directly instead of recalculating."
  artifacts:
    - path: "src/components/MedicineCardAggregate.tsx"
      issue: "line 18: badge = calculateStatus(nearestExpiryStock) — should use aggregateStatus prop"
    - path: "src/routes/medicines/index.tsx"
      issue: "line 202-206: passes nearestExpiryStock to card but not aggregateStatus"
  missing:
    - "Add aggregateStatus: MedicineStatus prop to MedicineCardAggregateProps"
    - "Replace line 18 with: const status = aggregateStatus"
    - "Pass aggregateStatus={item.aggregateStatus} in index.tsx render (line ~205)"

- gap_id: G-05-6
  truth: "Editing a stock entry via the edit sheet records a history entry for the change"
  status: resolved
  reason: "User reported: stock changes but no history entry is recorded after editing a stock entry"
  severity: major
  test: 5
  root_cause: "History IS written correctly by editStockEntry → updateMedicineWithHistory. The ChangeHistory component exists and is correct but is never rendered in the catalog detail view [id].tsx — the JSX has no <ChangeHistory /> anywhere."
  artifacts:
    - path: "src/routes/medicines/[id].tsx"
      issue: "JSX contains no ChangeHistory component — history is written but never displayed"
    - path: "src/components/ChangeHistory.tsx"
      issue: "component is correct (accepts medicineId: number) but unused in detail view"
  missing:
    - "Add <ChangeHistory medicineId={stock.id} /> inside each stock entry card in [id].tsx"

- gap_id: G-05-7
  truth: "Move/Split sheet pre-fills the location picker with the current stock entry's location"
  status: resolved
  reason: "User reported: location picker defaults to 'Other' instead of the entry's current location"
  severity: minor
  test: 7
  root_cause: "MoveStockSheet.tsx line 33: useState<string | null>(null) — ignores stock.location prop. Also missing useEffect reset when sheet reopens for a different entry."
  artifacts:
    - path: "src/components/MoveStockSheet.tsx"
      issue: "line 33: useState(null) should be useState(stock.location); missing useEffect reset on [open, stock]"
  missing:
    - "Change initial state to useState(stock.location)"
    - "Add useEffect reset: if (open) { setTargetLocation(stock.location); setQuantity(1) }"
    - "Import useEffect (currently only useState is imported)"

- gap_id: G-05-8
  truth: "There is a way to delete an entire catalog entry (medicine identity) from the UI"
  status: resolved
  reason: "User asked 'how to delete entire medicine (catalog)?' — no delete catalog action exists in the UI"
  severity: major
  test: 10
  root_cause: "Feature entirely absent — no deleteCatalogEntry function exists in any lib module; catalog detail view [id].tsx has only a pencil-icon edit button, no delete affordance"
  artifacts:
    - path: "src/routes/medicines/[id].tsx"
      issue: "lines 178-188: catalog header renders only edit button, no delete"
    - path: "src/lib/"
      issue: "no deleteCatalogEntry function anywhere"
  missing:
    - "New deleteCatalogEntry(catalogId) in stockOps.ts or catalogOps.ts — guard: block if active stock exists, wrapped in db.transaction"
    - "Trash2 delete button in catalog header in [id].tsx"
    - "AlertDialog with guard message + handleCatalogDeleteConfirm handler"
    - "Navigate to /medicines on success"

- gap_id: G-05-10
  truth: "Active list-view filters (location, status) carry into the catalog detail view, filtering which stock entries are displayed"
  status: resolved
  resolved_by: 05-13-PLAN.md
  resolved_at: 2026-08-31
  reason: "User reported: filter works for catalogs, but when I open one then filter not reduce stocks for catalog"
  severity: major
  test: 3
  root_cause: "MedicineDetail ([id].tsx) never reads from the Zustand UIStore. Its useLiveQuery (lines 49–56) fetches every active stock entry for the catalog and the component renders all of them unconditionally. No import of useUIStore exists; selectedStatuses and selectedLocations are never read; no useMemo filter step exists between the raw DB results and the render loop (line 261). Status is derived at render time via calculateStatus() — not stored in IndexedDB — so it cannot be pushed into the Dexie query; both status and location filtering must be applied in a useMemo after the live query resolves."
  artifacts:
    - path: "src/routes/medicines/[id].tsx"
      issue: "No import of useUIStore or useShallow. useLiveQuery (lines 49–56) applies only deletedAt===null guard. stockEntries flows to render loop at line 261 with no status or location filter. Existing useMemo (lines 65–72) only computes nearestExpiryStock."
    - path: "src/stores/uiStore.ts"
      issue: "selectedStatuses and selectedLocations hold the active filter values (string[]). Never consumed by [id].tsx."
  missing:
    - "Import useUIStore and useShallow in [id].tsx"
    - "Read selectedStatuses and selectedLocations from store with useShallow"
    - "Add filteredStockEntries useMemo: per entry call calculateStatus() vs selectedStatuses (skip if empty), test stock.location vs selectedLocations (skip if empty)"
    - "Replace stockEntries in render loop (line 261) and empty-state guard (line 257) with filteredStockEntries"
    - "Keep nearestExpiryStock useMemo and catalog-delete guard on unfiltered stockEntries (header badge and delete protection must reflect all stock)"

## Deferred Follow-Ups

- test: 3
  idea: "Add 'Add Stock' button on catalog detail view ([id].tsx) so user can add a new stock entry directly from the catalog page without going back to the list"
  deferred_at: 2026-08-26

- test: 5
  idea: "Reduce margin/padding on change history rows to make stock cards more compact — history section takes too much vertical space"
  deferred_at: 2026-08-26
