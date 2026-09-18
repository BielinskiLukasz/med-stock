---
phase: 08-full-location-management
plan: 04
subsystem: ui
tags: [react, dexie, radix-select, alert-dialog, i18n]

# Dependency graph
requires:
  - phase: 08-full-location-management (Plan 08-01)
    provides: "Location.hidden/order fields, db.version(6) schema, full locations.*/aria.* i18n vocabulary"
  - phase: 08-full-location-management (Plan 08-02)
    provides: "toggleLocationHidden, countActiveLocationReferences, deleteLocationWithReassign (atomic, no isDefault guard)"
provides:
  - "LocationsScreen hide/show toggle (Eye/EyeOff) on every row, unconditional of isDefault (D-05)"
  - "Hidden-row 'Hidden' badge + opacity-60 muting, inline in the same list (D-08)"
  - "Delete-with-reassign AlertDialog: zero-ref simple confirm vs. live-count reassign/clear Select, confirm disabled until a target is chosen (D-09/D-11)"
  - "Empty state (locations.emptyHeading/Body) when zero locations exist (D-12)"
  - "maxLength=60 on add/rename inputs; truncate+title on the name span"
  - "Duplicate-name error branch (locations.errorDuplicate) in handleAdd/handleRename"
affects: [08-05-full-location-management]

# Actuals (#2632)
actuals:
  tokens: 4039
  tasks: 2
  commits: 1

tech-stack:
  added: []
  patterns:
    - "Per-row AlertDialog made fully controlled (open={deleteTargetId === loc.id}) so the confirm-count fetch (countActiveLocationReferences) can run inside onOpenChange before the dialog body renders, instead of firing on AlertDialogTrigger's onClick"
    - "Radix Select's controlled `value` cannot be null, so a string sentinel (REASSIGN_OTHER = '__OTHER__') stands in for the 'clear to Other' choice and is translated back to null only at the deleteLocationWithReassign call site"

key-files:
  created: []
  modified:
    - src/routes/locations/index.tsx

key-decisions:
  - "Both plan tasks (hide/show+empty-state+maxLength+duplicate-error, and the delete-with-reassign dialog) landed in a single commit — they rewrite the same row-JSX subtree (the AlertDialog delete block sits inside the same row div the hide toggle/badge/truncate span were added to), so a clean per-task line-level split via git add -p wasn't practical without re-doing the edit as two separate passes. No functional overlap or omission resulted; both tasks' acceptance criteria were verified independently via targeted greps before committing."
  - "reassignTo modeled as string | undefined (never null) to match Radix Select's controlled value prop; REASSIGN_OTHER sentinel represents the explicit 'Other' choice, translated to null only when calling deleteLocationWithReassign"
  - "Zero-ref delete path reuses the existing handleDelete(id) (calls deleteLocationWithReassign(id, null)) unchanged; the reassign-body path is a new handleReassignDelete(id) using AlertDialogFooter but a plain destructive Button (not AlertDialogAction) so the disabled-until-chosen guard and explicit setDeleteTargetId(null) close logic could be wired directly"

requirements-completed: [LOC-02, LOC-03]

