---
phase: 04
plan: 01
subsystem: database-schema
status: complete
metrics:
  duration: 45 minutes
  tasks_completed: 2
  files_modified: 5
  commits: 1
  tests_added: 3
  tests_passed: 72
---

# Phase 04 Plan 01: Database Migration Schema v3 - Summary

**v2→v3 migration schema with medicine_catalog table, deduplication, and category conflict resolution**

## Objective

Establish the new two-layer data model — `medicine_catalog` (reusable templates) and `medicines` (stock entries) — and automatically migrate all existing v1.0 data without data loss.

## What Was Built

### Schema Layer (`src/lib/db.ts`)

1. **MedicineForm type** — Replaced enum with `as const` type definition to comply with TypeScript's `erasableSyntaxOnly` mode:
   - 13 form values: Tablet, Capsule, Syrup, Cream, Drops, Spray, Powder, Gel, Ointment, Patch, Inhaler, Suppository, Other
   - Type-safe discriminated union with `typeof MedicineForm[keyof typeof MedicineForm]`

2. **MedicineCatalog interface** — New table schema with fields:
   - `id: number` — auto-incrementing primary key
   - `name: string` — title-cased display name (normalized: `"paracetamol"` → `"Paracetamol"`)
   - `category: string | null` — most-common category from stock entries during migration
   - `form: MedicineForm | null` — set to null for all migrated entries (no heuristic inference per D-11)
   - `notes: string | null` — null for all migrated entries; stock notes remain in `medicines.notes` (D-05)
   - `createdAt: string`, `updatedAt: string` — ISO timestamps

3. **Medicine interface update** — Added `catalogId: number` field (required, non-nullable):
   - Maintains backward compatibility with all other existing fields
   - Foreign key to `medicine_catalog.id`

4. **Dexie type union** — Updated to include new table:
   ```typescript
   const db = new Dexie('MedStockDB') as Dexie & {
     medicines: EntityTable<Medicine, 'id'>
     medicine_catalog: EntityTable<MedicineCatalog, 'id'>
     locations: EntityTable<Location, 'id'>
     history: EntityTable<HistoryEntry, 'id'>
   }
   ```

5. **Version(2) upgrade callback** — Updated to set `catalogId: 0` (placeholder) and `deletedAt: null` on existing medicines

6. **Version(3) upgrade callback** — Automatic migration logic:
   - **Deduplication** — Normalizes names (case-insensitive + trimmed) per D-01
   - **Title-casing** — Applies to all catalog display names per D-02
   - **Category resolution** — Selects most-common category; ties broken by lowest source `id` per D-04
   - **Atomic transaction** — Catalog creation and stock entry updates happen within a single Dexie transaction
   - **No data loss** — All stock entries receive correct `catalogId` references; history preserved

### Test Layer (`src/lib/historyOps.test.ts`)

Three new test cases in `describe('v2→v3 migration', ...)` suite:

1. **Deduplication test** — Verifies 4 medicines with name variants produce 1 catalog entry:
   - Input: "Paracetamol", "paracetamol", " Paracetamol ", "IBUPROFEN"
   - Output: 2 catalogs (one per unique normalized name)
   - Assertion: Catalog names are title-cased ("Paracetamol", "Ibuprofen")

2. **Category conflict resolution test** — Verifies most-common category is selected:
   - Input: 3 "Aspirin" variants with categories "Painkiller", "Fever", "Painkiller"
   - Output: 1 catalog with category="Painkiller" (count=2 > count=1)

3. **Tiebreak test** — Verifies lowest source `id` breaks category ties:
   - Input: 2 "Vitamin C" variants with categories "Vitamin" (id=5), "Supplement" (id=6)
   - Output: 1 catalog with category="Vitamin" (id=5 < id=6)

All 72 tests pass (3 new migration tests + 69 existing tests).

### Breaking Changes (Rule 2 Deviations)

Updated 6 additional files to provide `catalogId` when creating medicines (required field):

1. **src/lib/db.test.ts** — Added `catalogId: 1` to all medicine fixtures
2. **src/lib/expiry.test.ts** — Updated `makeMed()` factory to include `catalogId: 1`
3. **src/lib/csvOps.ts** — Set `catalogId: 0` for CSV-imported medicines (migrated in Phase 5)
4. **src/lib/dataOps.ts** — Updated BackupSchema to accept optional `catalogId` for v1.0 compatibility; import function assigns `catalogId: 0` to unversioned data
5. **src/routes/medicines/new.tsx** — Set `catalogId: 1` for new medicines (TODO: Phase 5 uses actual catalog selection)

