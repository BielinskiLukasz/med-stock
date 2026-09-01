---
phase: 07-i18n-polish-language
verified: 2026-09-01T00:00:00Z
status: gaps_found
score: 4/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0

gaps:
  - truth: "LOCATION_KEYS maps all 7 predefined DB locations (Bathroom Cabinet, Bedroom Cabinet, Kitchen Drawer, Living Room Cabinet, Medicine Box, Refrigerator, Travel Kit)"
    status: failed
    reason: "LOCATION_KEYS in src/i18n/types.ts contains only 3 mappings; 4 predefined locations (Living Room Cabinet, Medicine Box, Refrigerator, Travel Kit) have no translation keys"
    artifacts:
      - path: "src/i18n/types.ts"
        issue: "LOCATION_KEYS Record missing 4 entries: 'Living Room Cabinet', 'Medicine Box', 'Refrigerator', 'Travel Kit'"
      - path: "src/i18n/en.ts"
        issue: "No corresponding locationNames.* keys for the 4 missing locations"
      - path: "src/i18n/pl.ts"
        issue: "No corresponding Polish translations for the 4 missing locations"
    missing:
      - "Add LOCATION_KEYS entries: 'Living Room Cabinet' -> 'locationNames.livingRoomCabinet', 'Medicine Box' -> 'locationNames.medicineBox', 'Refrigerator' -> 'locationNames.refrigerator', 'Travel Kit' -> 'locationNames.travelKit'"
      - "Add locationNames.livingRoomCabinet, medicineBox, refrigerator, travelKit to en.ts with English translations"
      - "Add corresponding Polish translations to pl.ts"

  - truth: "FilterChips renders active category filter chip labels in the active language"
    status: failed
    reason: "FilterChips.tsx line 27 renders hardcoded raw category value 'v' without CATEGORY_KEYS translation lookup"
    artifacts:
      - path: "src/components/FilterChips.tsx"
        issue: "Line 27: label uses raw category value instead of t(CATEGORY_KEYS[v] ?? 'categories.other')"
    missing:
      - "Import CATEGORY_KEYS from '@/i18n' (already imported)"
      - "Replace line 27: `label: ${t('filter.category')}: ${v}` with `label: ${t('filter.category')}: ${t(CATEGORY_KEYS[v] ?? 'categories.other')}`"

  - truth: "FilterChips renders active location filter chip labels in the active language"
    status: failed
    reason: "FilterChips.tsx line 31 renders hardcoded raw location value 'v' without LOCATION_KEYS translation lookup"
    artifacts:
      - path: "src/components/FilterChips.tsx"
        issue: "Line 31: label uses raw location value instead of t(LOCATION_KEYS[v] ?? v)"
    missing:
      - "Import LOCATION_KEYS from '@/i18n' (currently not imported)"
      - "Replace line 31: `label: ${t('filter.location')}: ${v}` with `label: ${t('filter.location')}: ${t(LOCATION_KEYS[v] ?? v)}`"

  - truth: "MoveStockSheet renders all labels and validation messages in the active language"
    status: failed
    reason: "MoveStockSheet.tsx contains 7+ hardcoded English strings: 'Boxes to move (max N)' (line 90), '= N units per box' (line 101), validation messages (lines 104, 107, 113, 124, 127), and 'Moving…' submit button text (line 171)"
    artifacts:
      - path: "src/components/MoveStockSheet.tsx"
        issue: "Multiple hardcoded English strings in labels and validation messages"
    missing:
      - "Add translation keys to TranslationDict: form.boxesToMove, form.unitsPerBox, form.boxValidationMin, form.boxValidationMax, form.quantityValidationMin, form.quantityValidationMax, form.saving"
      - "Add English values to en.ts and Polish values to pl.ts"
      - "Replace hardcoded strings with t() calls: line 90 'Boxes to move (max N)' → t('form.boxesToMove', { max: maxBoxes }), but t() lacks interpolation — alternatively use template strings with t() keys for parts"
      - "Line 101: use t('units.unitsPerBox') or similar"
      - "Lines 104, 107, 124, 127: replace validation error messages with t() calls"
      - "Line 171: replace 'Moving…' with t('form.saving') or equivalent"

  - truth: "MedicineCard renders the 'at' preposition connecting quantity and location in the active language"
    status: failed
    reason: "MedicineCard.tsx line 37 hardcodes English preposition 'at' instead of using t('common.at')"
    artifacts:
      - path: "src/components/MedicineCard.tsx"
        issue: "Line 37: template string uses hardcoded 'at' preposition"
    missing:
      - "Replace line 37: `{medicine.quantity} {unitDisplay} at {locationDisplay}` with `{medicine.quantity} {unitDisplay} ${t('common.at')} {locationDisplay}`"

  - truth: "CatalogAutocomplete component displays all UI strings (heading, placeholder, create button label) in the active language"
    status: failed
    reason: "CatalogAutocomplete.tsx has no useLang() call; all strings are hardcoded English: 'Select or Create Medicine' (line 33), 'Start typing a medicine name…' (line 38)"
    artifacts:
      - path: "src/components/CatalogAutocomplete.tsx"
        issue: "Component missing useLang() hook call; hardcoded heading and placeholder strings"
    missing:
      - "Add import of useLang from '@/i18n'"
      - "Add const { t } = useLang() inside CatalogAutocomplete component"
      - "Add translation keys to TranslationDict: catalog.selectOrCreate, catalog.placeholderText"
      - "Replace line 33: 'Select or Create Medicine' with t('catalog.selectOrCreate')"
      - "Replace line 38: 'Start typing a medicine name…' with t('catalog.placeholderText')"

  - truth: "SyncInstructions component displays all 5 instruction paragraphs in the active language"
    status: failed
    reason: "SyncInstructions.tsx has no useLang() call; all prose is hardcoded English (lines 1-20)"
    artifacts:
      - path: "src/components/SyncInstructions.tsx"
        issue: "Component missing useLang() hook call; 5 hardcoded English instruction paragraphs"
    missing:
      - "Add import of useLang from '@/i18n'"
      - "Add const { t } = useLang() inside SyncInstructions component"
      - "Add translation keys to TranslationDict: data.syncStep1, data.syncStep2, data.syncStep3, data.syncStep4, data.syncNote"
      - "Replace hardcoded paragraphs with t() calls for each step"

  - truth: "CSVPreview component displays all labels and messages in the active language"
    status: failed
    reason: "CSVPreview.tsx has no useLang() call; all strings are hardcoded English: 'Preview (first 5 rows)' (line 32), row count label (line 33), action buttons"
    artifacts:
      - path: "src/components/CSVPreview.tsx"
        issue: "Component missing useLang() hook call; hardcoded English strings for preview header, row count, and action buttons"
    missing:
      - "Add import of useLang from '@/i18n'"
      - "Add const { t } = useLang() inside CSVPreview component"
      - "Add translation keys to TranslationDict: csv.previewHeader, csv.rowCount, csv.importing, csv.importComplete, csv.back, csv.cancel"
      - "Replace hardcoded strings with t() calls"

