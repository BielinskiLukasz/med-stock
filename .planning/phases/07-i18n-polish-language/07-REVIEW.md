---
phase: 07-i18n-polish-language
reviewed: 2026-09-16T00:00:00Z
depth: standard
files_reviewed: 39
files_reviewed_list:
  - src/App.tsx
  - src/components/BottomTabBar.tsx
  - src/components/CSVColumnMapper.tsx
  - src/components/CSVPreview.tsx
  - src/components/CatalogAutocomplete.tsx
  - src/components/CatalogEditSheet.tsx
  - src/components/CatalogFields.tsx
  - src/components/ChangeHistory.tsx
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
  - src/i18n/LanguageProvider.tsx
  - src/i18n/en.ts
  - src/i18n/index.ts
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
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-09-16T00:00:00Z
**Depth:** standard
**Files Reviewed:** 39
**Status:** issues_found

## Summary

This is a re-review of phase 07 (i18n + Polish language) after gap-closure plan 07-09. The four
previously-logged gaps are verified fixed in the current code:

- **CR-01** (Add Medicine wizard buttons hardcoded English) — **RESOLVED**. `medicines/new.tsx:163,207`
  now call `t('form.creating')`, `t('form.nextAddStock')`, `t('form.savingGeneric')`, `t('form.addStock')`.
- **WR-01** (edit sheets hardcode "Saving…") — **RESOLVED**. `CatalogEditSheet.tsx:81`,
  `StockEditSheet.tsx:103`, `MedicineForm.tsx:437` all now call `t('form.savingGeneric')`.
- **WR-02** (custom unit/placeholder strings hardcoded) — **RESOLVED**. `MedicineForm.tsx` and
  `StockFields.tsx` now call `t('form.customUnitOption')`, `t('form.customUnitPlaceholder')`,
  `t('form.paoValuePlaceholder')`, `t('form.quantityPlaceholder')`, `t('form.packCountPlaceholder')`.
- **WR-03** (aria-labels hardcoded English) — **MOSTLY RESOLVED**, but one instance was missed by the
  closure plan: `medicines/index.tsx:160` still hardcodes `aria-label="Open filters"` on the filter-sheet
  trigger button on the main Medicines list screen (see WR-05 below).

While verifying the fix, this pass also found one new **Critical** logic bug (unrelated to i18n, but
present in files under review) and three new i18n coverage gaps that the 07-09 closure plan did not
touch: Zod validation-error messages, the sync-guide `formatDate()` fallback strings, and change-history
field-name interpolation all still bypass `t()`.

The previously-deferred items (WR-04 localStorage try/catch, WR-05 fragile `LOCATION_KEYS` fallback
duplication, WR-06 duplicated `statusKey` maps, WR-07 untyped `t()` key, WR-08 orphaned
`form.namePlaceholder` key, IN-01 dead filter keys, IN-02 missing sort-by-status UI, IN-03 stale
Phase-5 comment) were explicitly out of scope for 07-09 and are confirmed still present. They are
re-surfaced briefly at the end of this report for completeness, per the review brief, but are not
re-litigated as blocking since they were a deliberate scope decision.

## Critical Issues

### CR-02: "Not found" states are unreachable dead code — infinite loading spinner for missing records

**File:** `src/routes/medicines/[id].tsx:226` and `src/routes/medicines/[id].edit.tsx:56`
**Issue:**
Both routes gate their "not found" UI on `catalog === null` / `medicine === null`:

```tsx
// [id].tsx:217-235
if (catalog === undefined || stockEntries === undefined) { /* loading */ }
if (catalog === null) { /* not found */ }
```
```tsx
// [id].edit.tsx:48-62
if (medicine === undefined || catalog === undefined) { /* loading */ }
if (medicine === null) { /* not found */ }
```

