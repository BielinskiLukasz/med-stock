---
phase: 01-pwa-foundation-inventory-crud
plan: 02
subsystem: testing
tags: [vitest, typescript, pure-function, expiry, tdd]

# Dependency graph
requires:
  - phase: 01-pwa-foundation-inventory-crud
    provides: Medicine interface in src/lib/db.ts (type import for calculateStatus signature)
provides:
  - calculateStatus(med: Medicine, now?: Date): MedicineStatus pure function in src/lib/expiry.ts
  - AutoStatus type union ('Active' | 'Opened' | 'Expired')
  - ManualStatus type union ('Used Up' | 'Disposed' | 'Archived')
  - MedicineStatus type union (AutoStatus | ManualStatus)
  - 11 Vitest test cases covering all five D-11–D-15 branches
affects:
  - 01-03-PLAN (MedicineCard, StatusBadge import MedicineStatus and call calculateStatus)
  - 01-04-PLAN (filter queries in Phase 2 call calculateStatus with fixed 'now' for batch status)
  - Phase 2 dashboard metrics (expired count, expiring soon) depend on this function

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure utility function pattern: calculateStatus is a pure function with no side effects, no Dexie imports, no React imports — easy to unit test and callable from any context"
    - "TDD RED/GREEN/REFACTOR: test file committed first in failing state, then implementation, then refactor review"
    - "Date arithmetic via Date copy: addPAO creates a new Date from the input to avoid mutation"
    - "Null-safe date parsing: expiryDate and openedDate stored as YYYY-MM-DD strings, parsed to Date objects only inside calculateStatus"

key-files:
  created:
    - src/lib/expiry.ts
    - src/lib/expiry.test.ts
  modified: []

key-decisions:
  - "No refactor commit needed — addPAO helper naming and variable names (expiry, opened, paoEnd) were already clear on first implementation pass"
  - "ManualStatus in expiry.ts excludes null (unlike db.ts which has ManualStatus = ... | null) — expiry.ts exports the display-only type without null for consuming components"
  - "D-13 check uses !== null (not falsy) to correctly handle only actual null as 'not set', since empty string is not a valid ManualStatus value"

patterns-established:
  - "Pure utility pattern: status calculation lives in src/lib/ as a plain TS function, never in a React component or Zustand store"
  - "now: Date = new Date() default parameter enables deterministic testing without mocking Date.now()"

requirements-completed: [INV-05, INV-06]

coverage:
  - id: D1
    description: "calculateStatus returns 'Active' when expiry is in future and medicine not opened"
    requirement: INV-05
    verification:
      - kind: unit
        ref: "src/lib/expiry.test.ts#returns Active when expiry is in the future and medicine has not been opened"
        status: pass
    human_judgment: false
  - id: D2
    description: "calculateStatus returns 'Opened' when opened and PAO window has not elapsed"
    requirement: INV-05
    verification:
      - kind: unit
        ref: "src/lib/expiry.test.ts#returns Opened when openedDate is set and PAO window has not elapsed"
        status: pass
    human_judgment: false
  - id: D3
    description: "calculateStatus returns 'Expired' when now is past expiryDate"
    requirement: INV-05
    verification:
      - kind: unit
        ref: "src/lib/expiry.test.ts#returns Expired when now is past expiryDate"
        status: pass
    human_judgment: false
  - id: D4
    description: "calculateStatus returns 'Expired' when now is past openedDate + PAO window"
    requirement: INV-05
    verification:
      - kind: unit
        ref: "src/lib/expiry.test.ts#returns Expired when now is past openedDate + PAO window"
        status: pass
    human_judgment: false
  - id: D5
    description: "calculateStatus returns 'Expired' when expiry fires before PAO end (whichever-first)"
    requirement: INV-05
    verification:
      - kind: unit
        ref: "src/lib/expiry.test.ts#returns Expired when expiry fires before PAO end"
        status: pass
    human_judgment: false
  - id: D6
    description: "D-13: manualStatus takes precedence over auto-calculation when dates are valid"
    requirement: INV-06
    verification:
      - kind: unit
        ref: "src/lib/expiry.test.ts#D-13: returns manualStatus Archived when manualStatus is set (dates are valid)"
        status: pass
    human_judgment: false
  - id: D7
    description: "D-13: manualStatus takes precedence over auto-calculation when dates are expired"
    requirement: INV-06
    verification:
      - kind: unit
        ref: "src/lib/expiry.test.ts#D-13: returns manualStatus Used Up when manualStatus is set (dates are expired)"
        status: pass
    human_judgment: false
  - id: D8
    description: "D-14: null expiryDate with PAO set — returns Opened when within PAO window"
    requirement: INV-05
    verification:
      - kind: unit
        ref: "src/lib/expiry.test.ts#D-14: returns Opened when expiryDate is null, PAO is set, and within PAO window"
        status: pass
    human_judgment: false
  - id: D9
    description: "D-14: null expiryDate with PAO set — returns Expired when past PAO window"
    requirement: INV-05
    verification:
      - kind: unit
        ref: "src/lib/expiry.test.ts#D-14: returns Expired when expiryDate is null, PAO is set, and past PAO window"
        status: pass
    human_judgment: false
  - id: D10
    description: "D-15: openedDate set with null PAO — returns Opened when expiry is in the future"
    requirement: INV-05
    verification:
      - kind: unit
        ref: "src/lib/expiry.test.ts#D-15: returns Opened when openedDate is set, pao is null, and expiry is in the future"
        status: pass
    human_judgment: false
  - id: D11
    description: "D-15: openedDate set with null PAO — returns Expired when expiry is past"
    requirement: INV-05
    verification:
      - kind: unit
        ref: "src/lib/expiry.test.ts#D-15: returns Expired when openedDate is set, pao is null, and expiry is past"
        status: pass
    human_judgment: false