---

# Phase 07: i18n Polish Language Verification Report

**Phase Goal:** Users can switch between English and Polish; all text displays in the chosen language with locale-aware formatting

**Verified:** 2026-09-01T00:00:00Z  
**Status:** GAPS_FOUND  
**Score:** 4/7 must-haves verified

## Summary

Phase 07 is **incomplete**. While the core i18n infrastructure (LanguageProvider, useLang hook, formatDate utility) is correctly implemented and Plans 01–04 claim completion, a systematic code review identified **7 critical i18n coverage gaps** affecting multiple components. These gaps directly contradict the phase goal — users cannot see all text in the chosen language because:

1. **4 of 7 predefined locations always render in English** (missing LOCATION_KEYS entries)
2. **Filter chip labels for categories and locations render in English** (missing CATEGORY_KEYS/LOCATION_KEYS lookups in FilterChips)
3. **MoveStockSheet validation and inline labels hardcoded in English** (7+ strings untranslated)
4. **MedicineCard preposition 'at' hardcoded in English** (should use t('common.at'))
5. **CatalogAutocomplete component has zero i18n** (no useLang hook, hardcoded heading and placeholder)
6. **SyncInstructions component has zero i18n** (5 hardcoded English paragraphs)
7. **CSVPreview component has zero i18n** (hardcoded header, row count, action buttons)