Dexie's `Table.get()` (used by both `useLiveQuery` callbacks: `db.medicine_catalog.get(catalogId)` and
`db.medicines.get(Number(id))`) resolves to `undefined` when the key does not exist — it never resolves
to `null` (confirmed by the `EntityTable<Medicine, 'id'>` / `EntityTable<MedicineCatalog, 'id'>` typing in
`src/lib/db.ts`, and consistent with the project's own documented invariant that IndexedDB has no native
`null` key semantics). Consequently the `=== null` branch in both files is unreachable: a request for a
deleted or nonexistent catalog/medicine id (e.g. a stale bookmark, a race after another tab permanently
deletes the entry, or manually editing the URL hash) is indistinguishable from "still loading" and the
screen falls into the first branch — the loading spinner — **forever**, with no path to the "not found"
message and no escape other than manually navigating away.

**Fix:**
```tsx
// [id].tsx
if (catalog === undefined || stockEntries === undefined) { /* loading */ }
if (catalog === undefined) { /* unreachable — remove, or... */ }
```
Replace the sentinel check with an explicit "resolved but absent" test, e.g. track a `loaded` flag or
compare against `undefined` after an initial-load flag flips true:
```tsx
const [attempted, setAttempted] = useState(false)
useEffect(() => { if (catalog !== undefined) setAttempted(true) }, [catalog])
if (!attempted) return <Loading />
if (catalog === undefined) return <NotFound />
```
or simpler — since `useLiveQuery`'s `undefined` already conflates "loading" and "not found", swap to a
sentinel object result from the querier function itself:
```tsx
const catalog = useLiveQuery(
  () => db.medicine_catalog.get(catalogId).then(c => c ?? null),
  [id],
)
// now: undefined = loading, null = not found, object = found
```
Apply the same fix to `medicine`/`catalog` lookups in `[id].edit.tsx`.

## Warnings

### WR-05: `aria-label="Open filters"` still hardcoded English — missed by the WR-03 closure

**File:** `src/routes/medicines/index.tsx:160`
**Issue:** The filter-sheet trigger button on the main Medicines list screen (the app's primary landing
screen) still has a literal English `aria-label="Open filters"`, never routed through `t()`. This wasn't
in the original WR-03 finding list (which covered `BottomTabBar`, `SearchBar`, `FilterChips`,
`medicines/new.tsx`, and `[id].tsx`) and was not touched by the 07-09 closure plan. Screen readers will
announce this button in English regardless of the active language, on the screen every user sees first.
**Fix:** Add an `aria.openFilters` key to `TranslationDict`/`en.ts`/`pl.ts` and use it:
```tsx
aria-label={t('aria.openFilters')}
```

### WR-06: Zod validation-error messages are hardcoded English, bypassing an already-existing translation key

**Files:**
- `src/components/CatalogFields.tsx:26` — `name: z.string().min(1, 'Name is required')`
- `src/components/MedicineForm.tsx:35-36` — `name: z.string().min(1, 'Name is required')`,
  `expiryDate: z.string().min(1, 'Expiry date is required')`
- `src/components/StockFields.tsx:30` — `expiryDate: z.string().min(1, 'Expiry date is required')`

**Issue:** All three Zod schemas hardcode their validation-failure messages as English string literals.
These render via `<FormMessage />` when the user submits an empty required field (Name / Expiry date) on
the Add Medicine, Edit Catalog, and Edit Stock forms. A Polish-language user who leaves the name or expiry
date blank sees "Name is required" / "Expiry date is required" in English. Notably, `TranslationDict`
already defines `form.nameRequired` (`'Name is required'` / `'Nazwa jest wymagana'`) but it is dead —
never referenced anywhere in the schemas. There is no `form.expiryDateRequired` key at all. This directly
contradicts the phase goal of "full string coverage" (I18N-02) and was missed by both the original review
and the 07-09 closure plan, likely because Zod schemas are defined at module scope, outside any component
where `useLang()` could be called.
**Fix:** Move message resolution out of the static schema definition into a factory that takes `t`, and
call it inside each component/form (where `useLang()` is available):
```ts
// CatalogFields.tsx
export const makeCatalogSchema = (t: (k: string) => string) => z.object({
  name: z.string().min(1, t('form.nameRequired')),
  // ...
})
```
Then in each consuming component: `const catalogSchema = useMemo(() => makeCatalogSchema(t), [t])`, and
pass the resulting schema into `zodResolver`. Add `form.expiryDateRequired` to `TranslationDict`/`en.ts`/`pl.ts`.

