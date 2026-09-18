---
phase: 08-full-location-management
plan: 05
subsystem: ui
tags: [dnd-kit, react, drag-and-drop, accessibility]

# Dependency graph
requires:
  - phase: 08-full-location-management (Plan 08-02)
    provides: "reorderLocations(orderedIds) — contiguous 1..N renumbering via bulkUpdate"
  - phase: 08-full-location-management (Plan 08-04)
    provides: "LocationsScreen row template (name, hide/show toggle, Edit, Delete) that the drag handle and up/down buttons attach to"
provides:
  - "SortableLocationList component (drag-to-reorder via @dnd-kit, PointerSensor + KeyboardSensor)"
  - "Up/down move buttons on every location row, funneling through the same reorderLocations call as drag"
  - "@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities in package.json"
affects: []

# Actuals (#2632)
actuals:
  tokens: 2908
  tasks: 2
  commits: 2

tech-stack:
  added: ["@dnd-kit/core@^6.3.1", "@dnd-kit/sortable@^10.0.0", "@dnd-kit/utilities@^3.2.2"]
  patterns:
    - "SortableLocationList owns only drag mechanics (DndContext/SortableContext/useSortable); the caller (LocationsScreen) supplies row content via a renderRow(loc) render-prop, so drag styling never leaks into the caller's row JSX"
    - "Both input paths (drag-end and up/down buttons) share one splice-based reorder function (handleReorder) which is the only caller of reorderLocations — handleMove computes the target index and delegates to handleReorder rather than duplicating the splice"

key-files:
  created:
    - src/components/SortableLocationList.tsx
  modified:
    - package.json
    - package-lock.json
    - src/routes/locations/index.tsx

key-decisions:
  - "SortableLocationRow wraps the drag handle + row content in one flex div with opacity-60 hidden-row muting applied at the row level (not duplicated inside renderRow) — matches the existing className the plain .map() loop used before this plan"
  - "Drag handle is a plain <button> (not shadcn Button) with min-h-11 min-w-11 and touch-none, matching the 44x44px touch-target exception already established for the Phase 7 language toggle"
  - "Up/down buttons placed between the Hidden badge and the hide/show toggle per the UI-SPEC row anatomy (drag handle, name, badge, up, down, hide/show, edit, delete)"

requirements-completed: [LOC-04]

coverage:
  - id: D1
    description: "Each location row can be dragged via a dedicated drag handle to a new position, and the new order persists to db.locations and is reflected everywhere order is read from"
    requirement: "LOC-04"
    verification:
      - kind: other
        ref: "npx tsc --noEmit; npm run build; grep -n 'onDragEnd={handleReorder}' src/routes/locations/index.tsx"
        status: pass
    human_judgment: false
  - id: D2
    description: "Up/down move buttons reorder by exactly one position on the same list as dragging, both simultaneously active (no toggle)"
    requirement: "LOC-04"
    verification:
      - kind: other
        ref: "grep -n 'handleMove(index' src/routes/locations/index.tsx"
        status: pass
    human_judgment: false
  - id: D3
    description: "First row's up button and last row's down button are disabled; a single-row list has both disabled"
    requirement: "LOC-04"
    verification:
      - kind: other
        ref: "grep -n 'disabled={index === 0}' src/routes/locations/index.tsx; grep -n 'disabled={index === locations.length - 1}' src/routes/locations/index.tsx"
        status: pass
    human_judgment: false
  - id: D4
    description: "Hidden locations remain draggable and button-movable, visually muted only"
    requirement: "LOC-04"
    verification:
      - kind: other
        ref: "src/components/SortableLocationList.tsx — opacity-60 className applied unconditionally to loc.hidden rows, no disabled/pointer-events change"
        status: pass
    human_judgment: false
  - id: D5
    description: "'Other' (null location) never appears as a row; it has no Location record"
    requirement: "LOC-04"
    verification:
      - kind: other
        ref: "locations comes from useLiveQuery(() => db.locations.toCollection().sortBy('order')) — Location table has no null-name/Other row by construction, matching D-16"
        status: pass
    human_judgment: false
  - id: D6
    description: "Both drag-end and up/down button handlers call the same shared reorderLocations function — no duplicate renumbering logic"
    requirement: "LOC-04"
    verification:
      - kind: other
        ref: "grep -n 'reorderLocations' src/routes/locations/index.tsx — single call site inside handleReorder; handleMove delegates to handleReorder"
        status: pass
    human_judgment: false
  - id: D7
    description: "Dragging a row shows the opacity 0.5 drag-active state and other rows reflow smoothly, without layout jump, at a 360px-wide mobile viewport"
    verification:
      - kind: manual
        ref: "backstop — requires a real pointer/touch drag interaction; not exercised by tsc/build/vitest"
        status: needs_verification
    human_judgment: true
    rationale: "UI-SPEC flags this as a backstop item (drag-active visual + reflow smoothness). @dnd-kit's built-in transform/transition and this component's opacity: isDragging ? 0.5 : 1 implement the spec exactly as documented in 08-RESEARCH.md's reference implementation, but confirming it renders correctly at a 360px viewport requires a human glance during end-of-phase verification (workflow.human_verify_mode = end-of-phase)."

duration: 12min
completed: 2026-09-18
status: complete
---

# Phase 8 Plan 5: Drag + Up/Down Reorder UI Summary

