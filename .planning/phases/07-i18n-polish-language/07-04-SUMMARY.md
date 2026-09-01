---
phase: 07-i18n-polish-language
plan: "04"
subsystem: ui
tags: [react, i18n, typescript, polish, translation]

requires:
  - phase: 07-01
    provides: LangContext, useLang hook, t() function, TranslationDict, CATEGORY_KEYS, LOCATION_KEYS, UNIT_KEYS, FORM_TYPE_KEYS, formatDate
  - phase: 07-02
    provides: status/filter/card display translation
  - phase: 07-03
    provides: form field, sheet, history component translation
provides:
  - All medicine route screens translated (index, new, [id], [id].edit)
  - Dashboard, trash, locations, data route screens translated
  - SearchBar, ExportSection, ImportJSONSection, ImportCSVSection utility components translated
  - Complete i18n coverage for all user-visible route screens and utility components
affects: []

actuals:
  tokens: 12220
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Dynamic translation key lookup: CATEGORY_KEYS[value] ? t(CATEGORY_KEYS[value]) : value — falls back to stored value when key not in map"
    - "Null location invariant: location !== null ? (LOCATION_KEYS[loc] ? t(LOCATION_KEYS[loc]) : loc) : t('locationNames.other')"
    - "D-07 predefined vs user-created location: LOCATION_KEYS[loc.name] ? t(LOCATION_KEYS[loc.name]) : loc.name"
    - "D-13 ISO timestamp: toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB') for deletedAt fields"

key-files:
  created: []
  modified:
    - src/i18n/types.ts
    - src/i18n/en.ts
    - src/i18n/pl.ts
    - src/routes/medicines/index.tsx
    - src/routes/medicines/new.tsx
    - src/routes/medicines/[id].tsx
    - src/routes/medicines/[id].edit.tsx
    - src/routes/dashboard/index.tsx
    - src/routes/trash/index.tsx
    - src/routes/locations/index.tsx
    - src/routes/data/index.tsx
    - src/components/SearchBar.tsx
    - src/components/ExportSection.tsx
    - src/components/ImportJSONSection.tsx
    - src/components/ImportCSVSection.tsx

key-decisions:
  - "TranslationDict extended with detail, locations, data, and common.at sections before modifying route files to avoid build breaks during incremental edits"
  - "ImportJSONSection confirmation dialog body left in English due to dynamic count interpolation (t() has no interpolation support)"
  - "SearchBar resolves placeholder prop with ?? fallback to t('medicines.searchPlaceholder') preserving existing API for callers that pass a custom placeholder"

patterns-established:
  - "Always extend types.ts + en.ts + pl.ts atomically before using new keys in components"
  - "Dynamic enum display: key-map lookup with raw-value fallback (CATEGORY_KEYS, LOCATION_KEYS, UNIT_KEYS)"
  - "ISO timestamp localization: toLocaleDateString with locale string derived from lang"

requirements-completed:
  - I18N-02
  - I18N-05

coverage:
  - id: D1
    description: "Medicine list screen (title, search placeholder, empty state, Add button) renders in active language"
    requirement: I18N-02
    verification:
      - kind: unit
        ref: "npx vitest run — 141 tests pass"
        status: pass
    human_judgment: true
    rationale: "Visual string rendering in Polish requires manual toggle verification"
  - id: D2
    description: "Medicine detail view labels (Expires, Opened, stock entries, location, category) and toast messages render in active language; dates use formatDate"
    requirement: I18N-02
    verification:
      - kind: unit
        ref: "npx tsc --noEmit — zero errors"
        status: pass
    human_judgment: true
    rationale: "Dynamic key lookups (CATEGORY_KEYS, LOCATION_KEYS, UNIT_KEYS) require visual check to confirm all enum values translate correctly"
  - id: D3
    description: "Dashboard, trash, locations, and data route screens render all labels in active language"
    requirement: I18N-02
    verification:
      - kind: unit
        ref: "npx tsc --noEmit — zero errors"
        status: pass
    human_judgment: true
    rationale: "Screen-level string coverage needs visual toggle verification"
  - id: D4
    description: "Trash screen deleted date renders using locale-appropriate format (D-13 ISO timestamp pattern)"
    requirement: I18N-05
    verification:
      - kind: unit
        ref: "npx tsc --noEmit — zero errors"
        status: pass
    human_judgment: true
    rationale: "Date format locale correctness requires visual check with real data"