# Metrics
duration: 9min
completed: 2026-06-30
status: complete
---

# Phase 01 Plan 02: calculateStatus TDD Summary

**calculateStatus pure function with addPAO helper, covering all five D-11–D-15 decision branches across 11 Vitest test cases (TDD RED/GREEN, no refactor needed)**

## Performance

- **Duration:** 9 min
- **Started:** 2026-06-30T09:09:45Z
- **Completed:** 2026-06-30T09:18:00Z
- **Tasks:** 1 (TDD feature with RED + GREEN cycles)
- **Files modified:** 2

## Accomplishments

- Created `src/lib/expiry.ts` exporting `calculateStatus`, `AutoStatus`, `ManualStatus`, `MedicineStatus` types — zero side effects, no React/Dexie dependencies
- Created `src/lib/expiry.test.ts` with 11 test cases covering all five D-11–D-15 branches (Active, Opened, Expired by expiry, Expired by PAO, whichever-first, D-13 x2, D-14 x2, D-15 x2)
- All 11 tests pass; RED/GREEN TDD cycles completed; no refactor changes required

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED | `2c4265f` — `test(01-02): add failing tests for calculateStatus` | PASSED — import error confirmed before implementation |
| GREEN | `bbf7fbb` — `feat(01-02): implement calculateStatus with all D-13/D-14/D-15 edge cases` | PASSED — 11/11 tests pass |
| REFACTOR | Skipped — implementation was already clear | N/A — no logic changes |

## Task Commits

1. **RED — Failing test suite** - `2c4265f` (test)
2. **GREEN — calculateStatus implementation** - `bbf7fbb` (feat)

## Files Created/Modified

- `src/lib/expiry.ts` — Pure utility: `calculateStatus(med, now?)`, `addPAO` helper, `AutoStatus`, `ManualStatus`, `MedicineStatus` types. No side effects. Importable from any context.
- `src/lib/expiry.test.ts` — 11 Vitest test cases in a `describe('calculateStatus')` block, using `makeMed()` factory for minimal Medicine objects

## Decisions Made

- No refactor commit needed — variable names (`expiry`, `opened`, `paoEnd`) and helper name (`addPAO`) were already clear from the first implementation pass
- `ManualStatus` in `expiry.ts` excludes `null` (unlike `db.ts` which has `ManualStatus = ... | null`) — the expiry module exports the display type for consuming components; null-checking remains the caller's responsibility
- D-13 guard uses `!== null` rather than falsy check, correctly allowing only explicit `null` (not `undefined`) to bypass the manual override

## Deviations from Plan

None - plan executed exactly as written. RED/GREEN/REFACTOR cycle followed; REFACTOR produced no changes as implementation was clean on first pass.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `calculateStatus` stable API: `calculateStatus(med: Medicine, now?: Date): MedicineStatus` — ready for Plan 03 (MedicineCard, StatusBadge)
- `MedicineStatus` type exported from `expiry.ts` — import in StatusBadge.tsx and MedicineCard.tsx for type-safe prop signatures
- Phase 2 filter logic can call `calculateStatus(med, fixedNow)` with a fixed date for batch expiry queries — default parameter pattern supports this without breaking existing call sites

## Known Stubs

None — `calculateStatus` is fully implemented with no hardcoded return values or placeholders.

---
*Phase: 01-pwa-foundation-inventory-crud*
*Completed: 2026-06-30*
