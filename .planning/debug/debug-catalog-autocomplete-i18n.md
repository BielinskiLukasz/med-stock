---
status: diagnosed
trigger: "G-07-17 — catalog autocomplete suggestion entries show English category labels when Polish is selected"
created: 2026-09-02T00:00:00Z
updated: 2026-09-02T00:00:00Z
---

## Current Focus

hypothesis: "CatalogAutocomplete renders cat.category (raw DB English string) directly without CATEGORY_KEYS + t() lookup"
test: "Read CatalogAutocomplete.tsx line 69 — inspect category render expression"
expecting: "Expression is {cat.category} with no translation call"
next_action: "n/a — root cause confirmed, find_root_cause_only mode"

## Symptoms

expected: "Category labels in autocomplete suggestions display in Polish when Polish language is active"
actual: "Category labels display in English (raw canonical DB value) regardless of selected language"
errors: "None"
reproduction: "Open Add medicine form, switch to Polish, focus catalog autocomplete, observe suggestion entries"
started: "Discovered during UAT phase 07"

## Eliminated

(none — root cause found on first investigation)

## Evidence

- timestamp: 2026-09-02T00:00:00Z
  checked: "src/components/CatalogAutocomplete.tsx line 69"
  found: "<span className=\"ml-2 text-gray-500 text-xs\">{cat.category}</span>"
  implication: "cat.category holds the canonical English string from the DB (e.g. 'Pain & Fever'). It is rendered verbatim with no translation lookup."

- timestamp: 2026-09-02T00:00:00Z
  checked: "src/components/CatalogAutocomplete.tsx imports (line 6)"
  found: "import { useLang } from '@/i18n' — only useLang is imported, CATEGORY_KEYS is absent"
  implication: "Even if the developer intended to translate, CATEGORY_KEYS was never imported so no lookup is possible."

- timestamp: 2026-09-02T00:00:00Z
  checked: "src/i18n/types.ts — CATEGORY_KEYS record"
  found: "CATEGORY_KEYS maps canonical English strings (e.g. 'Pain & Fever') to dot-notation i18n keys (e.g. 'categories.painFever'). Re-exported from src/i18n/index.ts."
  implication: "The correct lookup mechanism exists and is ready to use — it just was not wired up in CatalogAutocomplete."

- timestamp: 2026-09-02T00:00:00Z
  checked: "src/i18n/index.ts — t() signature"
  found: "t: (key: string) => string — accepts a dot-notation key string"
  implication: "t(CATEGORY_KEYS[cat.category]) is the correct call pattern. CATEGORY_KEYS[cat.category] yields the dot-notation key; t() resolves it to the active-language string."

## Resolution

root_cause: "CatalogAutocomplete.tsx line 69 renders cat.category (the raw canonical English DB value) directly to the DOM. CATEGORY_KEYS is not imported and t() is never called for the category label, so the canonical English string is always shown regardless of the active language."
fix: ""
verification: ""
files_changed: []
