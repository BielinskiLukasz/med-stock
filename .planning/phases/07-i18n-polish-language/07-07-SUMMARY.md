---
phase: 07-i18n-polish-language
plan: 07
subsystem: i18n
tags: [i18n, react, typescript, dexie, vitest]

requires:
  - phase: 07-i18n-polish-language
    provides: i18n foundation, LOCATION_KEYS, CATEGORY_KEYS, translation dictionaries

provides:
  - cascade-delete of catalog rows when last medicine is permanently deleted
  - FilterBottomSheet location names translated via LOCATION_KEYS
  - CatalogAutocomplete category labels translated via CATEGORY_KEYS
  - ImportJSONSection idle description and confirm body translated via t()

affects: [verify-work, UAT]

actuals:
  tokens: 11250
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns: [TDD for DB cascade logic, split-key pattern for translated strings with dynamic counts]

key-files:
  created: []
  modified:
    - src/lib/historyOps.ts
    - src/lib/historyOps.test.ts
    - src/components/FilterBottomSheet.tsx
    - src/components/CatalogAutocomplete.tsx
    - src/components/ImportJSONSection.tsx
    - src/i18n/types.ts
    - src/i18n/en.ts
    - src/i18n/pl.ts

key-decisions:
  - "cascade-delete runs inside the same transaction as medicine delete to prevent TOCTOU race"
  - "LOCATION_KEYS[name] ?? name fallback preserves user-created location names verbatim"

requirements-completed: [I18N-02]

coverage:
  - id: D1
    description: "permanentDeleteMedicine cascades to delete catalog row when last medicine is removed; preserves row when siblings remain"
    requirement: I18N-02
    verification:
      - kind: unit
        ref: "src/lib/historyOps.test.ts#permanentDeleteMedicine cascades to catalog when last medicine is deleted"
        status: pass
      - kind: unit
        ref: "src/lib/historyOps.test.ts#permanentDeleteMedicine preserves catalog when other medicines still reference it"
        status: pass
    human_judgment: false
  - id: D2
    description: "FilterBottomSheet location buttons render translated predefined location names; empty state uses t('filter.noLocations')"
    verification:
      - kind: automated
        ref: "npx tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "Visual rendering of Polish location names requires browser verification with Polish language active"
  - id: D3
    description: "CatalogAutocomplete category spans render t(CATEGORY_KEYS[cat.category] ?? cat.category) — Polish category names in suggestions"
    verification:
      - kind: automated
        ref: "npx tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "Requires browser verification with Polish language active to confirm Polish category labels appear"
  - id: D4
    description: "ImportJSONSection idle description and dialog confirm body translated via four new data.* keys"
    requirement: I18N-02
    verification:
      - kind: automated
        ref: "npm run build"
        status: pass
    human_judgment: true
    rationale: "Requires browser verification with Polish language active to confirm Polish strings appear in ImportJSONSection"

duration: 12min
completed: 2026-09-02
status: complete
---

# Phase 07 Plan 07: Gap Closure — UAT Fixes (G-07-4, G-07-17, G-07-17b, G-07-20) Summary

Closed four UAT gaps: catalog cascade-delete on last medicine removal, Polish location/category labels in FilterBottomSheet and CatalogAutocomplete, and full i18n for ImportJSONSection description and confirm dialog.

## Performance

- **Duration:** 12 min
- **Started:** 2026-09-02T21:39:05Z
- **Completed:** 2026-09-02T21:51:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- G-07-17b closed: permanentDeleteMedicine now cascades to delete medicine_catalog row atomically inside the transaction when the last stock entry for that catalogId is permanently removed; two TDD tests cover both the cascade and preserve branches
- G-07-4 and G-07-17 closed: FilterBottomSheet location buttons use LOCATION_KEYS lookup with verbatim fallback for user-created names; CatalogAutocomplete category spans use CATEGORY_KEYS lookup; empty location state renders via t('filter.noLocations')
- G-07-20 closed: ImportJSONSection idle description and AlertDialog confirm body replaced with four new data.* translation keys; no hardcoded English strings remain in those two locations

## Task Commits

Each task was committed atomically:

1. **Task 1: Cascade-delete catalog entry in permanentDeleteMedicine (G-07-17b)** - `f5add63` (RED) + `3a7db3d` (GREEN)
2. **Task 2: Translate location names and category labels (G-07-4, G-07-17)** - `84977f9`
3. **Task 3: Add ImportJSONSection translation keys (G-07-20)** - `c89649b`

## Files Created/Modified

- `src/lib/historyOps.ts` - Added db.medicine_catalog to transaction scope; cascade-delete after count check
- `src/lib/historyOps.test.ts` - Two new TDD tests: cascade when last medicine, preserve when siblings remain
- `src/components/FilterBottomSheet.tsx` - Added LOCATION_KEYS import; t(LOCATION_KEYS[name] ?? name) on location buttons; t('filter.noLocations') on empty state
- `src/components/CatalogAutocomplete.tsx` - Added CATEGORY_KEYS import; t(CATEGORY_KEYS[cat.category] ?? cat.category) on category span
- `src/components/ImportJSONSection.tsx` - t('data.importJSONDescription') replaces hardcoded paragraph; split-key pattern for confirm body
- `src/i18n/types.ts` - Added filter.noLocations + four data.importJSONDescription/importConfirmBody* keys to TranslationDict
- `src/i18n/en.ts` - English values for five new keys
- `src/i18n/pl.ts` - Polish values for five new keys

## Decisions Made

- Cascade-delete runs inside the same `db.transaction('rw', ...)` as the medicine delete to prevent a TOCTOU race between count and delete (T-07-07-01 mitigation).
- `LOCATION_KEYS[name] ?? name` fallback ensures user-created location names that are absent from LOCATION_KEYS always render verbatim — no user data is lost or garbled (T-07-07-02 accepted).
- Split-key pattern (`importConfirmBodyPre` / `importConfirmBodyMid` / `importConfirmBodyPost`) chosen because the i18n `t()` function has no interpolation support; counts are injected as JSX children between three translated string segments.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Self-Check

- [x] All 3 tasks executed
- [x] Task 1: Two TDD tests committed (RED f5add63 + GREEN 3a7db3d), all 22 historyOps.test.ts tests pass
- [x] Task 2: TypeScript compiles with zero errors after i18n additions and component changes
- [x] Task 3: `npm run build` exits 0
- [x] Each task committed individually
- [x] SUMMARY.md created in `.planning/phases/07-i18n-polish-language/`

## Next Phase Readiness

All four UAT gaps closed. Phase 07 is ready for final verification via /gsd-verify-work.

---
*Phase: 07-i18n-polish-language*
*Completed: 2026-09-02*
