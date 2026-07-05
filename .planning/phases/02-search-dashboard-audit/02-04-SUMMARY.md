---
phase: 02-search-dashboard-audit
plan: 04
subsystem: ui
tags: [trash-bin, soft-delete, change-history, dexie, historyOps, react, shadcn]

requires:
  - phase: 02-01
    provides: [historyOps, softDeleteMedicine, updateMedicineWithHistory, addMedicineHistory, restoreMedicine, permanentDeleteMedicine, db.history]
  - phase: 02-02
    provides: [TrashScreen stub, App.tsx trash route, 4-tab nav]

provides:
  - TrashScreen (full implementation with restore + permanent-delete)
  - ChangeHistory component (collapsible timeline in detail view)
  - HistoryEntry component (single formatted history entry)
  - Phase 1 delete mechanism replaced with softDeleteMedicine()
  - Edit form writes history via updateMedicineWithHistory()
  - Create form writes 'created' history entry via addMedicineHistory()

affects: []

tech-stack:
  added: []
  patterns:
    - "soft-delete-navigation: softDeleteMedicine() followed by navigate() in route handler"
    - "before-snapshot pattern: capture medicine from useLiveQuery before calling updateMedicineWithHistory"
    - "best-effort-create-history: addMedicineHistory() called after db.medicines.get(newId) confirmation"
    - "collapsible-section-with-count: useState + toggle button showing entry count"
    - "history-entry-format: {timestamp} — {action summary} per UI-SPEC"

key-files:
  created:
    - src/components/ChangeHistory.tsx
    - src/components/HistoryEntry.tsx
  modified:
    - src/routes/medicines/[id].tsx
    - src/routes/medicines/[id].edit.tsx
    - src/routes/medicines/new.tsx
    - src/routes/trash/index.tsx

key-decisions:
  - "handleDelete in [id].tsx calls softDeleteMedicine(medicine) — never direct db.medicines.update with manualStatus (D-25, Pitfall 2 fix)"
  - "handleSubmit in [id].edit.tsx captures 'before' snapshot from useLiveQuery then calls updateMedicineWithHistory — diff computed in historyOps"
  - "addMedicineHistory called after db.medicines.get(newId) confirmation — best-effort, not in shared transaction with add"
  - "TrashScreen uses toCollection().filter(m => m.deletedAt !== null) — not where/notEqual(null) per Pitfall 1"
  - "permanentDeleteMedicine never deletes history entries — T-02-07 mitigation; AlertDialog confirmation required per T-02-09"
  - "ChangeHistory returns null while loading (history section loads silently, no spinner flash)"

patterns-established:
  - "ChangeHistory placement: below field list, above Actions div in detail view"
  - "AlertDialog for permanent delete in Trash: 'Delete medicine permanently?' + 'This cannot be undone, but history will be preserved.'"

requirements-completed:
  - HIST-01
  - HIST-02
  - TRSH-01
  - TRSH-02
  - TRSH-03
  - TRSH-04

coverage:
  - id: D1
    description: "Phase 1 delete mechanism replaced — [id].tsx handleDelete calls softDeleteMedicine() setting deletedAt, not manualStatus='Disposed'"
    requirement: TRSH-01
    verification:
      - kind: unit
        ref: "grep: src/routes/medicines/[id].tsx contains softDeleteMedicine; does not contain manualStatus.*Disposed in handleDelete"
        status: pass
    human_judgment: false
  - id: D2
    description: "Edit form writes history — [id].edit.tsx handleSubmit calls updateMedicineWithHistory() with before snapshot and changed fields"
    requirement: HIST-01
    verification:
      - kind: unit
        ref: "grep: src/routes/medicines/[id].edit.tsx contains updateMedicineWithHistory; no direct db.medicines.update in handleSubmit"
        status: pass
    human_judgment: false
  - id: D3
    description: "Create form writes 'created' history entry — new.tsx calls addMedicineHistory(newMedicine, 'created') after db.medicines.add()"
    requirement: HIST-01
    verification:
      - kind: unit
        ref: "grep: src/routes/medicines/new.tsx contains addMedicineHistory"
        status: pass
    human_judgment: false
  - id: D4
    description: "Trash Bin route shows deleted medicines with Restore and Delete Permanently buttons; empty state shows 'Trash is empty.'"
    requirement: TRSH-01
    verification:
      - kind: unit
        ref: "grep: src/routes/trash/index.tsx exports TrashScreen; contains toCollection().filter; contains AlertDialog; no db.history.delete"
        status: pass
    human_judgment: true
    rationale: "Trash UI interaction (restore, permanent delete, empty state) requires browser rendering to verify correctly"
  - id: D5
    description: "ChangeHistory component in detail view — collapsible section showing timeline of history entries for a medicine"
    requirement: HIST-02
    verification:
      - kind: unit
        ref: "grep: src/components/ChangeHistory.tsx exports ChangeHistory; contains useState; contains where('medicineId').equals"
        status: pass
    human_judgment: true
    rationale: "Collapsible behavior and timeline rendering require UI interaction to verify the expand/collapse and entry display"
  - id: D6
    description: "HistoryEntry component formats entries as '{timestamp} — {action summary}' per UI-SPEC"
    requirement: HIST-02
    verification:
      - kind: unit
        ref: "grep: src/components/HistoryEntry.tsx exports HistoryEntry; contains formatEntry"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-07-01
status: complete
---

