---
phase: 07-i18n-polish-language
plan: 02
subsystem: ui
tags: [i18n, translation, status-badge, filter, medicine-card, typescript]

requires:
  - phase: 07-i18n-polish-language
    plan: 01
    provides: useLang hook, CATEGORY_KEYS, LOCATION_KEYS, formatDate, TranslationDict

provides:
  - STATUS_LABELS removed from expiry.ts (D-04) — TypeScript enforces no stale imports
  - StatusBadge renders status labels via t() with statusKey Record
  - FilterChips renders status chip labels via t()
  - FilterBottomSheet: all status/category/sort/heading labels via t(); CATEGORIES replaces ALL_CATEGORIES
  - UNIT_KEYS Record in src/i18n/types.ts (re-exported from index.ts)
  - MedicineCard: location/unit/date fully translated; D-07 custom names preserved
  - MedicineCardAggregate: category and quantityUnit translated

affects:
  - 07-03
  - 07-04

actuals:
  tokens: 9000
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - statusKey Record pattern — local Record<MedicineStatus, string> mapping canonical status to translation key, defined per-component
    - UNIT_KEYS lookup Record — same pattern as CATEGORY_KEYS/LOCATION_KEYS, maps canonical unit strings to units.* keys
    - D-06/D-07 location display pattern — LOCATION_KEYS[loc] lookup first; fall back to stored name for user-created; null → t('locationNames.other')

key-files:
  created: []
  modified:
    - src/lib/expiry.ts
    - src/components/StatusBadge.tsx
    - src/components/FilterChips.tsx
    - src/components/FilterBottomSheet.tsx
    - src/i18n/types.ts
    - src/i18n/index.ts
    - src/components/MedicineCard.tsx
    - src/components/MedicineCardAggregate.tsx

key-decisions:
  - "D-04 applied: STATUS_LABELS removed from expiry.ts; all 3 consumer components (StatusBadge, FilterChips, FilterBottomSheet) switched to t() via local statusKey Record"
  - "D-05 applied: CATEGORY_KEYS lookup used in FilterBottomSheet and MedicineCardAggregate for category display"
  - "D-06/D-07 applied: MedicineCard checks LOCATION_KEYS first; user-created location names bypass translation; null renders t('locationNames.other')"
  - "D-08 applied: UNIT_KEYS added for QUANTITY_UNITS values; MedicineCard and MedicineCardAggregate use t(UNIT_KEYS[unit])"
  - "D-11 applied: MedicineCard expiryDate rendered via formatDate(date, lang)"
  - "FilterChips chip labels updated: Category/Location/Status prefixes now translated via t('filter.category'), t('filter.location'), t('filter.status')"
  - "FilterBottomSheet sort direction: removed conditional 'Soonest'/'A-Z' labels; replaced with t('filter.asc')/t('filter.desc')"

requirements-completed:
  - I18N-02
  - I18N-04
  - I18N-05

duration: 18min
completed: 2026-08-31
status: complete
---

# Phase 7 Plan 02: Status/Filter/Card Translation Summary

**STATUS_LABELS removed and all status/category/filter/card display strings migrated to t() via useLang — StatusBadge, FilterChips, FilterBottomSheet, MedicineCard, MedicineCardAggregate fully translated**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-08-31T22:31:00Z
- **Completed:** 2026-08-31T22:49:39Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Removed `STATUS_LABELS` from `src/lib/expiry.ts` — build verifies no stale imports at compile time (D-04)
- `StatusBadge`, `FilterChips`, `FilterBottomSheet` all replaced `STATUS_LABELS[status]` with `t(statusKey[status])` using local statusKey Records
- `FilterBottomSheet` replaces local `ALL_CATEGORIES` with imported `CATEGORIES` from `@/types/medicine`; all section headings, status options, category options, sort labels, direction labels, title, and clear-all button translated via `t()`
- Added `UNIT_KEYS` Record to `src/i18n/types.ts` (re-exported from `index.ts`) mapping all QUANTITY_UNITS values to `units.*` translation keys
- `MedicineCard` translates: predefined location names via LOCATION_KEYS, null location as `t('locationNames.other')`, quantityUnit via UNIT_KEYS, expiryDate via `formatDate(date, lang)`, 'Expires:' label via `t('dates.expires')` (D-06, D-07, D-08, D-11)
- `MedicineCardAggregate` translates: catalog.category via CATEGORY_KEYS, quantityUnit via UNIT_KEYS, 'across N locations' via `t('common.across')` / `t('common.locations')` (D-05, D-08)
- TypeScript build: exit 0, 141/141 vitest tests passing

