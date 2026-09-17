---
phase: 07-i18n-polish-language
fixed_at: 2026-09-17T12:00:00Z
review_path: .planning/phases/07-i18n-polish-language/07-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 07: Code Review Fix Report

**Fixed at:** 2026-09-17T12:00:00Z
**Source review:** .planning/phases/07-i18n-polish-language/07-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (WR-01 through WR-04; IN-01/IN-02 out of scope per `fix_scope: critical_warning`)
- Fixed: 4
- Skipped: 0

**Verification environment:** `workflow.use_worktrees` is `false` in `.planning/config.json`, so all
edits and commits were made directly in the main checkout on branch `develop` (no worktree was
created). The build/test/lint results below are reproducible from this same checkout.

## Fixed Issues

### WR-01: MoveStockSheet shows the raw canonical unit string untranslated

**Files modified:** `src/components/MoveStockSheet.tsx`
**Commit:** `69374b0`
**Applied fix:** Imported `UNIT_KEYS` from `@/i18n` and routed `stock.quantityUnit` through
`t(UNIT_KEYS[stock.quantityUnit] ?? 'units.units')`, matching the pattern already used by every
other component that renders `quantityUnit`. Preserved the existing fallback-to-`units.units`
behavior for the empty/nullish case.

### WR-02: HistoryEntry shows the raw Medicine field key untranslated (and stringifies objects)

**Files modified:** `src/i18n/types.ts`, `src/i18n/en.ts`, `src/i18n/pl.ts`, `src/i18n/index.ts`,
`src/components/HistoryEntry.tsx`
**Commit:** `4fe47bf`
**Applied fix:** Added a `HISTORY_FIELD_KEYS: Record<string, string>` lookup (mirroring
`CATEGORY_KEYS`/`UNIT_KEYS`) mapping the seven mutable `Medicine` field keys — including
`manualStatus` — to `form.*`/`history.*` translation keys, and added the new
`history.manualStatusField` key (`'Manual status'` / `'Status ręczny'`) since no existing key
covered that field. Added a `displayValue()` helper in `HistoryEntry.tsx` that renders `null`/
`undefined` as `'—'` and serializes objects (e.g. `pao: {value, unit}`) via `JSON.stringify`
instead of the unreadable `String()` coercion (`"[object Object]"`). `formatEntry()` now resolves
`t(HISTORY_FIELD_KEYS[field] ?? field)` for the label and `displayValue()` for both old/new
values.

### WR-03: CSV import UI surfaces raw internal field keys, never translated

**Files modified:** `src/i18n/types.ts`, `src/i18n/index.ts`, `src/components/CSVColumnMapper.tsx`,
`src/components/CSVPreview.tsx`
**Commit:** `b7820ff`
**Applied fix:** Added a `CSV_FIELD_KEYS: Record<string, string>` map covering all six
`MEDICINE_FIELDS` values (`location`, `expiryDate`, `openedDate`, `quantity`, `quantityUnit`,
`notes`), reusing the existing `form.*` labels since every field already had one — no new
dictionary keys were needed. Routed `CSVColumnMapper`'s `<SelectItem>` field-dropdown options and
`CSVPreview`'s `<th>` column headers through `t(CSV_FIELD_KEYS[field] ?? field)`.

### WR-04: Form validation error messages are hardcoded English, bypassing i18n entirely

**Files modified:** `src/i18n/types.ts`, `src/i18n/en.ts`, `src/i18n/pl.ts`,
`src/components/CatalogFields.tsx`, `src/components/StockFields.tsx`,
`src/components/MedicineForm.tsx`, `src/components/CatalogEditSheet.tsx`,
`src/components/StockEditSheet.tsx`, `src/routes/medicines/new.tsx`,
`src/components/MedicineForm.test.ts`, `src/components/StockFields.test.ts`
**Commit:** `6032f35`
**Applied fix:** Added the missing `form.expiryDateRequired` key (`'Expiry date is required'` /
`'Data ważności jest wymagana'`) alongside the previously-dead `form.nameRequired`. Converted the
three module-scope Zod schema constants (`catalogSchema`, `stockSchema`, `medicineSchema`) into
factory functions (`createCatalogSchema(t)`, `createStockSchema(t)`, `createMedicineSchema(t)`)
that read `.min()` messages from `t('form.nameRequired')` / `t('form.expiryDateRequired')` at
schema-construction time, since Zod schemas can't call the `useLang()` hook directly from module
scope. Per the review's explicit call-out ("every call site constructing the schema... must
reference the language-aware schema variable"), updated **all** consumers, not just the three
files named in the finding:
- `CatalogFields.tsx` / `StockFields.tsx` / `MedicineForm.tsx` — export the factory + a
  `z.infer<ReturnType<typeof createXSchema>>` type instead of the old `z.infer<typeof xSchema>`
- `MedicineForm.tsx` (self-contained form) — builds `const medicineSchema = useMemo(() =>
  createMedicineSchema(t), [t])` before its own `useForm({ resolver: zodResolver(medicineSchema) })`
- `CatalogEditSheet.tsx`, `StockEditSheet.tsx`, `routes/medicines/new.tsx` (both the catalog and
  stock forms in the add-medicine flow) — each now builds its own schema via the same
  `useMemo(() => createXSchema(t), [t])` pattern before passing it to `zodResolver`
- `MedicineForm.test.ts`, `StockFields.test.ts` — updated to call `createMedicineSchema(t)` /
  `createStockSchema(t)` with a small `t` helper backed by `en.ts`, so existing assertions against
  English error text (`'Name is required'`, `'Expiry date is required'`) continue to hold
  unchanged (the English dictionary values are identical to the old hardcoded strings)

Verified that React Hook Form's `useForm` re-reads `_options` (including `resolver`) on every
render, so a schema rebuilt via `useMemo(() => createXSchema(t), [t])` correctly re-validates in
the newly active language after a language switch, without needing to remount the form.

**Note — human verification recommended:** this fix reshapes how validation-schema construction
and hook dependencies interact across six components (a structural/wiring change, not a pure
string substitution). Build, full test suite, and lint all pass (see below), but a manual UAT pass
switching the language toggle mid-session on the add/edit medicine and add/edit stock forms is
recommended to visually confirm Polish validation text appears immediately after a language
switch, since this is the phase's independent goal-verification blocker for requirement I18N-02.

## Verification Results

Run in the main checkout (no worktree — `workflow.use_worktrees: false`), after all four fixes:

```
$ npm run build
> tsc -b && vite build
✓ built in 2.47s   (no type errors, no build errors)

$ npx vitest run
Test Files  13 passed (13)
     Tests  143 passed (143)

$ npm run lint
5 warnings, 0 errors — all pre-existing `react(only-export-components)` fast-refresh
warnings (confirmed via `git stash` diff: same 5 files/warning count before and after
this fix session, only line numbers shifted). No new lint findings introduced.
```

## Skipped Issues

None — all four in-scope findings (WR-01 through WR-04) were fixed and verified.

---

_Fixed: 2026-09-17T12:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
