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
  - src/routes/trash/index.tsx
findings:
  critical: 1
  warning: 8
  info: 3
  total: 12
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-09-16T00:00:00Z
**Depth:** standard
**Files Reviewed:** 39
**Status:** issues_found

## Summary

This phase introduces a custom React Context i18n system (EN/PL) and translates most of the app's
user-facing strings. The `LangContext`/`useLang()`/`t()` mechanism itself is small and reasonable,
and the vast majority of screens correctly route strings through `t()` with sensible fallback
lookups (`CATEGORY_KEYS`, `LOCATION_KEYS`, `UNIT_KEYS`, `FORM_TYPE_KEYS`).

However, the translation coverage is **not complete**, and the gaps are concentrated in exactly the
flow the project's own `CLAUDE.md` calls out as the core value proposition (adding/checking stock).
The `MedicineNew.tsx` "Add Medicine" wizard — arguably the single most important screen in the app —
ships primary call-to-action button text that is never translated, in any language. Several other
components hardcode "Saving…"/"Other..."/"Custom unit" strings instead of using `t()`, aria-labels
are uniformly left in English, some translation keys are entirely dead code (evidence that nothing
enforces key/usage correctness), and `LanguageProvider` reads/writes `localStorage` without any
error guard even though this codebase is otherwise careful about defensive coding for browser storage
edge cases (see `App.tsx`'s `navigator.storage.persist()` handling for comparison).

None of the mutation/history/status logic in `lib/expiry.ts`, `lib/historyOps.ts`, or `lib/utils.ts`
was altered incorrectly — those files remain correct. The defects found are scoped to the i18n
system itself and to the translation coverage introduced across the phase's 8 plans.

## Critical Issues

### CR-01: "Add Medicine" wizard's primary buttons are never translated

**File:** `src/routes/medicines/new.tsx:163-164, 207-208`
**Issue:** The `MedicineNew` screen (Step 2: create catalog, Step 3: add stock) hardcodes its
submit-button text and loading-state text as raw English string literals instead of calling `t()`:

```tsx
{catalogForm.formState.isSubmitting ? 'Creating…' : 'Next: Add Stock'}
...
{stockForm.formState.isSubmitting ? 'Saving…' : 'Add Stock'}
```

Every other screen in this phase routes its strings through `t()`; this file does not, for its two
most important buttons. A Polish-language user completing the primary "add a medicine" flow — the
scenario `CLAUDE.md` names as the app's core value — sees "Next: Add Stock" / "Add Stock" /
"Creating…" / "Saving…" in English regardless of the selected language. This is not a stylistic gap;
it is a functional failure of the feature this phase was built to deliver.
**Fix:** Add `nextAddStock` / `addStock` / `creating` keys to `TranslationDict` (`en.ts`/`pl.ts`) and
use them:
```tsx
{catalogForm.formState.isSubmitting ? t('form.creating') : t('form.nextAddStock')}
...
{stockForm.formState.isSubmitting ? t('form.saving') : t('form.addStock')}
```
(Note: `form.saving` currently means "Moving…" — see WR-01 — so a distinct key is needed here rather
than reusing it as-is.)

## Warnings

### WR-01: Hardcoded "Saving…" loading-state labels bypass i18n in three components

**File:** `src/components/CatalogEditSheet.tsx:81`, `src/components/StockEditSheet.tsx:103`, `src/components/MedicineForm.tsx:437`
**Issue:** All three submit buttons hardcode the English literal `'Saving…'` (and in
`MedicineForm.tsx`, an inconsistent `'Saving...'` with plain dots instead of an ellipsis character)
for the `isSubmitting` loading state, instead of using a translation key:
```tsx
{form.formState.isSubmitting ? 'Saving…' : t('form.saveChanges')}
```
The existing `form.saving` key already exists in `TranslationDict`, but its value is `'Moving…'` /
`'Przenoszę…'` (it is only correct for `MoveStockSheet.tsx`'s move action). Reusing it here would
show the wrong text ("Moving…") on a save action, so a dedicated key is required.
**Fix:** Add a `form.savingGeneric` (or similarly named) key with value `'Saving…'` / `'Zapisywanie…'`
and use it in all three call sites instead of the literal.

### WR-02: Hardcoded "Other...", "Custom unit", and numeric example placeholders

**File:** `src/components/MedicineForm.tsx:389, 394` and `src/components/StockFields.tsx:303, 308`
(also `paoValue`/`quantity`/`packCount` placeholders `"e.g. 12"`, `"e.g. 20"`, `"e.g. 2"` in both files)
**Issue:** The custom-quantity-unit `SelectItem` and its follow-up `Input` placeholder are hardcoded:
```tsx
<SelectItem value="__CUSTOM__">Other...</SelectItem>
...
<Input placeholder="Custom unit" ... />
```
These never change when the user switches to Polish.
**Fix:** Add `form.customUnitOption` / `form.customUnitPlaceholder` keys and route through `t()`.
Also route the numeric-field placeholders through translated keys (or at minimum drop the English
`"e.g."` prefix in favor of a translated equivalent, since the number itself doesn't need
localization but the leading text does).

### WR-03: Hardcoded English `aria-label`s throughout, never localized

**File:** `src/components/BottomTabBar.tsx:79`, `src/components/SearchBar.tsx:35`,
`src/components/FilterChips.tsx:55`, `src/routes/medicines/index.tsx:160`,
`src/routes/medicines/new.tsx:143, 178`, `src/routes/medicines/[id].tsx:260, 268, 320`
**Issue:** Every `aria-label` in the reviewed files is a raw English string
(`"Open filters"`, `"Back to search"`, `"Edit catalog"`, `"Delete catalog"`, `"Edit stock entry"`,
`"Clear search"`, `` `Remove ${chip.label}` ``, and the language-toggle's own
`"Switch to Polish"`/`"Switch to English"`). Screen-reader users on the Polish locale get an
all-English accessibility tree. Given this phase's explicit goal is a fully localized app, these
should have been included.
**Fix:** Add `aria.*` translation keys and use `t()` for every `aria-label` attribute.

### WR-04: `LanguageProvider` reads/writes `localStorage` without any error handling

**File:** `src/i18n/LanguageProvider.tsx:20-28`
**Issue:**
```tsx
const [lang, setLangState] = useState<Lang>(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  return isValidLang(saved) ? saved : 'en'
})

const setLang = (newLang: Lang) => {
  localStorage.setItem(STORAGE_KEY, newLang)
  setLangState(newLang)
}
```
Neither call is guarded. If `localStorage` throws — private-browsing storage restrictions, blocked
third-party storage, quota exceeded, or a corporate/managed-device policy — the `useState`
initializer throws during the very first render of `LanguageProvider`, which sits above
`RouterProvider` in `App.tsx`, so the entire app fails to mount with an unhandled exception. This
project is otherwise careful about this class of failure — see `App.tsx`'s
`navigator.storage.persist()` handling, explicitly guarded with `?.` and `.catch()` — but the new
i18n code doesn't follow the same pattern.
**Fix:**
```tsx
const [lang, setLangState] = useState<Lang>(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return isValidLang(saved) ? saved : 'en'
  } catch {
    return 'en'
  }
})

const setLang = (newLang: Lang) => {
  try {
    localStorage.setItem(STORAGE_KEY, newLang)
  } catch (err) {
    console.warn('Failed to persist language preference:', err)
  }
  setLangState(newLang)
}
```

### WR-05: Fragile/inconsistent fallback pattern for free-text location names passed through `t()`

**File:** `src/components/MedicineCard.tsx:23`, `src/components/FilterBottomSheet.tsx:138`,
`src/components/FilterChips.tsx:31`, `src/components/MedicineForm.tsx:204`,
`src/components/StockFields.tsx:121`, `src/components/MoveStockSheet.tsx:150`,
`src/routes/medicines/[id].tsx:296`, `src/routes/trash/index.tsx:90`
**Issue:** These call sites all use the pattern `t(LOCATION_KEYS[name] ?? name)`, passing a
user-entered, free-text custom location name directly into the same `t()` lookup used for static
translation keys. `t()`'s fallback behavior (return the input unchanged when no matching dictionary
entry is found) happens to make this safe today, but it is an undocumented implementation detail,
not a contract — if a user names a custom location something that happens to collide with a real
dot-path key (e.g. a location literally named `"form.cancel"`), that location would silently render
as `"Cancel"` instead of its actual name. Contrast this with `src/routes/locations/index.tsx:136`,
which uses the safer explicit pattern:
```tsx
{LOCATION_KEYS[loc.name] ? t(LOCATION_KEYS[loc.name]) : loc.name}
```
Two different guard idioms for the same problem, one of which has a real (if low-probability) data
integrity edge case, is a maintainability hazard.
**Fix:** Standardize on the `locations/index.tsx` pattern everywhere — never pass unvalidated
user content into `t()`.

### WR-06: `statusKey` lookup table duplicated verbatim in three files

**File:** `src/components/StatusBadge.tsx:15-23`, `src/components/FilterBottomSheet.tsx:26-34`,
`src/components/FilterChips.tsx:6-14`
**Issue:** The exact same `Record<MedicineStatus, string>` mapping status values to `status.*`
translation keys is copy-pasted into three separate files. Any future status addition/rename must be
updated in three places in lockstep, or the UI silently desyncs (a status shows its raw enum name in
one place and its translated label in another).
**Fix:** Extract to a single shared constant, e.g. `STATUS_KEYS` in `src/i18n/types.ts` alongside
`CATEGORY_KEYS`/`LOCATION_KEYS`/`UNIT_KEYS`/`FORM_TYPE_KEYS`, and import it in all three components.

### WR-07: `t()` accepts an unvalidated `string` key — no compile-time key safety

**File:** `src/i18n/index.ts:16`, `src/i18n/LanguageProvider.tsx:32-43`
**Issue:** `t: (key: string) => string` accepts any string. A typo'd or stale key (e.g. calling
`t('form.save_changes')` instead of `t('form.saveChanges')`) is not a compile error — it silently
falls through to `return key`, displaying the raw dot-path string to the user at runtime. This is
directly evidenced by the dead keys in IN-01 below (keys that exist in the dictionary but are never
referenced, undetectable without a manual audit) and is the same class of defect that produced CR-01
and WR-01 (missing entries that nobody could catch statically).
**Fix:** Derive a template-literal union type from `TranslationDict` (e.g.
`` type TKey = { [N in keyof TranslationDict]: `${string & N}.${string & keyof TranslationDict[N]}` }[keyof TranslationDict] ``)
and type `t: (key: TKey) => string`, so invalid/unused keys are caught by `tsc -b` at build time
(this project already runs `tsc -b` before every build per `CLAUDE.md`).

