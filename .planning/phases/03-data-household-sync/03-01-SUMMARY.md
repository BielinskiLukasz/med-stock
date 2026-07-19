---
phase: 03-data-household-sync
plan: "01"
subsystem: data-nav
tags: [navigation, routing, toast, pwa, scaffold]
status: complete

dependency_graph:
  requires: []
  provides:
    - Data tab in BottomTabBar (5th tab)
    - /data route registered in App.tsx
    - DataScreen with 3-section scaffold
    - SyncInstructions (complete, static)
    - Toaster infrastructure (sonner) in RootLayout
    - ExportSection stub (replaced by 03-02)
    - ImportJSONSection stub (replaced by 03-02)
    - ImportCSVSection stub (replaced by 03-03)
  affects:
    - src/components/BottomTabBar.tsx
    - src/App.tsx
    - src/routes/RootLayout.tsx

tech_stack:
  added:
    - sonner@^2.0.7 (toast notifications, shadcn ecosystem)
    - papaparse@^5.5.4 (CSV parsing, CLAUDE.md recommended)
    - "@types/papaparse@^5.5.2" (TypeScript types for papaparse)
  patterns:
    - Thin shadcn-style wrapper for Toaster (position=bottom-center, richColors)
    - Toaster mounted as sibling of BottomTabBar in RootLayout (portal positioning)
    - HashRouter child route pattern (matches existing App.tsx entries)
    - Section card layout (border + rounded-lg + p-4) with h3 headers owned by DataScreen

key_files:
  created:
    - src/components/ui/sonner.tsx
    - src/routes/data/index.tsx
    - src/components/SyncInstructions.tsx
    - src/components/ExportSection.tsx
    - src/components/ImportJSONSection.tsx
    - src/components/ImportCSVSection.tsx
  modified:
    - package.json (sonner + papaparse + @types/papaparse added)
    - package-lock.json
    - src/routes/RootLayout.tsx (Toaster import + render)
    - src/components/BottomTabBar.tsx (5th Data tab + D-42 comment)
    - src/App.tsx (DataScreen import + /data route)
    - .gitignore (scoped data/ to root-level; added !src/routes/data/ exception)

decisions:
  - "D-42 implemented: 5 tabs Medicines|Dashboard|Trash|Locations|Data (no tab removed)"
  - "D-43 implemented: DataScreen is single scrollable screen with 3 section cards"
  - "D-44 implemented: SyncInstructions is static text-only (4 steps + Note, no buttons)"
  - "Sonner Toaster position=bottom-center (mobile-friendly, above tab bar)"

metrics:
  duration_minutes: 18
  completed_date: "2026-07-13"
  tasks_completed: 2
  files_changed: 10

requirements_addressed:
  - DATA-04
---

# Phase 03 Plan 01: Data Tab & Navigation Scaffold Summary

**One-liner:** Data tab + /data route with 3-section DataScreen scaffold; sonner toast infrastructure and SyncInstructions copy fully delivered.

## What Was Built

Phase 3 navigational foundation: installed the two npm dependencies (sonner + papaparse), wired the Toaster into RootLayout, added the 5th "Data" tab to BottomTabBar, registered the `/data` route in App.tsx, scaffolded the DataScreen with three section cards (Export backup / Import backup / Sync with household), delivered the complete static SyncInstructions component, and created stub section components for Plans 03-02 and 03-03 to replace.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install dependencies and configure sonner toast | 4e82d42 | package.json, package-lock.json, src/components/ui/sonner.tsx, src/routes/RootLayout.tsx |
| 2 | Add Data tab to navigation and scaffold DataScreen | ea0df60 | .gitignore, src/App.tsx, src/components/BottomTabBar.tsx, src/routes/data/index.tsx, src/components/SyncInstructions.tsx, src/components/ExportSection.tsx, src/components/ImportJSONSection.tsx, src/components/ImportCSVSection.tsx |

## Decisions Made

- **D-42 (BottomTabBar):** 5th tab "Data" added after Locations. All 4 existing tabs preserved. Tab bar comment updated from D-39 to D-42.
- **D-43 (DataScreen layout):** Single scrollable container with 3 section cards (border/rounded-lg/p-4). Each section has h3 header owned by DataScreen (not by section components). pb-20 prevents tab bar overlap.
- **D-44 (SyncInstructions):** Static text-only. 4 numbered paragraphs + Note paragraph. Exact copy from UI-SPEC §Sync with Household Section. No buttons, no state.
- **Toaster positioning:** Mounted as sibling of BottomTabBar (after it) in RootLayout, not inside main. This ensures portal z-index works correctly across all routes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] .gitignore `data/` pattern blocked src/routes/data/ from git**
- **Found during:** Task 2 git add
- **Issue:** `.gitignore` had `data/` which matches any `data/` directory including `src/routes/data/`. This prevented `src/routes/data/index.tsx` from being staged.
- **Fix:** Changed `data/` to `/data/` (root-level only) and added `!src/routes/data/` exception.
- **Files modified:** `.gitignore`
- **Commit:** ea0df60

## Known Stubs

The following stubs exist intentionally per the plan design — Plans 03-02 and 03-03 will replace them completely:

| Stub | File | Line | Reason |
|------|------|------|--------|
| "Export functionality will be available soon." | src/components/ExportSection.tsx | 3 | Placeholder — replaced by Plan 03-02 |
| "JSON import will be available soon." | src/components/ImportJSONSection.tsx | 3 | Placeholder — replaced by Plan 03-02 |
| "CSV import will be available soon." | src/components/ImportCSVSection.tsx | 3 | Placeholder — replaced by Plan 03-03 |

These stubs do not prevent the plan goal (navigational scaffold) from being achieved. The Data tab is navigable, the DataScreen renders its 3-section structure, and SyncInstructions is fully delivered.

## Self-Check: PASSED

- src/components/ui/sonner.tsx: FOUND
- src/routes/data/index.tsx: FOUND
- src/components/SyncInstructions.tsx: FOUND
- src/components/ExportSection.tsx: FOUND
- src/components/ImportJSONSection.tsx: FOUND
- src/components/ImportCSVSection.tsx: FOUND
- Commit 4e82d42: FOUND
- Commit ea0df60: FOUND
- npm run build: PASSED (exit 0)
- npm test: PASSED (56/56 tests)
