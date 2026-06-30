---
phase: 01-pwa-foundation-inventory-crud
plan: "01"
subsystem: database, ui, routing
tags: [dexie, react-router, zustand, react-hook-form, zod, tailwindcss, shadcn-ui, pwa, indexeddb]

# Dependency graph
requires: []
provides:
  - Dexie MedStockDB singleton with Medicine + Location schema v1 and predefined location seed data
  - createHashRouter at module scope with all 6 routes wired
  - MedicineList via useLiveQuery with Disposed filter and empty state
  - Minimal add-medicine form (name + expiryDate) writing to Dexie IndexedDB
  - BottomTabBar navigation with Medicines and Locations tabs
  - StatusBadge, MedicineCard, RootLayout components
  - Zustand v5 UIState store
  - CATEGORIES and QUANTITY_UNITS constants
  - navigator.storage.persist() called once on first launch (PWA-02)
affects: [02-expiry-calculation, 03-medicine-crud, 04-location-management]

# Tech tracking
tech-stack:
  added:
    - dexie 4.4.4 — IndexedDB ORM with EntityTable generics
    - dexie-react-hooks — useLiveQuery for live React rendering from IndexedDB
    - react-router-dom 7.x — createHashRouter + RouterProvider + NavLink
    - zustand 5.0.14 — curried create<T>()() store pattern
    - react-hook-form 7.80 — controlled form with zodResolver
    - zod 4.4.3 — schema validation via z.string().min()
    - "@hookform/resolvers/zod" — bridge between RHF and Zod
  patterns:
    - "Dexie singleton cast with EntityTable<T, 'id'> for type safety"
    - "createHashRouter at module scope (outside component) to prevent state reset on render"
    - "useLiveQuery with undefined guard for loading state"
    - "manualStatus null sentinel for active medicines, 'Disposed' for soft-delete"
    - "location null sentinel — medicine.location ?? 'Other' in display; never store string 'Other' in medicine records"
    - "navigator.storage.persist() in useEffect with empty deps — called exactly once"
    - "Try/catch on all Dexie writes; never expose raw Dexie errors to UI (ASVS V7)"

key-files:
  created:
    - src/lib/db.ts
    - src/types/medicine.ts
    - src/stores/uiStore.ts
    - src/routes/RootLayout.tsx
    - src/components/BottomTabBar.tsx
    - src/components/StatusBadge.tsx
    - src/components/MedicineCard.tsx
    - src/routes/medicines/index.tsx
    - src/routes/medicines/new.tsx
    - src/routes/locations/index.tsx
  modified:
    - src/App.tsx

key-decisions:
  - "MedicineStatus defined locally in types/medicine.ts and StatusBadge.tsx — expiry.ts does not exist yet (Plan 02 creates it); avoids build failure without runtime circular dependency"
  - "locations seeded alphabetically in db.on('populate') matching D-19 display order requirement"
  - "status prop on MedicineCard uses string type for skeleton; Plan 03 will cast to MedicineStatus after calculateStatus is wired"

patterns-established:
  - "Dexie EntityTable generics pattern: const db = new Dexie('MedStockDB') as Dexie & { medicines: EntityTable<Medicine, 'id'> }"
  - "Zustand v5 curried form: create<UIState>()((set) => ({...}))"
  - "HashRouter module-scope: const router = createHashRouter([...]) before export default function App()"
  - "useLiveQuery undefined guard: if (medicines === undefined) return <div>Loading...</div>"
  - "Null sentinel for location: medicine.location ?? 'Other'"

requirements-completed: [PWA-01, PWA-02, PWA-03, PWA-04, INV-01]

