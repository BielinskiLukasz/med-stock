---
phase: 01-pwa-foundation-inventory-crud
plan: GAP-01
subsystem: app-shell
tags: [gap-closure, css, pwa, documentation]
status: complete
completed_date: "2026-07-04"
duration: 10 minutes

requires: [01-04]
provides: []
affects: [src/App.tsx, src/index.css, src/lib/db.ts]

tech_stack:
  patterns:
    - Module-scope side effect for single-run browser API calls (avoids StrictMode double-invoke)
    - Tailwind v4 @theme inline block for bridging v3 CSS variable naming convention

key_files:
  modified:
    - src/App.tsx
    - src/index.css
    - src/lib/db.ts

decisions:
  - navigator.storage.persist() moved to module scope — follows existing router pattern (line 12 comment)
  - @theme inline block placed between @import and @layer base — required by Tailwind v4 processing order
  - D-25 deviation documented inline in db.ts at both the field level and schema version level

metrics:
  duration: 10 minutes
  tasks_completed: 3
  files_modified: 3
---

# Phase 01 Plan GAP: Phase 1 Gap Closure Summary

**One-liner:** Closed three Phase 1 UAT gaps — StrictMode double-warning, transparent shadcn/ui surfaces, and D-25 soft-delete documentation.

## Gaps Closed

### Gap A — StrictMode double-warning (src/App.tsx)

**Root cause:** `navigator.storage.persist()` was inside a `useEffect([], [])` hook. React 18 StrictMode double-invokes effects in development, causing the persist warning to fire twice on cold start.

**Fix:** Moved the entire persist block (guard + `.then` + `.catch`) to module scope, immediately after the `createHashRouter` constant. This follows the existing pattern where the router is created outside the React tree (Pitfall 4 comment on line 12). Removed the now-unused `useEffect` import.

**Result:** `navigator.storage.persist()` fires exactly once per page load. Dev console shows the warning at most once on cold start.

**Commit:** e19e124

---

### Gap B — Transparent shadcn/ui floating surfaces (src/index.css)

**Root cause:** Tailwind v4 generates color utilities as `background-color: var(--color-popover)`, but the existing `index.css` only defined `--popover` (Tailwind v3 naming convention). With `--color-popover` undefined, the resolved value is transparent — affecting every shadcn/ui surface that uses color tokens: Select dropdowns, AlertDialog panels, Popover bubbles.

**Fix:** Inserted an `@theme inline` block between `@import "tailwindcss"` and the first `@layer base` rule. The block maps all 19 shadcn/ui color tokens to `--color-*` aliases using `hsl(var(--{token}))` wrappers.

Tokens mapped: background, foreground, card, card-foreground, popover, popover-foreground, primary, primary-foreground, secondary, secondary-foreground, muted, muted-foreground, accent, accent-foreground, destructive, destructive-foreground, border, input, ring.

The `--radius` token was intentionally excluded: shadcn/ui consumes it as a raw CSS var, not via Tailwind's color pipeline.

The existing `:root` and `.dark {}` blocks were not modified — they remain the source of truth for HSL values. The `@theme inline` block only creates aliases so dark mode continues to work at runtime.

**Result:** Select dropdown, AlertDialog, and Popover surfaces render with opaque backgrounds.

**Commit:** 7497ed4

---

### Gap C — D-25 soft-delete deviation undocumented (src/lib/db.ts)

**Root cause:** The Phase 1 specification described soft-delete as setting `manualStatus='Disposed'`. The implementation instead uses `deletedAt` (an ISO timestamp). This intentional deviation (D-25) was not fully documented in the source.

**Fix:** Expanded the `deletedAt` field comment in the `Medicine` interface to explicitly:
1. Reference D-25 as the design decision
2. Explain why `manualStatus='Disposed'` was rejected — `manualStatus` is a user-visible override field (D-13: values are 'Used Up' and 'Archived'); overloading it with 'Disposed' would corrupt the restore flow
3. State why `deletedAt` was the right choice — precise audit timestamp, clean separation of deletion lifecycle from user-driven status overrides

Also expanded the `db.version(2)` comment block with the same D-25 rationale so the context is visible at the schema definition level.

No TypeScript types, schema definitions, or runtime behavior were changed.

**Result:** `grep 'D-25' src/lib/db.ts` returns 3 matches; `grep 'D-13' src/lib/db.ts` returns 3 matches. Future readers can understand the intentional deviation without needing to trace back to planning docs.

**Commit:** 772657e

---

## Verification Results

| Check | Command | Result |
|-------|---------|--------|
| No useEffect in App.tsx | `grep -c 'useEffect' src/App.tsx` | 0 PASS |
| @theme inline present | `grep -c '@theme inline' src/index.css` | 1 PASS |
| D-25 in db.ts | `grep -c 'D-25' src/lib/db.ts` | 3 PASS |
| TypeScript | `npx tsc --noEmit` | exit 0 PASS |
| Build | `npm run build` | exit 0 PASS |

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `src/App.tsx` | Fix | Remove useEffect import; move persist() block to module scope |
| `src/index.css` | Fix | Add @theme inline block with 19 --color-* token mappings |
| `src/lib/db.ts` | Docs | Expand deletedAt and db.version(2) comments with D-25/D-13 rationale |

## Deviations from Plan

None — plan executed exactly as written. All three tasks were independent documentation/cosmetic fixes with no logic changes.

## Known Stubs

None.

## Threat Flags

None — changes are CSS-only (build time) and a browser API call with existing optional-chaining guard. No new network endpoints, auth paths, or data access patterns.

## Self-Check: PASSED

- [x] `src/App.tsx` exists with no useEffect import
- [x] `src/index.css` exists with @theme inline block (19 tokens)
- [x] `src/lib/db.ts` exists with D-25 documented in field and schema comments
- [x] Commits e19e124, 7497ed4, 772657e exist in git log
- [x] `npx tsc --noEmit` exits 0
- [x] `npm run build` exits 0
