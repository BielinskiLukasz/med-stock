---
phase: 07-i18n-polish-language
reviewed: 2026-09-17T00:00:00Z
depth: standard
files_reviewed: 41
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
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-09-17T00:00:00Z
**Depth:** standard
**Files Reviewed:** 41
**Status:** issues_found

## Summary

This is an independent re-review of the i18n/Polish-language phase at current HEAD, performed
fresh (no diff since the previous pass). Each of the 41 required-reading files was read in full
and checked against the translation infrastructure (`src/i18n/*`) for correctness, consistency,
and completeness.

No Critical issues were found — no secrets, no injection vectors, no crashes. The translation
plumbing itself (`LanguageProvider`, `useLang`, dot-notation `t()` lookup, `CATEGORY_KEYS` /
`LOCATION_KEYS` / `UNIT_KEYS` / `FORM_TYPE_KEYS` maps) is sound and consistently applied across
the large majority of components.

Four genuine Warning-level gaps were confirmed. Three components/pairs bypass the
`UNIT_KEYS`/label-lookup pattern used everywhere else and surface raw internal identifiers
(a canonical unit string, a `Medicine` field key, and CSV column-mapping field keys) directly to
the UI, so a Polish-language user sees untranslated English text or raw JS property names in
those specific spots. The fourth (WR-04) is higher-impact: the Zod validation schemas backing the
add/edit medicine and add/edit stock forms hardcode English error messages, bypassing i18n on the
app's most-used interaction — this was flagged by an earlier review pass, independently
re-confirmed by direct source inspection, and merged back into this report after this pass's own
automated scan did not surface it (see note below). Two Info-level quality issues (dead
translation keys, duplicated status-map literal) round out the findings.

**Note on review consistency:** this report reflects the union of two independent review passes
at the same commit. The automated pass that produced WR-01/WR-02/WR-03/IN-01/IN-02 above did not
independently surface WR-04; it was carried forward from a prior pass and verified directly
against the source (`CatalogFields.tsx:26`, `StockFields.tsx:30`, `MedicineForm.tsx:35-36`) before
being added here, specifically so the auto-fix pass that consumes this file does not silently miss
it.

Per review scope instructions, CR-02 (Dexie `.get()` resolving to `undefined`, not `null`, in
`src/routes/medicines/[id].tsx` / `[id].edit.tsx`) and WR-07 (`formatDate()` in `src/lib/utils.ts`
hardcoding `'No expiry'` / `'Bez daty ważności'` instead of `dates.noExpiry`) were independently
re-observed but are treated as out-of-scope pre-existing issues per the review brief, not
phase-07 blockers.

## Warnings

### WR-01: MoveStockSheet shows the raw canonical unit string untranslated

**File:** `src/components/MoveStockSheet.tsx:101`
**Issue:** Every other component that displays a `quantityUnit` value (`MedicineCard.tsx`,
`MedicineCardAggregate.tsx`, `[id].tsx`, `trash/index.tsx`, `StockFields.tsx`,
`MedicineForm.tsx`) goes through `t(UNIT_KEYS[unit] ?? 'units.units')` so the canonical English
value (`'tablets'`, `'capsules'`, …) is translated for the active language. `MoveStockSheet.tsx`
is the one exception:

```tsx
<p className="text-xs text-gray-500">
  {`= ${unitsPerBox} ${stock.quantityUnit || t('units.units')} ${t('form.unitsPerBox')}`}
</p>
```

`stock.quantityUnit` is rendered verbatim. In the Polish UI, a box entry whose unit is the
canonical value `"tablets"` will show `"= 20 tablets per box"` instead of `"= 20 tabletek na
opakowanie"` — the unit stays in English regardless of the selected language. `UNIT_KEYS` isn't
even imported in this file, confirming the lookup was simply omitted.

**Fix:**
```tsx
import { useLang, LOCATION_KEYS, UNIT_KEYS } from '@/i18n'
// …
<p className="text-xs text-gray-500">
  {`= ${unitsPerBox} ${stock.quantityUnit ? t(UNIT_KEYS[stock.quantityUnit] ?? 'units.units') : t('units.units')} ${t('form.unitsPerBox')}`}
</p>
```

