# Phase 4: Database Migration & Schema v3 - Context

**Gathered:** 2026-07-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a `medicine_catalog` table to Dexie and convert the existing `medicines` table into stock entries linked by `catalogId`. Automatically migrate all v1.0 data without data loss. Update `historyOps.ts` signatures to work with the new schema. Update `historyOps.test.ts` to match. No UI changes in this phase.

</domain>

<decisions>
## Implementation Decisions

### Name Deduplication

- **D-01:** Deduplication uses **case-insensitive + trimmed** name comparison. Normalize each name to `name.trim().toLowerCase()` before comparing. "Paracetamol", "paracetamol", and " Paracetamol " all produce one catalog entry. — **Reversibility:** one-way — changing the dedup strategy after migration requires a new db.version(4) upgrade pass to split or merge existing catalog entries.
- **D-02:** The catalog entry's display name is **title-cased** (capitalize first letter of each word). E.g., `"paracetamol"` → `"Paracetamol"`. Applied during migration to all entries, regardless of which source record's casing is used.
- **D-03:** REQUIREMENTS.md MIGR-02 wording must be updated from "exact name match" to "case-insensitive, trimmed name match" before planning starts. This is a deliberate improvement, not a deviation.

### Category Conflict Resolution

- **D-04:** When multiple v1.0 records share the same normalized name but have different `category` values, the catalog entry's `category` is set to the **most-common category** among the group. Tiebreaker: first occurrence (lowest `id`) among the tied categories. — **Reversibility:** one-way — catalog category is set by migration; re-running would require another migration pass.
- **D-05:** Existing `Medicine.notes` migrates to the **stock entry's `notes` field**. `medicine_catalog.notes` starts as `null` for all migrated entries. Users populate catalog notes in Phase 5 if desired.

### historyOps.ts Signature Updates

- **D-06:** All `historyOps.ts` functions that currently read `medicine.name` are updated to accept **`medicineName: string`** as an explicit parameter. Callers (routes and forms, written in Phase 5) supply the name from their catalog context. `historyOps.ts` does not read from `medicine_catalog` internally. — **Reversibility:** reversible — signatures change before Phase 5 callers exist.
- **D-07:** `HistoryEntry.medicineId` continues to hold the **stock entry id** (not catalog id). No `catalogId` field is added to `HistoryEntry`. The denormalized `medicineName` string is sufficient for history readability across catalog changes.
- **D-08:** `historyOps.ts` signature updates are delivered **in Phase 4**, not deferred. Phase 5 writes callers against the real API.
- **D-09:** `historyOps.test.ts` is updated **in Phase 4** to match new function signatures. Phase 4 ends with all tests passing.

### MedicineForm Enum

- **D-10:** `medicine_catalog.form` is a **TypeScript enum `MedicineForm`** (not `string | null`). Values (in display order): `Tablet`, `Capsule`, `Syrup`, `Cream`, `Drops`, `Spray`, `Powder`, `Gel`, `Ointment`, `Patch`, `Inhaler`, `Suppository`, `Other`. Field type in the interface: `MedicineForm | null`. — **Reversibility:** costly — Phase 5 add form and edit form build pickers against this enum; adding or renaming values after Phase 5 ships requires updating form components and existing DB data.
- **D-11:** All migrated catalog entries get **`form: null`**. No heuristic inference from medicine name during migration.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current Schema and Mutation Layer
- `src/lib/db.ts` — Current Dexie schema (v2) with `Medicine`, `Location`, `HistoryEntry` interfaces. Phase 4 adds `db.version(3)` here. Critical invariants documented inline (null key, deletedAt pattern).
- `src/lib/historyOps.ts` — All 5 mutation functions to be updated in this phase. Current signatures accept `Medicine` objects; will be updated to accept stock entry + explicit `medicineName`.

### Requirements and Success Criteria
- `.planning/REQUIREMENTS.md` — MIGR-01, MIGR-02 (note: MIGR-02 wording update required per D-03)
- `.planning/ROADMAP.md` — Phase 4 success criteria contain the exact field lists for `medicine_catalog` and updated `medicines` tables

### Backup Schema (Phase 6 dependency — read-only context)
- `src/lib/dataOps.ts` — Current `BackupSchema` Zod definition. Phase 4 does NOT update this; Phase 6 owns backup/restore. Awareness needed to avoid breaking the import path.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `db.version(2).stores({...}).upgrade(tx => ...)` pattern in `src/lib/db.ts` — Phase 4 adds `db.version(3)` using the same pattern. The `upgrade()` callback receives a `tx` parameter for table access.
- `db.on('populate', ...)` in `src/lib/db.ts` — seeds default locations on first open. Not touched in Phase 4.

### Established Patterns
- **All dates as `YYYY-MM-DD` strings** — `createdAt`/`updatedAt` on catalog entries must follow this convention.
- **`null` is not a valid IndexedDB key** — `deletedAt` is not indexed; active records are filtered with `.toCollection().filter(m => m.deletedAt === null)`. Same constraint applies to any new nullable fields.
- **`location: null` means "Other"** — unchanged in Phase 4.
- **Dexie `EntityTable<T, 'id'>`** — each new table uses this type annotation pattern.
- **Named exports** — `db.ts` uses `export { db }` not `export default db`.

### Integration Points
- `src/lib/historyOps.ts` — function signatures change here; no callers exist yet (Phase 5 writes them)
- `src/lib/historyOps.test.ts` — tests updated to match new signatures in this phase
- `src/lib/dataOps.ts` — `BackupSchema` imports from `db.ts`; Phase 4 must not break its `Medicine` import path even as the interface changes

</code_context>

<specifics>
## Specific Ideas

- Title-case normalization for catalog display names (D-02) can use a simple utility: `name.trim().replace(/\b\w/g, c => c.toUpperCase())`.
- Most-common-category algorithm: group stock entries by normalized name, count each category value, pick max-frequency category, break ties by lowest source `id`.
- `MedicineForm` enum values chosen to cover full household medicine range, including less common forms (Patch, Inhaler, Suppository) because the user wanted granularity over simplicity.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-Database Migration & Schema v3*
*Context gathered: 2026-07-28*