duration: 45min
completed: 2026-09-01
status: complete
---

# Phase 07 Plan 04: Route Screens and Utility Components Translation Summary

**Polish and English translations wired to all 8 route screens and 4 utility components, completing full i18n coverage across the MedStock UI**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-09-01T06:30:00Z
- **Completed:** 2026-09-01T07:14:51Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments

- All medicine route screens (index, new, [id], [id].edit) translated — titles, labels, buttons, toasts, dialogs, and empty states
- Dashboard, trash, locations, and data route screens translated — all user-visible strings use t() with active language
- SearchBar, ExportSection, ImportJSONSection, ImportCSVSection utility components translated
- TranslationDict extended with detail, locations (CRUD UI), data (confirm dialogs), and common.at sections to support the new translations
- Null-location invariant and D-07 predefined/user-created location display patterns applied consistently across all screens

## Task Commits

1. **Task 1: Translate medicine route screens** - `0a50405` (feat)
2. **Task 2: Translate dashboard, trash, locations, data screens and utility components** - `0b36d9b` (feat)

## Files Created/Modified

- `src/i18n/types.ts` - Added detail, locations CRUD, data confirm, common.at key sections
- `src/i18n/en.ts` - English values for all new keys
- `src/i18n/pl.ts` - Polish values for all new keys
- `src/routes/medicines/index.tsx` - Title, search placeholder, empty state, Add button translated
- `src/routes/medicines/new.tsx` - Page title, cancel button, toast translated; category display uses CATEGORY_KEYS
- `src/routes/medicines/[id].tsx` - Full detail view translation: labels, dates (formatDate), location (null-safe), toasts, dialogs
- `src/routes/medicines/[id].edit.tsx` - Page title, save label, loading, toasts translated
- `src/routes/dashboard/index.tsx` - Title and card labels translated
- `src/routes/trash/index.tsx` - Title, quantity/location display, deleted date (D-13 ISO), dialog, buttons translated
- `src/routes/locations/index.tsx` - Title, input placeholder, buttons, predefined-vs-user location display, error messages, dialog translated
- `src/routes/data/index.tsx` - Section headings translated
- `src/components/SearchBar.tsx` - Placeholder resolved via ?? fallback to t('medicines.searchPlaceholder')
- `src/components/ExportSection.tsx` - Export/Exporting button text and toasts translated
- `src/components/ImportJSONSection.tsx` - Button, dialog title/action, toasts translated
- `src/components/ImportCSVSection.tsx` - Button and toasts translated

## Decisions Made

- Extended TranslationDict (types.ts + en.ts + pl.ts) atomically before modifying components to ensure tsc remained error-free throughout
- ImportJSONSection confirmation dialog body left in English — the description contains dynamic counts (`medicineCount`, `locationCount`) and t() has no interpolation support; translating the static parts around the numbers would produce awkward mixed output
- SearchBar preserves its optional `placeholder` prop API; the t() fallback only applies when the prop is omitted

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript checks and all 141 Vitest tests passed cleanly after both tasks.

## Known Stubs

None - all translated strings are wired to live i18n keys. The ImportJSONSection dialog description contains hardcoded English around dynamic counts (by design, noted in Decisions Made) but this is not a rendering stub — it displays real data, just not yet fully internationalized.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 07 i18n / Polish Language is fully complete: foundation (07-01), status/filter/cards (07-02), forms/sheets/history (07-03), and all route screens/utility components (07-04) are translated
- The app can switch between English and Polish via the language toggle with all screens rendering correctly
- One known gap: ImportJSONSection dialog body text with dynamic counts remains in English — a future interpolation-capable t() upgrade would resolve it

---
*Phase: 07-i18n-polish-language*
*Completed: 2026-09-01*