### WR-02: HistoryEntry shows the raw Medicine field key untranslated (and stringifies objects)

**File:** `src/components/HistoryEntry.tsx:24-27`
**Issue:** For a single changed field, the entry message interpolates the raw `field` name
(a `keyof Medicine` value such as `expiryDate`, `location`, `quantity`, `pao`, `manualStatus`)
directly into the translated sentence:

```tsx
if (entry.changedFields.length === 1) {
  const { field, oldValue, newValue } = entry.changedFields[0]
  return `${ts} — ${field} ${t('history.fieldChanged')}: "${String(oldValue)}" → "${String(newValue)}"`
}
```

This produces mixed-language, developer-facing output such as `"17.09.2026 — expiryDate
zmieniono: ..."` in Polish (English property name glued to a Polish verb) and `"… — location
changed: ..."` in English (acceptable there only by coincidence). There is no lookup table
mapping `Medicine` field keys to translated labels anywhere in `@/i18n`, so this can't currently
be fixed by reusing an existing map. Additionally, `String(oldValue)` / `String(newValue)` on a
structured field (`pao: {value, unit}`) renders the literal text `"[object Object]"` in both
languages, which is unreadable regardless of translation — this compounds the same code path.

**Fix:** add a field-label lookup (mirroring `CATEGORY_KEYS`/`UNIT_KEYS`) and a display-safe
serializer:
```tsx
// src/i18n/types.ts — add alongside the other *_KEYS records
export const HISTORY_FIELD_KEYS: Record<string, string> = {
  location: 'form.location',
  expiryDate: 'form.expiryDate',
  openedDate: 'form.openedDate',
  pao: 'form.pao',
  quantity: 'form.quantity',
  quantityUnit: 'form.quantityUnit',
  notes: 'form.notes',
  manualStatus: 'history.manualStatusField', // add translation key
}

// HistoryEntry.tsx
function displayValue(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
// …
const label = t(HISTORY_FIELD_KEYS[field] ?? field)
return `${ts} — ${label} ${t('history.fieldChanged')}: "${displayValue(oldValue)}" → "${displayValue(newValue)}"`
```

### WR-03: CSV import UI surfaces raw internal field keys, never translated

**File:** `src/components/CSVColumnMapper.tsx:53-56`, `src/components/CSVPreview.tsx:42-48`
**Issue:** Both components render `MEDICINE_FIELDS` values (canonical field identifiers such as
`name`, `expiryDate`, `quantityUnit`, `location`, …) directly as UI text with no translation
pass, unlike every other enum-like value in the app (categories, locations, units, form types all
have `*_KEYS` maps in `@/i18n/types.ts`):

```tsx
// CSVColumnMapper.tsx
{MEDICINE_FIELDS.map((field) => (
  <SelectItem key={field} value={field}>
    {field}
  </SelectItem>
))}
```
```tsx
// CSVPreview.tsx
{mappedFields.map(([, fieldName]) => (
  <th key={fieldName} ...>{fieldName}</th>
))}
```
A Polish-language user mapping their spreadsheet columns sees the dropdown options and preview
table headers in raw English identifiers (`expiryDate`, `quantityUnit`) with no localization,
breaking the "instantly know" UX goal for the one language most users of this household PWA will
actually use.

**Fix:** introduce a `CSV_FIELD_KEYS: Record<string, string>` map (e.g. reusing `form.*` labels
where they already exist) and route both render sites through it:
```tsx
// CSVColumnMapper.tsx
<SelectItem key={field} value={field}>
  {t(CSV_FIELD_KEYS[field] ?? field)}
</SelectItem>
// CSVPreview.tsx
<th key={fieldName} ...>{t(CSV_FIELD_KEYS[fieldName] ?? fieldName)}</th>
```

### WR-04: Form validation error messages are hardcoded English, bypassing i18n entirely

**File:** `src/components/CatalogFields.tsx:26`, `src/components/StockFields.tsx:30`, `src/components/MedicineForm.tsx:35-36`
**Issue:** The Zod schemas backing every add/edit medicine and add/edit stock form pass literal
English strings as `.min()` validation messages instead of translated text:

