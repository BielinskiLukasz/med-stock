---
status: complete
phase: 06-backup-restore
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md]
started: 2026-08-31T00:00:00Z
updated: 2026-08-31T14:30:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Export to JSON stamps schemaVersion
expected: Open the Data screen (/data). Click export. Open the downloaded JSON file in a text editor. The file should contain a top-level "schemaVersion": 2 field.
result: pass

### 2. Import new-format backup shows standard toast
expected: Import a JSON file that was exported from the current app (schemaVersion: 2). After confirming the import dialog, a toast should appear saying "Imported: N medicines, L locations" (with real counts).
result: pass

### 3. Import v1.0 legacy backup shows branched toast with catalog count
expected: Import an old-format JSON backup (one that has medicines with "name" and "category" fields, no schemaVersion). After confirming the import dialog, a toast should say something like "Imported N medicines — M catalog entries created from v1.0 backup." (not the standard format).
result: pass

### 4. Import invalid file shows error
expected: Try to import a non-backup JSON file (e.g., an empty object {} or a plain text file renamed to .json). The app should show an error toast or block the import — it should NOT silently succeed or crash.
result: pass

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
