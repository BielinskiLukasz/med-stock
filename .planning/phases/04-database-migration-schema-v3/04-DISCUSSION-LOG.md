# Phase 4: Database Migration & Schema v3 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-28
**Phase:** 4-Database Migration & Schema v3
**Areas discussed:** Deduplication matching rule, Category conflict in migration, historyOps.ts redesign, form field type in catalog

---

## Deduplication Matching Rule

| Option | Description | Selected |
|--------|-------------|----------|
| Case-insensitive + trim | Normalize to lowercase + trimmed. 'Paracetamol' and 'paracetamol' merge into one entry. Keep first occurrence's casing. | ✓ |
| Exact match only | Only identical strings deduplicate. Simpler migration code, but misses obvious duplicates. | |

**User's choice:** Case-insensitive + trim

---

| Option | Description | Selected |
|--------|-------------|----------|
| First occurrence wins | Take the name casing from the lowest-id record. | |
| Capitalize first letter | Normalize all entries to title-cased. Consistent display regardless of original input. | ✓ |

**User's choice:** Capitalize first letter (title-case normalize)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Treat as implicit improvement, document in CONTEXT.md | Keep REQUIREMENTS.md as-is. Record the decision in CONTEXT.md. | |
| Update REQUIREMENTS.md wording | Change MIGR-02 text to say 'case-insensitive, trimmed name match'. | ✓ |

**User's choice:** Update REQUIREMENTS.md wording

---

## Category Conflict in Migration

| Option | Description | Selected |
|--------|-------------|----------|
| First occurrence wins | Catalog entry takes the category from the lowest-id record. Simple, deterministic. | |
| Most-common category wins | Count which category appears most often among same-name records. | ✓ |
| Null — user fills later | Leave catalog category as null when there's a conflict. | |

**User's choice:** Most-common category wins

---

| Option | Description | Selected |
|--------|-------------|----------|
| First occurrence among tied categories | Among tied categories, pick the one from the lowest-id record. | ✓ |
| Null on tie | If no single category wins, leave catalog category as null. | |

**User's choice:** First occurrence (lowest id) among tied categories

---

| Option | Description | Selected |
|--------|-------------|----------|
| Stock entry notes | Existing notes move to stock entry. Catalog notes start as null. | ✓ |
| Catalog notes | Notes move to medicine_catalog. Stock entry notes start as null. | |
| Both — copy to stock, null on catalog | Same as stock entry notes but explicitly stated. | |

**User's choice:** Stock entry notes; catalog.notes starts null

---

## historyOps.ts Redesign

| Option | Description | Selected |
|--------|-------------|----------|
| Caller passes medicineName explicitly | Function signatures accept medicineName: string. Callers provide it from catalog context. | ✓ |
| historyOps reads from medicine_catalog internally | Each function does a db lookup via catalogId. More self-contained but adds async reads. | |
| Keep name denormalized on stock entries | Add name back to medicines as a redundant copy. Simplest but creates consistency risk. | |

**User's choice:** Caller passes medicineName explicitly

---

| Option | Description | Selected |
|--------|-------------|----------|
| Stock entry id only | Keep HistoryEntry.medicineId as stock entry id. No catalogId added. | ✓ |
| Add catalogId to HistoryEntry | Add catalogId alongside medicineId for cross-stock history queries. | |

**User's choice:** Stock entry id only — keep existing HistoryEntry structure

---

| Option | Description | Selected |
|--------|-------------|----------|
| Update signatures in Phase 4 | Change function signatures now. Phase 5 writes callers against the real API. | ✓ |
| Stub with TODOs for Phase 5 | Keep current signatures. Phase 5 updates them when it writes callers. | |

**User's choice:** Update signatures in Phase 4

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, update tests in Phase 4 | Keep tests in sync. Phase 4 delivers working historyOps.ts with passing tests. | ✓ |
| Leave tests for Phase 5 | Phase 5 fixes the tests when it writes callers. Phase 4 may have failing tests. | |

**User's choice:** Yes, update historyOps.test.ts in Phase 4

---

## Form Field Type in Catalog

| Option | Description | Selected |
|--------|-------------|----------|
| string \| null (free-text) | Maximum flexibility. Phase 5 can show suggested values without restriction. | |
| MedicineForm enum (typed, fixed set) | Locked list of values. Type-safe, consistent display. | ✓ |

**User's choice:** MedicineForm enum

---

| Option | Description | Selected |
|--------|-------------|----------|
| Tablet, Capsule, Syrup, Cream, Drops, Spray, Powder, Other | Covers most common household medicine forms. | |
| Fewer: Tablet, Capsule, Liquid, Topical, Other | Higher-level groupings. | |
| More granular (add Gel, Ointment, Patch, Inhaler, Suppository) | Full pharmaceutical precision. | ✓ |

**User's choice:** Tablet, Capsule, Syrup, Cream, Drops, Spray, Powder, Gel, Ointment, Patch, Inhaler, Suppository, Other

---

| Option | Description | Selected |
|--------|-------------|----------|
| null (no inference) | All migrated catalog entries get form: null. User fills in Phase 5. | ✓ |
| Try to infer from name | Heuristic match on name keywords. Fallback to null. | |

**User's choice:** null for all migrated catalog entries

---

## Claude's Discretion

None — all areas had explicit user choices.

## Deferred Ideas

None — discussion stayed within phase scope.
