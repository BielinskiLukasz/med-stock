---
status: diagnosed
trigger: "G-07-4: Active filter chip labels display in English instead of Polish"
created: 2026-09-02T00:00:00Z
updated: 2026-09-02T00:00:00Z
---

## Current Focus

hypothesis: FilterBottomSheet.tsx displays location option buttons using raw English DB names
  (`{location.name}`) instead of the translated value, causing location filter options to
  always appear in English regardless of selected language.
test: Code trace of FilterBottomSheet.tsx line 138 vs FilterChips.tsx line 31
expecting: FilterBottomSheet uses untranslated location names; FilterChips uses translated names
next_action: DIAGNOSED — root cause confirmed

## Symptoms

expected: Active filter chip labels and filter bottom sheet option buttons display in Polish
  when Polish is active. E.g. "Kategoria: Ból i gorączka" not "Category: Pain & Fever".
actual: "build in localisation are english only in filter screen"
errors: None reported
reproduction: Switch to Polish. Open filter sheet. Observe location option buttons — they
  show "Bathroom Cabinet" instead of "Szafka łazienkowa".
started: Discovered during UAT phase 07

## Eliminated

- hypothesis: CATEGORY_KEYS lookup is wrong or missing keys
  evidence: CATEGORY_KEYS in types.ts maps every CATEGORIES value (e.g. 'Pain & Fever' ->
    'categories.painFever') exactly matching the CATEGORIES array in types/medicine.ts.
    FilterChips uses t(CATEGORY_KEYS[v] ?? 'categories.other') correctly.
  timestamp: 2026-09-02

- hypothesis: t() function fails to resolve dot-notation keys like 'categories.painFever'
  evidence: LanguageProvider.tsx t() splits on first dot to get ns='categories',
    subKey='painFever', then returns dict['categories']['painFever']. Polish dict has
    all these keys. Function works correctly for two-level paths.
  timestamp: 2026-09-02

- hypothesis: LanguageProvider does not wrap FilterChips
  evidence: App.tsx wraps entire <RouterProvider> in <LanguageProvider>. FilterChips is
    rendered inside MedicineList inside RootLayout inside RouterProvider.
  timestamp: 2026-09-02

- hypothesis: FilterChips chip labels are not reactive to language change
  evidence: FilterChips uses useLang() -> useContext(LangContext). LanguageProvider holds
    lang in useState and creates a new t() function on each render. Context change
    triggers re-render of all consumers. The all[] array is recomputed in the function
    body on every render.
  timestamp: 2026-09-02

## Evidence

- timestamp: 2026-09-02
  checked: FilterChips.tsx lines 26-38
  found: Category chips use t(CATEGORY_KEYS[v] ?? 'categories.other'), location chips use
    t(LOCATION_KEYS[v] ?? v), status chips use t(statusKey[v as MedicineStatus] ?? v).
    All three use correct translation key lookups.
  implication: FilterChips.tsx is correctly implemented for all three chip types.

- timestamp: 2026-09-02
  checked: FilterBottomSheet.tsx lines 125-146 (location section)
  found: Location option buttons render {location.name} — the raw English DB name. This is
    NOT wrapped in t() or LOCATION_KEYS lookup. Category buttons (line 114) and status
    buttons (line 90) both use t() correctly; only locations use raw name.
  implication: Location option buttons in the filter sheet always show English DB names
    regardless of language. This is the bug the user observed.

- timestamp: 2026-09-02
  checked: FilterBottomSheet.tsx line 143
  found: Hardcoded English string "No locations added yet." — also untranslated.
  implication: Minor secondary issue; shown only when no locations exist.

- timestamp: 2026-09-02
  checked: LOCATION_KEYS in types.ts vs DB seed in db.ts
  found: DB seeds: 'Bathroom Cabinet', 'Bedroom Cabinet', 'Kitchen Drawer',
    'Living Room Cabinet', 'Medicine Box', 'Refrigerator', 'Travel Kit'.
    LOCATION_KEYS has identical keys mapping to 'locationNames.*' translation keys.
    Polish pl.ts has all locationNames.* keys with Polish values.
  implication: The translation infrastructure for locations is complete and correct.
    FilterBottomSheet just never uses it.

- timestamp: 2026-09-02
  checked: FilterBottomSheet.tsx line 138 vs FilterChips.tsx line 31
  found: FilterBottomSheet: {location.name} (raw DB name, always English).
    FilterChips: t(LOCATION_KEYS[v] ?? v) (uses translation lookup).
    The active chip label IS translated; the option button in the sheet is NOT.
  implication: User sees English location names in the filter sheet options even in Polish
    mode. After applying a location filter, the active chip above the list IS in Polish.
    The user observed the option buttons in the filter sheet and reported them as English.

## Resolution

root_cause: FilterBottomSheet.tsx line 138 renders location option buttons with
  {location.name} (raw English DB name) instead of the translated value. All other
  filter sheet items (category buttons line 114, status buttons line 90) correctly use
  t() with translation key lookups. Only location buttons are missing the translation.
  The active filter CHIPS (FilterChips.tsx) ARE correctly translated for locations via
  t(LOCATION_KEYS[v] ?? v), but the selectable option buttons in the filter bottom sheet
  that the user clicks to apply a location filter remain in English.
fix: []
verification: []
files_changed: []