## Task Commits

1. **Task 1: STATUS_LABELS removal + filter translation** — `d009ac0`
2. **Task 2: MedicineCard + MedicineCardAggregate translation** — `2333adc`

## Files Modified

- `src/lib/expiry.ts` — STATUS_LABELS const deleted; all other exports unchanged
- `src/components/StatusBadge.tsx` — imports useLang; local statusKey Record; renders t(statusKey[status])
- `src/components/FilterChips.tsx` — imports useLang; local statusKey Record; chip label prefixes translated
- `src/components/FilterBottomSheet.tsx` — imports useLang + CATEGORY_KEYS + CATEGORIES; all labels translated; ALL_CATEGORIES removed
- `src/i18n/types.ts` — UNIT_KEYS Record added (9 entries: QUANTITY_UNITS + 'units' fallback)
- `src/i18n/index.ts` — UNIT_KEYS added to re-export list
- `src/components/MedicineCard.tsx` — imports useLang + LOCATION_KEYS + UNIT_KEYS + formatDate; location/unit/date translated
- `src/components/MedicineCardAggregate.tsx` — imports useLang + CATEGORY_KEYS + UNIT_KEYS; category/unit/across translated

## Deviations from Plan

### Auto-fixed / Scoped Adjustments

**1. [Scope clarification] Sort labels: 3 fields translated, not 4**
- **Found during:** Task 1
- **Issue:** Plan says "translate for the four sort fields" with keys `filter.byName`, `filter.byExpiry`, `filter.byStatus`, `filter.byCreated`. However, the current FilterBottomSheet renders only 3 sort options: `name`, `expiryDate`, `category`. The SortField type has `'status'` as a 4th valid value but no `'createdAt'`; `filter.byCreated` ('Date added') has no matching SortField.
- **Decision:** Translated the 3 existing sort fields using the closest keys (byName, byExpiry, byCategoryLabel). Did not add `status` as a 4th sort button — that is new UI functionality outside a translation task scope.
- **Impact:** `filter.byStatus` and `filter.byCreated` remain in the TranslationDict for future use; current sort UI is correct and fully translated.

**2. [Enhancement] FilterChips chip-label prefixes translated**
- **Found during:** Task 1
- **Issue:** Plan describes translating the status chip label. The category and location chip-label prefixes ("Category:", "Location:") were also hardcoded English strings.
- **Fix:** Translated all 3 chip prefixes using `t('filter.category')`, `t('filter.location')`, `t('filter.status')` per the existing TranslationDict keys (Rule 2 — missing i18n on adjacent strings at the same callsite).
- **Files modified:** src/components/FilterChips.tsx

## Known Stubs

None — all display strings have live data sources.

## Self-Check: PASSED

- `src/lib/expiry.ts` — STATUS_LABELS removed: verified (grep returns no match)
- `src/components/StatusBadge.tsx` — exists and uses t(): verified
- `src/components/FilterBottomSheet.tsx` — ALL_CATEGORIES removed, CATEGORIES imported: verified
- `src/i18n/types.ts` — UNIT_KEYS exported: verified
- `npm run build` — exit 0: verified
- `npx vitest run` — 141/141 passed: verified
- Commit d009ac0 — exists: verified
- Commit 2333adc — exists: verified
