---
phase: 03-data-household-sync
plan: "02"
subsystem: data-ops
tags: [export, import, json, zod, dexie, blob-api, alert-dialog, tdd]
status: complete

dependency_graph:
  requires:
    - 03-01 (DataScreen scaffold, ExportSection/ImportJSONSection stubs, sonner toast)
  provides:
    - BackupSchema (Zod schema mirroring Medicine + Location + HistoryEntry)
    - BackupData type
    - exportToJSON (Blob API download, dated filename D-46)
    - importFromJSON (3-table atomic Dexie transaction D-47)
    - ExportSection (full implementation replacing 03-01 stub)
    - ImportJSONSection (full implementation replacing 03-01 stub)
  affects:
    - src/lib/dataOps.ts
    - src/lib/dataOps.test.ts
    - src/components/ExportSection.tsx
    - src/components/ImportJSONSection.tsx

tech_stack:
  added: []
  patterns:
    - TDD (RED/GREEN): test file written before implementation, 7 schema tests
    - Zod safeParse as security gate before any DB write (D-50)
    - Blob API + anchor download (no library, D-46)
    - Dexie 3-table transaction: clear then bulkAdd (D-47)
    - Controlled AlertDialog (programmatic open, no trigger, D-48)
    - Hidden file input for iOS Safari compatibility (no showOpenFilePicker)

key_files:
  created:
    - src/lib/dataOps.ts
    - src/lib/dataOps.test.ts
  modified:
    - src/components/ExportSection.tsx (replaced stub)
    - src/components/ImportJSONSection.tsx (replaced stub)

decisions:
  - "BackupSchema includes ManualStatus enum ('UsedUp','Disposed','Archived').nullable() — matches db.ts ManualStatus type"
  - "importFromJSON accepts already-validated BackupData (not raw file) — caller validates, function stays pure"
  - "AlertDialog controlled via dialogOpen state — opened after validation+count-fetch, not via AlertDialogTrigger"
  - "medicineCount/locationCount fetched from DB before opening dialog (actual counts per D-48)"

metrics:
  duration_minutes: 4
  completed_date: "2026-07-13"
  tasks_completed: 2
  files_changed: 4

requirements_addressed:
  - DATA-01
  - DATA-02
---

# Phase 03 Plan 02: JSON Export & Import Summary

**One-liner:** Full JSON export via Blob API (dated filename) and JSON import with Zod validation, 3-table atomic Dexie transaction, and confirmation dialog showing actual DB counts.

## What Was Built

JSON export and import vertical slice completing DATA-01 and DATA-02. Created `dataOps.ts` with `BackupSchema` (Zod schema mirroring all three Dexie table interfaces), `exportToJSON` (reads 3 tables, creates a dated Blob download), and `importFromJSON` (single 3-table transaction: clear then bulkAdd). Replaced the stub `ExportSection.tsx` with a button that calls `exportToJSON` and shows a dated success toast. Replaced the stub `ImportJSONSection.tsx` with a hidden file input, Zod validation gate, confirmation AlertDialog showing actual DB counts, atomic import execution, and exact UI-SPEC toast messages.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create dataOps.ts — BackupSchema, exportToJSON, importFromJSON (TDD) | 69caf28 | src/lib/dataOps.ts, src/lib/dataOps.test.ts |
| 2 | Create ExportSection and ImportJSONSection components | d5374e2 | src/components/ExportSection.tsx, src/components/ImportJSONSection.tsx |

## Decisions Made

- **BackupSchema ManualStatus:** Used `z.enum(['UsedUp', 'Disposed', 'Archived']).nullable()` matching db.ts `ManualStatus` type exactly. 'Disposed' is technically valid in the schema (it appears in the type definition) even though the UI doesn't expose it — needed for round-trip fidelity of imported backups.
- **importFromJSON caller-validates:** The function accepts `BackupData` (already validated), not raw parsed JSON. This keeps the function pure and testable. The component (`ImportJSONSection`) calls `BackupSchema.safeParse` before calling `importFromJSON`.
- **Controlled AlertDialog:** Opened via `setDialogOpen(true)` after file validation and DB count fetch. No `AlertDialogTrigger` used — programmatic pattern required by D-48 (actual counts must be fetched before dialog appears).
- **DB counts on file-select:** `db.medicines.count()` and `db.locations.count()` are called when file is selected (not when dialog opens), ensuring counts reflect DB state at the time the user chose the file.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all plan goals achieved. ExportSection and ImportJSONSection stubs from Plan 03-01 fully replaced.

## Threat Surface Scan

All threats in the plan's threat model are mitigated:

| Threat | Mitigation | Verified |
|--------|-----------|---------|
| T-03-01 (Tampering via importFromJSON) | BackupSchema.safeParse called before importFromJSON; JSON.parse wrapped in try/catch | Yes — grep confirms `BackupSchema.safeParse` and nested `JSON.parse` try/catch in ImportJSONSection |
| T-03-02 (Info Disclosure via export) | Explicit user action only; no auto-export | Yes — exportToJSON only called on button click |
| T-03-03 (Spoofing via file picker) | `accept=".json"` on input; Zod schema validation | Yes — grep confirms `accept=".json"` and `BackupSchema.safeParse` |
| T-03-04 (DoS via large JSON) | Accepted — household use case has tens to hundreds of records | N/A |

No new threat surface introduced beyond the plan's threat model.

## Self-Check: PASSED

- src/lib/dataOps.ts: FOUND
- src/lib/dataOps.test.ts: FOUND
- src/components/ExportSection.tsx: FOUND (stub replaced)
- src/components/ImportJSONSection.tsx: FOUND (stub replaced)
- Commit 69caf28: FOUND
- Commit d5374e2: FOUND
- npm test -- run src/lib/dataOps.test.ts: 7/7 PASSED
- npm test -- run (full suite): 63/63 PASSED
- npm run build: PASSED (exit 0)
