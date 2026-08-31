---
phase: "06"
plan: "02"
subsystem: dataOps, ImportJSONSection
status: complete
tags: [tdd, integration-test, backup-restore, legacy-import, schema-versioning]
requirements: [DATA-01, DATA-02, DATA-03]

dependency_graph:
  requires: [06-01]
  provides: [ImportResult, LegacyBackupSchema, importFromJSON(raw:unknown), schemaVersion in export]
  affects:
    - src/lib/dataOps.ts
    - src/lib/dataOps.test.ts
    - src/components/ImportJSONSection.tsx

tech_stack:
  added: [fake-indexeddb/auto (test imports)]
  patterns: [TDD RED-GREEN, two-pass-zod-parse, format-detection, atomic-dexie-transaction]

key_files:
  created: []
  modified:
    - src/lib/dataOps.ts
    - src/lib/dataOps.test.ts
    - src/components/ImportJSONSection.tsx

decisions:
  - "schemaVersion detection: undefined means old-format; Zod .optional() on BackupSchema handles both in one parse"
  - "LegacyBackupSchema kept module-internal to avoid leaking legacy types to callers"
  - "ImportResult returned from importFromJSON — callers no longer need to inspect raw Zod output"
  - "BackupSchema.safeParse in handleFileSelect retained as pre-dialog gate (both formats accepted)"
  - "pendingRaw stored as unknown | null — importFromJSON owns all validation internally"

metrics:
  duration: 16
  completed: "2026-08-31T13:56:35Z"

actuals:
  tokens: 28000
  tasks: 2
  commits: 3
---

# Phase 06 Plan 02: Wire Import/Export Pipeline Summary

**One-liner:** End-to-end backup/restore pipeline with schemaVersion stamping, two-pass Zod detection for old/new formats, and branched toast messages for legacy imports.

## Accomplishments

### Task 1: dataOps.ts — end-to-end pipeline (tracer, TDD)

- Added `schemaVersion: z.number().optional()` to `BackupSchema` (Step A)
- `exportToJSON` now stamps `schemaVersion: 2` on every exported JSON file (Step B)
- Exported `ImportResult` type: `{ medicineCount, locationCount, catalogCount, isLegacyFormat }` (Step C)
- Added module-internal `LegacyBackupSchema` (Step D) — validates old-format medicines with `name`/`category` fields
- Refactored `importFromJSON(raw: unknown): Promise<ImportResult>` (Step E):
  - Fast path: `BackupSchema.safeParse(raw)` succeeds and `schemaVersion !== undefined` → restore catalog + stock verbatim
  - Inference path: `schemaVersion === undefined` → `LegacyBackupSchema.safeParse(raw)` → call `inferCatalogEntriesFromLegacyMedicines` → build typed `Medicine[]` without `name`/`category` fields
- 4 integration test suites added to `dataOps.test.ts` using `fake-indexeddb/auto`: new-format, old-format, deduplication, invalid input
- TDD cycle: RED (4 failing) → GREEN (all 19 passing)

### Task 2: ImportJSONSection.tsx — branched toast (auto)

- Renamed `pendingData` → `pendingRaw`, type changed from `BackupData | null` to `unknown | null`
- Removed `import type { BackupData }` (no longer needed as state type)
- `handleFileSelect`: stores raw parsed JSON via `setPendingRaw(parsed)`; `BackupSchema.safeParse` kept for pre-dialog gating
- `handleConfirmImport`: calls `importFromJSON(pendingRaw)` and branches on `isLegacyFormat`:
  - Legacy: "Imported N medicines — M catalog entries created from v1.0 backup."
  - New format: "Imported: N medicines, L locations" (existing copy)

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED  | 80b3c6c | `test(06-02): add failing integration tests for importFromJSON pipeline` |
| GREEN | be1045c | `feat(06-02): implement end-to-end import/export pipeline in dataOps.ts` |
| REFACTOR | — | Not needed |

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| `npx vitest run src/lib/dataOps.test.ts` | 19/19 passed |
| `npm run build` | exits 0 |
| `npm run lint` | 0 errors (5 pre-existing warnings in unrelated files) |
| `grep schemaVersion src/lib/dataOps.ts` | matches in BackupSchema + exportToJSON body |
| `grep -c LegacyBackupSchema src/lib/dataOps.ts` | 3 (definition + 2 usages) |
| `grep 'export type ImportResult' src/lib/dataOps.ts` | found at line 75 |
| Old-format: catalogId !== 0 after import | confirmed by integration test |
| New-format: isLegacyFormat === false | confirmed by integration test |

## Known Stubs

None.

## Threat Flags

None — no new trust boundaries beyond those documented in the PLAN.md threat register (T-06-01, T-06-02, T-06-03 all implemented as mitigated).

## Self-Check: PASSED

- `src/lib/dataOps.ts` modified with schemaVersion, ImportResult, LegacyBackupSchema, refactored importFromJSON
- `src/lib/dataOps.test.ts` has 4 new integration describe blocks (19 total tests pass)
- `src/components/ImportJSONSection.tsx` uses pendingRaw (not BackupData), branches toast on isLegacyFormat
- Commits 80b3c6c (RED), be1045c (GREEN), 917fb0c (Task 2) present in git log
