---
phase: 07-i18n-polish-language
plan: 01
subsystem: ui
tags: [i18n, react-context, typescript, localStorage, tdd, vitest]

requires:
  - phase: 06-backup-restore
    provides: existing App.tsx RouterProvider, BottomTabBar.tsx nav patterns

provides:
  - Lang type (en | pl) and TranslationDict type with compile-time coverage
  - LanguageProvider React Context — wraps RouterProvider in App.tsx (D-02)
  - useLang() hook — returns lang, setLang, t()
  - t() lookup — returns key name itself on missing path, never blank
  - CATEGORY_KEYS, LOCATION_KEYS, FORM_TYPE_KEYS lookup Records
  - en.ts and pl.ts — complete EN/PL dictionaries (17 namespaces)
  - BottomTabBar flag-emoji toggle (D-09) — 5 translated tab labels
  - formatDate() pure utility — EN YYYY-MM-DD, PL DD.MM.YYYY (D-11)
  - localStorage persistence under 'medstock-lang' (D-10)

affects:
  - 07-02
  - 07-03
  - 07-04
  - 08-location-management

actuals:
  tokens: 8000
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - Custom React Context i18n (no react-i18next) — D-01
    - TranslationDict structural type guarantees compile-time key coverage across both languages
    - LanguageProvider in LanguageProvider.tsx (JSX) re-exported from index.ts (pure TS) to avoid .ts/.tsx JSX constraint
    - formatDate pure string-split — no Intl.DateTimeFormat to avoid timezone edge cases (D-11)
    - TDD RED/GREEN cycle for formatDate utility

key-files:
  created:
    - src/i18n/types.ts
    - src/i18n/en.ts
    - src/i18n/pl.ts
    - src/i18n/index.ts
    - src/i18n/LanguageProvider.tsx
    - src/lib/utils.test.ts
  modified:
    - src/App.tsx
    - src/components/BottomTabBar.tsx
    - src/lib/utils.ts

key-decisions:
  - "D-01 applied: custom React Context hook (no react-i18next) — TranslationDict type enforces both en/pl have identical key shapes at compile time"
  - "D-02 applied: LanguageProvider is outermost wrapper in App.tsx, outside RouterProvider"
  - "D-09 applied: flag emoji toggle (UK flag / Polish flag) as 6th element in BottomTabBar with min-h-[44px] touch target"
  - "D-10 applied: localStorage key medstock-lang, validates read value against Lang union, defaults to en"
  - "D-11 applied: formatDate uses string split not Intl.DateTimeFormat"
  - "Structural deviation: LanguageProvider component lives in LanguageProvider.tsx (JSX) not index.ts — TypeScript prohibits JSX in .ts files; index.ts re-exports LanguageProvider so public API is unchanged"

patterns-established:
  - "i18n pattern: import { useLang } from '@/i18n'; const { lang, t } = useLang() — all call sites follow this"
  - "Translation key pattern: t('namespace.key') — always two levels, never three"
  - "Lookup record pattern: CATEGORY_KEYS['Pain & Fever'] → 'categories.painFever' — for computed key lookups"
  - "formatDate pattern: formatDate(medicine.expiryDate, lang) — always pass lang from useLang()"

requirements-completed:
  - I18N-01
  - I18N-03

coverage:
  - id: D1
    description: "Language toggle in BottomTabBar switches all 5 tab labels between EN and PL without page reload"
    requirement: I18N-01
    verification: []
    human_judgment: true
    rationale: "Visual/interactive verification required — tab label switching and no-reload behavior cannot be asserted by unit test"
  - id: D2
    description: "Language persists in localStorage under key medstock-lang and is restored on next load"
    requirement: I18N-03
    verification: []
    human_judgment: true
    rationale: "Requires browser localStorage interaction — not exercised by Vitest unit tests"
  - id: D3
    description: "formatDate formats EN as YYYY-MM-DD, PL as DD.MM.YYYY, null as no-expiry label"
    requirement: I18N-01
    verification:
      - kind: unit
        ref: "src/lib/utils.test.ts#formatDate"
        status: pass
    human_judgment: false
  - id: D4
    description: "TypeScript build passes with zero errors — TranslationDict structural type validates en.ts and pl.ts"
    verification:
      - kind: other
        ref: "npm run build (exit 0)"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-08-31
status: complete
---