coverage:
  - id: D1
    description: "Hide/show toggle (Eye/EyeOff) renders on every location row regardless of isDefault, and toggling calls toggleLocationHidden"
    requirement: "LOC-02"
    verification:
      - kind: other
        ref: "grep -n \"isDefault &&\" src/routes/locations/index.tsx (zero matches); npx tsc --noEmit"
        status: pass
    human_judgment: false
  - id: D2
    description: "Hidden rows show a 'Hidden' badge and opacity-60 muting inline in the same list (not a separate section)"
    requirement: "LOC-02"
    verification:
      - kind: other
        ref: "grep -n \"t('locations.hidden')\\|opacity-60\" src/routes/locations/index.tsx"
        status: pass
    human_judgment: true
    rationale: "Visual muting/contrast on a screen with no component test — the UI-SPEC itself flags this as a backstop item (WCAG AA contrast at opacity-60 against light/dark background), which needs a human glance to confirm legibility."
  - id: D3
    description: "Deleting a zero-reference location still opens a confirm dialog before deleting (never silent/instant)"
    requirement: "LOC-03"
    verification:
      - kind: other
        ref: "npx tsc --noEmit; npm run build; manual code read of the activeRefCount === 0 branch retaining the existing AlertDialog confirm"
        status: pass
    human_judgment: false
  - id: D4
    description: "Deleting a location with active references shows a live count and a reassign-target Select (excluding the deleted location and hidden locations) or 'Clear (set to Other)', with confirm disabled until a target is chosen"
    requirement: "LOC-03"
    verification:
      - kind: other
        ref: "grep -n \"filter((l) => l.id !== loc.id && !l.hidden)\\|disabled={reassignTo === undefined}\" src/routes/locations/index.tsx; npm run build"
        status: pass
    human_judgment: false
  - id: D5
    description: "Confirming the reassign dialog calls deleteLocationWithReassign(id, target) atomically"
    requirement: "LOC-03"
    verification:
      - kind: other
        ref: "grep -n \"deleteLocationWithReassign(id, reassignTo\" src/routes/locations/index.tsx (builds on Plan 08-02's already-unit-tested atomic transaction)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Add/Edit-location and inline rename inputs enforce maxLength=60; duplicate-name errors show distinct copy (locations.errorDuplicate) instead of the generic errorAdd/errorRename"
    verification:
      - kind: other
        ref: "grep -n \"maxLength={60}\\|Location name already exists\" src/routes/locations/index.tsx"
        status: pass
    human_judgment: false
  - id: D7
    description: "Zero-location empty state renders emptyHeading/emptyBody instead of an empty list, with the Add-location button still visible"
    verification:
      - kind: other
        ref: "grep -n \"emptyHeading\\|emptyBody\" src/routes/locations/index.tsx; npx tsc --noEmit"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-09-18
status: complete
---

# Phase 8 Plan 4: Locations Screen — Hide/Show Toggle + Delete-with-Reassign Dialog Summary

**Rewrote the Locations screen row actions to add a hide/show toggle available on every row (predefined and custom alike) and replaced the simple delete confirm with a live-count reassign-or-clear picker, closing out D-05/D-08/D-09/D-11/D-12 from CONTEXT.md.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-09-18T11:05:56Z
- **Completed:** 2026-09-18T11:14:26Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Every location row now has an `Eye`/`EyeOff` hide/show toggle calling `toggleLocationHidden`, with no `isDefault` branch (D-05) — hidden rows show a `t('locations.hidden')` badge and `opacity-60` muting, staying inline in the same list (D-08)
- The delete flow computes `countActiveLocationReferences(loc.name)` when the per-row `AlertDialog` opens (now fully controlled via `open`/`onOpenChange`), branching the dialog body: zero references keeps the existing simple confirm; one-or-more references shows the live count plus a `Select` of reassign targets (excluding the location being deleted and any hidden location) or "Clear (set to Other)", with the confirm button disabled until a target is chosen (D-09, D-11) — resolving the UI-SPEC's "partial" unresolved row
- `deleteLocation` no longer appears anywhere in the file; the screen calls `deleteLocationWithReassign` exclusively, atomically reassigning/clearing then deleting
- Zero-location empty state (`locations.emptyHeading`/`emptyBody`) renders in place of the row list, with "Add location" still visible (D-12)
- `maxLength={60}` added to both the add-location and rename inputs; the location-name span truncates with a native `title` tooltip carrying the full name
- `handleAdd`/`handleRename` catch blocks now branch on the thrown `'Location name already exists'` message, showing `locations.errorDuplicate` instead of the generic fallback

## Task Commits

Both plan tasks landed in a single commit — see "Decisions Made" below for why a clean per-task split wasn't practical:

