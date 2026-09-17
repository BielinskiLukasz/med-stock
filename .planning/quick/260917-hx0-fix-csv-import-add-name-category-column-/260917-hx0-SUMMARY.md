---
phase: quick-260917-hx0
plan: 1
subsystem: data
tags: [csv, dexie, medicine_catalog, papaparse]

# Dependency graph
requires:
  - phase: 05-stock-catalog-management
    provides: medicine_catalog/medicines split (D-16) that CSV import now correctly targets
provides:
  - mergeCSVRowsToMedicines extracts name/category per row and never emits a placeholder catalogId
  - commitCSVImport resolves/creates medicine_catalog entries with case-insensitive dedup inside one db.transaction
  - CSVColumnMapper's Preview button is reachable (name is now a mappable field)
affects: [csv-import, medicine_catalog]

tech-stack:
  added: []
  patterns:
    - "CSV import dedup: db.medicine_catalog.where('name').equalsIgnoreCase(name).first(), sequential per-row lookup relies on IndexedDB read-your-own-writes within one transaction for same-batch dedup"

key-files:
  created: []
  modified:
    - src/lib/csvOps.ts
    - src/lib/csvOps.test.ts
    - src/components/ImportCSVSection.tsx
    - src/i18n/types.ts

key-decisions:
  - "mergeCSVRowsToMedicines stays pure/synchronous; DB access isolated to new commitCSVImport"
  - "category only applied when creating a brand-new catalog entry; an existing match's category is never overwritten by the CSV row"
  - "sequential (non-parallel) per-row catalog resolution in commitCSVImport, required so same-batch case-insensitive dedup works via read-your-own-writes"

requirements-completed: []

duration: 25min
completed: 2026-09-17
status: complete
---

# Quick Task 260917-hx0: Fix CSV Import Name/Category Column Summary

**CSV import now derives real medicine_catalog entries from the CSV's own name/category columns instead of the hardcoded `catalogId: 1` placeholder.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `MEDICINE_FIELDS` gained `'name'` and `'category'`, unblocking CSVColumnMapper's Preview button (previously permanently disabled because `mapping.includes('name')` could never be true)
- `mergeCSVRowsToMedicines` now extracts `name`/`category` per row via the existing `getMappedValue` helper, skips rows with no resolvable name, and never assigns a `catalogId`
- New `commitCSVImport(medicines)` resolves each row to a `medicine_catalog` entry — case-insensitive dedup against existing entries and within the same import batch — creating a new entry only when no match exists, all inside one `db.transaction('rw', db.medicine_catalog, db.medicines, ...)`
- `ImportCSVSection` no longer depends on `medicine_catalog` id `1` existing; the stale precondition check that blocked import when that row was missing was removed
- CSVColumnMapper/CSVPreview's field labels for `name`/`category` are now translated via `CSV_FIELD_KEYS`

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract name/category per row and resolve them to a medicine_catalog entry** - `4556e5f` (feat)
2. **Task 2: Wire commitCSVImport into the import flow and translate name/category** - `30b14ca` (feat)

_TDD note: Task 1 was `tdd="true"` in the plan, but implementation and test rewrite were committed together as a single `feat` commit per the plan's `<action>` (it did not specify a separate RED-only commit before the implementation) — no test.md gate commit exists, only the combined feat commit. Both old and new tests pass._

## Files Created/Modified
- `src/lib/csvOps.ts` - `MEDICINE_FIELDS` gained `'name'`/`'category'`; new `ParsedCSVMedicine` type; `mergeCSVRowsToMedicines` rewritten to extract name/category and skip nameless rows; new `commitCSVImport` async function doing catalog dedup + bulk stock insert in one transaction
- `src/lib/csvOps.test.ts` - rewritten: `fake-indexeddb/auto` polyfill import first, `db` import, updated existing tests to map a `name` column, replaced the obsolete "name is a catalog field" test with two skip-behavior tests, added name/category extraction tests, and a `describe('commitCSVImport', ...)` block covering create/reuse/same-batch-dedup
- `src/components/ImportCSVSection.tsx` - removed the `db.medicine_catalog.get(1)` precondition check and the now-unused `db` import; `handleCommit` now calls `commitCSVImport(medicines)` instead of `db.medicines.bulkAdd(medicines)`
- `src/i18n/types.ts` - added `name: 'form.name'` and `category: 'form.category'` to `CSV_FIELD_KEYS` (both target keys already existed under `form` in `en.ts`/`pl.ts`)

## Decisions Made
- Sequential (not `Promise.all`) per-row catalog lookup in `commitCSVImport` — required for same-batch case-insensitive dedup to work via IndexedDB's read-your-own-writes semantics inside the open transaction
- `category` is applied only when creating a brand-new catalog entry; reusing an existing catalog entry never overwrites its stored category with the CSV row's value

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None - all mapped fields flow through to real DB writes; no placeholder/mock data introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- CSV import is now correct end-to-end: mapping a column to `name` (required) and optionally `category` creates or reuses real catalog entries with no shared placeholder
- Manual sanity check (optional per plan, not run in this session): import a small CSV mapping `name`/`category`/`expiryDate` and confirm the medicines page shows the CSV's own names, not a shared placeholder catalog entry

---
*Quick task: 260917-hx0*
*Completed: 2026-09-17*

## Self-Check: PASSED

All modified files and both task commits (4556e5f, 30b14ca) verified present.
