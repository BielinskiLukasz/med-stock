---
phase: 05-stock-catalog-management
plan: 10
subsystem: ui
tags: [react, dexie, indexeddb, packCount, aggregation]

requires:
  - phase: 05-09
    provides: packCount field on Medicine type and DB schema v4

provides:
  - Pack-level Open box split (G-05-3): handleOpenBoxClick branches on packCount
  - Stock card displays "N boxes × Q units" when packCount is set
  - Open box button visible when packCount > 1 even if quantity <= 1
  - Aggregate totalQty = (packCount ?? 1) * quantity per entry (G-05-2 display)

affects: [05-UAT, future verify-work]

tech-stack:
  added: []
  patterns:
    - "Pack-level split: decrement packCount on original, new entry gets packCount=1 and same per-box quantity"
    - "Unit-level split: decrement quantity on original, new entry gets quantity=1"
    - "Aggregate totalQty: (packCount ?? 1) * quantity — null packCount treated as 1"

key-files:
  created: []
  modified:
    - src/routes/medicines/[id].tsx
    - src/lib/aggregation.ts
    - src/lib/aggregation.test.ts

key-decisions:
  - "Pack-level split wraps both writes in db.transaction; guard condition extended to packCount > 1"
  - "packCount=null treated as 1 in totalQty to preserve backward compatibility"
  - "Stock card shows singular 'box' vs plural 'boxes' based on packCount value"

patterns-established:
  - "Open box guard: ((quantity ?? 0) > 1 || (packCount ?? 0) > 1) && !openedDate"
  - "Aggregate product: (packCount ?? 1) * (quantity ?? 0)"

requirements-completed: [STOCK-01, STOCK-03]

coverage:
  - id: D1
    description: "handleOpenBoxClick pack-level split: opening one box from a multi-box entry decrements packCount on original and creates new entry with packCount=1 and same per-box quantity"
    requirement: STOCK-03
    verification:
      - kind: manual_procedural
        ref: "Add stock entry with packCount=2, quantity=30; click Open box; verify original shows 1 box × 30, new entry shows opened with 30 units"
        status: unknown
    human_judgment: true
    rationale: "Behavioral split in Dexie requires browser/UI verification — no unit test covers the component handler end-to-end"
  - id: D2
    description: "Open box button visible when packCount > 1 even if quantity <= 1"
    requirement: STOCK-03
    verification:
      - kind: manual_procedural
        ref: "Add stock entry with packCount=2, quantity=1; confirm Open box button is present"
        status: unknown
    human_judgment: true
    rationale: "Guard condition change requires UI rendering verification"
  - id: D3
    description: "Stock card displays 'N boxes × Q units' when packCount is set"
    requirement: STOCK-01
    verification:
      - kind: manual_procedural
        ref: "Stock card with packCount=2, quantity=30 shows '2 boxes × 30 tablets'"
        status: unknown
    human_judgment: true
    rationale: "JSX rendering requires UI verification"
  - id: D4
    description: "computeCatalogAggregate totalQty multiplies quantity by packCount when set"
    requirement: STOCK-01
    verification:
      - kind: unit
        ref: "src/lib/aggregation.test.ts#multiplies quantity by packCount when packCount is set (G-05-2)"
        status: pass
      - kind: unit
        ref: "src/lib/aggregation.test.ts#treats packCount=1 as equivalent to no packCount for totalQty"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-08-25
status: complete
---

# Phase 05 Plan 10: Pack-Level Open Box Split and Aggregate Quantity Fix Summary

**Pack-level "Open box" split via packCount branch in handleOpenBoxClick, and aggregate totalQty now reflects (packCount ?? 1) × quantity per stock entry**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-25T21:19:50Z
- **Completed:** 2026-08-25T21:39:25Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `handleOpenBoxClick` now branches on packCount: multi-box entries (packCount > 1) lose one box on the original and create a new entry with packCount=1 and the full per-box quantity marked as opened. Single-unit entries follow the previous quantity-decrement path.
- Open box guard extended to `((quantity ?? 0) > 1 || (packCount ?? 0) > 1) && !openedDate` so the button appears on multi-box entries even when per-box quantity is 1.
- Stock cards display "N boxes × Q units" when packCount is a positive number; entries without packCount show the existing "Q units" display.
- `computeCatalogAggregate` totalQty updated to `(packCount ?? 1) * (quantity ?? 0)` — a 2-box × 30-tablet entry now contributes 60, not 30. Backward compatible: entries without packCount behave identically to before (multiply by 1).
- Added 2 new unit tests covering packCount×quantity product and null-equivalence; all 13 aggregation tests pass.

## Task Commits

1. **Task 1: Tracer — handleOpenBoxClick pack-level split + Open box guard update (G-05-3)** - `66e2cf0` (feat)
2. **Task 2: Update aggregate totalQty to account for packCount (G-05-2 display)** - `ab4d71a` (feat)

## Files Created/Modified

- `src/routes/medicines/[id].tsx` — handleOpenBoxClick rewritten with pack/unit branch; guard updated; stock card display updated
- `src/lib/aggregation.ts` — totalQty formula updated to (packCount ?? 1) * (quantity ?? 0)
- `src/lib/aggregation.test.ts` — 2 new tests: packCount multiplication and packCount=null equivalence

## Decisions Made

- Pack-level and unit-level paths are both wrapped in the same `db.transaction('rw', db.medicines, db.history)` — no partial state possible on failure (T-05-10-01 mitigation from threat model).
- `packCount=null` treated as 1 in totalQty to preserve backward compatibility with all existing stock entries that predate packCount.
- Stock card uses singular "box" vs plural "boxes" based on packCount for cleaner display.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added packCount unit tests for G-05-2 behavior**
- **Found during:** Task 2 (aggregation.ts update)
- **Issue:** Done criteria specified "totalQty === 70 for (packCount=2, quantity=30) and (packCount=null, quantity=10)" but no test existed in aggregation.test.ts to verify this
- **Fix:** Added two tests: one for the 70-total scenario, one for packCount=1 equivalence
- **Files modified:** src/lib/aggregation.test.ts
- **Verification:** Both new tests pass (13/13 total)
- **Committed in:** ab4d71a (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing correctness test)
**Impact on plan:** The test addition proves the exact done criteria from the plan. No scope creep.

## Issues Encountered

Pre-existing test failure in `src/routes/medicines/medicines-list.test.ts` (1 test times out after 5000ms — structural assertion unrelated to packCount). This failure existed before this plan and is out of scope per the scope boundary rule. All 112 other tests pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- G-05-2 (display half) and G-05-3 fully closed — both gaps are now implemented
- All aggregation tests green; TypeScript clean
- Manual UAT needed to verify the Open box flow in the UI (see coverage D1-D3)
- Phase 05 gap closure plans 05-07 through 05-11 continue; 05-11 is next

---
*Phase: 05-stock-catalog-management*
*Completed: 2026-08-25*
