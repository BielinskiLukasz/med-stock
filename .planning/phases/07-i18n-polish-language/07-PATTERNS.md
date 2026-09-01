# Phase 7: i18n / Polish Language - Pattern Map

**Mapped:** 2026-08-31
**Files analyzed:** 7 new/modified files
**Analogs found:** 6 / 7

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/i18n/index.ts` | provider/context | event-driven | `src/stores/uiStore.ts` | role-match (state + typed dict) |
| `src/i18n/en.ts` | config | transform | `src/stores/uiStore.ts` (initial state shape) | partial |
| `src/i18n/pl.ts` | config | transform | `src/i18n/en.ts` (sibling) | exact (same shape) |
| `src/lib/utils.ts` | utility | transform | itself (existing file, add `formatDate`) | exact |
| `src/components/BottomTabBar.tsx` | component | event-driven | itself (modify existing) | exact |
| `src/components/StatusBadge.tsx` | component | request-response | itself (modify existing) | exact |
| `src/lib/expiry.ts` | utility | transform | itself (modify existing — remove `STATUS_LABELS`) | exact |

---

## Pattern Assignments

### `src/i18n/index.ts` (provider + hook, event-driven)

**Analog:** `src/stores/uiStore.ts` (for TypeScript strict typing) + React Context pattern

**Named export requirement** (from CLAUDE.md + uiStore.ts line 1):
```typescript
// Named exports only — no default export
export type Lang = 'en' | 'pl'
export type TranslationDict = { ... }
export const LanguageProvider = ...
export function useLang() { ... }
```

**localStorage persistence pattern** — no existing analog, use plain API:
```typescript
const STORAGE_KEY = 'medstock-lang'
const saved = localStorage.getItem(STORAGE_KEY) as Lang | null
// On change:
localStorage.setItem(STORAGE_KEY, newLang)
```

**React Context shape** (mirrors uiStore.ts state + setter pattern, lines 8-27):
```typescript
interface LangContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}
```

**Provider wraps router** — analog: `App.tsx` lines 45-47 (RouterProvider is the single child):
```typescript
export default function App() {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  )
}
```

**TypeScript strict: no `any`** — key lookup must use typed path or a safe getter:
```typescript
// t() must return string and never throw; missing key falls back to key name
function t(key: string): string {
  // walk nested dict; return key if path not found (visible, not silent)
  ...
}
```

---

### `src/i18n/en.ts` and `src/i18n/pl.ts` (config, transform)

**Shape** — flat by namespace per D-03; both must satisfy `TranslationDict`:
```typescript
export const en: TranslationDict = {
  medicines: { title: 'Medicines', search: '...', empty: '...' },
  dashboard: { title: 'Dashboard' },
  status: {
    active: 'Active', opened: 'Opened', expired: 'Expired',
    exceededOpenPeriod: 'Exceeded Open Period',
    usedUp: 'Used Up', disposed: 'Disposed', archived: 'Archived',
  },
  categories: { painFever: 'Pain/Fever', vitamins: 'Vitamins', ... },
  locations: { bathroomCabinet: 'Bathroom Cabinet', other: 'Other', ... },
  units: { tablets: 'tablets', days: 'days', ... },
  dates: { noExpiry: 'No expiry' },
}
```

**Named export, no default** (CLAUDE.md convention):
```typescript
export const en: TranslationDict = { ... }
// NOT: export default { ... }
```

---

### `src/lib/utils.ts` — add `formatDate` (utility, transform)

**Analog:** existing `src/lib/utils.ts` (lines 1-6) — pure function, named export

**Existing file pattern** (full file, lines 1-6):
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**New function to add** — pure, no imports needed, follows same named-export style:
```typescript
export function formatDate(dateString: string | null | undefined, lang: 'en' | 'pl'): string {
  if (!dateString) return lang === 'pl' ? 'Bez daty ważności' : 'No expiry'
  if (lang === 'pl') {
    const [y, m, d] = dateString.split('-')
    return `${d}.${m}.${y}`
  }
  return dateString
}
```

Note: per UI-SPEC, `formatDate(null, lang)` must return `t('dates.noExpiry')`. Since `utils.ts` cannot import the lang context, the planner should either (a) pass the translated fallback string as a parameter, or (b) have callers handle null before calling `formatDate`. Planner must decide.

---

### `src/components/BottomTabBar.tsx` — add language toggle (component, event-driven)

**Analog:** `src/components/BottomTabBar.tsx` itself — modify existing file

**Existing NavLink tab pattern** (lines 8-20) — language toggle button copies same flex+text-xs styling but uses `<button>` instead of `<NavLink>`:
```typescript
// Existing tab pattern to replicate for the toggle button:
className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors text-gray-500 hover:text-gray-700"
```

**Toggle button structure** to add after last `<NavLink>` (before closing `</nav>`):
```typescript
<button
  onClick={() => setLang(lang === 'en' ? 'pl' : 'en')}
  aria-label={lang === 'en' ? 'Switch to Polish' : 'Switch to English'}
  className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px]"
