---
plan: 02-01
phase: 02-search-dashboard-audit
status: complete
completed: 2026-06-30
subsystem: data-layer
tags: [dexie, schema-migration, history, tdd, soft-delete]
requires: []
provides: [Medicine.deletedAt, HistoryEntry, db.history, historyOps]
affects: [plans 02-02, 02-03, 02-04]
tech-stack-added: []
tech-stack-patterns: [dexie-transaction-rw, json-stringify-value-equality, soft-delete-pattern]
key-files-created: [src/lib/historyOps.ts, src/lib/historyOps.test.ts]
key-files-modified: [src/lib/db.ts]
decisions:
  - deletedAt is not in the medicines index string — null values cannot be indexed in IndexedDB; active record queries use toCollection().filter()
  - permanentDeleteMedicine never deletes history entries — preserved forever per D-38
  - diffMedicine uses JSON.stringify for PAO object comparison to handle value equality correctly
  - restoreMedicine does not reset manualStatus — user's manual override is preserved per D-28
duration: ~15min
---

# Phase 02 Plan 01: Dexie v2 Schema + historyOps Utility Summary

## One-Liner

Dexie schema v2 migration with soft-delete and audit history table, plus historyOps.ts with 6 atomic transaction functions covering all medicine lifecycle mutations.

## What Was Built

- **Dexie schema v2 migration** in `src/lib/db.ts`: added `deletedAt: string | null` to Medicine interface, exported `HistoryEntry` interface (with `medicineId`, `medicineName` denormalized, `action`, `changedFields`, `timestamp`), registered `history` table with `++id, medicineId, timestamp` index, added `history: EntityTable<HistoryEntry, 'id'>` to the Dexie type cast
- **`src/lib/historyOps.ts`** with 6 exported functions: `diffMedicine`, `updateMedicineWithHistory`, `softDeleteMedicine`, `restoreMedicine`, `permanentDeleteMedicine`, `addMedicineHistory` — all using `db.transaction('rw', ...)` for atomicity
- **`src/lib/historyOps.test.ts`** with 17 TDD test cases covering all lifecycle behaviors including PAO object equality, D-28 manualStatus preservation, and D-38 history preservation after permanent delete

## Key Decisions

- `deletedAt` NOT in the medicines index string — null values cannot be indexed in IndexedDB (Pitfall 1/D-41 amendment). Active record queries must use `toCollection().filter(m => m.deletedAt === null)`
- `permanentDeleteMedicine` never deletes history entries — data preserved forever per D-38. History entry written FIRST, then medicine deleted, to avoid losing the name if write fails
- `diffMedicine` uses `JSON.stringify` for every tracked field comparison to handle PAO object equality correctly (Pitfall 8)
- `restoreMedicine` does not include `manualStatus` in the update payload — user's manual status override survives a restore cycle (D-28)
- `medicineName` is denormalized into HistoryEntry — readable after the medicine is permanently deleted (D-36/D-38)

## Deviations from Plan

None — plan executed exactly as written.

## TDD Gate Compliance

- RED commit: `cdf5763` — `test(02-01): RED — historyOps lifecycle tests` (fails — module not found)
- GREEN commit: `5ef2cea` — `feat(02-01): GREEN — historyOps.ts all lifecycle functions` (all 44 tests pass)

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. All mutations remain local IndexedDB only.

`permanentDeleteMedicine` does not call `db.history.delete()` — verified by grep (count: 0). Satisfies T-02-01.

## Self-Check

- [x] `npm run build` exits 0
- [x] `npm run test -- --run` exits 0, 44 tests pass (27 prior Phase 1 + 17 new historyOps)
- [x] `grep -c 'db.history.delete' src/lib/historyOps.ts` returns 0
- [x] Two TDD commits: RED failing then GREEN passing
- [x] `src/lib/historyOps.ts` exists with all 6 exported functions
- [x] `src/lib/historyOps.test.ts` exists with full TDD test suite

## Self-Check: PASSED
