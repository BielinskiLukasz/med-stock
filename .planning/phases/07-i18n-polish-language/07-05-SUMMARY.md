---
phase: "07"
plan: "05"
subsystem: i18n
tags: [i18n, dictionary, gap-closure, typescript]
status: complete

depends_on: []
provides: [extended-location-keys, form-move-keys, data-sync-keys, csv-keys, catalog-keys, toast-keys]
affects: [src/i18n/types.ts, src/i18n/en.ts, src/i18n/pl.ts]

tech_stack:
  added: []
  patterns: [dictionary-extension, type-safe-i18n]

key_files:
  created: []
  modified:
    - src/i18n/types.ts
    - src/i18n/en.ts
    - src/i18n/pl.ts

decisions:
  - "Added catalog and csv sections to TranslationDict after the detail section, consistent with plan spec"
  - "Polish translations for sync steps use Polish quotation marks consistent with existing pl.ts style"

metrics:
  duration: "5 minutes"
  completed: "2026-09-01"
  tasks: 2
  commits: 2
  files: 3

actuals:
  tokens: 8200
  tasks: 2
  commits: 2
---

# Phase 07 Plan 05: Extend i18n Dictionary — Summary

## What Was Built

Extended the i18n dictionary across three files (`types.ts`, `en.ts`, `pl.ts`) to cover all translation keys needed by the gap-closure components introduced in Phase 07 plans. No component wiring — dictionary-only changes.

**Task 1 (Gap 1 — location names):** Added 4 missing predefined location entries to `LOCATION_KEYS` (`Living Room Cabinet`, `Medicine Box`, `Refrigerator`, `Travel Kit`) and the corresponding `livingRoomCabinet`, `medicineBox`, `refrigerator`, `travelKit` string fields to `TranslationDict.locationNames`, with English and Polish translations.

**Task 2 (Gaps 4–9 — form/data/csv/catalog/toasts):** Added:
- 8 new `form` keys: `boxesToMove`, `unitsPerBox`, `quantityToMove`, `boxValidationMin`, `boxValidationMax`, `quantityValidationMin`, `quantityValidationMax`, `saving`
- 7 new `data` keys: `syncStep1`–`syncStep4`, `syncNote`, `exportDescription`, `importCSVDescription`
- 1 new `toasts` key: `csvImportNeedsCatalog`
- New `catalog` section: `selectOrCreate`, `placeholderText`, `createEntry`, `noMedicinesYet`
- New `csv` section: `previewHeader`, `rowCount`, `importing`, `importComplete`, `back`, `cancel`

All additions are fully typed in `TranslationDict` and provided in both `en` and `pl` translation objects.

## Key Files

### Created
None

### Modified
- `src/i18n/types.ts` — `TranslationDict` type extended with 4 new locationNames fields, 8 new form fields, 7 new data fields, 1 new toasts field, and new `catalog` + `csv` sections; `LOCATION_KEYS` extended with 4 new entries
- `src/i18n/en.ts` — All new keys added with English strings
- `src/i18n/pl.ts` — All new keys added with Polish strings

## Tasks Completed

- [x] Task 1: Extend LOCATION_KEYS and locationNames (Gap 1)
- [x] Task 2: Add all remaining translation keys (Gaps 4-9)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

```
npx tsc --noEmit  → exit 0 (no TypeScript errors)
grep -c "syncStep1" src/i18n/en.ts  → 1
grep -c "syncStep1" src/i18n/pl.ts  → 1
grep -c "csvImportNeedsCatalog" src/i18n/types.ts  → 1
```

- LOCATION_KEYS contains all 7 predefined location keys: Bathroom Cabinet, Bedroom Cabinet, Kitchen Drawer, Living Room Cabinet, Medicine Box, Refrigerator, Travel Kit
- en.ts contains `livingRoomCabinet: 'Living Room Cabinet'`
- pl.ts contains `livingRoomCabinet: 'Szafka w salonie'`
- types.ts contains both `catalog` and `csv` sections

## Known Stubs

None
