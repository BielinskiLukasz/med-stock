---
status: testing
phase: 07-i18n-polish-language
source: [07-01-SUMMARY.md, 07-02-SUMMARY.md, 07-03-SUMMARY.md, 07-04-SUMMARY.md, 07-05-SUMMARY.md, 07-06-SUMMARY.md]
started: 2026-09-02T10:51:13Z
updated: 2026-09-02T10:57:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Language Toggle Tab Labels
expected: Open the app. Find the language toggle in the bottom tab bar (EN/PL button). Tap it to switch to Polish. All 5 tab labels change to Polish immediately — no page reload. Tap again to switch back to English — labels change back instantly.
result: pass

### 2. Language Persistence
expected: Switch to Polish. Close/reload the tab or window. Reopen the app — it should open in Polish, not revert to English. (Verify: localStorage key medstock-lang is set.)
result: pass

### 3. Status Labels Polish
expected: With Polish active, look at medicine cards and any status badges (e.g. Active, Expired, Opened, ExceededOpenPeriod). All status labels appear in Polish (Aktywny, Wygasły, Otwarty, etc.).
result: pass

### 4. Filter Chips Polish Labels
expected: Apply any filter (category, location, or status). The active filter chip prefix and selected value text appear in Polish. E.g. "Kategoria: Tabletki" not "Category: Tablets".
result: issue
reported: "build in localisation are english only in filter screen"
severity: major

### 5. Filter Bottom Sheet Polish
expected: Open the filter/sort bottom sheet. All section headings, status options, category options, sort field labels (Nazwa, Data ważności, Kategoria), direction labels, and button labels appear in Polish.
result: pass

### 6. Medicine Card Polish Display
expected: With Polish active, view the medicine list. Each medicine card shows: predefined location names translated (e.g. "Szafka w łazience"), quantity unit translated (e.g. "tabletki"), and expiry date in DD.MM.YYYY format (e.g. "31.12.2026"). User-created location names are preserved as-is.
result: pass

### 7. CatalogFields Category and Form-Type Dropdowns
expected: Open the Add medicine form (or Edit). The Category dropdown shows Polish labels (e.g. "Tabletki", "Kapsułki"). The Form/Type dropdown also shows Polish labels. Value stored in DB remains the canonical English string.
result: pass

### 8. Quantity Unit and PAO Unit Dropdowns
expected: In the Add/Edit stock form, the quantity unit dropdown shows Polish labels. The PAO (period after opening) unit dropdown also shows Polish labels. Values saved to DB remain canonical English strings.
result: pass

### 9. Sheet Titles and Toast Messages
expected: Open the "Edit stock" sheet, "Move stock" sheet, and "Edit medicine" sheet. Each sheet title appears in Polish. Perform an action (e.g. save or move) — the toast notification text appears in Polish.
result: pass

### 10. Change History Polish Labels
expected: Open a medicine detail view. The "Change History" section heading renders in Polish. If there is no history, the empty state text renders in Polish.
result: pass

### 11. History Entry Action Strings
expected: View a medicine with history entries. Action strings — "added", "deleted", "restored", field-change descriptions, multi-field changes — all appear in Polish. The timestamp next to each entry uses the Polish locale format.
result: pass

### 12. Medicine List Screen Polish
expected: With Polish active, the medicine list screen shows: page title in Polish, search placeholder in Polish, empty state text in Polish (if applicable), and the Add medicine button label in Polish.
result: pass

### 13. Medicine Detail View Polish
expected: Open a medicine detail. Labels like "Expires", "Opened", stock entry column headers, location label, and category label all appear in Polish. Any toast triggered from this screen also appears in Polish. Dates use DD.MM.YYYY format.
result: pass

### 14. All Remaining Screens Polish
expected: Visit Dashboard, Trash, Locations, and Data screens. All visible labels, headings, buttons, and body text on each screen render in Polish. No hardcoded English strings visible.
result: pass

### 15. Trash Deleted Date Format
expected: Navigate to the Trash screen. Any "deleted on" date shown for trashed medicines appears in DD.MM.YYYY format when Polish is active.
result: pass

### 16. Move Stock Sheet Polish
expected: Open the Move Stock sheet (e.g. from a medicine detail). The box label, per-box info text, quantity label, validation error messages, and the submitting-state button text all appear in Polish.
result: pass

### 17. Catalog Autocomplete Polish
expected: On the Add medicine form, interact with the medicine catalog autocomplete. The heading, placeholder text, empty state, and "Create new entry" button text all appear in Polish.
result: issue
reported: "the suggestion screen shows english category; also: cannot remove suggestion even if medicine was removed"
severity: major

### 18. Sync Instructions Polish
expected: Navigate to the Data screen → Sync section. All sync step paragraphs (all 4–5 steps) appear in Polish.
result: pass

### 19. CSV Preview Polish
expected: Initiate a CSV import. On the CSV preview screen, the preview header, row count text, and all action button labels (Import, Back, Cancel) appear in Polish.
result: skipped
reason: "cannot test now"

### 20. Export and Import Section Polish
expected: On the Data screen, the export description paragraph and the CSV import idle description text both appear in Polish.
result: issue
reported: "import part is english only"
severity: major

### 21. formatDate AUTO-PASS
expected: formatDate formats EN as YYYY-MM-DD, PL as DD.MM.YYYY, null as no-expiry label
result: pass
source: automated
coverage_id: D3

### 22. TypeScript Build AUTO-PASS
expected: TypeScript build passes with zero errors — TranslationDict structural type validates en.ts and pl.ts
result: pass
source: automated
coverage_id: D4

## Summary

total: 22
passed: 18
issues: 3
pending: 0
skipped: 1
blocked: 0

## Gaps

- gap_id: G-07-4
  truth: "Active filter chip labels (category, location, status prefix and selected value) display in Polish when Polish is active"
  status: failed
  reason: "User reported: build in localisation are english only in filter screen"
  severity: major
  test: 4
  artifacts: []
  missing: []

- gap_id: G-07-17
  truth: "Catalog autocomplete heading, placeholder text, empty state, and create button text all appear in Polish"
  status: failed
  reason: "User reported: the suggestion screen shows english category"
  severity: major
  test: 17
  artifacts: []
  missing: []

- gap_id: G-07-17b
  truth: "Stale catalog autocomplete suggestions are removed when their associated medicine is deleted"
  status: failed
  reason: "User reported: cannot remove suggestion even if medicine was removed"
  severity: major
  test: 17
  artifacts: []
  missing: []

- gap_id: G-07-20
  truth: "The CSV import idle description text on the Data screen appears in Polish"
  status: failed
  reason: "User reported: import part is english only"
  severity: major
  test: 20
  artifacts: []
  missing: []
