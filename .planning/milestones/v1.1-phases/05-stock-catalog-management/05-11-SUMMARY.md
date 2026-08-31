---
phase: 05-stock-catalog-management
plan: 11
subsystem: catalog-management
tags: [catalog, delete, alert-dialog, guard, stockOps]
dependency_graph:
  requires: [05-10]
  provides: [G-05-8-closed, deleteCatalogEntry]
  affects: [src/lib/stockOps.ts, src/routes/medicines/[id].tsx]
tech_stack:
  added: []
  patterns: [AlertDialog-branching, active-stock-guard, db.transaction-delete]
key_files:
  created: []
  modified:
    - src/lib/stockOps.ts
    - src/routes/medicines/[id].tsx
decisions:
  - "deleteCatalogEntry re-checks active stock count inside the function before deleting (T-05-11-01 mitigation)"
  - "AlertDialog branches on stockEntries.length from the already-loaded useLiveQuery array — no extra DB query"
  - "Confirm action only rendered when stockEntries.length === 0 (conditional render, not disabled state)"
metrics:
  duration: 12
  completed_date: "2026-08-26"
  tasks_completed: 2
  files_modified: 2
status: complete
requirements: [CAT-03]
---

# Phase 05 Plan 11: Catalog Deletion Summary

Implemented catalog deletion end-to-end with an active-stock guard. Users can now delete a catalog entry from the detail view. Deletion is blocked when active stock entries exist; confirmed deletion removes the catalog row atomically and navigates to /medicines.

## What Was Built

**`deleteCatalogEntry` in `src/lib/stockOps.ts`:**
- Counts active stock entries (filter deletedAt === null) for the given catalogId
- Throws `'Cannot delete catalog with active stock entries'` if count > 0
- Wraps `db.medicine_catalog.delete(catalogId)` in `db.transaction('rw', ...)` for atomicity
- Closes threat T-05-11-01 (UI guard alone not relied on; function re-enforces server-side)

**Catalog delete UI in `src/routes/medicines/[id].tsx`:**
- `catalogDeleteOpen` state and `handleCatalogDeleteConfirm` handler added
- Trash2 button (red, `aria-label="Delete catalog"`) added to catalog header after the pencil button
- AlertDialog branches on `stockEntries.length`:
  - Active stock present: title "Cannot delete catalog", only Cancel shown
  - No active stock: title "Delete catalog?", destructive Delete action calls handler
- `handleCatalogDeleteConfirm`: `await deleteCatalogEntry(catalogId)` → `toast.success` → `void navigate('/medicines')` on success; `toast.error` + `console.error` on failure

## Tasks

| # | Name | Type | Commit | Files |
|---|------|------|--------|-------|
| 1 | deleteCatalogEntry function | tracer | 85b927a | src/lib/stockOps.ts |
| 2 | Catalog delete button + AlertDialog + navigation | auto | 54f9e6b | src/routes/medicines/[id].tsx |

## Verification

- `npx tsc --noEmit`: clean (no output)
- `npx vitest run`: 112/113 passed; 1 pre-existing timeout failure in `medicines-list.test.ts` (dynamic import with cache-busting timestamp in jsdom — unrelated to this plan)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — threat model was fully addressed:
- T-05-11-01 (Tampering): deleteCatalogEntry re-checks active stock before delete
- T-05-11-02 (DoS/orphaned stock): active-stock guard prevents orphaned medicines

## Self-Check

- [x] `src/lib/stockOps.ts` modified with `deleteCatalogEntry` export
- [x] `src/routes/medicines/[id].tsx` modified with button, state, handler, AlertDialog
- [x] Commit 85b927a exists (tracer)
- [x] Commit 54f9e6b exists (UI)
- [x] TypeScript compiles cleanly
- [x] Gap G-05-8 closed
</content>
</invoke>