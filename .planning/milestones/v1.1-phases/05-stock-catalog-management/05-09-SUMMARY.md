---
phase: "05"
plan: "09"
subsystem: stock-data-model
tags: [schema, form, packCount, dexie-migration, tdd]
status: complete

dependency_graph:
  requires: []
  provides: [packCount-schema, packCount-form-ui, packCount-persistence]
  affects: [StockFields, StockEditSheet, new.tsx, db.ts]

tech_stack:
  added: []
  patterns: [dexie-version-upgrade, zod-nullable-optional, tdd-schema-validation]

key_files:
  created:
    - src/components/StockFields.test.ts
  modified:
    - src/lib/db.ts
    - src/components/StockFields.tsx
    - src/components/StockEditSheet.tsx
    - src/routes/medicines/new.tsx

decisions:
  - packCount placed after quantity in schema and before quantityUnit in JSX for logical grouping
  - test file uses vi.mock for React/dexie-react-hooks to avoid worker timeout from component-level Dexie initialization
  - moveStock in stockOps.ts does not propagate packCount to the new entry (out of scope for this plan; consistent with plan focus on add/edit flows)

metrics:
  duration_minutes: 52
  completed_date: "2026-08-25"
  tasks_completed: 2
  files_modified: 5
---

# Phase 05 Plan 09: packCount Schema + Form (G-05-2 schema half) Summary

**One-liner:** packCount field (boxes/packs count) added to Medicine interface via db.version(5) migration, Zod schema, and all stock add/edit form touchpoints.

## What Was Built

Gap G-05-2 (schema half) is closed. The `packCount: number | null` field now exists across the full stack:

1. **db.ts** — `packCount: number | null` added to the `Medicine` interface; `db.version(5)` migration backfills all existing records with `packCount = null`.

2. **StockFields.tsx** — `packCount: z.number().positive().nullable().optional()` added to `stockSchema`; a "Number of boxes" `FormField` added to the JSX between the quantity and quantityUnit sections. Empty input coerces to `null` (not `0` or `undefined`).

3. **StockEditSheet.tsx** — `packCount: stock.packCount` included in `defaultValues` and `useEffect` reset; `packCount: data.packCount ?? null` included in the `onSave` changes object.

4. **new.tsx** — `packCount: null` added to `stockForm` default values; `packCount: data.packCount ?? null` passed in `handleStockSubmit` to `addStockEntry`.

## Commits

| Hash | Message |
|------|---------|
| 435c594 | feat(05-09): add packCount field to Medicine interface and db.version(5) |
| 39e434e | test(05-09): add failing tests for packCount in stockSchema |
| c1c6544 | feat(05-09): add packCount form field, schema validation, and persistence |

## Verification Results

- `npx tsc --noEmit` — clean (exit 0) throughout
- `npx vitest run` — 111/111 tests passed (11 test files)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test worker timeout from React/Dexie component imports**
- **Found during:** Task 2 TDD RED phase
- **Issue:** `StockFields.test.ts` importing `stockSchema` from `StockFields.tsx` causes the full component module to load, including `useLiveQuery` from `dexie-react-hooks` and React hooks. The jsdom worker timed out before any tests ran.
- **Fix:** Added `vi.mock()` for `react`, `dexie-react-hooks`, and `@/lib/db` in the test file, isolating the Zod schema under test from the component runtime.
- **Files modified:** `src/components/StockFields.test.ts`
- **Commit:** c1c6544 (included in GREEN implementation commit)

## Known Stubs

None — packCount is fully wired from form input through schema validation to DB persistence.

## Threat Mitigations Applied

| Threat ID | Mitigation |
|-----------|------------|
| T-05-09-01 | `z.number().positive().nullable().optional()` rejects zero and negative values; null coercion is explicit in form onChange and onSave |

## Notes

- `moveStock` in `stockOps.ts` creates a new stock entry without propagating `packCount`. This is consistent with plan scope (add/edit flows only) and is a known gap. The new entry at the target location starts with `packCount = null`, which is the correct default for an unknown box count.

## Self-Check

- [x] src/lib/db.ts — Medicine interface has packCount, db.version(5) present
- [x] src/components/StockFields.tsx — stockSchema has packCount, FormField rendered
- [x] src/components/StockEditSheet.tsx — defaultValues, reset, and onSave include packCount
- [x] src/routes/medicines/new.tsx — defaultValues and handleStockSubmit include packCount
- [x] src/components/StockFields.test.ts — 6 schema tests pass
- [x] Commits: 435c594, 39e434e, c1c6544 exist in git log
- [x] TypeScript clean, 111/111 tests green

## Self-Check: PASSED
