---
status: testing
phase: 05-stock-catalog-management
source: 05-06-PLAN.md checkpoint:human-verify
started: 2026-08-01T00:00:00Z
updated: 2026-08-01T00:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Add flow — select existing catalog
expected: |
  Navigate to /medicines/new. Type a name that matches an existing catalog entry. Select it from the dropdown. Stock form opens pre-filled with the catalog name. Fill in expiry date and submit. App navigates to the catalog's detail view showing the new stock entry.
awaiting: user response

## Tests

### 1. Add flow — select existing catalog
expected: Navigate to /medicines/new. Type a name that matches an existing catalog entry. Select it from the dropdown. Stock form opens pre-filled with the catalog name. Fill in expiry date and submit. App navigates to the catalog's detail view showing the new stock entry.
result: pending

### 2. Add flow — create new catalog
expected: Navigate to /medicines/new. Type a medicine name that has no match in the catalog. A "Create [name]" option appears. Click it. Step 2 opens with the name pre-filled. Fill in category/form. Click "Next: Add Stock". Step 3 opens with the new catalog's name shown. Fill in expiry date and submit. App navigates to the new catalog's detail view.
result: pending

### 3. List view — catalog aggregates and filters
expected: The medicine list shows catalog cards with aggregated status (worst-case across stock entries) and total quantity. Category filter, location filter (match-any: catalog appears if ANY stock entry is at the selected location), and status filter all work correctly. Sort by name, expiry, category, and status all work.
result: pending

### 4. Catalog edit
expected: Open a catalog's detail view. Click the pencil icon next to the catalog name. A bottom sheet opens with name, category, form, and notes pre-filled. Edit the name. Save. The catalog header on the detail view updates immediately. History is not recorded for catalog edits (catalog is shared metadata, not a stock entry).
result: pending

### 5. Stock entry edit
expected: On a detail view, click the pencil icon on a stock row. A bottom sheet opens pre-filled with quantity, expiry date, location, PAO, and notes for that entry. Edit a field (e.g. change quantity). Click "Update stock". Sheet closes, stock row updates, a history entry is recorded.
result: pending

### 6. Open box
expected: Find a stock entry with quantity ≥ 2. Click "Open box". No sheet or dialog appears — it fires immediately. The original entry's quantity decrements by 1. A new entry appears at the same location with quantity=1 and Opened date set to today. Both changes are visible in the stock list without refresh.
result: pending

### 7. Move/Split
expected: Click "Move/Split" on a stock entry. A bottom sheet opens with a quantity input (max = available qty) and a location picker. Enter a quantity less than the full amount. Select a different location. Click "Move N units". The original entry decrements by N. A new entry appears at the target location with quantity=N. Both are visible.
result: pending

### 8. Delete stock entry — goes to Trash
expected: Click "Delete" on a stock entry. An alert dialog asks for confirmation. Click "Move to Trash". The entry disappears from the detail view. App navigates to /medicines. In the Trash screen, the deleted entry appears with the correct catalog name.
result: pending

### 9. Trash "View" link navigates correctly
expected: In the Trash screen, click "View" on a deleted stock entry. App navigates to /medicines/:catalogId (the catalog detail view), not to a 404 or the wrong page. The catalog detail view loads showing its remaining active stock entries.
result: pending

### 10. Form validation — required fields
expected: Open the Add flow or an edit sheet. Clear the required field (expiry date for stock, name for catalog). Try to submit. Validation errors appear inline under the relevant field. The form does not submit.
result: pending

## Summary

total: 10
passed: 0
issues: 0
pending: 10
skipped: 0
blocked: 0

## Gaps

[none yet — to be filled after testing]
