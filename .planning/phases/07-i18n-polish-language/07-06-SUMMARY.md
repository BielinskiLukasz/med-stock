---
phase: 07-i18n-polish-language
plan: "06"
subsystem: i18n
tags: [i18n, components, gap-closure]
status: complete

dependency_graph:
  requires: [07-05]
  provides: [full-i18n-component-coverage]
  affects: [FilterChips, MedicineCard, MoveStockSheet, CatalogAutocomplete, SyncInstructions, CSVPreview, ExportSection, ImportCSVSection]

tech_stack:
  patterns: [useLang hook, CATEGORY_KEYS lookup, LOCATION_KEYS lookup, t() calls]

key_files:
  modified:
    - src/components/FilterChips.tsx
    - src/components/MedicineCard.tsx
    - src/components/MoveStockSheet.tsx
    - src/components/CatalogAutocomplete.tsx
    - src/components/SyncInstructions.tsx
    - src/components/CSVPreview.tsx
    - src/components/ExportSection.tsx
    - src/components/ImportCSVSection.tsx

decisions:
  - "LOCATION_KEYS[v] ?? v fallback in FilterChips preserves user-created location names (D-06/D-07)"
  - "CATEGORY_KEYS[v] ?? 'categories.other' fallback displays translated 'Other' for unknown categories"
  - "MoveStockSheet box validation messages use static translations without dynamic counts — input max attr enforces the visual limit"

metrics:
  duration: "15min"
  completed: "2026-09-01"
  tasks: 2
  commits: 2

actuals:
  tokens: 14000
  tasks: 2
  commits: 2
---

# Phase 07 Plan 06: Wire 8 Components to i18n — Summary

**One-liner:** Wired all 8 gap components to use t() calls with CATEGORY_KEYS/LOCATION_KEYS lookups — completing full Polish language coverage across the app.

## What Was Built

All 8 components identified in VERIFICATION.md as having zero or partial i18n coverage were updated to use the translation keys added in Plan 07-05. No new dictionary keys were added — only component wiring. The result: switching language from English to Polish updates every user-visible string in the app.

**Task 1 (tracer):** Wired FilterChips, MedicineCard, MoveStockSheet (Gaps 2–5)
- FilterChips now imports `CATEGORY_KEYS` and `LOCATION_KEYS` from `@/i18n` and uses `t(CATEGORY_KEYS[v] ?? 'categories.other')` for category chip labels and `t(LOCATION_KEYS[v] ?? v)` for location chip labels
- MedicineCard replaces the hardcoded `' at '` preposition with `{t('common.at')}` — shows 'w' in Polish
- MoveStockSheet replaces 8 hardcoded English strings: box label, per-box info, 2 box validation messages, quantity label, 2 quantity validation messages, and the submit button in-progress state

**Task 2 (auto):** Wired CatalogAutocomplete, SyncInstructions, CSVPreview, ExportSection, ImportCSVSection (Gaps 6–9)
- CatalogAutocomplete: added `useLang` import + hook; replaced heading, placeholder, empty state, create button text
- SyncInstructions: added `useLang` import + hook; replaced all 5 paragraph content blocks with t() calls
- CSVPreview: added `useLang` import + hook; replaced preview header, row count label, and 4 action button strings
- ExportSection: replaced hardcoded description paragraph with `t('data.exportDescription')`
- ImportCSVSection: replaced idle description paragraph and guard toast string argument with t() calls

## Key Files Modified

- `src/components/FilterChips.tsx` — CATEGORY_KEYS and LOCATION_KEYS added to import; chip label template strings use t() lookups
- `src/components/MedicineCard.tsx` — 'at' preposition replaced with t('common.at')
- `src/components/MoveStockSheet.tsx` — 8 hardcoded strings replaced with t() calls
- `src/components/CatalogAutocomplete.tsx` — useLang added; 4 strings replaced
- `src/components/SyncInstructions.tsx` — useLang added; 5 paragraphs replaced
- `src/components/CSVPreview.tsx` — useLang added; 6 strings replaced
- `src/components/ExportSection.tsx` — description replaced with t('data.exportDescription')
- `src/components/ImportCSVSection.tsx` — idle description and guard toast replaced

## Tasks Completed

- [x] Task 1 (tracer): Wire FilterChips, MedicineCard, MoveStockSheet (Gaps 2-5) — commit 4546268
- [x] Task 2 (auto): Wire CatalogAutocomplete, SyncInstructions, CSVPreview, ExportSection, ImportCSVSection (Gaps 6-9) — commit 05ad48e

## Deviations from Plan

None — plan executed exactly as written. All 8 components updated per the specified actions. All 10 post-plan verification checks pass.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | 0 errors |
| `grep -c "LOCATION_KEYS[v]" FilterChips.tsx` | 1 |
| `grep -c "CATEGORY_KEYS[v]" FilterChips.tsx` | 1 |
| `grep -c "common.at" MedicineCard.tsx` | 1 |
| `grep -c "form.saving" MoveStockSheet.tsx` | 1 |
| `grep -c "useLang" CatalogAutocomplete.tsx` | 2 (import + call) |
| `grep -c "data.syncStep" SyncInstructions.tsx` | 4 |
| `grep -c "csv.previewHeader" CSVPreview.tsx` | 1 |
| `grep -c "data.exportDescription" ExportSection.tsx` | 1 |
| `grep -c "csvImportNeedsCatalog" ImportCSVSection.tsx` | 1 |

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundaries introduced. All changes are pure UI string substitutions.
