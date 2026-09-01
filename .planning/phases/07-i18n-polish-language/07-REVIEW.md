---
phase: 07-i18n-polish-language
plan: all
status: issues
severity: medium
generated: 2026-09-01
---

# Phase 07 Code Review

**Scope:** Changes from Phase 7 — i18n / Polish Language  
**Status:** Issues found (advisory)

## Summary

15 findings across three tiers:
- **Pre-existing bugs (not Phase 7):** 2 (CSV import catalogId, isNameMapped)
- **i18n coverage gaps (Phase 7 omissions):** 11
- **Known intentional gaps (documented in plans):** 2 (ImportJSONSection dialog body, Zod schema validation)

---

## Findings

### 1. [HIGH] csvOps.ts — All CSV imports assign catalogId: 1

**File:** `src/lib/csvOps.ts:88`  
**Note:** Pre-existing TODO from Phase 5; not introduced by Phase 7.

`mergeCSVRowsToMedicines` sets `catalogId: 1` on every row. All imported stock entries attach to whichever catalog entry has DB ID 1; medicine names from the CSV are discarded.

---

### 2. [HIGH] CSVColumnMapper.tsx — Preview button permanently disabled

**File:** `src/components/CSVColumnMapper.tsx:26`  
**Note:** Pre-existing bug from Phase 5/6; not introduced by Phase 7.

`isNameMapped = Object.values(mapping).includes('name')` is always false because `'name'` is not in `MEDICINE_FIELDS`. CSV import cannot advance past the column-mapping step.

---

### 3. [MEDIUM] types.ts — 4 of 7 default locations missing from LOCATION_KEYS

**File:** `src/i18n/types.ts:250`

`LOCATION_KEYS` maps only 3 of the 7 DB-seeded default locations. `Living Room Cabinet`, `Medicine Box`, `Refrigerator`, and `Travel Kit` always render in English in Polish mode. The keys (`livingRoomCabinet`, `medicineBox`, `refrigerator`, `travelKit`) are absent from both `types.ts` and `pl.ts`.

---

### 4. [MEDIUM] CatalogAutocomplete.tsx — No i18n

**File:** `src/components/CatalogAutocomplete.tsx:33`

New component added during this phase; no `useLang()` call. Heading `'Select or Create Medicine'`, input placeholder, empty-state message, and Create button label are all hardcoded English. This is the first step of the add-medicine flow.

---

### 5. [MEDIUM] SyncInstructions.tsx — No i18n

**File:** `src/components/SyncInstructions.tsx:1`

Entire component — five instruction paragraphs and footer note — is hardcoded English. Rendered in the Data screen's Sync section alongside translated components.

---

### 6. [MEDIUM] CSVPreview.tsx — No i18n

**File:** `src/components/CSVPreview.tsx:1`

New component added during this phase; no `useLang()` call. Preview header, row-count label, and all action buttons (`Importing…`, `Import N medicines`, `Back`, `Cancel`) are hardcoded English. `t('form.cancel')` and `t('form.save')` keys already exist.

---

### 7. [MEDIUM] FilterChips.tsx — Active category chips render raw English

**File:** `src/components/FilterChips.tsx:27`

Active category filter chips render the raw English category value (e.g. `'Pain & Fever'`) instead of `t(CATEGORY_KEYS[v])`. Status chips on line 35 correctly call `t()` — inconsistent regression within the same file.

---

### 8. [MEDIUM] FilterChips.tsx — Active location chips render raw DB string

**File:** `src/components/FilterChips.tsx:31`

Active location filter chips display the raw DB location string instead of `t(LOCATION_KEYS[loc] ?? loc)`. `LOCATION_KEYS` maps `'Bathroom Cabinet'` and `pl.ts` has the translation; the lookup is simply not called.

---

### 9. [MEDIUM] MoveStockSheet.tsx — Inline labels and validation errors hardcoded

**File:** `src/components/MoveStockSheet.tsx:90`

Multiple inline labels (`Boxes to move (max N)`, `= N units per box`, validation messages) and `Saving…` spinner text (line 171) are hardcoded English while the rest of the component uses `t()`.

---

### 10. [LOW] MedicineCard.tsx — `'at'` preposition hardcoded

**File:** `src/components/MedicineCard.tsx:37`

The preposition connecting quantity and location is hardcoded `'at'`. `t('common.at')` exists in both `en.ts` (`'at'`) and `pl.ts` (`'w'`).

---

### 11. [LOW] MedicineForm.tsx — `'Saving...'` hardcoded (also in 3 other components)

**File:** `src/components/MedicineForm.tsx:437`

Submit button shows hardcoded `'Saving...'` during submission. Same pattern in `CatalogEditSheet.tsx:81`, `StockEditSheet.tsx:103`, `routes/medicines/new.tsx:207`. No Polish `saving` key exists; a `form.saving` key would need to be added.

---

### 12. [LOW] ImportJSONSection.tsx — Dialog body hardcoded (intentional)

**File:** `src/components/ImportJSONSection.tsx:114`  
**Note:** Documented intentional gap in 07-04-PLAN.md — `t()` has no interpolation support for dynamic counts.

Dialog body `'This will replace all N medicines, M locations…'` is built via string concatenation. Title and action button are translated.

---

### 13. [LOW] CatalogFields.tsx — Zod error message hardcoded (structural constraint)

**File:** `src/components/CatalogFields.tsx:26`

Zod schema `'Name is required'` error is hardcoded English. `form.nameRequired` (`'Nazwa jest wymagana'`) exists in `pl.ts` but Zod schema strings are evaluated at schema-construction time and cannot access React context.

---

### 14. [LOW] ImportCSVSection.tsx — Error toast hardcoded

**File:** `src/components/ImportCSVSection.tsx:63`

Guard toast `'CSV import requires at least one medicine catalog…'` is hardcoded English. This path is reachable when a user has deleted and recreated catalog entries (ID > 1).

---

### 15. [LOW] ExportSection.tsx — Description paragraph hardcoded

**File:** `src/components/ExportSection.tsx:26`

Description paragraph `'Download your entire inventory as a JSON file…'` is hardcoded English while the export button correctly uses `t()`.
