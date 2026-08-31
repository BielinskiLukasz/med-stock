---
phase: 07-i18n-polish-language
plan: 03
subsystem: ui
tags: [i18n, react, typescript, forms, sheets, history]

requires:
  - phase: 07-i18n-polish-language
    plan: 01
    provides: useLang hook, CATEGORY_KEYS, LOCATION_KEYS, FORM_TYPE_KEYS, UNIT_KEYS, TranslationDict

provides:
  - CatalogFields: category and form-type dropdowns render Polish labels (value props preserved as canonical English)
  - MedicineForm: all labels, location names, unit options, PAO unit options, buttons and toasts translated
  - StockFields: all labels, quantity unit and PAO unit dropdowns, location names, pack count, toasts translated
  - StockEditSheet: SheetTitle, buttons, toast translated
  - MoveStockSheet: SheetTitle, target location label, location items, buttons, toast translated
  - CatalogEditSheet: SheetTitle, buttons, toast translated
  - ChangeHistory: section heading and no-history text translated
  - HistoryEntry: formatEntry refactored with t()/lang params; timestamp locale-aware; action strings translated

affects:
  - 07-04

actuals:
  tokens: 2800
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - Form i18n pattern: import useLang + lookup Records at the top of each form component; call const { t } = useLang() inside the component; render t(KEY[value] ?? 'fallback.key') as SelectItem children; value props stay canonical English
    - History i18n pattern: formatEntry becomes a pure function accepting (entry, t, lang); component calls useLang() and passes t/lang through; Intl.toLocaleString locale switches on lang value

key-files:
  created: []
  modified:
    - src/components/CatalogFields.tsx
    - src/components/MedicineForm.tsx
    - src/components/StockFields.tsx
    - src/components/StockEditSheet.tsx
    - src/components/MoveStockSheet.tsx
    - src/components/CatalogEditSheet.tsx
    - src/components/ChangeHistory.tsx
    - src/components/HistoryEntry.tsx

key-decisions:
  - "D-05 applied: SelectItem value props left as canonical English strings in all three form components; only display labels use t()"
  - "D-08 applied: PAO unit SelectItems (days/weeks/months) and QUANTITY_UNITS SelectItems display translated labels; stored values unchanged"
  - "D-06/D-07 applied: location display uses t(LOCATION_KEYS[loc.name] ?? loc.name) — predefined locations translate, user-created names render as-is"
  - "MedicineForm submitLabel prop made optional with t('form.save') as runtime default to enable hook-driven default"
  - "HistoryEntry formatEntry refactored as pure function accepting t and lang to avoid hook-in-function-body pattern"
  - "MoveStockSheet submit button simplified from dynamic 'Move N boxes/units' to t('form.save') per plan specification"
  - "MoveStockSheet also translates target location label, no-location SelectItem, and predefined location names (Rule 2 — adjacent untranslated strings)"

requirements-completed:
  - I18N-02
  - I18N-04

coverage:
  - id: D1
    description: "Form dropdowns for category and form-type in CatalogFields show Polish labels when Polish active; value props remain canonical English strings"
    requirement: I18N-02
    verification:
      - kind: other
        ref: "npm run build (exit 0, 0 TypeScript errors)"
        status: pass
    human_judgment: true
    rationale: "Visual verification required — dropdown label rendering in Polish mode cannot be asserted by unit test without a LanguageProvider-wrapped render harness"
  - id: D2
    description: "Form dropdowns for quantity units and PAO units in MedicineForm and StockFields show Polish labels when Polish active"
    requirement: I18N-02
    verification:
      - kind: other
        ref: "npm run build (exit 0)"
        status: pass
    human_judgment: true
    rationale: "Visual verification required — unit dropdown rendering in Polish mode"
  - id: D3
    description: "Sheet titles (Edit stock, Move stock, Edit medicine) and toast messages render in active language"
    requirement: I18N-02
    verification:
      - kind: other
        ref: "npm run build (exit 0)"
        status: pass
    human_judgment: true
    rationale: "Visual verification required — sheet open/close interaction and toast trigger"
  - id: D4
    description: "ChangeHistory section heading and no-history text render in active language"
    requirement: I18N-02
    verification:
      - kind: other
        ref: "npm run build (exit 0)"
        status: pass
    human_judgment: true
    rationale: "Visual verification required — history section rendering"
  - id: D5
    description: "HistoryEntry action strings (added, deleted, restored, field-changed, multi-field) render in active language with locale-appropriate timestamp"
    requirement: I18N-02
    verification:
      - kind: other
        ref: "npm run build (exit 0)"
        status: pass
    human_judgment: true
    rationale: "Visual verification required — history entry rendering with live DB data"
  - id: D6
    description: "TypeScript build passes with zero errors — TranslationDict structural type validates all t() key paths"
    requirement: I18N-04
    verification:
      - kind: other
        ref: "npm run build (exit 0)"
        status: pass
      - kind: unit
        ref: "npx vitest run — 141/141 passed"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-08-31
status: complete
---

# Phase 7 Plan 03: Form/Sheet/History Translation Summary

