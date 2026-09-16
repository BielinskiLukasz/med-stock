---
phase: 07-i18n-polish-language
plan: 09
subsystem: i18n
tags: [react, typescript, i18n, translation-dictionary, aria, forms]

# Dependency graph
requires:
  - phase: 07-i18n-polish-language
    provides: custom useLang()/t()/TranslationDict pattern (Plans 07-01 through 07-08)
provides:
  - 9 new form.* TranslationDict keys (creating, nextAddStock, addStock, savingGeneric, customUnitOption, customUnitPlaceholder, paoValuePlaceholder, quantityPlaceholder, packCountPlaceholder)
  - new top-level aria.* TranslationDict namespace (8 keys)
  - Add Medicine wizard Step 2/3 submit buttons wired through t() (CR-01)
  - CatalogEditSheet/StockEditSheet/MedicineForm submit buttons wired through t('form.savingGeneric') (WR-01)
  - custom-unit option/placeholder and numeric placeholders wired through t() in MedicineForm/StockFields (WR-02)
  - all 8 aria-label attributes across 5 files wired through t() (WR-03)
affects: [gsd-ship, requirement I18N-02]

actuals:
  tokens: 4200
  tasks: 4
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Reused established custom TranslationDict/useLang()/t() pattern — no new dependency or architecture"

key-files:
  created: []
  modified:
    - src/i18n/types.ts
    - src/i18n/en.ts
    - src/i18n/pl.ts
    - src/routes/medicines/new.tsx
    - src/components/CatalogEditSheet.tsx
    - src/components/StockEditSheet.tsx
    - src/components/MedicineForm.tsx
    - src/components/StockFields.tsx
    - src/components/BottomTabBar.tsx
    - src/components/SearchBar.tsx
    - src/components/FilterChips.tsx
    - "src/routes/medicines/[id].tsx"

key-decisions:
  - "form.savingGeneric is a distinct key from the pre-existing form.saving ('Moving…', MoveStockSheet-only) — reused across the wizard Step 3 button and all 3 edit-sheet submit buttons, resolving MedicineForm.tsx's inconsistent plain-dots ellipsis in the same change"
  - "User-typed custom-unit Input value/onChange left untranslated per D-07 — only the static SelectItem label and static placeholder text were routed through t()"
  - "aria.removeFilter holds only the leading verb; FilterChips concatenates it with the chip's own label at render time, matching the existing `${t('filter.category')}: ${...}` concatenation idiom already used in that file"

patterns-established: []

requirements-completed: [I18N-02]

coverage:
  - id: CR-01
    description: "Add Medicine wizard Step 2 and Step 3 submit buttons render translated idle/submitting text in both EN and PL"
    requirement: I18N-02
    verification:
      - kind: unit
        ref: "npm run build && grep -c \"t('form.creating')\" src/routes/medicines/new.tsx (and 3 sibling greps for nextAddStock/savingGeneric/addStock, all >=1)"
        status: pass
    human_judgment: false
  - id: WR-01
    description: "CatalogEditSheet, StockEditSheet, MedicineForm submit buttons show t('form.savingGeneric') during submission with a consistent ellipsis character"
    requirement: I18N-02
    verification:
      - kind: unit
        ref: "npm run build && grep -c \"t('form.savingGeneric')\" across CatalogEditSheet.tsx/StockEditSheet.tsx/MedicineForm.tsx, all >=1"
        status: pass
    human_judgment: false
  - id: WR-02
    description: "MedicineForm and StockFields custom-unit SelectItem/Input placeholder and paoValue/quantity/packCount numeric placeholders render via t()"
    requirement: I18N-02
    verification:
      - kind: unit
        ref: "npm run build && grep -c checks for form.customUnitOption/customUnitPlaceholder/paoValuePlaceholder/quantityPlaceholder in both files, plus form.packCountPlaceholder in StockFields.tsx, all >=1"
        status: pass
    human_judgment: false
  - id: WR-03
    description: "All 8 aria-label attributes across BottomTabBar, SearchBar, FilterChips, medicines/new.tsx, and medicines/[id].tsx render via t()"
    requirement: I18N-02
    verification:
      - kind: unit
        ref: "npm run build && grep -c checks for aria.switchToPolish/switchToEnglish/clearSearch/removeFilter/backToSearch (>=2)/editStockEntry/deleteCatalog/editCatalog, all meeting required minimums"
        status: pass
    human_judgment: false
  - id: regression-guard
    description: "No regression introduced in existing test suites or lint"
    verification:
      - kind: unit
        ref: "npx vitest run (143/143 tests passed)"
        status: pass
      - kind: unit
        ref: "npm run lint (exit 0; only 5 pre-existing, unrelated only-export-components warnings)"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-09-16
status: complete
---

# Phase 07 Plan 09: Translation Gap-Closure (CR-01/WR-01/WR-02/WR-03) Summary

