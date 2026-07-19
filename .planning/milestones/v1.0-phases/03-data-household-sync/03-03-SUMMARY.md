---
phase: 03-data-household-sync
plan: "03"
subsystem: csv-import
tags: [csv, papa-parse, column-mapping, import, tdd, papaparse]
status: complete

dependency_graph:
  requires:
    - 03-01 (ImportCSVSection stub, papaparse installed)
    - 03-02 (JSON import/export complete; DataScreen wired)
  provides:
    - parseCSVFile (Papa Parse wrapper as Promise)
    - mergeCSVRowsToMedicines (pure CSV-to-Medicine converter)
    - MEDICINE_FIELDS constant (dropdown options for column mapper)
    - SKIP_VALUE constant ('(skip)' sentinel)
    - CSVColumnMapper (controlled dropdown mapper per CSV column)
    - CSVPreview (5-row preview + total count + commit button)
    - ImportCSVSection (full step machine replacing 03-01 stub)
  affects:
    - src/lib/csvOps.ts
    - src/lib/csvOps.test.ts
    - src/components/CSVColumnMapper.tsx
    - src/components/CSVPreview.tsx
    - src/components/ImportCSVSection.tsx

tech_stack:
  added: []
  patterns:
    - TDD (RED/GREEN): test file written before implementation, 6 pure-logic tests
    - Pure function design: mergeCSVRowsToMedicines has no side effects, no DB access
    - Step machine pattern: idle → mapping → preview → committing via useState
    - Controlled component: CSVColumnMapper is stateless, mapping owned by ImportCSVSection
    - iOS Safari fallback: <input type="file"> (no File System Access API)
    - Append-only bulkAdd (asymmetric to JSON import clear+bulkAdd — D-53)

key_files:
  created:
    - src/lib/csvOps.ts
    - src/lib/csvOps.test.ts
    - src/components/CSVColumnMapper.tsx
    - src/components/CSVPreview.tsx
  modified:
    - src/components/ImportCSVSection.tsx (replaced 03-01 stub)

decisions:
  - "D-51 implemented: parseCSVFile wraps Papa.parse with header:true, skipEmptyLines:true"
  - "D-52 implemented: CSVColumnMapper renders one Select per header; Preview disabled until 'name' mapped"
  - "D-53 implemented: CSVPreview shows slice(0,5); commit uses bulkAdd not clear+bulkAdd"
  - "T-03-05 mitigated: empty name rows skipped; quantity non-numeric -> null (not error)"
  - "pao: null for all CSV imports — CSV cannot represent complex PAO object"

metrics:
  duration_minutes: 8
  completed_date: "2026-07-13"
  tasks_completed: 2
  files_changed: 5

requirements_addressed:
  - DATA-03
---

# Phase 03 Plan 03: CSV Import Summary

**One-liner:** Full CSV import vertical slice — Papa Parse wrapper, pure mergeCSVRowsToMedicines with skip/quantity logic, CSVColumnMapper with name gate, CSVPreview with 5-row preview, ImportCSVSection step machine that appends to DB.

## What Was Built

CSV import DATA-03 delivered as a complete vertical slice. Created `csvOps.ts` with `parseCSVFile` (Papa Parse Promise wrapper), `mergeCSVRowsToMedicines` (pure row converter with name-skip and quantity-parse safety), `MEDICINE_FIELDS` constant, and `SKIP_VALUE` sentinel. Created `CSVColumnMapper.tsx` with one controlled Select dropdown per detected CSV column, name-field gate on Preview button, and exact UI-SPEC validation message. Created `CSVPreview.tsx` showing the first 5 rows in a table with total row count and dynamic "Import N medicines" button. Replaced the `ImportCSVSection.tsx` stub with a full idle→mapping→preview→committing step machine that calls `parseCSVFile`, passes state to sub-components, calls `db.medicines.bulkAdd` (append-only, D-53), and shows exact UI-SPEC toast messages.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Add failing tests for mergeCSVRowsToMedicines | 5b38097 | src/lib/csvOps.test.ts |
| 1 (GREEN) | Implement csvOps.ts | 16ef306 | src/lib/csvOps.ts |
| 2 | Create CSVColumnMapper, CSVPreview, ImportCSVSection | 6b976d3 | src/components/CSVColumnMapper.tsx, src/components/CSVPreview.tsx, src/components/ImportCSVSection.tsx |

## Decisions Made

- **D-51 (parseCSVFile):** Uses Papa.parse with `header: true, skipEmptyLines: true, complete/error` callback wrapped in a Promise. This exposes the callback API as async/await.
- **D-52 (CSVColumnMapper):** All headers default to SKIP_VALUE on file parse. Preview button disabled (`disabled={!isNameMapped}`) until at least one column maps to 'name'. Exact UI-SPEC validation message shown when not mapped.
- **D-53 (append-only bulkAdd):** `db.medicines.bulkAdd(medicines)` — intentional asymmetry from JSON import (`clear` + `bulkAdd`). CSV import adds to existing inventory; JSON import replaces it.
- **T-03-05 (quantity safety):** `parseFloat` with `isFinite` check — non-numeric strings become `null`, row not skipped. Only empty/missing `name` causes a row skip.
- **pao: null:** CSV cannot represent the complex `{ value, unit }` PAO object. All CSV-imported rows get `pao: null`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — ImportCSVSection stub from Plan 03-01 fully replaced. All plan goals achieved.

## Threat Surface Scan

Threats T-03-05, T-03-06, T-03-07 from the plan's threat model:

| Threat | Mitigation | Verified |
|--------|-----------|---------|
| T-03-05 (Tampering via mergeCSVRowsToMedicines) | Empty name rows skipped; quantity non-numeric → null; all other fields nullable | Yes — csvOps.ts grep confirms skippedCount increment on empty name, parseFloat+isFinite for quantity |
| T-03-06 (DoS via large CSV) | Accepted — household use case; Papa Parse handles streaming internally | N/A |
| T-03-07 (Info Disclosure via CSV preview) | Accepted — inherent to preview feature required by D-53 | N/A |

No new threat surface introduced beyond the plan's threat model.

## Self-Check: PASSED

- src/lib/csvOps.ts: FOUND
- src/lib/csvOps.test.ts: FOUND
- src/components/CSVColumnMapper.tsx: FOUND
- src/components/CSVPreview.tsx: FOUND
- src/components/ImportCSVSection.tsx: FOUND (stub replaced)
- Commit 5b38097: FOUND
- Commit 16ef306: FOUND
- Commit 6b976d3: FOUND
- npm test -- run src/lib/csvOps.test.ts: 6/6 PASSED
- npm test -- run (full suite): 69/69 PASSED
- npm run build: PASSED (exit 0)
