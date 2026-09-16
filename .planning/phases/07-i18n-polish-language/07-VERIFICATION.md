---
phase: 07-i18n-polish-language
verified: 2026-09-16T21:35:00Z
status: gaps_found
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_verified_at: 2026-09-16T20:00:00Z
  previous_gaps:
    - CR-01 (Add Medicine wizard buttons hardcoded)
    - WR-01 (Edit sheets "Saving…" hardcoded)
    - WR-02 (Custom unit/placeholder strings hardcoded)
    - WR-03 (8 aria-labels hardcoded)
  gap_closure_plan: 07-09-PLAN.md
  closure_status: "Partial — 4 gaps targeted, 3.5/4 closed; 1 instance of WR-03 (medicines/index.tsx) missed"
  new_gaps_identified:
    - WR-05 (aria-label="Open filters" not covered by 07-09 scope)
    - WR-07 (formatDate() hardcoded "No expiry" strings, out-of-scope for 07-09)

gaps:
  - truth: "All UI labels and screen titles display in the active language, including aria-labels for accessibility (I18N-02 Success Criterion #2)"
    status: failed
    reason: "WR-05 (NEW GAP): medicines/index.tsx:160 has aria-label='Open filters' hardcoded English on the primary Medicines list screen (the app's most-viewed screen). A Polish user cannot see this label translated, violating the phase goal of 'full string coverage'."
    artifacts:
      - path: "src/routes/medicines/index.tsx"
        issue: "Line 160: aria-label='Open filters' is hardcoded English literal, never routed through t(). This aria-label was not included in the 07-09 closure plan's WR-03 scope (which covered 8 instances across 5 files, but missed this one on the main Medicines list)."
    missing:
      - "Add aria.openFilters key to src/i18n/types.ts TranslationDict.aria namespace"
      - "Add aria.openFilters to src/i18n/en.ts (value: 'Open filters') and src/i18n/pl.ts (value: 'Otwórz filtry' or equivalent)"
      - "Change medicines/index.tsx:160 from aria-label='Open filters' to aria-label={t('aria.openFilters')}"

deferred: []
behavior_unverified_items: []
coincidental_reliance_items: []

human_verification:
  - test: "Toggle app language to Polish, navigate to Medicines list screen (first tab), and click the filter button (sliders icon). Verify the aria-label for the filter button reads 'Otwórz filtry' or equivalent Polish translation when using a screen reader."
    expected: "Screen reader announces the filter button's aria-label in Polish, not English."
    why_human: "aria-label text is not visible in the UI but only exposed to assistive technology (screen readers); automated grep/file checks cannot verify the accessibility announcement."

---

# Phase 07: i18n Polish Language - Re-verification Report

**Phase Goal:** Users can switch between English and Polish; all text displays in the chosen language with locale-aware formatting

**Verified:** 2026-09-16T21:35:00Z (Re-verification after 07-09 gap-closure plan)

**Status:** GAPS_FOUND — Phase goal NOT fully achieved

---

## Executive Summary

The 07-09 gap-closure plan successfully closed 3.5 of 4 documented gaps (CR-01, WR-01, WR-02, and 7/8 of WR-03), with **12 files modified and 4 commits executed**. However:

1. **WR-03 closure was incomplete:** One aria-label instance in `medicines/index.tsx:160` ("Open filters" on the primary Medicines list screen) was missed and remains hardcoded English.
2. **Out-of-scope gap persists:** `formatDate()` in `src/lib/utils.ts` hardcodes "No expiry" strings (WR-07), explicitly deferred by 07-09 but still violating "full string coverage."

**Result:** Phase goal requires all text to display in the active language. The missed `aria-label="Open filters"` on the most-viewed screen (Medicines list) and the hardcoded date-fallback strings mean the goal is NOT achieved.

---

## Detailed Verification