1. **Tasks 1+2: hide/show toggle, badge, empty state, maxLength, duplicate-error branch, delete-with-reassign dialog** - `67e1cba` (feat)

**Plan metadata:** (this commit, created after this SUMMARY)

## Files Created/Modified
- `src/routes/locations/index.tsx` - hide/show toggle + badge + opacity muting; empty state; `maxLength={60}` on both inputs; truncate+title on the name span; duplicate-name error branch in add/rename; delete `AlertDialog` made controlled and split into zero-ref vs. reassign-body variants with a `Select` reassign-target picker; `deleteLocation` import removed entirely

## Decisions Made
- **Single commit for both tasks:** Task 1 (hide/show toggle, badge, empty state, maxLength, duplicate-error) and Task 2 (delete-with-reassign dialog) both modify the same row-rendering JSX subtree in `LocationsScreen` — the delete `AlertDialog` block lives inside the same per-row `<div>` that Task 1 added the hide toggle, badge, and truncated name span to. Because both tasks' changes were interleaved in one continuous rewrite of that block, splitting them into two atomic commits via line-level staging wasn't practical without re-doing the edit as two literal sequential passes. Both tasks' acceptance criteria were still verified independently (via the greps listed in each `coverage` entry above) before the single commit was made — no functional overlap or omission resulted.
- **`reassignTo: string | undefined`, never `null`:** Radix `Select`'s controlled `value` prop rejects `null`. Introduced a `REASSIGN_OTHER = '__OTHER__'` string sentinel for the "Clear (set to Other)" choice; `undefined` means "nothing chosen yet" (blocks the confirm button per the UI-SPEC's explicit guard requirement), and `REASSIGN_OTHER` is translated back to `null` only at the `deleteLocationWithReassign` call site.
- **Reassign-confirm uses a plain destructive `Button`, not `AlertDialogAction`:** `AlertDialogAction` auto-closes the dialog synchronously on click regardless of the async delete's completion, and doesn't cleanly compose with the `disabled` guard's semantics here. Using a plain `Button` inside `AlertDialogFooter`, with `handleReassignDelete` explicitly calling `setDeleteTargetId(null)` after the awaited delete succeeds, keeps the dialog open on a failed delete (so the inline error message is visible) while still closing on success — matching the existing `deleteLocation`'s error-handling shape (`setError` on catch, no early close).
- **Per-row `AlertDialog` made fully controlled:** `open={deleteTargetId === loc.id}` with `onOpenChange` running `countActiveLocationReferences` before flipping `deleteTargetId` — this lets the dialog body branch on `activeRefCount` from the moment it renders, rather than needing a loading flicker inside `AlertDialogContent` itself.
- **No new i18n key for the hide/show toggle's error path:** `toggleLocationHidden` reuses `t('locations.errorDelete')` on failure (a single-field update is very unlikely to throw, and the UI-SPEC/CONTEXT didn't call for a dedicated toggle-error copy key) rather than inventing new copy not specified anywhere.

## Deviations from Plan

None - plan executed exactly as written. Both tasks' `<action>` and `<acceptance_criteria>` blocks were implemented as specified; the single-commit granularity above is a process note, not a behavioral deviation (Rules 1-4 didn't apply — nothing broke, nothing was missing, no architectural change was needed).

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `LocationsScreen` now fully implements D-05, D-08, D-09, D-11, D-12 — hide/show and delete-with-reassign are both live and wired to Plan 08-02's tested `locationOps.ts` functions
- Plan 08-05 (drag/button reorder UI) can build directly on this file: the row template established here (name span, hide/show toggle, Edit, Delete) is the same template the reorder UI's drag handle and up/down buttons will be prepended/appended to
- No blockers identified for Plan 08-05

---
*Phase: 08-full-location-management*
*Completed: 2026-09-18*

## Self-Check: PASSED

`src/routes/locations/index.tsx` and this SUMMARY.md verified present on disk; commit `67e1cba` verified present in `git log --oneline`.