coverage:
  - id: D1
    description: "Dexie MedStockDB schema v1 with medicines + locations tables, Medicine and Location interfaces, 8 predefined location seeds"
    requirement: INV-01
    verification:
      - kind: manual_procedural
        ref: "npm run build — zero TypeScript errors; db.ts exports db singleton typed as Dexie & { medicines: EntityTable, locations: EntityTable }"
        status: pass
    human_judgment: false
  - id: D2
    description: "createHashRouter at module scope in App.tsx; all 6 routes wired (/, /medicines, /medicines/new, /medicines/:id, /medicines/:id/edit, /locations)"
    requirement: PWA-01
    verification:
      - kind: manual_procedural
        ref: "npm run build — tsc reports zero errors; grep 'createHashRouter' src/App.tsx returns match before export default"
        status: pass
    human_judgment: false
  - id: D3
    description: "MedicineList via useLiveQuery filtering Disposed items; empty state renders 'No medicines yet. Add your first one.' with Add button"
    requirement: INV-01
    verification:
      - kind: manual_procedural
        ref: "npm run build succeeds; src/routes/medicines/index.tsx contains useLiveQuery and db.medicines.where('manualStatus').notEqual('Disposed')"
        status: pass
    human_judgment: false
  - id: D4
    description: "Minimal add-medicine form (name + expiryDate) writing to Dexie IndexedDB on submit"
    requirement: INV-01
    verification:
      - kind: manual_procedural
        ref: "npm run build succeeds; src/routes/medicines/new.tsx contains db.medicines.add and zodResolver"
        status: pass
    human_judgment: false
  - id: D5
    description: "PWA installability — navigator.storage.persist() called once in useEffect with empty deps; service worker generated by vite-plugin-pwa"
    requirement: PWA-02
    verification:
      - kind: manual_procedural
        ref: "npm run build generates dist/sw.js and dist/workbox-*.js; App.tsx useEffect contains navigator.storage?.persist"
        status: pass
    human_judgment: true
    rationale: "PWA install, service worker registration, and persistent storage grant require a browser with DevTools — cannot be verified headlessly"
  - id: D6
    description: "BottomTabBar with two NavLink tabs (Medicines, Locations) rendered in RootLayout"
    requirement: PWA-01
    verification:
      - kind: manual_procedural
        ref: "src/components/BottomTabBar.tsx contains NavLink to='/medicines' and NavLink to='/locations'"
        status: pass
    human_judgment: false

# Metrics
duration: 25min
completed: 2026-06-30
status: complete
---

# Phase 01 Plan 01: Walking Skeleton Summary

**HashRouter + Dexie IndexedDB skeleton with medicine CRUD (add + list), BottomTabBar navigation, and PWA service worker — full data path React form -> IndexedDB write -> useLiveQuery -> DOM render operational**

## Performance

- **Duration:** 25 min
- **Started:** 2026-06-30T00:00:00Z
- **Completed:** 2026-06-30T00:25:00Z
- **Tasks:** 2 (Task 1 committed previously; Task 2 committed this session)
- **Files modified:** 11 (Task 2)

## Accomplishments

- Dexie MedStockDB singleton with Medicine and Location interfaces, schema v1 (medicines + locations tables), and db.on('populate') seeding 8 predefined locations (D-18, LOC-01)
- createHashRouter defined at module scope in App.tsx with 6 routes: /, /medicines, /medicines/new, /medicines/:id, /medicines/:id/edit, /locations
- MedicineList using useLiveQuery with Disposed soft-delete filter, empty state per D-03, and live re-render without page reload
- Minimal add-medicine form (name + expiryDate only) with zodResolver, try/catch Dexie write, navigate('/medicines') on success
- BottomTabBar with NavLink active styling satisfying D-02; RootLayout flex column layout with BottomTabBar
- StatusBadge mapping all 6 MedicineStatus values to Tailwind color classes
- navigator.storage.persist() in useEffect with empty deps (PWA-02)
- Build passes: zero TypeScript errors, dist/ generated with sw.js and workbox precache files

## Task Commits

1. **Task 2: Dexie schema + App router + medicine list skeleton** — `8da7f4c` (feat)

## Files Created/Modified