# Phase 7 Plan 01: i18n Foundation Summary

**Custom React Context i18n with TypeScript-typed EN/PL dictionaries, LanguageProvider, localStorage persistence, and flag-emoji toggle in BottomTabBar**

## Performance

- **Duration:** 13 min
- **Started:** 2026-08-31T22:18:50Z
- **Completed:** 2026-08-31T22:32:07Z
- **Tasks:** 2 (1 tracer + 1 TDD)
- **Files modified:** 9

## Accomplishments

- Created src/i18n/ module with TranslationDict type (17 namespaces), LanguageProvider (localStorage persistence, D-10), and useLang() hook with t() fallback
- Wired LanguageProvider as outermost wrapper in App.tsx; translated all 5 BottomTabBar tab labels; added flag-emoji toggle (D-09) with 44px touch target
- Implemented formatDate() in utils.ts via TDD (RED→GREEN) — 7 tests all passing, no Intl.DateTimeFormat (D-11)
- TypeScript build passes cleanly (exit 0); T-07-01 threat mitigated: localStorage value validated against Lang union before applying

## Task Commits

1. **Task 1 (tracer): i18n module** - `c43ca27` (feat)
2. **Task 1 (tracer): App.tsx + BottomTabBar** - `e54daea` (feat)
3. **Task 2 (TDD RED): failing tests** - `303a5ec` (test)
4. **Task 2 (TDD GREEN): formatDate impl** - `0d4902c` (feat)

## Files Created/Modified

- `src/i18n/types.ts` — Lang, TranslationDict, CATEGORY_KEYS, LOCATION_KEYS, FORM_TYPE_KEYS
- `src/i18n/en.ts` — complete English translation dictionary (17 namespaces)
- `src/i18n/pl.ts` — complete Polish translation dictionary (17 namespaces)
- `src/i18n/index.ts` — LangContext, useLang hook, re-exports from types.ts + LanguageProvider.tsx
- `src/i18n/LanguageProvider.tsx` — JSX provider component with localStorage read/write
- `src/App.tsx` — LanguageProvider wraps RouterProvider
- `src/components/BottomTabBar.tsx` — t() for 5 tab labels; flag-emoji toggle button
- `src/lib/utils.ts` — formatDate() named export added
- `src/lib/utils.test.ts` — 7 vitest cases for formatDate

## Decisions Made

- D-01, D-02, D-09, D-10, D-11 all applied as specified in CONTEXT.md
- T-07-01 threat mitigated: localStorage value validated against `['en', 'pl']` before use; falls back to 'en'
- LanguageProvider component placed in `.tsx` file (required for JSX); re-exported from `index.ts` so public API is `import { LanguageProvider } from '@/i18n'` unchanged

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] LanguageProvider.tsx extracted from index.ts**
- **Found during:** Task 1 (tracer — build step)
- **Issue:** TypeScript error TS1005 — JSX syntax not allowed in `.ts` files; plan specified `src/i18n/index.ts` as the single file containing LanguageProvider
- **Fix:** Extracted JSX LanguageProvider component to `src/i18n/LanguageProvider.tsx`; created `src/i18n/types.ts` for pure TypeScript types; `index.ts` re-exports all public symbols. Public API unchanged: `import { LanguageProvider, useLang, Lang, ... } from '@/i18n'` still resolves correctly
- **Files modified:** src/i18n/index.ts, src/i18n/LanguageProvider.tsx (new), src/i18n/types.ts (new)
- **Verification:** `npm run build` exits 0
- **Committed in:** c43ca27, e54daea (Task 1 commits)

---

**Total deviations:** 1 auto-fixed (Rule 3 — blocking TypeScript constraint)
**Impact on plan:** Structural only — additional files created but public module API is identical to plan specification. No scope change.

## Issues Encountered

None beyond the .ts/.tsx JSX constraint handled above.

## Next Phase Readiness

- Plans 07-02, 07-03, 07-04 can now `import { useLang, CATEGORY_KEYS, LOCATION_KEYS, FORM_TYPE_KEYS } from '@/i18n'`
- `formatDate(dateString, lang)` available from `@/lib/utils` for all date display sites
- LanguageProvider provides `t()` for all string translation call sites
- Phase 8 (Location Management) can use `LOCATION_KEYS` and `t()` for predefined location name display

---

*Phase: 07-i18n-polish-language*
*Completed: 2026-08-31*