**17 new i18n keys (9 `form.*` + 8 `aria.*`) wired into the Add Medicine wizard's primary submit buttons, 3 edit-sheet saving states, MedicineForm/StockFields custom-unit and numeric placeholders, and 8 aria-label attributes across 5 files — closing all 4 documented translation-coverage gaps blocking Phase 7.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-09-16T18:50:00Z (approx.)
- **Completed:** 2026-09-16T19:10:11Z
- **Tasks:** 4 completed
- **Files modified:** 12

## Accomplishments
- Closed CR-01 (Critical): Add Medicine wizard Step 2/3 submit buttons now render translated idle/submitting text in both EN and PL — the app's core "add a medicine" flow is fully localized.
- Closed WR-01: 3 edit sheets (CatalogEditSheet, StockEditSheet, MedicineForm) now show a translated, ellipsis-consistent generic saving indicator distinct from MoveStockSheet's "Moving…".
- Closed WR-02: custom quantity-unit option/placeholder and all 3 numeric example placeholders (paoValue, quantity, packCount) now render translated text without touching the user's own typed value.
- Closed WR-03: all 8 aria-label attributes across BottomTabBar, SearchBar, FilterChips, medicines/new.tsx, and medicines/[id].tsx now render translated text for screen readers.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add all 17 new translation keys and close CR-01 (Add Medicine wizard buttons)** - `c48c9aa` (feat)
2. **Task 2: Close WR-01 (edit sheet "Saving…" hardcoded in 3 files)** - `02e22a7` (fix)
3. **Task 3: Close WR-02 (custom-unit option/placeholder + numeric example placeholders)** - `1f2de39` (fix)
4. **Task 4: Close WR-03 (8 hardcoded aria-label attributes across 6 files)** - `fdf96a5` (fix)

**Plan metadata:** committed separately after this SUMMARY.md is written.

## Files Created/Modified
- `src/i18n/types.ts` - extended `TranslationDict.form` with 9 new fields and added new top-level `aria` type (8 fields)
- `src/i18n/en.ts` - populated 9 new `form.*` and 8 new `aria.*` English values
- `src/i18n/pl.ts` - populated 9 new `form.*` and 8 new `aria.*` Polish values
- `src/routes/medicines/new.tsx` - Step 2/Step 3 submit buttons wired through `t()`; both "Back to search" aria-labels wired through `t('aria.backToSearch')`
- `src/components/CatalogEditSheet.tsx` - submitting-state text wired through `t('form.savingGeneric')`
- `src/components/StockEditSheet.tsx` - submitting-state text wired through `t('form.savingGeneric')`
- `src/components/MedicineForm.tsx` - submitting-state text, custom-unit option/placeholder, and paoValue/quantity placeholders wired through `t()`
- `src/components/StockFields.tsx` - custom-unit option/placeholder and paoValue/quantity/packCount placeholders wired through `t()`
- `src/components/BottomTabBar.tsx` - language-toggle aria-label wired through `t('aria.switchToPolish')`/`t('aria.switchToEnglish')`
- `src/components/SearchBar.tsx` - clear-search button aria-label wired through `t('aria.clearSearch')`
- `src/components/FilterChips.tsx` - chip-removal aria-label wired through `t('aria.removeFilter')` concatenated with the chip's own label
- `src/routes/medicines/[id].tsx` - edit-stock/delete-catalog/edit-catalog aria-labels wired through `t('aria.editStockEntry')`/`t('aria.deleteCatalog')`/`t('aria.editCatalog')`

## Decisions Made
- `form.savingGeneric` introduced as a distinct key rather than reusing `form.saving` (which means "Moving…" and is MoveStockSheet-only), per 07-VERIFICATION.md's explicit note on this collision risk.
- The MedicineForm.tsx submitting-state fix simultaneously resolved a pre-existing inconsistent ellipsis style (plain dots vs. the ellipsis character) noted in 07-REVIEW.md WR-01, since `form.savingGeneric`'s value uses the standard ellipsis character established across the rest of the dictionary.
- User-typed custom-unit input value was explicitly left untouched (no `t()` wrapping) per 07-CONTEXT.md D-07 and this plan's `must_haves.prohibitions` — only the static SelectItem label and static placeholder were translated.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase complete, ready for verification. All 4 documented gaps from 07-VERIFICATION.md's re-verification (CR-01, WR-01, WR-02, WR-03) are closed. `npm run build`, `npx vitest run` (143/143 passed), and `npm run lint` (exit 0) all pass with no new failures. Requirement I18N-02 ("All UI strings display in the active language") is unblocked.

The out-of-scope items explicitly deferred by this plan (WR-04 through WR-08, IN-01 through IN-03) remain open in the codebase and were not touched, per this plan's objective.

---
*Phase: 07-i18n-polish-language*
*Completed: 2026-09-16*
