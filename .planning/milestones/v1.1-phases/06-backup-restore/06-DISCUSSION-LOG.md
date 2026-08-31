# Phase 6: Backup & Restore - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-31
**Phase:** 6-Backup & Restore
**Areas discussed:** Old-format import UX, History on old-format import, Backup schemaVersion field

---

## Old-Format Import UX

| Option | Description | Selected |
|--------|-------------|----------|
| Silent migrate | Detect old format automatically, infer catalog entries, show informative toast | ✓ |
| Warn before migrating | Show confirmation dialog before proceeding with migration | |
| Treat as error | Reject old-format backups entirely | |

**User's choice:** Silent migrate

**Follow-up — toast wording:**

| Option | Description | Selected |
|--------|-------------|----------|
| Count both | "Imported N medicines — M catalog entries created from v1.0 backup." | ✓ |
| Just medicine count | "Imported N medicines." — no mention of migration | |
| You decide | Leave wording to planner | |

**User's choice:** Count both

**Notes:** Silent migration is preferred — the app handles the format difference transparently and surfaces it in the success toast without interrupting the user flow.

---

## History on Old-Format Import

| Option | Description | Selected |
|--------|-------------|----------|
| Keep as-is | Import history unchanged; stale medicineId values are acceptable | ✓ |
| Clear history | Don't import history from old-format backups | |
| Remap medicineId values | Build a mapping from old to new IDs and rewrite history entries | |

**User's choice:** Keep as-is

**Follow-up — UI disclosure for stale IDs:**

| Option | Description | Selected |
|--------|-------------|----------|
| No — acceptable for old imports | History is an audit trail; stale IDs are acceptable | ✓ |
| Yes — note it in the toast | Add disclosure to success toast | |
| You decide | Leave to planner | |

**User's choice:** No — acceptable for old imports

**Notes:** Since `medicineName` is denormalized on every history entry (CLAUDE.md invariant), entries remain readable even with stale `medicineId` values. No UI disclosure needed.

---

## Backup schemaVersion Field

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — add schemaVersion: 2 | Explicit version field in export; detection uses presence/absence | ✓ |
| No — implicit detection is enough | Detect by medicine_catalog.length === 0 | |
| Yes, but with different field name | Same concept, different key name | |

**User's choice:** Yes — add schemaVersion: 2

**Follow-up — Zod schema validation:**

| Option | Description | Selected |
|--------|-------------|----------|
| Optional field, import logic branches | z.number().optional(); import code decides what to do per version | ✓ |
| Required in schema, reject unknowns | z.literal(2) — fails on unknown versions | |

**User's choice:** Optional field, import logic branches

**Follow-up — Old-format schema parsing:**

| Option | Description | Selected |
|--------|-------------|----------|
| Extend medicines schema with optional name/category | Add to existing BackupSchema | |
| Two-pass parse approach | Separate LegacyBackupSchema; used only when schemaVersion absent | ✓ |
| You decide | Leave to planner | |

**User's choice:** Two-pass parse approach

**Notes:** Forward-compat is important — a schemaVersion: 3 file from a future app version should pass validation in the v1.1 app. The two-pass approach keeps the standard BackupSchema clean and adds a separate LegacyBackupSchema only for v1.0 import.

---

## Claude's Discretion

None — all decisions were user-selected.

## Deferred Ideas

None — discussion stayed within phase scope.