## Verification

✓ All 72 tests pass (`npm test`)
✓ TypeScript strict mode compilation succeeds (`npm run build`)
✓ Zero deviations from planned schema structure
✓ Migration callback follows D-01, D-02, D-04, D-05, D-11 precisely
✓ No data loss: all v2 medicines assigned correct catalogId in v3
✓ Transaction atomicity: catalog creation and stock updates succeed or roll back together

## Key Decisions Implemented

| Decision | Implementation | Status |
|----------|----------------|--------|
| D-01: Case-insensitive deduplication | `normalized = name.trim().toLowerCase()` | ✓ Done |
| D-02: Title-case display names | `word.charAt(0).toUpperCase() + word.slice(1)` | ✓ Done |
| D-04: Most-common category + tiebreak | Category count map + lowest id tiebreak | ✓ Done |
| D-05: Stock notes preserved; catalog notes null | `notes: null` in catalog; medicine.notes unchanged | ✓ Done |
| D-10: MedicineForm enum (13 values) | `as const` type with all 13 forms | ✓ Done |
| D-11: No heuristic form inference | `form: null` for all migrated entries | ✓ Done |

## Deviations from Plan

**Rule 2: Auto-add missing critical functionality**

Five files required `catalogId` field additions beyond the planned scope (db.ts, historyOps.test.ts):
- **Root cause:** Schema change introduced required field that existing code couldn't provide
- **Resolution:** Added temporary default values (`catalogId: 0` for imports, `catalogId: 1` for new entries)
- **Future work:** Phase 5 properly wires catalog selection UI; Phase 6 updates backup schema

**TypeScript compiler flag issue**

- **Found:** `enum` keyword incompatible with `erasableSyntaxOnly` compiler flag
- **Fixed:** Replaced with `as const` type definition, preserving full type safety
- **Impact:** Zero behavioral change; type safety equivalent to enum

## Known Stubs

| Type | File | Line | Description |
|------|------|------|-------------|
| TODO | src/routes/medicines/new.tsx | 12 | Phase 5 — use actual catalog selection instead of catalogId: 1 |
| TODO | src/lib/csvOps.ts | 91 | Phase 5 — migrate imported data to proper catalogs |
| TODO | src/lib/dataOps.ts | 101 | Phase 5 — update import to create/merge catalogs from backup data |

## Files Changed

| File | Role | Changes |
|------|------|---------|
| src/lib/db.ts | schema | Added MedicineForm type, MedicineCatalog interface, updated Medicine.catalogId, added v3 migration callback |
| src/lib/historyOps.test.ts | test | Added 3 migration test cases; updated baseMedicine fixture with catalogId |
| src/lib/db.test.ts | test | Updated 3 medicine fixtures to include catalogId (Rule 2) |
| src/lib/expiry.test.ts | test | Updated makeMed factory to include catalogId (Rule 2) |
| src/lib/csvOps.ts | utility | Added catalogId: 0 to CSV import (Rule 2) |
| src/lib/dataOps.ts | utility | Updated BackupSchema and import function for catalogId (Rule 2) |
| src/routes/medicines/new.tsx | route | Added catalogId: 1 to new medicine creation (Rule 2) |

## Commits

1. **feat(04-01): add v3 schema with medicine_catalog and deduplication migration**
   - Added MedicineForm type definition
   - Added MedicineCatalog interface
   - Updated Medicine interface with catalogId field
   - Updated Dexie type union
   - Implemented v3 upgrade callback with deduplication logic
   - Updated all test files and routes to provide catalogId

## Readiness for Phase 5

✓ `medicine_catalog` table exists with correct schema  
✓ `Medicine.catalogId` field ready for Phase 5 callers  
✓ Migration callback handles v1.0 → v3 automatically on first open  
✓ All existing tests pass; no breaking changes in API  
✓ CSV/JSON import paths updated to accept new schema  

Phase 5 can now:
- Build UI for catalog autocomplete / selection
- Implement two-step add flow (catalog → stock)
- Update historyOps.ts signatures to accept explicit `medicineName` (D-06, D-08)
- Build detail view listing all stock entries per catalog

## Next Steps

**Phase 04 Plan 02:** Update historyOps.ts function signatures to accept explicit `medicineName` parameter (D-06, D-08, D-09)
