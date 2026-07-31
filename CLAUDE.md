# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**MedStock** — a privacy-first PWA for household medicine inventory. React 19 + TypeScript + Vite + Dexie.js (IndexedDB). No backend, no accounts, no cloud. All data lives locally; family sync is manual via shared OneDrive JSON export/import.

**Core value:** At a pharmacy, search a medicine name and instantly know: do I have it and is it still valid?

## Commands

```bash
npm run dev          # Vite dev server with HMR — http://localhost:5173/med-stock/
npm run build        # tsc -b && vite build — type-checks first, then bundles
npm run preview      # Serve the production build locally
npm run lint         # oxlint across all source files
npm test             # Vitest (watch mode)
npx vitest run       # Vitest single run (CI / no watch)
npx vitest run src/lib/expiry.test.ts   # Run one test file
```

Tests use `jsdom` + `fake-indexeddb` (configured in `vite.config.ts` / `setupTests.ts`). No real browser needed.

## Architecture

### Routing

`App.tsx` uses `createHashRouter` (hash-based — no server config needed for PWA). The router is created **at module scope**, not inside a component or `useState`. This is intentional: React 18 StrictMode double-invokes effects, and the `navigator.storage.persist()` call for iOS protection also lives at module scope for the same reason.

Five screens behind a bottom tab bar:

| Route | Screen |
|-------|--------|
| `/medicines` | Medicine list with search + filter/sort |
| `/medicines/new` | Add form |
| `/medicines/:id` | Detail view with change history |
| `/medicines/:id/edit` | Edit form |
| `/locations` | Location CRUD |
| `/dashboard` | Expiry alert cards |
| `/trash` | Soft-deleted medicines |
| `/data` | JSON export / JSON import / CSV import / Sync guide |

`RootLayout.tsx` wraps all screens with the bottom tab bar and `<Toaster />` (sonner).

### Data layer

**`src/lib/db.ts`** — Dexie schema + single `db` export. Four tables:
- `medicine_catalog` — one row per unique medicine (name, category, form, notes)
- `medicines` — one stock entry per physical package; references `catalogId`
- `locations` — predefined + user-created storage locations
- `history` — immutable change log (never deleted)

Schema is at version 4. Add new indexed fields only via `db.version(5)` — never modify earlier versions.

**`src/lib/expiry.ts`** — pure `calculateStatus(medicine, now?)` function. Returns `AutoStatus | ManualStatus`. Must be called **at render time** (inside `useMemo` or component body), never inside a `useLiveQuery` querier.

**`src/lib/historyOps.ts`** — all medicine mutations (update, soft-delete, restore, permanent-delete) go through this module so every change is recorded atomically in `db.history`. Always use these instead of calling `db.medicines` directly.

**`src/lib/stockOps.ts`** — high-level stock operations (`addStockEntry`, `editStockEntry`, `moveStock`). All mutations wrapped in `db.transaction()`.

**`src/lib/aggregation.ts`** — `computeCatalogAggregate()`: rolls up status and quantity across all stock entries for a catalog (nearest expiry wins for status; quantities summed).

**`src/lib/dataOps.ts`** — JSON export/import with Zod schema validation (`BackupSchema`).

**`src/lib/csvOps.ts`** — Papa Parse integration, column mapping logic.

**`src/lib/locationOps.ts`** — location CRUD helpers.

### State management

Zustand (`src/stores/uiStore.ts`) holds **only UI state**: filter chips, sort field/direction, sheet open flags. It does not hold medicine data — that comes from Dexie via `useLiveQuery`.

Data flow: `useLiveQuery` (reactive DB query) → raw array → `useMemo` (in-memory filter/sort/status) → render.

### Path alias

`@/` resolves to `src/`. Use it for all imports.

## Critical invariants

**Catalog/stock separation.** `medicine_catalog` holds the medicine identity (name, category, form); `medicines` holds stock entries that reference `catalogId`. Never store a medicine name directly on a stock entry — always go through the catalog. Renaming a catalog entry updates the display name for all associated stock entries automatically.

**`null` is not a valid IndexedDB key.** Never query `where('deletedAt').equals(null)`. Use `.toCollection().filter(m => m.deletedAt === null)` for active records.

**`location: null` means "Other".** Never store the string `'Other'` in `Medicine.location`. Store `null` instead and display "Other" in the UI.

**`manualStatus` takes precedence over auto-calculated status.** `calculateStatus()` checks `manualStatus !== null` first and returns it immediately.

**History entries are never deleted.** `medicineName` is denormalized on write so history remains readable after a permanent delete.

**Zustand v5 curried syntax.** Use `create<T>()((set) => ...)` not `create<T>((set) => ...)`. For array selectors, wrap with `useShallow`: `useUIStore(useShallow(s => s.selectedCategories))`.

**All dates as `YYYY-MM-DD` strings.** Avoids timezone bugs. Never store `Date` objects in IndexedDB.

## Conventions

- Named exports everywhere — no default exports from components or lib modules (except `App.tsx` and route files that React Router requires).
- `sonner` for toast notifications — `toast.success()` / `toast.error()` from `'sonner'`.
- shadcn/ui primitives live in `src/components/ui/` — extend them there if needed.
- TypeScript strict mode is on. No `any`.

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