### WR-08: Hardcoded medicine-name placeholder ignores the existing (and now orphaned) `form.namePlaceholder` key

**File:** `src/components/CatalogFields.tsx:54`, `src/components/MedicineForm.tsx:119`
**Issue:** Both forms hardcode:
```tsx
<Input placeholder="e.g. Ibuprofen 400mg" autoComplete="off" {...field} />
```
while `TranslationDict.form.namePlaceholder` already exists with a *different* value
(`'e.g. Ibuprofen'` / `'np. Ibuprofen'`) and is never used anywhere in the codebase (confirmed via
search — no `t('form.namePlaceholder')` call site exists). The placeholder is (a) never translated
to Polish and (b) inconsistent with the translation dictionary's own text for the same field.
**Fix:** Either use `t('form.namePlaceholder')` in both places, or delete the unused key if a
hardcoded example is intentional — currently it's neither used nor consistent.

## Info

### IN-01: Dead/unused translation keys

**File:** `src/i18n/types.ts`, `src/i18n/en.ts`, `src/i18n/pl.ts`
**Issue:** The following keys are defined (and translated into both languages) but never referenced
by any `t()` call in the reviewed source: `common.acrossLocations`, `filter.byStatus`,
`filter.byCreated`, `history.updated`, `toasts.saved`, `data.importCSVButton`. These are either
leftovers from an earlier design or aspirational keys for features not wired up (e.g. `filter.byStatus`
suggests a "sort by status" option, but `FilterBottomSheet.tsx`'s sort buttons only offer
`name`/`expiryDate`/`category` even though `SortField` includes `'status'`).
**Fix:** Remove unused keys, or wire up the missing UI (sort-by-status option) if it was intended to
ship in this phase.

