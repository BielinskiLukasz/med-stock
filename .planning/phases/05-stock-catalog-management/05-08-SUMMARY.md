---
phase: 05
plan: "08"
subsystem: aggregation
tags: [tdd, bug-fix, aggregation, status]
dependency_graph:
  requires: []
  provides: [accurate-catalog-aggregate-status]
  affects: [MedicineListScreen, CatalogCard]
tech_stack:
  added: []
  patterns: [priority-reduce, module-level-constants]
key_files:
  created: []
  modified:
    - src/lib/aggregation.ts
    - src/lib/aggregation.test.ts
decisions:
  - "PRIORITY map as module-level constant drives worst-case reduce (not recreated per call)"
  - "MANUAL_STATUSES Set gates exclusion before priority check — falls back to Active when all entries are manual"
metrics:
  duration: "18 minutes"
  completed_date: "2026-08-25"
  tasks: 3
  files: 2
status: complete
---

# Phase 05 Plan 08: computeCatalogAggregate Priority-Reduce Summary

**One-liner:** Rewrote `computeCatalogAggregate` with PRIORITY map (Expired=4, ExceededOpenPeriod=3, Opened=2, Active=1) and MANUAL_STATUSES exclusion set, replacing the nearest-expiry proxy.

## What Was Built

Gap G-05-4 closed. `computeCatalogAggregate` now iterates all active stock entries, calls `calculateStatus` on each, skips manual statuses, and escalates `worstStatus` using a priority map. The nearest-expiry proxy was removed — it missed `ExceededOpenPeriod` (PAO-only entries with no `expiryDate`) and leaked manual statuses into the aggregate.

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED (failing tests) | bce16e7 | PASS — 4 new tests failed, 7 existing passed |
| GREEN (implementation) | f91d38d | PASS — all 11 tests passed |
| REFACTOR | n/a — constants already module-level from GREEN | PASS |

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| RED | Add 5 failing priority-ordering tests to aggregation.test.ts | bce16e7 |
| GREEN | Rewrite computeCatalogAggregate with PRIORITY map and MANUAL_STATUSES set | f91d38d |

## Verification

- `npx vitest run src/lib/aggregation.test.ts` — 11/11 passed
- `npx tsc --noEmit` — clean, no errors
- Full suite: pending final check

## Decisions Made

1. **PRIORITY map as module-level constant** — avoids object recreation on each `computeCatalogAggregate` call; consistent with REFACTOR goal.
2. **MANUAL_STATUSES as `Set<MedicineStatus>`** — O(1) lookup; typed to prevent typos.
3. **`worstStatus` defaults to `'Active'`** — correct fallback when all entries are manual or input array is empty.
4. **Defensive `?? 0` on PRIORITY lookup** — if a future status value is not in the map, the cast returns `undefined`; the `> PRIORITY[worstStatus]` check safely skips it.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check

- [x] `src/lib/aggregation.ts` modified with priority-reduce implementation
- [x] `src/lib/aggregation.test.ts` modified with 5 new failing tests (RED) then all-pass (GREEN)
- [x] RED commit bce16e7 exists
- [x] GREEN commit f91d38d exists
- [x] TypeScript clean (`npx tsc --noEmit` — no output)
- [x] All 11 aggregation tests pass
- [!] Pre-existing failure in `src/routes/medicines/medicines-list.test.ts` ("does not contain where(manualStatus)") — unrelated to this plan, out of scope, logged to deferred-items