- `src/lib/db.ts` — Dexie MedStockDB singleton; Medicine + Location interfaces; schema v1; populate hook with 8 predefined locations
- `src/types/medicine.ts` — CATEGORIES (10 items) + QUANTITY_UNITS (8 items) consts; re-exports DB types; MedicineStatus/AutoStatus defined locally pending Plan 02
- `src/stores/uiStore.ts` — Zustand v5 curried UIState store with locationDialogOpen
- `src/App.tsx` — createHashRouter at module scope; 6 routes; navigator.storage.persist() useEffect
- `src/routes/RootLayout.tsx` — flex h-screen layout with Outlet + BottomTabBar
- `src/components/BottomTabBar.tsx` — two NavLink tabs with active state styling; fixed bottom
- `src/components/StatusBadge.tsx` — STATUS_STYLES Record mapping 6 MedicineStatus values to Tailwind classes
- `src/components/MedicineCard.tsx` — name, location null-sentinel, expiryDate display; StatusBadge
- `src/routes/medicines/index.tsx` — useLiveQuery with Disposed filter; empty state D-03; MedicineCard list
- `src/routes/medicines/new.tsx` — RHF + zodResolver; db.medicines.add() with all fields; try/catch
- `src/routes/locations/index.tsx` — stub (Plan 04 replaces)

## Decisions Made

- **MedicineStatus defined locally**: `src/lib/expiry.ts` does not exist yet (Plan 02 creates it). Rather than creating a forward-import that would fail the build, MedicineStatus and AutoStatus are defined as string union types locally in `src/types/medicine.ts` and `src/components/StatusBadge.tsx`. TODO comments mark both files for update after Plan 02.
- **Locations seeded alphabetically**: The 8 predefined location names are ordered A-Z in the bulkAdd call to satisfy D-19 display order. Because IndexedDB returns records in insertion order when not using `.orderBy()`, this ensures correct ordering even before Plan 04 adds the full location query.
- **status prop as string on MedicineCard**: The `status` prop is typed as `string` on `MedicineCard` to avoid a circular dependency with `expiry.ts`. Plan 03 will update the prop type to `MedicineStatus` after `calculateStatus` is wired.

## Deviations from Plan

None — plan executed exactly as written. The `MedicineStatus` local definition was explicitly prescribed in the plan ("define MedicineStatus locally to avoid build failure") and is not a deviation.

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| `status="Active"` on all MedicineCard renders | src/routes/medicines/index.tsx | 46 | Plan 03 wires calculateStatus from expiry.ts (Plan 02 creates it) |
| Locations stub ("Location management coming soon.") | src/routes/locations/index.tsx | all | Plan 04 implements full Location management screen (LOC-01–LOC-05) |
| Medicine detail/edit placeholders (div with text) | src/App.tsx | router children | Plan 03 creates MedicineDetail and MedicineEdit route components |
| All optional fields null on new medicine add | src/routes/medicines/new.tsx | onSubmit | Skeleton only adds name + expiryDate; Plan 03 creates full MedicineForm with all optional fields |

These stubs are intentional per the walking skeleton strategy. They do not prevent the plan's goal of validating the end-to-end data path (React form → Dexie write → useLiveQuery → DOM render).

## Issues Encountered

- `npm run test -- --run` exits with code 1 because no test files exist yet. This is expected — Plan 02 creates `src/lib/expiry.test.ts`. The test framework setup is confirmed functional (setupTests.ts imports @testing-library/jest-dom without error).
- `node_modules/` was not present at task start (npm install was required before build). Ran `npm install` as part of task setup.

## User Setup Required

None — no external service configuration required. This is a fully local PWA with no backend.

## Next Phase Readiness

- Plan 02 (expiry calculation): `src/lib/db.ts` exports the `Medicine` interface with all required fields. `calculateStatus(medicine, now)` can be implemented immediately. After Plan 02, update `MedicineStatus` imports in `src/types/medicine.ts` and `src/components/StatusBadge.tsx`.
- Plan 03 (medicine CRUD): Router has `/#/medicines/:id` and `/#/medicines/:id/edit` routes (placeholder divs). `db`, `Medicine`, `CATEGORIES`, `QUANTITY_UNITS` are all exported and ready for consumption.
- Plan 04 (location management): `/#/locations` route serves `LocationsScreen` stub. `db.locations` is seeded with 8 predefined locations (`isDefault: true`). `useUIStore` provides `locationDialogOpen` for the inline location quick-add dialog.

---
*Phase: 01-pwa-foundation-inventory-crud*
*Completed: 2026-06-30*
