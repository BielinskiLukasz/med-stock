---
phase: 07-i18n-polish-language
reviewed: 2026-09-17T00:00:00Z
depth: standard
files_reviewed: 39
files_reviewed_list:
  - src/App.tsx
  - src/components/BottomTabBar.tsx
  - src/components/CatalogAutocomplete.tsx
  - src/components/CatalogEditSheet.tsx
  - src/components/CatalogFields.tsx
  - src/components/ChangeHistory.tsx
  - src/components/CSVColumnMapper.tsx
  - src/components/CSVPreview.tsx
  - src/components/ExportSection.tsx
  - src/components/FilterBottomSheet.tsx
  - src/components/FilterChips.tsx
  - src/components/HistoryEntry.tsx
  - src/components/ImportCSVSection.tsx
  - src/components/ImportJSONSection.tsx
  - src/components/MedicineCard.tsx
  - src/components/MedicineCardAggregate.tsx
  - src/components/MedicineForm.tsx
  - src/components/MoveStockSheet.tsx
  - src/components/SearchBar.tsx
  - src/components/StatusBadge.tsx
  - src/components/StockEditSheet.tsx
  - src/components/StockFields.tsx
  - src/components/SyncInstructions.tsx
  - src/i18n/en.ts
  - src/i18n/index.ts
  - src/i18n/LanguageProvider.tsx
  - src/i18n/pl.ts
  - src/i18n/types.ts
  - src/lib/expiry.ts
  - src/lib/historyOps.test.ts
  - src/lib/historyOps.ts
  - src/lib/utils.test.ts
  - src/lib/utils.ts
  - src/routes/dashboard/index.tsx
  - src/routes/data/index.tsx
  - src/routes/locations/index.tsx
  - src/routes/medicines/[id].edit.tsx
  - src/routes/medicines/[id].tsx
  - src/routes/medicines/index.tsx
  - src/routes/medicines/new.tsx
  - src/routes/trash/index.tsx
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-09-17T00:00:00Z
**Depth:** standard
**Files Reviewed:** 39
**Status:** issues_found

## Summary

This is the third re-verification pass of Phase 07 (i18n / Polish language support). The two
previously-flagged gaps (WR-05 hardcoded aria-label on the Medicines filter button, and the
`namePlaceholder` gap in `CatalogFields`/`MedicineForm`) are confirmed closed by commits
`5b2b386` and `ad0d903` — both now correctly call `t('aria.openFilters')` and
`t('form.namePlaceholder')` respectively.

However, tracing every user-visible string through the diff (not just the strings the prior
gap-closure plan targeted) surfaces three more spots where hardcoded, un-translated, or
untranslatable-by-design English text still reaches the UI, undermining the phase's own goal
of full bilingual coverage. None of these are crashes, data-loss risks, or security issues —
all are classified as Warning. Two smaller Info-level notes are also included for
completeness. The two known, separately-tracked findings from the prior review (CR-02 Dexie
`.get()` returning `undefined` vs `null`, and WR-07 `formatDate()`'s hardcoded no-expiry
strings) were independently re-confirmed present but are **not** re-flagged as new phase-07
blockers per the out-of-scope note in the review brief.

## Warnings

### WR-01: Zod form-validation messages are hardcoded in English and never localized

**File:** `src/components/CatalogFields.tsx:26`, `src/components/StockFields.tsx:30`, `src/components/MedicineForm.tsx:35-36`

**Issue:** The `catalogSchema`, `stockSchema`, and `medicineSchema` Zod objects pass literal
English strings as validation messages:

```ts
// CatalogFields.tsx
name: z.string().min(1, 'Name is required'),

// StockFields.tsx
expiryDate: z.string().min(1, 'Expiry date is required'),

// MedicineForm.tsx
name: z.string().min(1, 'Name is required'),
expiryDate: z.string().min(1, 'Expiry date is required'),
```

`FormMessage` (`src/components/ui/form.tsx:148`) renders `error.message` verbatim:
`const body = error ? String(error?.message) : children`. So when a Polish-language user
submits the Add/Edit Medicine form with an empty name or expiry date, the validation error
appears in English ("Name is required" / "Expiry date is required") regardless of the
selected language — the single most common form-validation path in the app.

Tellingly, a `form.nameRequired` key already exists in both `en.ts` (`'Name is required'`)
and `pl.ts` (`'Nazwa jest wymagana'`) and in `types.ts`, but it is **never referenced** by any
`t(...)` call — it is dead, unused translation data, suggesting this was meant to be wired up
but was missed. There is no equivalent key at all for "Expiry date is required".

**Fix:** Since these Zod schemas are built at module scope (outside React), they cannot call
`t()` directly. Store a translation *key* as the Zod message instead of literal English, and
translate it at display time in the shared `FormMessage` primitive (or in each field's
`render`):

```ts
// CatalogFields.tsx / MedicineForm.tsx
name: z.string().min(1, 'form.nameRequired'),

// StockFields.tsx / MedicineForm.tsx — add a new key, e.g. form.expiryDateRequired
expiryDate: z.string().min(1, 'form.expiryDateRequired'),
```

```tsx
// src/components/ui/form.tsx
import { useLang } from '@/i18n'
...
const { t } = useLang()
const body = error ? t(String(error?.message)) : children
```
(`t()` already falls back to returning the key unchanged for unknown keys, so this is safe
for any other error sources that produce plain, human-readable messages.)