### IN-02: `SortField` includes `'status'` but the sort UI never exposes it

**File:** `src/components/FilterBottomSheet.tsx:152`
**Issue:** `(['name', 'expiryDate', 'category'] as SortField[]).map(...)` omits `'status'`, even
though `MedicineList` (`src/routes/medicines/index.tsx:122-124`) has working sort-by-status logic and
`filter.byStatus` exists as a translation key (see IN-01). This looks like a pre-existing gap outside
this phase's scope, but it directly correlates with a dead i18n key introduced/retained in this phase
and is worth flagging together.
**Fix:** Either add the `'status'` sort button or remove the dead code paths that support it.

### IN-03: Stale `TODO: Phase 5` comment in `MedicineForm.tsx`

**File:** `src/components/MedicineForm.tsx:29-31`
**Issue:**
```tsx
// TODO: Phase 5 — CatalogFields and StockFields have been extracted as reusable components.
// This monolithic form is kept for backward compat during Phase 5 transition.
// Replace with CatalogFields + StockFields composition once add/edit flows are updated (Plans 05-05, 05-06).
```
The project is now on Phase 07; this comment references a "Phase 5 transition" that (per
`MedicineEdit`'s continued use of `MedicineForm`) either never completed or was intentionally kept.
Either way, the stale comment misleads future readers about the file's status.
**Fix:** Update or remove the comment to reflect the current, apparently-permanent role of
`MedicineForm` in the edit flow.

---

_Reviewed: 2026-09-16T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
