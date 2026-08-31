# Phase 6: Backup & Restore - Context

**Gathered:** 2026-08-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Update backup/restore to fully support the new catalog+stock schema: JSON export already includes `medicine_catalog` (done in Phase 5 work), and new-format import already restores both tables correctly. The remaining gap is DATA-03: old-format (pre-v1.1) backup import must infer catalog entries from medicine `name`/`category` fields using the same dedup logic as the Phase 4 migration, rather than assigning `catalogId: 0` placeholders. A `schemaVersion` field is added to exports to make format detection explicit.

No new routes or UI screens. Changes are confined to `src/lib/dataOps.ts` and its tests.

</domain>

<decisions>
## Implementation Decisions

### Old-Format Import Behavior

- **D-01:** Old-format import is **silent migrate** — no confirmation dialog, no user action required. The app detects the format automatically (absence of `schemaVersion` field) and runs catalog inference inline.

- **D-02:** Success toast after old-format import shows **both counts**: `"Imported N medicines — M catalog entries created from v1.0 backup."` This makes the migration transparent without interrupting the user. — **Reversibility:** reversible — toast wording is a UI string, easy to change.

- **D-03:** Old-format detection uses **`schemaVersion` field presence**: if `schemaVersion` is present → new format; if absent → v1.0 format. This replaces the fragile `medicine_catalog.length === 0` heuristic.

### Backup Schema Versioning

- **D-04:** `exportToJSON()` adds **`schemaVersion: 2`** to the exported JSON root object. New exports are reliably identifiable without inspecting table sizes. — **Reversibility:** one-way — once v1.1 users export with schemaVersion: 2, removing the field in a future version would break importers that rely on it.

- **D-05:** `BackupSchema` Zod validation treats `schemaVersion` as **`z.number().optional()`**. The schema does not enforce which version numbers are valid — that's the import logic's job. This preserves forward-compatibility: a `schemaVersion: 3` file from a future app version passes validation in the v1.1 app.

### Old-Format Schema Parsing (Two-Pass)

- **D-06:** The import function uses a **two-pass parse approach** for old-format backups:
  1. First parse: attempt the standard `BackupSchema` (detects `schemaVersion`, validates new format)
  2. If `schemaVersion` is absent: re-parse the raw JSON with a separate `LegacyBackupSchema` that includes `name: z.string().optional()` and `category: z.string().nullable().optional()` on medicines, preserving the v1.0 name/category fields for catalog inference.
  
  The existing `BackupSchema` is unchanged (not extended). The legacy schema is a parallel definition used only in the old-format import path. — **Reversibility:** reversible — legacy schema is additive code, not modifying the live schema.

- **D-07:** Catalog inference for old-format import uses **the same dedup logic as Phase 4 migration** (`db.ts` version 3 upgrade): normalize name to lowercase+trimmed, group medicines by normalized name, title-case the canonical name, pick most-common category (lowest-ID for ties), set `form: null` (no heuristic). This logic should be extracted to a shared utility function used by both the migration and the import path.

### History Handling on Old-Format Import

- **D-08:** History entries from old-format backups are **imported as-is** — no remapping of `medicineId` values. The stale IDs are acceptable because `medicineName` is denormalized on every history entry (per the CLAUDE.md invariant), so entries remain human-readable in the ChangeHistory screen. No UI disclosure is needed.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Success Criteria
- `.planning/REQUIREMENTS.md` — DATA-01, DATA-02, DATA-03 (3 requirements for this phase)
- `.planning/ROADMAP.md` — Phase 6 success criteria (4 items)

### Existing Backup/Restore Code (primary target)
- `src/lib/dataOps.ts` — Current `BackupSchema`, `exportToJSON()`, `importFromJSON()`. Phase 6 modifies all three. DATA-01 (export) and DATA-02 (new-format import) are already implemented here; DATA-03 (old-format import) is the gap.

### Phase 4 Dedup Logic (reference implementation)
- `src/lib/db.ts` — `db.version(3)` upgrade (lines ~115–190): the catalog inference algorithm to extract and reuse in a shared utility. Normalizes name, groups by normalized key, title-cases, picks most-common category.

### UI
- `src/routes/data/index.tsx` — DataScreen; contains `ImportJSONSection` which calls `importFromJSON`. No structural changes needed — toast message update only.
- `src/components/ImportJSONSection.tsx` — Where the import result toast is rendered. Update success message to show catalog count on v1.0 import.

### Test Infrastructure
- `src/lib/dataOps.test.ts` — Existing BackupSchema validation tests. Phase 6 adds import integration tests for both new-format and old-format paths, using `fake-indexeddb` (already configured in vite.config.ts).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `db.version(3)` upgrade in `src/lib/db.ts` — catalog inference algorithm (normalize → group → title-case → most-common-category). Extract to a shared `inferCatalogEntriesFromLegacyMedicines(medicines)` utility in `src/lib/dataOps.ts` or a new `src/lib/catalogInference.ts`.
- `fake-indexeddb` configured via `vite.config.ts` + `setupTests.ts` — integration tests for `importFromJSON` can use it without a real browser.
- `sonner` toast — `toast.success()` for import result message.

### Established Patterns
- **All dates as `YYYY-MM-DD` strings** — new catalog entries created during old-format import should use `new Date().toISOString()` for `createdAt`/`updatedAt`, consistent with Phase 4 migration.
- **`form: null` for inferred catalog entries** — per Phase 4 decision D-11: no heuristic inference of form field. Old-format backups had no `form`, so inferred catalog entries get `form: null`.
- **Transaction-wrapped import** — `importFromJSON` already uses `db.transaction('rw', ...)` covering all 4 tables. Old-format import must stay within this same transaction.
- **Named exports** — no default exports from `dataOps.ts`.

### Integration Points
- `src/lib/dataOps.ts` — All changes land here: add `schemaVersion` to export, add `LegacyBackupSchema`, add old-format detection + catalog inference path inside `importFromJSON`, extract dedup logic.
- `src/components/ImportJSONSection.tsx` — Update to display catalog count in the success toast when importing v1.0 backup.

</code_context>

<specifics>
## Specific Ideas

- **Two-pass parse**: Standard schema parse first (fast path for new-format). Only fall through to legacy schema parse when `schemaVersion` is absent. No performance cost for normal usage.
- **Shared dedup utility**: Extracting the Phase 4 catalog inference logic avoids duplicating a 40-line algorithm. The utility takes an array of `{ name: string; category: string | null }` and returns `MedicineCatalog[]` + a mapping of `normalizedName → catalogId`. The import function uses the mapping to assign `catalogId` values to stock entries.
- **Return type extension**: `importFromJSON` currently returns `{ medicineCount, locationCount }`. Extend to `{ medicineCount, locationCount, catalogCount, isLegacyFormat }` so the caller (ImportJSONSection) can build the appropriate toast message.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 6-Backup & Restore*
*Context gathered: 2026-08-31*
