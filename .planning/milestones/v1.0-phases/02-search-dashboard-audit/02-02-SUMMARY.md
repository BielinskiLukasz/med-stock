---
plan: 02-02
phase: 02-search-dashboard-audit
status: complete
completed: 2026-07-01
subsystem: search-filter-ui
tags: [search, filter, zustand, shadcn-sheet, tdd, two-step-query]
requires: [02-01]
provides: [SearchBar, FilterBottomSheet, FilterChips, uiStore-filter-state, 4-tab-nav, dashboard-stub, trash-stub]
affects: [plans 02-03, 02-04]
tech-stack-added: []
tech-stack-patterns: [zustand-useShallow-v5, two-step-useLiveQuery-useMemo, toCollection-filter-null-guard]
key-files-created:
  - src/stores/uiStore.ts (extended — filter/sort state added)
  - src/components/ui/sheet.tsx (manual shadcn sheet via @radix-ui/react-dialog)
  - src/components/SearchBar.tsx
  - src/components/FilterBottomSheet.tsx
  - src/components/FilterChips.tsx
  - src/routes/dashboard/index.tsx (stub)
  - src/routes/trash/index.tsx (stub)
  - src/stores/uiStore.test.ts
  - src/routes/medicines/medicines-list.test.ts
key-files-modified:
  - src/routes/medicines/index.tsx (two-step query + search + filter UI)
  - src/components/BottomTabBar.tsx (2 -> 4 tabs)
  - src/App.tsx (dashboard + trash routes added)
decisions:
  - "Zustand v5 uses useShallow(selector) wrapper, not useStore(selector, shallow) — second-arg pattern removed"
  - "shadcn CLI placed sheet.tsx in wrong @/components/ui/ directory using @base-ui/react; created manually via @radix-ui/react-dialog"
  - "toCollection().filter() used for active records — not where('deletedAt').equals(null) (null key pitfall)"
  - "calculateStatus in useMemo post-filter, not inside useLiveQuery querier (time-based correctness)"
duration: ~29min
---

# Phase 02 Plan 02: Search + Filter/Sort UI Summary

## One-Liner

Complete search and filter vertical slice: Zustand uiStore extended with filter/sort state, shadcn Sheet installed manually, SearchBar/FilterBottomSheet/FilterChips created, Medicines screen updated to two-step query+memo pattern, 4-tab navigation, and App.tsx wired with Dashboard/Trash stubs.

## What Was Built

- **`src/stores/uiStore.ts`** extended: `selectedCategories`, `selectedLocations`, `selectedStatuses` arrays; `sortField`/`sortDirection`; `filterSheetOpen`; toggle/setSort/clearAllFilters/setFilterSheetOpen actions. `useActiveFilterCount` derived selector. `useShallow` re-exported for array consumers.
- **`src/components/ui/sheet.tsx`** created manually using `@radix-ui/react-dialog` (shadcn CLI placed files in wrong directory and used unavailable `@base-ui/react` dependency — see Deviations). Exports Sheet, SheetContent (with side prop), SheetHeader, SheetTitle, SheetFooter, SheetOverlay, SheetPortal, SheetTrigger, SheetClose, SheetDescription.
- **`src/components/SearchBar.tsx`**: controlled Input with `placeholder="Search medicines by name…"`, clear button (`aria-label="Clear search"`) visible only when value non-empty.
- **`src/components/FilterBottomSheet.tsx`**: shadcn Sheet with `side="bottom"`, 6 statuses, 10 categories, live locations from Dexie, sort field/direction controls, "Clear all filters" button. Uses `useShallow` for array subscriptions.
- **`src/components/FilterChips.tsx`**: dismissible chips for active filters, returns null when no filters active. OR logic within each dimension handled by toggle actions in uiStore.
- **`src/routes/medicines/index.tsx`** rewritten: two-step query+memo pattern. `useLiveQuery` with `toCollection().filter(deletedAt===null)` + name substring search. `useMemo` post-filter with `calculateStatus` for status/category/location. SearchBar, FilterChips, FilterBottomSheet integrated. Filter badge on SlidersHorizontal icon.
- **`src/components/BottomTabBar.tsx`**: 2 tabs → 4 tabs: Medicines | Dashboard | Trash | Locations (D-39).
- **`src/App.tsx`**: `/dashboard` and `/trash` routes added as children of RootLayout (D-40).
- **`src/routes/dashboard/index.tsx`**: stub component (replaced by Plan 02-03).
- **`src/routes/trash/index.tsx`**: stub component (replaced by Plan 02-04).
- **Tests**: `src/stores/uiStore.test.ts` (8 tests), `src/routes/medicines/medicines-list.test.ts` (4 tests). All 56 tests pass.

## Key Decisions

1. **Zustand v5 `useShallow` pattern**: The plan specified `useUIStore(s => s.arr, shallow)` (Zustand v4 API). In Zustand v5 the hook signature is `<U>(selector: (state: T) => U): U` — no second argument. The correct v5 pattern is `useUIStore(useShallow(s => s.arr))`. Used throughout FilterBottomSheet, FilterChips, and MedicineList.
2. **Manual sheet.tsx creation**: The `npx shadcn@latest add sheet` CLI placed `sheet.tsx` in `@/components/ui/` (a literal directory named `@`) and used `@base-ui/react/dialog` which is not installed. Created `src/components/ui/sheet.tsx` manually using `@radix-ui/react-dialog` (already installed as a transitive dep), following the same pattern as `alert-dialog.tsx`.
3. **Two-step query+memo**: `useLiveQuery` handles IndexedDB reactivity (deps: `[searchQuery]`); `useMemo` handles Zustand filter state changes (deps: `[medicines, selectedStatuses, selectedCategories, selectedLocations, sortField, sortDirection]`). This avoids triggering a Dexie re-read on every filter click.
4. **`toCollection().filter()` for null deletedAt**: Per D-41 amendment and Pitfall 1 — null is not a valid IndexedDB key, so `where('deletedAt').equals(null)` silently fails. Active records use `toCollection().filter(m => m.deletedAt === null)`.
5. **`calculateStatus` in `useMemo`, not in `useLiveQuery`**: Per Pitfall 3 — `useLiveQuery` querier only re-runs on DB changes, not on timer ticks. Status filters require `calculateStatus(m, now)` at render time so midnight expirations update correctly.

