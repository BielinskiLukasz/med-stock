---
phase: 05-stock-catalog-management
plan: "07"
subsystem: ui
status: complete
tags: [gap-closure, detail-view, filter, move-sheet]
completed_date: "2026-08-25"
duration_minutes: 8

dependency_graph:
  requires: []
  provides: [G-05-1-closed, G-05-5-closed, G-05-6-closed, G-05-7-closed]
  affects: [src/routes/medicines/[id].tsx, src/routes/medicines/index.tsx, src/components/MoveStockSheet.tsx]

tech_stack:
  added: []
  patterns: [useEffect-reset-on-open, match-any-filter, conditional-render-guard]

key_files:
  created: []
  modified:
    - src/routes/medicines/[id].tsx
    - src/routes/medicines/index.tsx
    - src/components/MoveStockSheet.tsx

decisions:
  - "G-05-1: Guarded Open box button with !stock.openedDate to prevent showing button on already-opened entries"
  - "G-05-5: Replaced aggregate status check with .some(e => calculateStatus(e)) for match-any semantics"
  - "G-05-6: Placed ChangeHistory after action row div inside stock entry map callback"
  - "G-05-7: Seeded useState with stock.location and added useEffect to re-sync on [open, stock]"

requirements: [STOCK-02, STOCK-03, STOCK-04, FLOW-01]
---

# Phase 05 Plan 07: Gap Closure (G-05-1, G-05-5, G-05-6, G-05-7) Summary

**One-liner:** Closed four UAT gaps — open box guard, change history render, status match-any filter, and move sheet location pre-fill.

## What Was Built

Three source files patched to close four independent UI-level gaps found during manual UAT:

- **G-05-1** (`[id].tsx`): Added `&& !stock.openedDate` to the Open box button render condition so the button is hidden when the stock entry already has an opened date.
- **G-05-6** (`[id].tsx`): Imported `ChangeHistory` component and rendered `<ChangeHistory medicineId={stock.id} />` at the bottom of each stock entry card so history written to the DB is now visible in the detail view.
- **G-05-5** (`index.tsx`): Imported `calculateStatus` and replaced the aggregate-status check in the status filter with `.some(e => selectedStatuses.includes(calculateStatus(e)))` to give match-any semantics identical to the location filter.
- **G-05-7** (`MoveStockSheet.tsx`): Added `useEffect` import, seeded `targetLocation` state from `stock.location`, and added a `useEffect([open, stock])` that calls `setTargetLocation(stock.location)` and `setQuantity(1)` when the sheet opens.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (tracer) | Open box guard + ChangeHistory render | df936cb | src/routes/medicines/[id].tsx |
| 2 | Status filter match-any over stock entries | 303fb6c | src/routes/medicines/index.tsx |
| 3 | Pre-fill MoveStockSheet location | 1a3fb85 | src/components/MoveStockSheet.tsx |

## Verification

- `npx tsc --noEmit` — clean (no output)
- `npx vitest run` — all tests pass (100 tests, 10 files; 1 test in full-suite run showed a pre-existing timeout flakiness that passes in isolation)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- `df936cb` exists: `git log --oneline | grep df936cb` confirmed
- `303fb6c` exists: confirmed
- `1a3fb85` exists: confirmed
- All three modified files present on disk
- `npx tsc --noEmit` clean