>
  <span>{lang === 'en' ? '🇬🇧' : '🇵🇱'}</span>
</button>
```

**Hook import** — use `useLang()` from `@/i18n`:
```typescript
import { useLang } from '@/i18n'
// Inside component:
const { lang, setLang } = useLang()
```

---

### `src/components/StatusBadge.tsx` — replace `STATUS_LABELS` lookup (component, request-response)

**Analog:** `src/components/StatusBadge.tsx` itself (lines 1-26)

**Current pattern to replace** (lines 1-2, 24):
```typescript
import { STATUS_LABELS } from '@/lib/expiry'
// ...
{STATUS_LABELS[status]}
```

**New pattern** — import hook, call `t()`:
```typescript
import { useLang } from '@/i18n'
// Inside component:
const { t } = useLang()
// status key mapping (canonical → translation key):
const statusKey: Record<MedicineStatus, string> = {
  Active: 'status.active',
  Opened: 'status.opened',
  Expired: 'status.expired',
  ExceededOpenPeriod: 'status.exceededOpenPeriod',
  UsedUp: 'status.usedUp',
  Disposed: 'status.disposed',
  Archived: 'status.archived',
}
// Render:
{t(statusKey[status])}
```

---

### `src/lib/expiry.ts` — remove `STATUS_LABELS` (utility, transform)

**Modification:** Delete `STATUS_LABELS` const (lines 13-21). Keep all types and `calculateStatus()` unchanged.

**Lines to remove:**
```typescript
/** Human-readable display labels for each status */
export const STATUS_LABELS: Record<MedicineStatus, string> = {
  Active: 'Active',
  Opened: 'Opened',
  Expired: 'Expired',
  ExceededOpenPeriod: 'Exceeded Open Period',
  UsedUp: 'Used Up',
  Disposed: 'Disposed',
  Archived: 'Archived',
}
```

**All `STATUS_LABELS` import sites** must be found and updated (4 files use StatusBadge; check if any import `STATUS_LABELS` directly):
- `src/components/StatusBadge.tsx` — direct import (confirmed, line 2)
- Any other file importing `STATUS_LABELS` from `@/lib/expiry` must switch to `t()` calls

---

## Shared Patterns

### Named Exports
**Source:** `src/components/StatusBadge.tsx` line 15, `src/lib/expiry.ts` line 57, `src/stores/uiStore.ts` line 30
**Apply to:** All new files in `src/i18n/`
```typescript
// Always:
export function useLang() { ... }
export const LanguageProvider = ...
export const en: TranslationDict = { ... }
// Never:
export default function ...
```

### TypeScript Strict — No `any`
**Source:** CLAUDE.md — enforced project-wide
**Apply to:** `TranslationDict` type, `t()` function, `Lang` type
```typescript
export type Lang = 'en' | 'pl'
export type TranslationDict = { /* fully typed nested structure */ }
// t() return type must be string, never any
```

### Zustand v5 Curried Syntax (reference only — language does NOT go in Zustand)
**Source:** `src/stores/uiStore.ts` line 30
```typescript
export const useUIStore = create<UIState>()((set) => ({ ... }))
// Language state uses React Context (D-02), not Zustand
```

### `@/` Path Alias
**Source:** All existing imports (e.g., `BottomTabBar.tsx` line 2: `import { cn } from '@/lib/utils'`)
**Apply to:** All new files
```typescript
import { useLang } from '@/i18n'
import { formatDate } from '@/lib/utils'
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/i18n/en.ts` | config | transform | No existing typed translation dict in codebase — use `TranslationDict` type from `src/i18n/index.ts` as the sole contract |

---

## Metadata

**Analog search scope:** `src/components/`, `src/lib/`, `src/stores/`, `src/App.tsx`
**Files scanned:** 7
**Pattern extraction date:** 2026-08-31