### WR-07: `formatDate()` hardcodes its "no expiry" strings instead of reusing the translation dictionary

**File:** `src/lib/utils.ts:16-25`
**Issue:**
```ts
export function formatDate(dateString: string | null | undefined, lang: Lang): string {
  if (!dateString) {
    return lang === 'pl' ? 'Bez daty ważności' : 'No expiry'
  }
  ...
```
This duplicates the `dates.noExpiry` key already defined in `en.ts` (`'No expiry'`) and `pl.ts`
(`'Bez daty ważności'`). Because `formatDate` is a plain function (not a hook, so it cannot call
`useLang()`/`t()`), the string exists in two places that must be kept in sync by hand. If a translator
updates `dates.noExpiry` in the dictionary but misses this literal in `utils.ts` (or vice versa), the two
copies silently diverge — a maintainability/correctness risk that defeats the point of centralizing
translations in `en.ts`/`pl.ts`.
**Fix:** Pass the resolved string in as a parameter instead of hardcoding it:
```ts
export function formatDate(dateString: string | null | undefined, lang: Lang, noExpiryLabel: string): string {
  if (!dateString) return noExpiryLabel
  ...
}
// call sites: formatDate(medicine.expiryDate, lang, t('dates.noExpiry'))
```
(Note: existing callers in `MedicineCard.tsx` and `[id].tsx` only invoke `formatDate` when
`medicine.expiryDate`/`stock.expiryDate` is truthy, so the empty-string branch may currently be dead in
practice — but the duplication risk stands regardless, and `utils.test.ts` explicitly exercises the
null/undefined path.)

### WR-08: Change-history entries interpolate raw untranslated field names

**File:** `src/components/HistoryEntry.tsx:24-27`
**Issue:**
```ts
if (entry.changedFields.length === 1) {
  const { field, oldValue, newValue } = entry.changedFields[0]
  return `${ts} — ${field} ${t('history.fieldChanged')}: "${String(oldValue)}" → "${String(newValue)}"`
}
```
`field` is the raw `keyof Medicine` property name (`'location'`, `'expiryDate'`, `'quantity'`,
`'quantityUnit'`, `'notes'`, `'pao'`, `'openedDate'`, `'manualStatus'`) taken directly from
`TRACKED_FIELDS` in `historyOps.ts`. It is never mapped through a translation table, so a Polish-language
user viewing a medicine's change history (`ChangeHistory.tsx`, expanded on the detail screen) sees English
field names mixed into otherwise-Polish sentences, e.g. "12.03.2026 — quantityUnit zmieniono: ...". This
is a genuine I18N-02 gap on a user-visible screen that neither the original review nor 07-09 addressed.
**Fix:** Add a `Record<keyof Medicine, string>` translation-key map (mirroring the pattern already used
for `CATEGORY_KEYS`/`LOCATION_KEYS`/`UNIT_KEYS`) and translate `field` before interpolating:
```ts
const FIELD_KEYS: Record<string, string> = {
  location: 'form.location', expiryDate: 'form.expiryDate', quantity: 'form.quantity',
  quantityUnit: 'form.quantityUnit', notes: 'form.notes', pao: 'form.pao',
  openedDate: 'form.openedDate', manualStatus: 'status.title' /* or a dedicated key */,
}
// ...
return `${ts} — ${t(FIELD_KEYS[field] ?? field)} ${t('history.fieldChanged')}: ...`
```

## Info

### IN-04: Previously-deferred items confirmed still present (out of scope, not new)

Per the review brief, these were explicitly deferred by the previous review/07-09 planning decision and
are re-surfaced here only for completeness — they are not new findings and do not block this phase:

