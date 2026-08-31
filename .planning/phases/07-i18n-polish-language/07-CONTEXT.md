# Phase 7: i18n / Polish Language - Context

**Gathered:** 2026-08-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Add Polish/English language switching to the existing React PWA. Every visible string, label, placeholder, toast, status name, category name, predefined location name, quantity unit, and PAO unit displays in the chosen language. Dates render in locale-appropriate format. Language preference persists in localStorage and applies on next load without a reload. Stored database values are never modified.

</domain>

<decisions>
## Implementation Decisions

### Translation Infrastructure

- **D-01:** Use a custom `useTranslation()` hook backed by TypeScript-typed translation dictionaries — no new dependencies. Two objects (`en`, `pl`), both satisfying the same `TranslationDict` type, ensuring compile-time coverage of all keys. — **Reversibility:** costly — switching to react-i18next later would require replacing every `t('key')` call site.
- **D-02:** Language state lives in a `LanguageProvider` React Context at the app root. Consumers call a `useLang()` hook. Not stored in Zustand (uiStore.ts is for filter/sort state only).
- **D-03:** Translation keys are structured flat by screen/component namespace: `{ medicines: { title, search, empty }, dashboard: { title }, status: { active, expired, ... }, categories: { painFever, ... }, form: { tablet, ... }, locations: { bathroomCabinet, ... }, units: { tablets, days, weeks, months } }`. Full TypeScript type required for both language objects.

### Status Labels

- **D-04:** `STATUS_LABELS` object is removed from `expiry.ts`. `calculateStatus()` continues to return English canonical string keys (`'Active'`, `'Expired'`, `'ExceededOpenPeriod'`, etc.). Display components call `t('status.active')` etc. to render in the active language. — **Reversibility:** costly — touches every StatusBadge and display call site.

### Categories and Form Types

- **D-05:** `CATEGORIES` values in `types/medicine.ts` and `MedicineForm` values in `db.ts` remain as English canonical keys in code and DB. Display-layer components look up `t('categories.painFever')` etc. when rendering. The mapping from canonical key to translation key is defined in the translation dictionaries. — **Reversibility:** reversible.

### Predefined Location Names

- **D-06:** Predefined location names seeded in the DB (`'Bathroom Cabinet'`, `'Kitchen Drawer'`, etc.) are stored as-is. At render time, a known-value lookup translates them using the translation dict: `t('locations.bathroomCabinet')`. User-created custom location names are always shown as stored (no translation attempted). — **Reversibility:** reversible.

### Untranslated User Content

- **D-07:** User-typed content — medicine names, custom category strings, custom location names — is shown as-is in all language modes. No translation is attempted. No restriction to predefined values is added.

### Quantity and PAO Units

- **D-08:** `QUANTITY_UNITS` (`'tablets'`, `'capsules'`, `'ml'`, `'g'`, `'pcs'`, `'patches'`, `'drops'`, `'doses'`) and PAO units (`'days'`, `'weeks'`, `'months'`) are added to the translation dicts and rendered via `t()`. DB values stay as English keys.

### Language Toggle UI

- **D-09:** The language toggle lives inside `BottomTabBar.tsx`, rendered alongside the 5 nav links. Visual: flag emoji showing the currently active language — 🇬🇧 when English is active, 🇵🇱 when Polish is active. Tapping switches to the other language. The toggle is part of the `BottomTabBar` component, not a sibling in `RootLayout`.

### Language Persistence

- **D-10:** Selected language is persisted in `localStorage` (key: `'medstock-lang'`). `LanguageProvider` reads it on mount and applies it immediately. Changing language updates localStorage and triggers a React re-render — no full page reload.

### Date Formatting

- **D-11:** A shared `formatDate(dateString: string, lang: Lang): string` utility (in `utils.ts` or a new `i18n.ts` module) handles locale-aware date display. EN: returns the stored `YYYY-MM-DD` string as-is. PL: splits on `'-'` and reorders to `DD.MM.YYYY`. No `Intl.DateTimeFormat` — manual string split avoids timezone edge cases on stored date strings.
- **D-12:** Date formatting applies to display only. HTML `<input type="date">` elements are left native — the browser already applies locale formatting there.
- **D-13:** All visible dates use locale formatting — medicine cards, detail view, history entries, filter chip summaries. No partial scoping.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §i18n — I18N-01 through I18N-05 (5 requirements for this phase)
- `.planning/ROADMAP.md` §Phase 7 — Goal, Success Criteria, UI hint

### Codebase Entry Points
- `src/lib/expiry.ts` — `STATUS_LABELS` to be removed; `calculateStatus()` return values are the canonical status keys
- `src/types/medicine.ts` — `CATEGORIES` and `QUANTITY_UNITS` arrays (display translated, values unchanged)
- `src/lib/db.ts` — `MedicineForm` const object (display translated, values unchanged); predefined location seeds
- `src/stores/uiStore.ts` — Zustand v5 curried pattern; language state does NOT go here
- `src/components/BottomTabBar.tsx` — language toggle added here
- `src/App.tsx` — `LanguageProvider` wraps the router here

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/stores/uiStore.ts`: Zustand v5 `create<T>()((set) => ...)` pattern — apply same curried syntax if any language-adjacent store is ever needed, but language lives in React Context per D-02.
- `src/lib/utils.ts`: Existing utility module — natural home for the `formatDate()` helper.
- `src/components/ui/`: shadcn/ui primitives available for any toggle/button UI in BottomTabBar.

### Established Patterns
- **No default exports** from components or lib modules (except `App.tsx` and route files). Translation module and `LanguageProvider` must use named exports.
- **TypeScript strict mode** — `no any`. Translation dict types must be fully typed; key lookups must be type-safe.
- **Zustand v5 curried syntax** — `create<T>()((set) => ...)` — applies if any store is touched.
- **All dates as `YYYY-MM-DD` strings** in DB — `formatDate()` receives these strings directly, no `Date` object parsing needed.
- **`location: null` means "Other"** — translate null as `t('locations.other')` in Polish mode.

### Integration Points
- `LanguageProvider` wraps the `createHashRouter` output in `App.tsx` — every screen gets language context.
- `StatusBadge` component renders statuses — currently uses `STATUS_LABELS[status]`; must switch to `t('status.[key]')`.
- `FilterBottomSheet.tsx` and `MedicineCard.tsx`/`MedicineCardAggregate.tsx` render categories, locations, and statuses — all display-layer translation points.
- `CatalogFields.tsx` and `MedicineForm.tsx` render `CATEGORIES.map()` and form type options — display names translated via `t()`.

</code_context>

<specifics>
## Specific Ideas

- Flag emoji for the language toggle: 🇬🇧 (English active), 🇵🇱 (Polish active). Tapping switches; no text label needed alongside the flag.
- `formatDate` should be a pure function: `(dateString: string, lang: 'en' | 'pl') => string`. EN path: return `dateString` unchanged. PL path: `const [y, m, d] = dateString.split('-'); return \`${d}.${m}.${y}\``.
- The `TranslationDict` TypeScript type should be defined once and both `en` and `pl` objects must satisfy it — this gives compile-time guarantee that no key is missing in either language.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 7-i18n-polish-language*
*Context gathered: 2026-08-31*
