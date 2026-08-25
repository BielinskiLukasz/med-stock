---
status: complete
phase: 05-stock-catalog-management
source: 05-06-PLAN.md checkpoint:human-verify
started: 2026-08-01T00:00:00Z
updated: 2026-08-25T12:00:00Z
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
result: issue
reported: "not worst-case status across all stock is displayed; status filter only checks aggregated status, not individual stock entries (unlike location filter which is match-any)"
severity: major

### 4. Catalog edit
expected: Open a catalog's detail view. Click the pencil icon next to the catalog name. A bottom sheet opens with name, category, form, and notes pre-filled. Edit the name. Save. The catalog header on the detail view updates immediately. History is not recorded for catalog edits (catalog is shared metadata, not a stock entry).
result: pass

### 5. Stock entry edit
expected: On a detail view, click the pencil icon on a stock row. A bottom sheet opens pre-filled with quantity, expiry date, location, PAO, and notes for that entry. Edit a field (e.g. change quantity). Click "Update stock". Sheet closes, stock row updates, a history entry is recorded.
result: issue
reported: "stock changes but no history entry is recorded after editing a stock entry"
severity: major

### 6. Open box
expected: Find a stock entry with quantity ≥ 2. Click "Open box". No sheet or dialog appears — it fires immediately. The original entry's quantity decrements by 1. A new entry appears at the same location with quantity=1 and Opened date set to today. Both changes are visible in the stock list without refresh.
result: pass
notes: "confirms G-05-3 — open box operates on unit quantity (tablets), user expects a dialog with multiplier/box concept"

### 7. Move/Split
expected: Click "Move/Split" on a stock entry. A bottom sheet opens with a quantity input (max = available qty) and a location picker. Enter a quantity less than the full amount. Select a different location. Click "Move N units". The original entry decrements by N. A new entry appears at the target location with quantity=N. Both are visible.
result: issue
reported: "works, but location picker defaults to 'Other' instead of pre-filling the current entry's location"
severity: minor

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
passed: 7
issues: 8
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-05-1
  truth: "Providing an opened date in the Add Stock form should mark the entry as opened"
  status: failed
  reason: "User reported: not opened even if I provide opened date in form, need to click open box"
  severity: major
  test: 1
  artifacts: []
  missing: []

- gap_id: G-05-2
  truth: "The stock Add form should allow entering number of boxes (packs) in addition to quantity per box"
  status: failed
  reason: "User reported: we have quantity where I can put number of tablets in the box but I dont see to field to provide number of boxes (entire medicine box)"
  severity: major
  test: 1
  artifacts: []
  missing: []

- gap_id: G-05-3
  truth: "Open box should operate on the box/pack level, not the per-unit (tablet) level — needs a dialog with multiplier or box count so user can specify how many units are in one box"
  status: failed
  reason: "User reported: 'opening' one unit like one tablet — should be separate window with multiplier/boxes concept; confirmed again in test 6"
  severity: major
  test: 1
  artifacts: []
  missing: []

- gap_id: G-05-4
  truth: "Catalog card shows worst-case status using the correct priority order: expired > exceeded_open_period > expiring_soon > valid > unknown"
  status: failed
  reason: "User reported: 'expired' correctly shows as worst, but 'exceeded_open_period' is not treated as second-worst — status priority order needs review/discussion"
  severity: major
  test: 3
  artifacts: []
  missing: []

- gap_id: G-05-5
  truth: "Status filter is match-any: catalog appears if ANY stock entry matches the selected status (same logic as location filter)"
  status: failed
  reason: "User reported: status filter only checks aggregated status, not individual stock entries like location filter does"
  severity: major
  test: 3
  artifacts: []
  missing: []

- gap_id: G-05-6
  truth: "Editing a stock entry via the edit sheet records a history entry for the change"
  status: failed
  reason: "User reported: stock changes but no history entry is recorded after editing a stock entry"
  severity: major
  test: 5
  artifacts: []
  missing: []

- gap_id: G-05-7
  truth: "Move/Split sheet pre-fills the location picker with the current stock entry's location"
  status: failed
  reason: "User reported: location picker defaults to 'Other' instead of the entry's current location"
  severity: minor
  test: 7
  artifacts: []
  missing: []

- gap_id: G-05-8
  truth: "There is a way to delete an entire catalog entry (medicine identity) from the UI"
  status: failed
  reason: "User asked 'how to delete entire medicine (catalog)?' — no delete catalog action exists in the UI"
  severity: major
  test: 10
  artifacts: []
  missing: []