**Added `@dnd-kit`-powered drag-to-reorder and keyboard/screen-reader-accessible up/down move buttons to the Locations screen, both writing through Plan 08-02's already-tested `reorderLocations` function — closing out LOC-04, the last requirement in Phase 8.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-09-18T11:23:00Z (approx, immediately following Plan 08-04)
- **Completed:** 2026-09-18T11:35:07Z
- **Tasks:** 2
- **Files modified:** 3 (1 created)

## Accomplishments
- Installed `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (all three pre-vetted "Approved" in `08-RESEARCH.md`'s Package Legitimacy Audit)
- Built `SortableLocationList` — a `DndContext`/`SortableContext` wrapper using `PointerSensor` + `KeyboardSensor` and `closestCenter` collision detection, with a `renderRow` render-prop so the drag mechanics stay fully decoupled from LocationsScreen's row content
- Wired `SortableLocationList` into `LocationsScreen`, replacing the plain `.map()` loop; added `handleReorder` (drag-end callback, splices the array and calls `reorderLocations`) and `handleMove` (up/down button handler, computes the target index and delegates to `handleReorder` — no duplicate renumbering logic)
- Added `ChevronUp`/`ChevronDown` up/down buttons to every row, disabled at the first/last boundary (naturally covering the single-row case where both are disabled)
- Added the `locations.reorderHint` copy line above the list (only when the list is non-empty)
- Hidden locations stay draggable and button-movable in the same list, muted via the existing `opacity-60` styling — no separate section, no disabled state

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @dnd-kit and build SortableLocationList** - `3446a33` (feat)
2. **Task 2: Wire SortableLocationList + up/down buttons into LocationsScreen** - `468db2e` (feat)

**Plan metadata:** (this commit, created after this SUMMARY)

## Files Created/Modified
- `src/components/SortableLocationList.tsx` (new) - `DndContext`/`SortableContext` wrapper; `SortableLocationRow` applies `useSortable`'s transform/transition/opacity styles and spreads drag listeners onto a dedicated `GripVertical` handle button; renders caller-supplied row content via `renderRow(loc)`
- `package.json`, `package-lock.json` - `@dnd-kit/core@^6.3.1`, `@dnd-kit/sortable@^10.0.0`, `@dnd-kit/utilities@^3.2.2` added
- `src/routes/locations/index.tsx` - imports `SortableLocationList`, `reorderLocations`, `ChevronUp`/`ChevronDown`; adds `handleReorder`/`handleMove`; replaces the row `.map()` loop with `<SortableLocationList>`; adds up/down buttons between the Hidden badge and the hide/show toggle per the UI-SPEC row anatomy; adds the `reorderHint` line above the list

## Decisions Made
- **Drag handle as a plain `<button>`, not a shadcn `Button`:** keeps `{...attributes} {...listeners}` spreading simple and avoids fighting shadcn `Button`'s own event handling; styled directly with `min-h-11 min-w-11 touch-none cursor-grab active:cursor-grabbing` to match the UI-SPEC's 44×44px touch-target exception.
- **`SortableLocationRow` applies `opacity-60` for hidden rows at the row-wrapper level** (matching the exact className the previous `.map()` loop used), so `renderRow` only needs to supply the inner row content — no duplicated hidden-styling logic between the wrapper and the caller.
- **`handleMove` delegates to `handleReorder` rather than reimplementing the splice** — this was an explicit plan requirement (single renumbering code path) and keeps `reorderLocations` as the only place `order` values are ever written from the UI.

## Deviations from Plan

None - plan executed exactly as written. Both tasks' `<action>` and `<acceptance_criteria>` blocks were implemented as specified; no Rule 1-4 deviations were needed.

## Known Stubs

None.

## Issues Encountered

None. `npx tsc --noEmit`, `npm run build`, and the full `npx vitest run` (172/172) all pass clean after both tasks.

## User Setup Required

None - no external service configuration required.

## Human Verification Required (backstop, per UI-SPEC)

One backstop item from the UI-SPEC could not be automatically verified and is deferred to end-of-phase human verification (`workflow.human_verify_mode = end-of-phase`):

- **Drag-active visual + reflow smoothness at 360px:** dragging a row should show `opacity: 0.5` and the rest of the list should reflow without a layout jump on a 360px-wide mobile viewport. The implementation follows `08-RESEARCH.md`'s reference pattern exactly (`@dnd-kit`'s built-in transform/transition, `opacity: isDragging ? 0.5 : 1`), but this requires a human glance with a real pointer/touch drag — not exercised by `tsc`/`build`/`vitest`.

## Next Phase Readiness

- Phase 8 (Full Location Management) is now feature-complete: LOC-01 (rename, Plan 08-01), LOC-02 (hide/show, Plans 08-01/08-03/08-04), LOC-03 (delete-with-reassign, Plans 08-02/08-04), and LOC-04 (reorder, Plans 08-01/08-02/08-05) are all implemented and wired end-to-end.
- No blockers for phase completion. The one outstanding item is the backstop human-verification check above, which is expected to be confirmed during the phase's end-of-phase verification pass rather than blocking this plan's completion.

---
*Phase: 08-full-location-management*
*Completed: 2026-09-18*

## Self-Check: PASSED

`src/components/SortableLocationList.tsx`, `src/routes/locations/index.tsx`, and this SUMMARY.md verified present on disk; both task commits (`3446a33`, `468db2e`) verified present in `git log --oneline --all`.
