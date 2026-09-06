---
status: diagnosed
trigger: "G-07-17b: CatalogAutocomplete shows stale suggestions after all stock for a catalog entry is permanently deleted"
created: 2026-09-02T00:00:00Z
updated: 2026-09-02T00:00:00Z
---

## Current Focus

hypothesis: CatalogAutocomplete queries medicine_catalog unconditionally (no active-stock filter), AND permanentDeleteMedicine never cascades a catalog cleanup — so catalog entries outlive all their stock entries indefinitely.
test: trace read path in CatalogAutocomplete + write path in permanentDeleteMedicine
expecting: confirmed — two independent gaps, both required for the symptom
next_action: DIAGNOSED — root cause confirmed, no fix applied

## Symptoms

expected: Autocomplete only suggests catalog entries that have at least one active (non-soft-deleted, non-permanently-deleted) stock entry.
actual: Autocomplete shows all catalog entries including those whose every stock entry has been permanently deleted.
errors: none
reproduction: Permanently delete all stock entries for a medicine. Open Add medicine form, type the name — it still appears as a suggestion.
started: Discovered during UAT phase 07

## Eliminated

(none — root cause confirmed on first hypothesis)

## Evidence

- timestamp: 2026-09-02
  checked: src/components/CatalogAutocomplete.tsx line 19
  found: useLiveQuery(() => db.medicine_catalog.toArray(), []) — loads every row in medicine_catalog with no filter whatsoever
  implication: Any catalog entry that exists in the DB is always surfaced as a suggestion, regardless of whether it has any living stock entries.

- timestamp: 2026-09-02
  checked: src/lib/historyOps.ts permanentDeleteMedicine (lines 100-112)
  found: Transaction touches only db.medicines and db.history — adds a history row, then calls db.medicines.delete(medicine.id). db.medicine_catalog is not opened in the transaction and is never touched.
  implication: Permanently deleting a stock entry never checks whether it was the last one for its catalogId, and never deletes the catalog row — even when zero stock entries remain.

- timestamp: 2026-09-02
  checked: src/lib/stockOps.ts deleteCatalogEntry (lines 135-149)
  found: A function does exist to delete a catalog entry, but it is a separate, explicitly-called operation. It also throws if ANY medicines row references the catalogId (active OR soft-deleted), so it cannot be called until after all stock (including trashed stock) is permanently deleted. It is never called from permanentDeleteMedicine.
  implication: There is no automatic cascade from stock permanent-delete to catalog cleanup — it must be triggered manually, but the UI provides no obvious path to do so.

- timestamp: 2026-09-02
  checked: src/lib/db.ts MedicineCatalog schema
  found: medicine_catalog has no back-reference or reference-count field. The DB has no foreign-key enforcement — catalog rows simply linger after all referencing medicines rows are deleted.
  implication: Stale catalog entries are structurally invisible; the only way to detect them is an explicit count query against medicines.

## Resolution

root_cause: Two independent gaps combine to produce the symptom.
  (1) CatalogAutocomplete (src/components/CatalogAutocomplete.tsx:19) queries db.medicine_catalog.toArray() with no active-stock guard — it shows every catalog row unconditionally.
  (2) permanentDeleteMedicine (src/lib/historyOps.ts:100) deletes only the medicines row and adds a history entry; it never checks whether the deleted entry was the last stock entry for its catalogId, and never cleans up the catalog row.
  The AND-gate fires: removing either gap alone would fix the symptom, but both are independently present and either would need fixing to achieve correct behavior.

fix: not applied (find_root_cause_only mode)

verification: n/a

files_changed: []
