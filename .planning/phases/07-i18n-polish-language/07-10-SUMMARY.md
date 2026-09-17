---
phase: 07-i18n-polish-language
plan: 10
subsystem: i18n
tags: [i18n, translation, accessibility, aria-label, placeholder]

requires:
  - phase: 07-i18n-polish-language
    provides: [aria.* and form.* TranslationDict namespaces established in 07-01..07-09]
provides:
  - "aria.openFilters TranslationDict key (EN/PL) wired at medicines/index.tsx:160 filter-sheet trigger button"
  - "form.namePlaceholder value corrected in en.ts/pl.ts and wired at both CatalogFields.tsx:54 and MedicineForm.tsx:119 name inputs"
  - "Repo-wide zero-match confirmation: no hardcoded English aria-label/placeholder/title literal remains in src/**/*.tsx"
affects: []

actuals:
  tokens: 3200
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified: [src/i18n/types.ts, src/i18n/en.ts, src/i18n/pl.ts, src/routes/medicines/index.tsx, src/components/CatalogFields.tsx, src/components/MedicineForm.tsx]

key-decisions:
  - "Reused the existing (previously orphaned) form.namePlaceholder key for the medicine-name placeholder rather than minting a new key — its purpose already matched exactly what both call sites needed."
  - "aria.openFilters English value copied verbatim from the previously-hardcoded medicines/index.tsx:160 literal ('Open filters') to avoid introducing a wording drift during translation."

patterns-established: []

requirements-completed: [I18N-02]

coverage:
  - id: D1
    description: "WR-05: Medicines list filter-sheet trigger button aria-label translated via aria.openFilters"
    requirement: "I18N-02"
    verification:
      - kind: other
        ref: "npm run build && grep -c \"t('aria.openFilters')\" src/routes/medicines/index.tsx"
        status: pass
    human_judgment: false
  - id: D2
    description: "Gap 2: medicine-name input placeholder corrected (form.namePlaceholder) and wired at both CatalogFields.tsx and MedicineForm.tsx call sites"
    requirement: "I18N-02"
    verification:
      - kind: other
        ref: "npm run build && grep -c \"t('form.namePlaceholder')\" src/components/CatalogFields.tsx && grep -c \"t('form.namePlaceholder')\" src/components/MedicineForm.tsx && ! grep -rnE 'aria-label=\"[A-Za-z]|placeholder=\"[A-Za-z]|title=\"[A-Za-z]' src --include='*.tsx'"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-09-17
status: complete
---

# Phase 07 Plan 10: i18n Gap Closure (WR-05 + Placeholder Gap) Summary

**Closed the final two i18n gaps blocking I18N-02: aria.openFilters wired on the Medicines list filter button, and form.namePlaceholder corrected and wired at both medicine-name input call sites (CatalogFields.tsx and MedicineForm.tsx) — repo-wide grep confirms zero hardcoded English aria-label/placeholder/title literals remain.**

## Performance
- **Duration:** ~15min
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- WR-05 closed: `medicines/index.tsx:160`'s filter-sheet trigger button now renders `aria-label={t('aria.openFilters')}` in both English and Polish, closing the 8th of 8 aria-label call sites (07-09 had closed 7/8).
- Gap 2 closed: `form.namePlaceholder`'s EN/PL dictionary values corrected to match the wording already used at both real call sites ("e.g. Ibuprofen 400mg" / "np. Ibuprofen 400mg"), and both `CatalogFields.tsx:54` and `MedicineForm.tsx:119` now call `t('form.namePlaceholder')` instead of a hardcoded literal.
- Final repo-wide grep probe (`grep -rnE 'aria-label="[A-Za-z]|placeholder="[A-Za-z]|title="[A-Za-z]' src --include='*.tsx'`) confirmed zero matches — no third hardcoded call site was missed or introduced.

## Task Commits
1. **Task 1: Close WR-05 — add aria.openFilters and wire the Medicines list filter button** - `5b2b386`
2. **Task 2: Close Gap 2 — correct and wire form.namePlaceholder at both name-input call sites** - `ad0d903`

**Plan metadata:** (pending — recorded after this summary commit)

## Files Created/Modified
- `src/i18n/types.ts` - Added `openFilters: string` to the `aria` object type
- `src/i18n/en.ts` - Added `aria.openFilters: 'Open filters'`; corrected `form.namePlaceholder` to `'e.g. Ibuprofen 400mg'`
- `src/i18n/pl.ts` - Added `aria.openFilters: 'Otwórz filtry'`; corrected `form.namePlaceholder` to `'np. Ibuprofen 400mg'`
- `src/routes/medicines/index.tsx` - Filter-sheet trigger button's `aria-label` now calls `t('aria.openFilters')`
- `src/components/CatalogFields.tsx` - Medicine-name `Input`'s `placeholder` now calls `t('form.namePlaceholder')`
- `src/components/MedicineForm.tsx` - Medicine-name `Input`'s `placeholder` now calls `t('form.namePlaceholder')`

## Decisions Made
- Reused the existing orphaned `form.namePlaceholder` key rather than minting a duplicate — it already existed since an earlier plan (flagged as WR-08 in 07-REVIEW.md, deferred by 07-09) with the exact right purpose, just an unwired, shorter-example value.
- Copied the English `aria.openFilters` wording verbatim from the previously-hardcoded literal to avoid introducing wording drift during the swap-to-`t()` change.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Phase 07 now has all 10 plans summarized. Per 07-VERIFICATION.md, this was the last documented gap (WR-05) plus the one additional gap found this session (Gap 2/placeholder), both now closed and confirmed by a repo-wide zero-match grep. `npm run build`, `npx vitest run` (143/143 passing), and `npm run lint` (0 errors, only pre-existing unrelated warnings) all pass. Phase 07 is ready for its next re-verification pass before Phase 8 (Full Location Management) starts.

---
*Phase: 07-i18n-polish-language*
*Completed: 2026-09-17*

## Self-Check: PASSED

All 6 modified source files and this SUMMARY.md verified present on disk. Both task commits (`5b2b386`, `ad0d903`) verified present in git history.