- **WR-04 (localStorage try/catch):** `LanguageProvider.tsx:20-28` still calls `localStorage.getItem`/
  `setItem` with no try/catch. Still a crash risk in Safari private-browsing / storage-quota-exceeded
  environments.
- **WR-05→ (fragile `LOCATION_KEYS` fallback pattern):** the `LOCATION_KEYS[x] ? t(LOCATION_KEYS[x]) : x`
  ternary is now duplicated across at least 7 call sites (`MedicineCard.tsx`, `locations/index.tsx`,
  `[id].tsx`, `MoveStockSheet.tsx`, `StockFields.tsx`, `MedicineForm.tsx`, `FilterBottomSheet.tsx`) instead
  of a single shared helper (e.g. `translateLocation(name, t)`).
- **WR-06→ (duplicated `statusKey` map):** the identical `Record<MedicineStatus, string>` literal is now
  copy-pasted in three files: `StatusBadge.tsx`, `FilterChips.tsx`, `FilterBottomSheet.tsx`.
- **WR-07→ (untyped `t()` key):** `t(key: string): string` in `i18n/index.ts`/`LanguageProvider.tsx`
  still accepts any string; typos/missing keys silently fall through to displaying the raw dot-path.
- **WR-08→ (orphaned `form.namePlaceholder` key):** `TranslationDict.form.namePlaceholder` is defined in
  both `en.ts` ('e.g. Ibuprofen') and `pl.ts` ('np. Ibuprofen') but never referenced — `CatalogFields.tsx:54`
  and `MedicineForm.tsx:119` both still hardcode the literal placeholder `"e.g. Ibuprofen 400mg"` in English
  only, regardless of active language.
- **IN-01 (dead filter keys):** `filter.byStatus` / `filter.byCreated` remain unused in any rendered UI.
- **IN-02 (missing sort-by-status UI):** `SortField` (`uiStore.ts`) includes `'status'` and
  `medicines/index.tsx`'s sort comparator handles it, but `FilterBottomSheet.tsx`'s sort-by button row only
  cycles `name` / `expiryDate` / `category` — there is no way for a user to actually select sort-by-status.
- **IN-03 (stale Phase-5 comment):** `MedicineForm.tsx:29-31` still describes itself as kept "for backward
  compat during Phase 5 transition," to be replaced by `CatalogFields` + `StockFields` composition — it is
  still in active use unchanged by both `[id].edit.tsx` and `new.tsx`'s catalog-creation step re-uses
  `CatalogFields`/`StockFields` directly, so the comment is stale/misleading about the form's actual status.

### IN-05: `ImportJSONSection.tsx` never resets displayed counts after a successful import

**File:** `src/components/ImportJSONSection.tsx:69-83`
**Issue:** `handleConfirmImport` clears `pendingRaw` on success but leaves `medicineCount`/`locationCount`
state untouched. This is latent (the dialog is closed via `AlertDialogAction` before these are re-read),
but if the dialog is ever reopened as a controlled component without a fresh file selection, stale counts
from the previous import would flash briefly. Low impact, noted for completeness.
**Fix:** Reset `setMedicineCount(0)` / `setLocationCount(0)` alongside `setPendingRaw(null)` in the success
path.

### IN-06: Comment/label drift — `[id].tsx` header comment says "Load catalog by catalogId" but the delete-guard reads `stockEntries` before falsy check

**File:** `src/routes/medicines/[id].tsx:449`
**Issue:** `(stockEntries?.length ?? 0) > 0` is used to decide whether to show "cannot delete" vs. "delete
catalog?" in the confirmation dialog, but `stockEntries` at that point is guaranteed non-`undefined`
(guarded earlier at line 217), making the `?? 0` fallback dead defensive code. Purely cosmetic — flagged
for minor clarity only, not a functional defect.
**Fix:** `stockEntries.length > 0` (drop the optional chaining/fallback) once the earlier guard is trusted.

---

_Reviewed: 2026-09-16T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
