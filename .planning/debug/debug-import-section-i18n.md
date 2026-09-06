---
status: diagnosed
trigger: "G-07-20: CSV import idle description text on Data screen appears in English when Polish is active"
created: 2026-09-02T00:00:00Z
updated: 2026-09-02T00:00:00Z
---

## Current Focus

hypothesis: ImportJSONSection has hardcoded English strings never replaced with t() calls
test: read ImportJSONSection.tsx and compare to translation dictionaries
expecting: hardcoded English text not using t()
next_action: diagnosed — root cause confirmed

## Symptoms

expected: Import section description text appears in Polish when Polish is active
actual: "import part is english only"
errors: none
reproduction: Data screen > switch to Polish > observe import section description paragraph
started: discovered during UAT phase 07

## Eliminated

- hypothesis: data.importCSVDescription key missing from pl.ts
  evidence: pl.ts line 140 has the Polish translation; ImportCSVSection.tsx uses t('data.importCSVDescription')
  timestamp: 2026-09-02

- hypothesis: ImportCSVSection not calling t() for idle description
  evidence: ImportCSVSection.tsx line 110 correctly uses {t('data.importCSVDescription')}
  timestamp: 2026-09-02

## Evidence

- timestamp: 2026-09-02
  checked: ImportJSONSection.tsx lines 87-90
  found: Description paragraph is hardcoded English literal — "Restore your inventory from a backup file. This will replace all medicines, locations, and history with the contents of the backup."
  implication: This string never passes through t(), so it stays English regardless of selected language

- timestamp: 2026-09-02
  checked: ImportJSONSection.tsx lines 114-118
  found: AlertDialog description is a concatenated English string — "This will replace all X medicines, Y locations, and full change history. This cannot be undone. Import anyway?"
  implication: Also hardcoded English; also never translated

- timestamp: 2026-09-02
  checked: en.ts data section
  found: No key for the JSON import description paragraph; no key for the import confirm dialog body with counts
  implication: Translation keys were never added to en.ts / pl.ts / types.ts for these two strings

- timestamp: 2026-09-02
  checked: ImportCSVSection.tsx (the file the SUMMARY claimed was fixed)
  found: Correctly uses t('data.importCSVDescription') and t('data.importCSVSpreadsheet') — these are properly translated
  implication: The SUMMARY's fix was applied to ImportCSVSection only; ImportJSONSection was left untouched

## Resolution

root_cause: ImportJSONSection.tsx contains two hardcoded English strings that were never replaced with t() calls — (1) the idle description paragraph at lines 88-89 and (2) the AlertDialog confirm body at lines 114-118. No corresponding translation keys exist in en.ts, pl.ts, or types.ts for either string. The phase 07 SUMMARY's "import section" fix applied only to ImportCSVSection, not ImportJSONSection.
fix: empty until applied
verification: empty until verified
files_changed: []