# Phase 02 Plan 04: Trash Bin and Change History Summary

**Trash Bin with restore/permanent-delete and collapsible Change History timeline wired into detail view, replacing Phase 1 manualStatus delete mechanism with softDeleteMedicine()**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-01T01:00:00Z
- **Completed:** 2026-07-01T01:20:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Phase 1 delete mechanism (`manualStatus='Disposed'`) fully replaced with `softDeleteMedicine()` in `[id].tsx` — medicines now move to Trash Bin, not merely get flagged (D-25, Pitfall 2)
- `[id].edit.tsx` handleSubmit now calls `updateMedicineWithHistory()` capturing a before-snapshot from `useLiveQuery` — every field change logged with old/new values (HIST-01)
- `new.tsx` calls `addMedicineHistory(newMedicine, 'created')` after medicine creation — 'created' entry written for every new medicine (HIST-01)
- Full `TrashScreen` replaces stub: `toCollection().filter(m => m.deletedAt !== null)`, Restore button, AlertDialog-gated Delete Permanently, empty state 'Trash is empty.' (TRSH-01 through TRSH-04)
- `ChangeHistory` component: collapsible section using `where('medicineId').equals()`, entry count badge, `useState` toggle, wired into detail view below field list (HIST-02)
- `HistoryEntry` component: formats entries as `{timestamp} — {action summary}` per UI-SPEC copywriting

## Task Commits

1. **Task 1: Fix delete handler, wire history to edit/create, add ChangeHistory component** - `2747f2a` (feat)
2. **Task 2: Full Trash Bin route with restore and permanent-delete** - `5c36d2b` (feat)

## Files Created/Modified

- `src/routes/medicines/[id].tsx` — handleDelete replaced with softDeleteMedicine(); ChangeHistory added; AlertDialog description updated to Trash Bin wording
- `src/routes/medicines/[id].edit.tsx` — handleSubmit replaced db.medicines.update with updateMedicineWithHistory(); import added
- `src/routes/medicines/new.tsx` — addMedicineHistory() called after db.medicines.add() + get() confirmation
- `src/routes/trash/index.tsx` — stub replaced with full TrashScreen: useLiveQuery toCollection().filter, handleRestore, handlePermanentDelete with AlertDialog
- `src/components/ChangeHistory.tsx` — new: collapsible history timeline via useLiveQuery + useState
- `src/components/HistoryEntry.tsx` — new: formats and renders individual history entries

## Decisions Made

- `handleDelete` in `[id].tsx` must guard `if (!medicine) return` before calling `softDeleteMedicine(medicine)` — medicine from `useLiveQuery` can be `undefined` momentarily during load
- `handleSubmit` in `[id].edit.tsx` captures `const before = medicine` at call time — `useLiveQuery` value is guaranteed non-null by the `if (medicine === null)` guard above the form render
- `addMedicineHistory` in `new.tsx` is best-effort (not inside the same transaction as `db.medicines.add`) — acceptable per plan; medicine is confirmed added before history write
- `TrashScreen` uses `toCollection().filter(m => m.deletedAt !== null).sortBy('name')` — not `where('deletedAt').notEqual(null)` per Pitfall 1 (null not a valid IndexedDB key)
- `permanentDeleteMedicine` never touches `db.history` — T-02-07 mitigation satisfied; grep confirms `db.history.delete` count is 0 in trash route

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. All data remains local IndexedDB only.

- `permanentDeleteMedicine` does not call `db.history.delete()` — verified by grep (count: 0 in trash/index.tsx). Satisfies T-02-07.
- AlertDialog confirmation required before `permanentDeleteMedicine` is invoked — T-02-09 mitigation applied.
- `ChangeHistory` renders `entry.action` and formatted field names/values from DB — React escapes all rendered strings, no XSS surface. T-02-10: accept.

## Self-Check

- [x] `npm run build` exits 0 (verified — exit code 0)
- [x] `npm run test -- --run` exits 0 — 56 tests pass (all prior tests pass; no new test file added in this plan)
- [x] `src/routes/medicines/[id].tsx` contains `import { softDeleteMedicine }` — count: 2
- [x] `src/routes/medicines/[id].tsx` does NOT contain `manualStatus.*Disposed` in handleDelete — count: 0
- [x] `src/routes/medicines/[id].tsx` contains `ChangeHistory` — count: 2
- [x] `src/routes/medicines/[id].edit.tsx` contains `updateMedicineWithHistory` — count: 2
- [x] `src/routes/medicines/new.tsx` contains `addMedicineHistory` — count: 2
- [x] `src/routes/trash/index.tsx` exports `TrashScreen` (not stub) — count: 1
- [x] `src/routes/trash/index.tsx` contains `toCollection()` and `.filter(m => m.deletedAt !== null)` on consecutive lines
- [x] `src/routes/trash/index.tsx` contains `AlertDialog` — count: 26 (all imports + usage)
- [x] `src/routes/trash/index.tsx` does NOT contain `db.history.delete` — count: 0
- [x] `src/components/ChangeHistory.tsx` exports `ChangeHistory` and contains `useState` — both confirmed
- [x] `src/components/ChangeHistory.tsx` contains `where('medicineId').equals(medicineId)` — confirmed
- [x] `src/components/HistoryEntry.tsx` exports `HistoryEntry` — confirmed
- [x] Task 1 commit: `2747f2a`
- [x] Task 2 commit: `5c36d2b`

## Self-Check: PASSED
