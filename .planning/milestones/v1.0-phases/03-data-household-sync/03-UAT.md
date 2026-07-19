---
status: complete
phase: 03-data-household-sync
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md]
started: 2026-07-15T00:00:00Z
updated: 2026-07-15T00:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

status: complete
all_tests_done: true
passed: 10
issues: 1
decisions: 2

## Tests

### 1. Data Tab in Navigation
expected: Open the app. The bottom navigation bar shows 5 tabs: Medicines, Dashboard, Trash, Locations, Data. Tapping "Data" navigates to the Data screen.
result: pass

### 2. Data Screen Layout
expected: On the Data screen, you see 3 distinct section cards arranged vertically, each with a header: "Export backup", "Import backup", and "Sync with household". Scrolling reveals all 3 sections without overlap from the tab bar.
result: pass

### 3. Sync With Household Instructions
expected: In the "Sync with household" section, there are 4 numbered instruction steps (no button — text only) explaining the manual export → shared folder → import workflow. A note paragraph follows below the steps.
result: pass

### 4. Export Backup — Downloads a File
expected: In the "Export backup" section, tap the Export button. The browser/OS triggers a file download. The downloaded file is named medstock-backup-YYYY-MM-DD.json (today's date). No error appears.
result: pass

### 5. Import JSON — Confirmation Dialog Shows Real Counts
expected: In the "Import backup" section, select a valid medstock JSON backup file. Before replacing anything, a confirmation dialog appears that shows the ACTUAL number of medicines and locations currently in your DB (e.g. "This will replace all 12 medicines, 3 locations..."). You must confirm before anything changes.
result: pass

### 6. Import JSON — Successful Import
expected: After confirming the import dialog, the DB is replaced with the file's contents. A toast appears with the message "Imported: N medicines, M locations" (real numbers from the imported file). The app stays on the Data screen.
result: pass

### 7. Import JSON — Rejects Invalid File
expected: In the "Import backup" section, select a file that is NOT a valid medstock backup (e.g. a random JSON, a CSV, or a text file). An error toast appears (e.g. "Failed to import: ..."). The DB is NOT modified — all your existing medicines are still there.
result: pass

### 8. CSV Import — Column Mapping UI
expected: In the "Import backup" section (or a separate CSV import area), select a CSV file. The app parses it and shows a column-mapping UI: one row per CSV column header, each with a dropdown listing all medicine fields (name, category, location, expiryDate, etc.) plus a "(skip)" option.
result: issue
reported: "All dropdowns default to (skip) — no auto-mapping even when CSV column names exactly match medicine field names (e.g. 'name', 'category', 'location'). User must manually map every column."
severity: major

### 9. CSV Import — Name Field Gate
expected: In the column-mapping UI, the "Preview" button is disabled (grayed out) until at least one CSV column is mapped to the "name" field. A validation message appears explaining this requirement. Once you map a column to "name", the Preview button becomes enabled.
result: pass

### 10. CSV Import — Preview
expected: After mapping the name column (and any others you want), click Preview. A table appears showing up to 5 rows of the mapped data. A badge or label shows the total number of rows that will be imported (e.g. "42 rows").
result: pass

### 11. CSV Import — Appends (Does Not Replace)
expected: Click the Import/Commit button after previewing. A success toast appears with the count of imported medicines. Navigate to the Medicines screen — the CSV medicines have been ADDED to your existing inventory (not replaced). Any medicines that existed before the import are still there.
result: pass

### 12. DATA-04 Product Decision — Instructions-Only Sync
expected: Review the "Sync with household" section. There is no "Sync Now" button — only static 4-step instructions. Confirm: is this instructions-only approach acceptable for v1 (the REQUIREMENTS.md DATA-04 checkbox is currently marked Pending), or do you want to add a triggered flow to the backlog?
result: decision
decision: "Add triggered Sync Now flow to backlog. Static instructions are not sufficient — DATA-04 remains open as a backlog item."

### 13. SC-2 Product Decision — Full Replace vs. Merge
expected: Confirm the JSON import behavior: importing a backup FULLY REPLACES all existing medicines, locations, and history (clear then re-add from file). There is no merge or last-write-wins. The confirmation dialog makes this clear before you commit. Is full-replace acceptable, or should the ROADMAP SC-2 wording ("merge with last-write-wins") be updated to match what was built?
result: decision
decision: "Merge was always the intent. Full replace (D-47) is a gap, not a design choice. BACKLOG.md B-003 captures the work to implement proper merge with last-write-wins."

## Summary

total: 13
passed: 10
issues: 1
decisions: 2
pending: 0
skipped: 0

## Backlog

Items captured during UAT. Full entries live in `.planning/BACKLOG.md`.

- **BACKLOG.md B-002** — Interactive Guided Sync Flow (DATA-04). Decision from Test 12: static instructions are not sufficient; add a triggered step-through Sync Now flow.
- **BACKLOG.md B-003** — Merge-Based Sync. Decision from Test 13: full replace (D-47) was a gap, not a design choice; implement proper last-write-wins merge for JSON import.

## Gaps

### G-01 — CSV column mapping doesn't auto-match by name
- **Test:** 8
- **truth:** "CSV column mapping UI should auto-select the matching medicine field when a CSV column header exactly matches a field name (case-insensitive)"
- **status:** failed
- **reason:** "User reported: All dropdowns default to (skip) — no auto-mapping even when CSV column names exactly match medicine field names (e.g. 'name', 'category', 'location'). User must manually map every column."
- **severity:** major
- **artifacts:** [src/components/ImportCSVSection.tsx:41]
- **missing:** ["Auto-mapping logic: when building initialMapping, check if header (lowercased) matches any MEDICINE_FIELDS value; if so, pre-select it instead of SKIP_VALUE"]

### G-02 — CSV mapper column headers are not labelled (cosmetic)
- **Test:** 8
- **truth:** "Column mapping UI should have column headers clarifying 'Your file column' (left) and 'App field' (right) so users understand the mapping direction"
- **status:** failed
- **reason:** "User found the two-column layout confusing without labels — unclear which side is the CSV source and which is the medicine field target"
- **severity:** cosmetic
- **artifacts:** [src/components/CSVColumnMapper.tsx]
- **missing:** ["Add a header row above the mapping list: 'Your file column' on the left, 'Maps to' or 'App field' on the right"]