### WR-02: Change-history entries display raw internal field names, untranslated

**File:** `src/components/HistoryEntry.tsx:26`

**Issue:** `formatEntry()` builds the "field changed" line as:

```ts
return `${ts} — ${field} ${t('history.fieldChanged')}: "${String(oldValue)}" → "${String(newValue)}"`
```

`field` comes from `HistoryEntry['changedFields']`, which is populated from
`TRACKED_FIELDS` in `historyOps.ts` (`'location' | 'expiryDate' | 'openedDate' | 'pao' |
'quantity' | 'quantityUnit' | 'notes' | 'manualStatus'`) — raw camelCase database field
identifiers, not user-facing labels. A Polish-language user editing a stock entry's expiry
date will see e.g. `12.09.2026 — expiryDate zmieniono: "2026-01-01" → "2026-06-01"`: an
English/camelCase token embedded in an otherwise-Polish sentence, and not a friendly label
in either language (e.g. "Expiry date"/"Data ważności", matching `form.expiryDate`).

**Fix:** Add a lookup table mapping tracked field names to existing (or new) translation
keys, e.g.:

```ts
const FIELD_LABEL_KEYS: Record<string, string> = {
  location: 'form.location',
  expiryDate: 'form.expiryDate',
  openedDate: 'form.openedDate',
  pao: 'form.pao',
  quantity: 'form.quantity',
  quantityUnit: 'form.quantityUnit',
  notes: 'form.notes',
  manualStatus: 'history.manualStatusLabel', // new key needed
}
...
const fieldLabel = t(FIELD_LABEL_KEYS[field] ?? field)
return `${ts} — ${fieldLabel} ${t('history.fieldChanged')}: "${String(oldValue)}" → "${String(newValue)}"`
```

### WR-03: CSV import column-mapper shows raw internal field identifiers, untranslated

**File:** `src/components/CSVColumnMapper.tsx:53-57`, `src/components/CSVPreview.tsx:42-49`

**Issue:** Commit `ce6a611` ("feat(07-08): internationalize CSVColumnMapper") translated
every static string in this component but left the dynamic ones untouched:

```tsx
// CSVColumnMapper.tsx — Select options list MEDICINE_FIELDS verbatim
{MEDICINE_FIELDS.map((field) => (
  <SelectItem key={field} value={field}>
    {field}
  </SelectItem>
))}
```

```tsx
// CSVPreview.tsx — preview table headers render the raw field key
<th key={fieldName} ...>
  {fieldName}
</th>
```

`MEDICINE_FIELDS` (from `src/lib/csvOps.ts`) are internal identifiers like `expiryDate`,
`quantityUnit`, `packCount`. These are shown verbatim to the user both in the column-mapping
dropdown and the preview-table header row, in both languages, undermining the CSV import
flow's i18n coverage even though the rest of the same components were just localized in
this phase.

**Fix:** Add a `csv.fields.*` (or reuse `form.*`) translation namespace keyed by the
internal field name, and translate at render time in both components:

```ts
const FIELD_LABEL_KEYS: Record<string, string> = {
  name: 'form.name',
  expiryDate: 'form.expiryDate',
  quantityUnit: 'form.quantityUnit',
  // ...one entry per MEDICINE_FIELDS value
}
```
```tsx
{t(FIELD_LABEL_KEYS[field] ?? field)}
```

## Info

### IN-01: Missing-translation lookups fail silently

**File:** `src/i18n/LanguageProvider.tsx:32-43`

**Issue:** `t(key)` returns the raw key string whenever the namespace or subkey isn't found
in the active dictionary, with no warning of any kind. This is a reasonable production
fallback, but it means a typo'd key (e.g. `t('form.nam')`) or a key removed from one
language file but not the other would render silently as literal dot-notation text in the UI
with no signal during development that something is missing. This exact class of bug (a key
existing in the dictionary but never being called, per WR-01) went undetected for at least
one prior review cycle.

**Fix:** In development builds, `console.warn` when `t()` falls through to the raw-key
fallback, e.g. `if (import.meta.env.DEV) console.warn(\`[i18n] missing key: ${key}\`)`.

### IN-02: Zod required-field validation logic duplicated across three schemas

**File:** `src/components/CatalogFields.tsx:25-33`, `src/components/StockFields.tsx:29-39`, `src/components/MedicineForm.tsx:34-45`

**Issue:** `MedicineForm.tsx` carries its own copy of the `name`/`expiryDate` required-field
validation (and the whole schema) that is functionally identical to the split-out
`CatalogFields`/`StockFields` schemas, per the file's own `TODO: Phase 5` comment
acknowledging the duplication is temporary scaffolding. This means any future fix to WR-01
(localizing the required-field message) has to be applied in three places, and the two
copies are already slightly inconsistent (`MedicineForm`'s combined schema vs. the two split
schemas) — a maintenance hazard now surfaced by this i18n pass.

**Fix:** No action required for phase 07 itself, but note this so the eventual removal of
`MedicineForm.tsx` (once `[id].edit.tsx` is migrated to `CatalogFields` + `StockFields`, per
the existing TODO) also removes this duplicated, partially-un-localized validation.

---

_Reviewed: 2026-09-17T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