```tsx
// CatalogFields.tsx:26
name: z.string().min(1, 'Name is required'),

// StockFields.tsx:30
expiryDate: z.string().min(1, 'Expiry date is required'),

// MedicineForm.tsx:35-36
name: z.string().min(1, 'Name is required'),
expiryDate: z.string().min(1, 'Expiry date is required'),
```

`FormMessage` (`src/components/ui/form.tsx:148`) renders `error.message` verbatim with no
translation step, so a Polish-language user who submits any of these forms with a missing
required field sees English validation text — on the app's most-used interaction (adding/editing
stock). A `form.nameRequired` key already exists in `en.ts`/`pl.ts`/`types.ts` (`'Name is
required'` / `'Nazwa jest wymagana'`) but is dead code — confirmed via repo-wide search, no `t()`
call references it anywhere. `form.expiryDateRequired` does not exist yet in any of the three i18n
files.

**Fix:** add the missing key, then wire both existing and new keys into the three schemas. Zod
schemas are defined at module scope (outside any component), so they cannot call the `t()` hook
directly — resolve this by moving each schema inside the component (or into a schema-factory
function taking `lang`) so it can read the active-language dictionary directly:
```tsx
// src/i18n/types.ts — add alongside nameRequired
form: {
  // ...
  nameRequired: string
  expiryDateRequired: string  // NEW
}

// src/i18n/en.ts
form: { /* ... */ nameRequired: 'Name is required', expiryDateRequired: 'Expiry date is required', },
// src/i18n/pl.ts
form: { /* ... */ nameRequired: 'Nazwa jest wymagana', expiryDateRequired: 'Data ważności jest wymagana', },

// CatalogFields.tsx / StockFields.tsx / MedicineForm.tsx — inside the component, after useLang():
const { lang, t } = useLang()
const schema = useMemo(() => z.object({
  name: z.string().min(1, t('form.nameRequired')),
  // ...
}), [lang])
```
Every call site constructing the schema (including any `useForm({ resolver: zodResolver(schema) })`
wiring) must reference the language-aware `schema` variable, not a module-level constant, or the
messages will still resolve to whatever language was active when the module first loaded.

## Info

### IN-01: Dead/unused translation keys in en.ts / pl.ts / types.ts

**File:** `src/i18n/en.ts`, `src/i18n/pl.ts`, `src/i18n/types.ts`
**Issue:** The following keys are defined (and translated in both languages) but never
referenced anywhere in `src/`: `toasts.saved`, `toasts.deleted`, `filter.byStatus`,
`filter.byCreated`, `history.updated`, `common.acrossLocations`, `common.unknown`,
`medicines.noStockBody`. Confirmed via repo-wide search — none of these string keys appear
outside the dictionary/type files themselves. They add translation-maintenance surface (someone
has to keep both language files in sync for text nobody sees) with no UI benefit.
**Fix:** remove the unused keys from `TranslationDict`, `en.ts`, and `pl.ts` together, or wire them
up if the intent was for `noStockBody` to render as a second line under `noStockHeading` in
`src/routes/medicines/[id].tsx:279` (likely the intended pairing, given the naming convention
used by `emptyHeading`/`emptyBody` and `noResultsHeading`/`noResultsBody`, both of which *are*
rendered as heading+body pairs elsewhere in the same file).

### IN-02: `statusKey` status-label map duplicated identically in three files

**File:** `src/components/FilterBottomSheet.tsx:26-34`, `src/components/FilterChips.tsx:6-14`,
`src/components/StatusBadge.tsx:15-23`
**Issue:** The exact same `Record<MedicineStatus, string>` literal mapping each `MedicineStatus`
to its `status.*` translation key is copy-pasted verbatim in three separate component files. If a
new `MedicineStatus` value is ever added, all three copies must be updated in lockstep with no
compiler or lint signal tying them together (aside from the `Record<MedicineStatus, string>`
exhaustiveness check firing independently in each file).
**Fix:** hoist the map into `@/i18n/types.ts` alongside `CATEGORY_KEYS`/`LOCATION_KEYS`/`UNIT_KEYS`
as a single exported `STATUS_KEYS` constant, and import it from all three call sites.

---

_Reviewed: 2026-09-17T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