### Observable Truths (Phase Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can toggle between English and Polish using a visible persistent control (SC #1 / I18N-01) | ✓ VERIFIED | BottomTabBar.tsx: language toggle button functional, t('aria.switchToPolish')/t('aria.switchToEnglish') implemented; `useLang()` hook provides state management |
| 2 | All labels, placeholders, toasts, error messages, status names, screen titles switch to active language immediately without full page reload (SC #2 / I18N-02 — PRIMARY BLOCKER) | ✗ FAILED | medicines/index.tsx:160 has aria-label="Open filters" hardcoded English; also formatDate() (utils.ts:17-19) hardcodes "No expiry" strings. Not all text switches language. |
| 3 | Previously selected language persists in localStorage on app load (SC #3 / I18N-03) | ✓ VERIFIED | LanguageProvider.tsx:20-28 reads/writes 'medstock-lang' key; language restored on mount without full reload |
| 4 | Built-in category and predefined location names display in active language (SC #4 / I18N-04) | ✓ VERIFIED | CATEGORY_KEYS (10 entries), LOCATION_KEYS (7 entries) in types.ts; all wired through t() in FilterChips, FilterBottomSheet, CatalogAutocomplete, etc. |
| 5 | Dates display in locale-appropriate format: PL = DD.MM.YYYY, EN = YYYY-MM-DD (SC #5 / I18N-05) | ✓ VERIFIED | formatDate() in utils.ts correctly splits and reorders dates; MedicineCard and detail views call formatDate(date, lang) to render localized dates |

**Score:** 4/5 truths verified. Truth #2 FAILED (critical blocker on the phase goal).

---

### Gap-Closure Progress (07-09 Plan)

**Plan Target:** Close CR-01, WR-01, WR-02, WR-03 (4 documented gaps from 07-VERIFICATION.md re-verification)

**Execution Result:**

| Gap ID | Target | Status | Evidence | Notes |
|--------|--------|--------|----------|-------|
| CR-01 | Add Medicine wizard buttons (medicines/new.tsx:163,207) | ✓ FIXED | Lines 163, 207 now call t('form.creating'), t('form.nextAddStock'), t('form.savingGeneric'), t('form.addStock'); all 4 keys added to TranslationDict with English and Polish values | Critical user flow now fully translated in both languages |
| WR-01 | Edit sheet loading states (3 files: CatalogEditSheet, StockEditSheet, MedicineForm) | ✓ FIXED | CatalogEditSheet.tsx:81, StockEditSheet.tsx:103, MedicineForm.tsx:437 all call t('form.savingGeneric'); form.savingGeneric is distinct from form.saving (MoveStockSheet-only) | Consistent ellipsis character and distinct meaning from other save contexts |
| WR-02 | Custom unit option/placeholder and numeric placeholders (MedicineForm, StockFields) | ✓ FIXED | Both files use t('form.customUnitOption'), t('form.customUnitPlaceholder'), t('form.paoValuePlaceholder'), t('form.quantityPlaceholder'); StockFields also uses t('form.packCountPlaceholder') | User-typed custom-unit value left untranslated per D-07 (only static labels translated) |
| WR-03 | 8 aria-labels across 5 files | ⚠️ PARTIAL (7/8 fixed, 1 missed) | **Fixed:** BottomTabBar.tsx:79 (lang toggle), SearchBar.tsx:35 (clear search), FilterChips.tsx:55 (remove filter), medicines/new.tsx:143,178 (back to search × 2), medicines/[id].tsx:260,268,320 (edit/delete actions) — all use t(). **Missed:** medicines/index.tsx:160 (aria-label="Open filters" hardcoded) | 7 of 8 instances wired through t(); the missed instance is on the app's primary landing screen |

**NewGap: WR-05** (discovered during re-verification, not in original 07-09 scope)

| Gap ID | Description | Evidence | Severity |
|--------|-------------|----------|----------|
| WR-05 | medicines/index.tsx:160 aria-label="Open filters" hardcoded English, never translated | Line 160: `aria-label="Open filters"` on filter-sheet trigger button; aria.openFilters key does not exist in TranslationDict | **Critical** — on the app's primary Medicines list screen, the most-viewed and most-frequently-accessed screen |

**Out-of-Scope Gap: WR-07** (explicitly excluded from 07-09, but violates phase goal)

| Gap ID | Description | Evidence | Why Out-of-Scope |
|--------|-------------|----------|------------------|
| WR-07 | formatDate() hardcodes "No expiry" strings; duplicates dates.noExpiry key | utils.ts:17-19: `return lang === 'pl' ? 'Bez daty ważności' : 'No expiry'` — hardcoded literal instead of parametrized t() call | 07-09-PLAN.md line 87: WR-07 was explicitly listed as deferred (requires refactoring formatDate to accept t parameter) |

---

### Translation Dictionary Audit

**New Keys Added by 07-09 (all present):**

| Namespace | Keys | Status | Evidence |
|-----------|------|--------|----------|
| form (9 new) | creating, nextAddStock, addStock, savingGeneric, customUnitOption, customUnitPlaceholder, paoValuePlaceholder, quantityPlaceholder, packCountPlaceholder | ✓ All present in types.ts; both en.ts and pl.ts populated | npm run build exits 0 (TypeScript structural type enforcement) |
| aria (8 keys) | backToSearch, switchToPolish, switchToEnglish, clearSearch, removeFilter, editStockEntry, deleteCatalog, editCatalog | ✓ All 8 present in types.ts lines 284-293 | English values in en.ts:282-291; Polish values in pl.ts:265-273 |
| **aria (1 MISSING)** | **openFilters** (WR-05) | ✗ **NOT DEFINED** | Should be in TranslationDict.aria namespace but does not exist — this is the gap |

**Sample Polish translations verified (pl.ts lines 200-207):**
- `creating: 'Tworzenie…'`
- `nextAddStock: 'Dalej: Dodaj zapas'`
- `addStock: 'Dodaj zapas'`
- `savingGeneric: 'Zapisywanie…'`
- `customUnitOption: 'Inna...'`
- `customUnitPlaceholder: 'Własna jednostka'`

---

### Build and Test Verification

- `npm run build` — ✓ Exits 0 (all 12 modified files compile without error; TranslationDict structural type enforced for both en.ts and pl.ts)
- `npx vitest run` — ✓ All 143 tests pass (no regression in existing suites)
- `npm run lint` — ✓ Exits 0 (5 pre-existing, unrelated warnings only; no new issues in modified files)

---

### Key Artifacts Status

| Artifact | Modified | Verified | Issues |
|----------|----------|----------|--------|
| src/i18n/types.ts | ✓ | ✓ VERIFIED | Added form namespace (9 keys) + aria namespace (8 keys); aria.openFilters missing (WR-05) |
| src/i18n/en.ts | ✓ | ✓ VERIFIED | All 17 new keys populated with English values; aria section missing openFilters key |
| src/i18n/pl.ts | ✓ | ✓ VERIFIED | All 17 new keys populated with Polish values; aria section missing openFilters key |
| src/routes/medicines/new.tsx | ✓ | ✓ VERIFIED | Lines 163, 178, 207: all 4 button/aria-label call sites wired through t() |
| src/components/CatalogEditSheet.tsx | ✓ | ✓ VERIFIED | Line 81: submitting-state text now uses t('form.savingGeneric') |
| src/components/StockEditSheet.tsx | ✓ | ✓ VERIFIED | Line 103: submitting-state text now uses t('form.savingGeneric') |
| src/components/MedicineForm.tsx | ✓ | ✓ VERIFIED | Line 437: submitting-state uses t('form.savingGeneric'); lines 389, 394: custom-unit options use t() |
| src/components/StockFields.tsx | ✓ | ✓ VERIFIED | Lines 303, 308: custom-unit options use t(); placeholder calls use t('form.*PlaceholderPlaceholder') |
| src/components/BottomTabBar.tsx | ✓ | ✓ VERIFIED | Line 79: language-toggle aria-label now uses t('aria.switchToPolish')/t('aria.switchToEnglish') |
| src/components/SearchBar.tsx | ✓ | ✓ VERIFIED | Line 35: clear-search button aria-label now uses t('aria.clearSearch') |
| src/components/FilterChips.tsx | ✓ | ✓ VERIFIED | Line 55: chip-removal aria-label concatenates t('aria.removeFilter') with chip label |
| src/routes/medicines/[id].tsx | ✓ | ✓ VERIFIED | Lines 260, 268, 320: three aria-labels now use t('aria.editCatalog')/t('aria.deleteCatalog')/t('aria.editStockEntry') |
| src/routes/medicines/index.tsx | ✗ | ✗ UNMODIFIED | Line 160: `aria-label="Open filters"` remains hardcoded; NOT touched by 07-09 plan (WR-05) |
| src/lib/utils.ts | ✗ | ✗ UNMODIFIED | Lines 17-19: formatDate() still hardcodes "No expiry" strings; explicitly out-of-scope for 07-09 (WR-07) |

---

### Requirements Traceability

| Requirement | Phase Goal | Status | Evidence | Blocker |
|-------------|-----------|--------|----------|---------|
| I18N-01 | User can switch language persistently | ✓ SATISFIED | BottomTabBar toggle functional; state persists per localStorage check in LanguageProvider | — |
| I18N-02 | All UI strings display in active language | ✗ BLOCKED | CR-01, WR-01, WR-02 fixed; WR-03 7/8 fixed; WR-05 and WR-07 gaps remain → not "all" strings translated | **YES** |
| I18N-03 | Language persists in localStorage | ✓ SATISFIED | LanguageProvider reads/writes 'medstock-lang' on mount and language change | — |
| I18N-04 | Built-in names display in active language | ✓ SATISFIED | CATEGORY_KEYS (10 entries), LOCATION_KEYS (7 entries) all wired through t() | — |
| I18N-05 | Dates display in locale-appropriate format | ✓ SATISFIED | formatDate() correctly returns DD.MM.YYYY (PL) or YYYY-MM-DD (EN) | — |

**Phase Goal Achievement:** ✗ NOT ACHIEVED — I18N-02 ("all UI strings display in active language") blocked by missed aria-label and out-of-scope formatDate() hardcoding.

---

## Gaps Summary

### Gaps Found (Must Close)

**Critical Gap (Phase-Blocking):**
- **WR-05:** The app's primary Medicines list screen (medicines/index.tsx:160) has an untranslated aria-label button ("Open filters"). This is the screen every user sees first, and it violates the phase goal of "all text displays in the chosen language." Screen readers will announce "Open filters" in English to Polish users.

**Known Out-of-Scope Gap (Noted for Completeness):**
- **WR-07:** `formatDate()` hardcodes "No expiry" strings (utils.ts:17-19) instead of using the translation dictionary. This was explicitly deferred by 07-09 planning but still violates "full string coverage."

---

## Conclusion

**Phase Goal:** "Add Polish/English language switching with **full string coverage** and locale-aware dates"

**Achievement Status:**

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Language switching ✓ | ✓ ACHIEVED | Toggle works; state management complete |
| Locale-aware dates ✓ | ✓ ACHIEVED | formatDate() returns correct format per language |
| Full string coverage ✗ | ✗ NOT ACHIEVED | 2 gaps remain: WR-05 (aria-label on primary screen) + WR-07 (formatDate hardcoding) |

**Recommendation:** Mark as **GAPS_FOUND**. The 07-09 plan made significant progress (fixing CR-01, WR-01, WR-02, and 7/8 of WR-03), but the phase goal's promise of "full string coverage" is not met. The missed aria-label is on the app's most-viewed screen, making it a visible gap for any Polish user who relies on screen reader accessibility. Do not proceed to Phase 8 without closing WR-05.

---

## Next Steps

To achieve "PASSED" status, the following work is required:

1. **Close WR-05 (aria-label translation):**
   - Add `openFilters: string` to `TranslationDict.aria` in src/i18n/types.ts
   - Add English value to src/i18n/en.ts aria section
   - Add Polish equivalent to src/i18n/pl.ts aria section
   - Update medicines/index.tsx:160 to use `aria-label={t('aria.openFilters')}`
   - Verify `npm run build` exits 0

2. **Optional (out-of-scope for 07-09, but recommended for true "full coverage"):**
   - Refactor formatDate() to accept the "No expiry" label as a parameter instead of hardcoding it
   - Update all callers to pass `t('dates.noExpiry')`
   - This addresses WR-07 and eliminates the duplicate string maintenance risk

---

_Verified: 2026-09-16T21:35:00Z_  
_Verifier: Claude (gsd-verifier) — re-verification after 07-09-PLAN.md gap closure_  
_Code Review Reference: 07-REVIEW.md (2026-09-16)_  
_Previous Verification: 07-VERIFICATION.md (2026-09-16T20:00:00Z, status: gaps_found with CR-01/WR-01/WR-02/WR-03)_