**All eight form-entry and stock management components translated — dropdown labels, form labels, sheet titles, toast messages, and history action strings render in the active language via useLang(); stored canonical values never modified**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-08-31T23:14:23Z
- **Completed:** 2026-08-31T23:23:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- CatalogFields, MedicineForm, StockFields: all form labels, dropdown display labels, placeholder text, button labels, and toast messages translated via t(); CATEGORY_KEYS, FORM_TYPE_KEYS, UNIT_KEYS, LOCATION_KEYS lookup records applied to SelectItem labels while value props remain canonical English (D-05, D-06, D-07, D-08)
- StockEditSheet, MoveStockSheet, CatalogEditSheet: SheetTitle, button labels, and toast.error calls translated; MoveStockSheet also translates target location label and location dropdown items
- ChangeHistory: heading and empty-state text translated via t('history.title') and t('history.noHistory')
- HistoryEntry: formatEntry() refactored from module-level function to accept (t, lang) params; action strings (added, deleted, restored, field-changed, multi-field) fully translated; timestamp rendered with pl-PL or en-GB locale based on active lang
- TypeScript build: exit 0; 141/141 vitest tests pass

## Task Commits

1. **Task 1: Form field components** - `e39cb4e` (feat)
2. **Task 2: Sheets and history** - `bacd73b` (feat)

## Files Created/Modified

- `src/components/CatalogFields.tsx` — useLang + CATEGORY_KEYS + FORM_TYPE_KEYS; Name/Category/Form/Notes labels and dropdown labels translated
- `src/components/MedicineForm.tsx` — useLang + CATEGORY_KEYS + LOCATION_KEYS + UNIT_KEYS; all labels, location display, PAO/quantity units, toast translated; submitLabel prop made optional with t('form.save') runtime default
- `src/components/StockFields.tsx` — useLang + UNIT_KEYS + LOCATION_KEYS; all labels, unit/location dropdowns, PAO units, pack count, toast translated
- `src/components/StockEditSheet.tsx` — useLang; SheetTitle, buttons, toast translated
- `src/components/MoveStockSheet.tsx` — useLang + LOCATION_KEYS; SheetTitle, target location, location items, buttons, toast translated
- `src/components/CatalogEditSheet.tsx` — useLang; SheetTitle, buttons, toast translated
- `src/components/ChangeHistory.tsx` — useLang; heading and no-history text translated
- `src/components/HistoryEntry.tsx` — useLang + Lang type; formatEntry refactored as pure function with t/lang params; all action strings and timestamp locale-aware

## Decisions Made

- MedicineForm `submitLabel` default changed from `'Save'` (compile-time string) to `t('form.save')` (runtime-resolved) using a `resolvedLabel` const inside the component body — the hook constraint prevents using a dynamic default in the function signature
- MoveStockSheet dynamic submit button text ("Move N boxes" / "Move N units") simplified to `t('form.save')` per plan specification — dynamic box/unit count text is useful UX but the plan explicitly calls for t('form.save')
- HistoryEntry `formatEntry` made into a pure function accepting `(entry, t, lang)` rather than calling `useLang()` inside the helper — React hooks must be called in component body only

## Deviations from Plan

### Auto-fixed / Scoped Adjustments

**1. [Rule 2 - Missing] MoveStockSheet additional translations**
- **Found during:** Task 2
- **Issue:** Plan spec for MoveStockSheet covered SheetTitle, target location label, buttons, and toast. The no-location SelectItem and predefined location SelectItems were also hardcoded English strings in the same component.
- **Fix:** Added LOCATION_KEYS import and translated no-location option (t('form.noLocation')) and location items (t(LOCATION_KEYS[loc.name] ?? loc.name)) — consistent with StockFields pattern established in Task 1.
- **Files modified:** src/components/MoveStockSheet.tsx
- **Committed in:** bacd73b (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — adjacent untranslated strings in same component)
**Impact on plan:** Minor scope extension within the component. No new files or architectural changes.

## Known Stubs

None — all translated strings have live data from the i18n dictionaries; no placeholders remain.

## Self-Check: PASSED

- `src/components/CatalogFields.tsx` — FOUND
- `src/components/MedicineForm.tsx` — FOUND
- `src/components/StockFields.tsx` — FOUND
- `src/components/StockEditSheet.tsx` — FOUND
- `src/components/MoveStockSheet.tsx` — FOUND
- `src/components/CatalogEditSheet.tsx` — FOUND
- `src/components/ChangeHistory.tsx` — FOUND
- `src/components/HistoryEntry.tsx` — FOUND
- Task 1 commit e39cb4e — exists
- Task 2 commit bacd73b — exists
- `npm run build` — exit 0: verified
- `npx vitest run` — 141/141 passed: verified

## Next Phase Readiness

- Plan 07-04 can proceed — all form, sheet, and history strings are translated
- All translation keys used in this plan were already present in en.ts and pl.ts from Plan 07-01
- No new exported symbols — all changes are internal call-site translations in existing components

---

*Phase: 07-i18n-polish-language*
*Completed: 2026-08-31*