All gaps stem from incomplete translation of visible UI strings. The build passes and no TypeScript errors exist, but **behavioral coverage of I18N-02 ("All UI strings display in the active language") is incomplete**.

---

## Observable Truths Verification

### 1. Language toggle switches all tab labels in BottomTabBar (I18N-01)

**Status:** ✓ VERIFIED

- BottomTabBar.tsx successfully calls `useLang()` and renders five translated tab labels via `t('nav.*')` keys
- Flag emoji toggle button present with correct aria-labels
- Code review: no gaps identified in this component

---

### 2. Language preference persists in localStorage (I18N-03)

**Status:** ✓ VERIFIED

- LanguageProvider reads 'medstock-lang' from localStorage on mount
- setLang writes to localStorage before updating state
- Input validation: value tested against `['en', 'pl']` union, defaults to 'en'
- Code review: no gaps identified

---

### 3. Dates format locale-appropriately (I18N-05)

**Status:** ✓ VERIFIED

- formatDate() utility correctly implements EN (YYYY-MM-DD) and PL (DD.MM.YYYY) formatting
- Tests in src/lib/utils.test.ts all pass
- MedicineCard and other detail views call `formatDate(date, lang)` correctly
- Code review: no gaps identified for this requirement

---

### 4. All UI strings (labels, placeholders, toasts, error messages, status names, screen titles) display in the active language (I18N-02)

**Status:** ✗ FAILED (7 component-level gaps)

Code review identified 11 findings; analysis categorizes them:

- **Pre-existing bugs (not Phase 7):** 2
  - csvOps.ts catalogId hardcoding (Phase 5 TODO, unrelated to i18n)
  - CSVColumnMapper isNameMapped validation (Phase 5/6 bug, unrelated to i18n)

- **Known intentional gaps (documented in plans):** 2
  - ImportJSONSection dialog body with dynamic counts (Plan 04 decision: t() has no interpolation support)
  - CatalogFields Zod validation error message (structural constraint: Zod evaluates at schema-construction time, cannot access React context)

- **i18n coverage gaps (Phase 7 omissions):** 7 — **all must be resolved**
  1. LOCATION_KEYS missing 4 of 7 default locations
  2. FilterChips hardcoded category chip labels
  3. FilterChips hardcoded location chip labels
  4. MoveStockSheet inline labels and validation messages
  5. MedicineCard hardcoded 'at' preposition
  6. CatalogAutocomplete component (no i18n)
  7. SyncInstructions component (no i18n)
  8. CSVPreview component (no i18n)
  9. ImportCSVSection error toast (hardcoded English guard message)
  10. ExportSection description paragraph (hardcoded English)

**Gap Severity:**

Items 1–8 are **BLOCKERS** — they directly prevent I18N-02 achievement (category, location, unit, and validation labels display in English even when the app language is Polish).

Items 9–10 are **LOW-priority** (edge-case error paths and description text).

---

### 5. Built-in category and predefined location names display in the active language (I18N-04)

**Status:** ✗ FAILED (partial)

- CATEGORY_KEYS is correctly mapped and used in FilterBottomSheet, MedicineCardAggregate
- LOCATION_KEYS is **incomplete:** 3 of 7 predefined locations have translation keys; 4 are missing
- FilterChips renders category and location chip labels using hardcoded raw values instead of CATEGORY_KEYS/LOCATION_KEYS lookups

**Result:** Incomplete i18n coverage for I18N-04.

---

## Requirements Coverage

| Requirement | Phase Plan | Status | Evidence |
|-------------|-----------|--------|----------|
| I18N-01 | 07-01 | ✓ VERIFIED | LanguageProvider + useLang + BottomTabBar toggle functional |
| I18N-02 | 07-02, 07-03, 07-04 | ✗ FAILED | 7 component-level gaps: missing translations for category/location chip labels, validation messages, preposition, and 3 new components |
| I18N-03 | 07-01 | ✓ VERIFIED | localStorage 'medstock-lang' read/write working |
| I18N-04 | 07-02, 07-04 | ⚠️ PARTIAL | CATEGORY_KEYS complete; LOCATION_KEYS incomplete (3/7 mappings); FilterChips missing lookups |
| I18N-05 | 07-02, 07-04 | ✓ VERIFIED | formatDate() utility functional; date display correct |