## TDD Gate Compliance

- **Task 1 RED commit**: `5b57a2f` — `test(02-02): RED — uiStore filter state + SearchBar + FilterChips tests` (fails — modules not found)
- **Task 1 GREEN commit**: `eced8b7` — `feat(02-02): GREEN — uiStore filter/sort state, sheet.tsx, SearchBar, FilterBottomSheet, FilterChips` (all tests pass)
- **Task 2 RED commit**: `1785b97` — `test(02-02): RED — MedicineList two-step query + dashboard/trash stub route tests` (fails — modules not found)
- **Task 2 GREEN commit**: `786f2ae` — `feat(02-02): GREEN — Medicines screen two-step query+memo, 4-tab nav, dashboard/trash routes` (all tests pass)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zustand v5 useShallow API — shallow not accepted as second selector argument**
- **Found during:** Task 1 GREEN — TypeScript build errors `Expected 0-1 arguments, but got 2` and `is of type 'unknown'`
- **Issue:** The plan specified `useUIStore(s => s.selectedCategories, shallow)` which was the Zustand v4 API. Zustand v5 removed the second equality function argument from the hook signature.
- **Fix:** Changed all array subscriptions to use `useUIStore(useShallow(s => s.selectedCategories))` pattern. Updated `uiStore.ts` to re-export `useShallow` alongside `shallow`.
- **Files modified:** `src/stores/uiStore.ts`, `src/components/FilterBottomSheet.tsx`, `src/components/FilterChips.tsx`, `src/routes/medicines/index.tsx`
- **Commit:** `eced8b7`

**2. [Rule 3 - Blocking] shadcn CLI created sheet.tsx in wrong location with unavailable dependency**
- **Found during:** Task 1 — `npx shadcn@latest add sheet` created `@/components/ui/sheet.tsx` (literal `@` directory) using `@base-ui/react/dialog` instead of `@radix-ui/react-dialog`
- **Issue:** The shadcn CLI used a different registry format that resolves `@` as a literal directory name instead of the project alias, and referenced `@base-ui/react` which is not installed.
- **Fix:** Created `src/components/ui/sheet.tsx` manually modeled after `alert-dialog.tsx`, using `@radix-ui/react-dialog` (already installed). The wrong `@/` directory was left as untracked (not committed) and will be cleaned up outside this plan.
- **Files modified:** Created `src/components/ui/sheet.tsx`
- **Commit:** `eced8b7`

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `DashboardScreen` | `src/routes/dashboard/index.tsx` | Plan 02-03 builds the real Dashboard screen. Stub wires the route in App.tsx so navigation works. |
| `TrashScreen` | `src/routes/trash/index.tsx` | Plan 02-04 builds the real Trash screen. Stub wires the route in App.tsx so navigation works. |

Both stubs are intentional and documented in the plan. They do not prevent this plan's goal (search and filter on the Medicines screen).

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. All data remains local IndexedDB only.

- `SearchBar` searchQuery is passed only to `.toLowerCase().includes()` — no DOM injection surface (T-02-03: accept).
- Filter status options are hardcoded in `FilterBottomSheet` — user cannot inject custom statuses (T-02-04: accept).
- `sheet.tsx` was created from trusted `@radix-ui/react-dialog` (already installed) rather than the CLI-generated `@base-ui/react` variant — T-02-SC mitigation applied.

## Self-Check

- [x] `npm run build` exits 0
- [x] `npm run test -- --run` exits 0, 56 tests pass (44 prior Phase 1+02-01 + 12 new 02-02 tests)
- [x] `src/stores/uiStore.ts` exports `useUIStore`, `useActiveFilterCount`, `useShallow`, `shallow`, `SortField`, `SortDirection`
- [x] `src/stores/uiStore.ts` contains `selectedCategories: []`, `selectedLocations: []`, `selectedStatuses: []`
- [x] `src/stores/uiStore.ts` contains `clearAllFilters` action
- [x] `src/components/ui/sheet.tsx` exists and exports `SheetContent`
- [x] `src/components/SearchBar.tsx` exports `SearchBar`
- [x] `src/components/FilterBottomSheet.tsx` exports `FilterBottomSheet` and uses `side="bottom"`
- [x] `src/components/FilterChips.tsx` exports `FilterChips` and returns null when no filters active
- [x] `src/routes/medicines/index.tsx` uses `toCollection()` + `.filter(` for active records query
- [x] `src/routes/medicines/index.tsx` contains `useMemo` with `calculateStatus` for post-filter
- [x] `src/routes/medicines/index.tsx` does NOT contain `where('manualStatus').notEqual`
- [x] `src/components/BottomTabBar.tsx` contains NavLink `to="/dashboard"` and `to="/trash"`
- [x] `src/App.tsx` contains `path: 'dashboard'` and `path: 'trash'` route entries
- [x] `src/routes/dashboard/index.tsx` exists (stub)
- [x] `src/routes/trash/index.tsx` exists (stub)
- [x] TDD: 2 RED commits + 2 GREEN commits (Tasks 1 and 2)
- [x] All commits verified: 5b57a2f, eced8b7, 1785b97, 786f2ae

## Self-Check: PASSED