---

## Artifacts Audit

### Created/Modified by Phase 07

| Artifact | Status | Notes |
|----------|--------|-------|
| src/i18n/types.ts | ⚠️ INCOMPLETE | LOCATION_KEYS missing 4 entries; TranslationDict keys missing for new gaps |
| src/i18n/en.ts | ⚠️ INCOMPLETE | Missing locationNames keys + form.* keys for MoveStockSheet + catalog.* keys + csv.* keys |
| src/i18n/pl.ts | ⚠️ INCOMPLETE | Polish translations missing for above keys |
| src/App.tsx | ✓ VERIFIED | LanguageProvider wraps RouterProvider correctly |
| src/components/BottomTabBar.tsx | ✓ VERIFIED | Tab labels translated; flag toggle functional |
| src/lib/utils.ts | ✓ VERIFIED | formatDate() utility correct |
| src/components/StatusBadge.tsx | ✓ VERIFIED | Renders via t() lookup |
| src/components/FilterBottomSheet.tsx | ✓ VERIFIED | Status/category/sort labels translated |
| src/components/FilterChips.tsx | ✗ FAILED | Category and location chip labels hardcoded |
| src/components/MedicineCard.tsx | ⚠️ PARTIAL | 'at' preposition hardcoded; otherwise translated |
| src/components/MedicineCardAggregate.tsx | ✓ VERIFIED | Category and unit translated |
| src/components/CatalogAutocomplete.tsx | ✗ MISSING_I18N | No useLang() call; 2 hardcoded strings |
| src/components/SyncInstructions.tsx | ✗ MISSING_I18N | No useLang() call; 5 hardcoded paragraphs |
| src/components/CSVPreview.tsx | ✗ MISSING_I18N | No useLang() call; 4+ hardcoded strings |

---

## Code Review Cross-Reference

The 07-REVIEW.md findings are **accurate and substantive**. All 7 critical gaps (items 1–8 in the STRIDE/findings) are confirmed by codebase inspection:

- ✓ Finding 3 (LOCATION_KEYS incomplete) — verified in src/i18n/types.ts lines 250–254
- ✓ Finding 4 (CatalogAutocomplete no i18n) — verified in src/components/CatalogAutocomplete.tsx lines 33, 38
- ✓ Finding 5 (SyncInstructions no i18n) — verified in src/components/SyncInstructions.tsx lines 1–20
- ✓ Finding 6 (CSVPreview no i18n) — verified in src/components/CSVPreview.tsx lines 32–33
- ✓ Finding 7 (FilterChips hardcoded labels) — verified in src/components/FilterChips.tsx lines 27, 31
- ✓ Finding 9 (MoveStockSheet inline labels) — verified in src/components/MoveStockSheet.tsx lines 90, 101, 104, 107, 113, 124, 127, 171
- ✓ Finding 10 (MedicineCard 'at' preposition) — verified in src/components/MedicineCard.tsx line 37

---

## Deferred Items (Later Phases)

None — all 7 critical gaps must be resolved in Phase 07 to achieve the phase goal. None are explicitly scheduled for Phase 8+.

---

## Human Verification Needed

None of the identified gaps require human judgment. All are technical implementation gaps with concrete fixes documented in the gaps section.

---

## Conclusion

**Phase 07 goal is NOT achieved.**

The phase goal requires "all text displays in the chosen language." Code review and codebase verification confirm that multiple visible UI strings remain hardcoded in English:

- 4 predefined locations always display in English (I18N-04 blocker)
- Category and location filter chip labels always display in English (I18N-02 blocker)
- MoveStockSheet validation and inline labels always display in English (I18N-02 blocker)
- MedicineCard preposition hardcoded in English (I18N-02 blocker)
- Three new components (CatalogAutocomplete, SyncInstructions, CSVPreview) have zero i18n (I18N-02 blocker)

**Recommendation:** Do not advance to Phase 08. Create a follow-up plan to close the 7 gaps identified in this verification report.

---

_Verified: 2026-09-01T00:00:00Z_  
_Verifier: Claude (gsd-verifier)_
_Review Reference: 07-REVIEW.md findings 3–10 (i18n coverage gaps)_
