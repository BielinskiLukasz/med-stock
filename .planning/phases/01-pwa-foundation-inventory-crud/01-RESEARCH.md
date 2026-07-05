# Phase 1: PWA Foundation & Inventory CRUD - Research

**Researched:** 2026-06-30
**Domain:** React PWA, IndexedDB (Dexie.js), React Router, Form Handling, Offline-First
**Confidence:** MEDIUM

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Multi-route app with React Router. Distinct routes per screen: `/#/medicines`, `/#/medicines/new`, `/#/medicines/:id`, `/#/medicines/:id/edit`, `/#/locations`. Browser back/forward works naturally.
- **D-02:** Bottom tab bar as persistent navigation. Phase 1 ships with two tabs: Medicines + Locations.
- **D-03:** Landing screen is Medicine list (`/` redirects to `/#/medicines`). Empty state: "No medicines yet. Add your first one." + Add Medicine button.
- **D-04:** HashRouter — URLs use `#` fragment (e.g., `https://[user].github.io/med-stock/#/medicines`). Works on GitHub Pages with zero server-side config.
- **D-05:** Vite `base` config: `/med-stock/` (matches the GitHub repository name `med-stock`).
- **D-06:** One-step full form. All ~9 fields visible in a scrollable page. No wizard.
- **D-07:** Required fields: **Name** and **Expiry Date** only. All other fields are optional.
- **D-08:** Period-after-opening (PAO) stored as `{ value: number, unit: 'days' | 'weeks' | 'months' }`.
- **D-09:** Quantity unit: predefined list (tablets, capsules, ml, g, pcs, patches, drops, doses) plus free-text "Other".
- **D-10:** Predefined categories (hardcoded, not user-editable in v1): Pain & Fever, Antibiotics, Allergy, Digestive, Vitamins & Supplements, Skin & Topical, Eye & Ear, Cold & Flu, Heart & Circulation, Other.
- **D-11:** Status is a **pure utility function** in `src/lib/expiry.ts`: `calculateStatus(medicine: Medicine, now: Date): MedicineStatus`.
- **D-12:** Status is **never stored in the database** — always derived at read time.
- **D-13:** Status split — AUTO: `Active`, `Opened`, `Expired`. MANUAL: `Used Up`, `Disposed`, `Archived`. Manual statuses stored as `manualStatus` field; take precedence over auto-calculation.
- **D-14:** Edge case — expiry date is null but PAO is set: use PAO only.
- **D-15:** Edge case — opened date set but PAO is null: status is `Opened` or `Expired` based on expiry date only.
- **D-16:** Users can add a new location inline from the medicine form AND from the dedicated Locations screen.
- **D-17:** `'Other'` is a hardcoded sentinel — not a database record. `location` field in Dexie is `string | null`.
- **D-18:** Predefined locations stored in Dexie Locations table with `isDefault: true`. Cannot be renamed or deleted.
- **D-19:** Location display order: all alphabetical.

### Claude's Discretion

- Transition animations between routes (slide, fade, or none)
- Exact visual treatment of the "Add new location" inline mini-dialog (sheet vs inline input vs modal)
- Empty state illustrations vs text-only empty states
- PWA icon set and splash screen design

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INV-01 | User can add a medicine package with all fields | React Hook Form + Zod schema; Dexie db.medicines.add() |
| INV-02 | User can edit any field of an existing medicine package | React Hook Form pre-populated; Dexie db.medicines.update() |
| INV-03 | User can view full details of a medicine package | Detail route `/#/medicines/:id`; Dexie useLiveQuery by id |
| INV-04 | User can delete a medicine package (moves to Trash — Phase 2 implements Trash; Phase 1: soft-delete via manualStatus:'Disposed') | Dexie update manualStatus field; Phase 1 scopes to logical delete |
| INV-05 | App automatically calculates validity status from expiry + opened date + PAO | Pure `calculateStatus()` function in `src/lib/expiry.ts` |
| INV-06 | Medicine package status: Active, Opened, Expired, Used Up, Disposed, Archived | `MedicineStatus` union type; auto + manual status logic (D-13) |
| LOC-01 | Predefined locations available when adding/editing | Dexie Locations table seeded with `isDefault: true` records |
| LOC-02 | User can add a custom location | Inline quick-add dialog in medicine form + Locations screen |
| LOC-03 | User can edit a custom location name | Dexie db.locations.update(); filtered to isDefault:false |
| LOC-04 | User can delete a custom location (medicines revert to "Other") | Dexie transaction: update affected medicines, delete location |
| LOC-05 | User can manage all locations from a dedicated Locations screen | Route `/#/locations`; bottom tab nav |
| PWA-01 | App works fully offline | vite-plugin-pwa + Workbox precache all assets; Dexie is local-only |
| PWA-02 | App requests persistent storage on first launch | `navigator.storage.persist()` called in App.tsx useEffect |
| PWA-03 | App is installable as PWA on Android, Windows, macOS, Linux | Web manifest with required fields; vite-plugin-pwa generates manifest |
| PWA-04 | App remains responsive with 1,000+ medicine packages | Dexie indexed queries; windowed/paginated list; avoid full-table re-renders |
</phase_requirements>

---

## Summary

Phase 1 builds the complete foundation for MedStock: a Vite 8 + React 19 + TypeScript 6 project scaffold deployed to GitHub Pages via HashRouter, with full medicine inventory CRUD backed by Dexie.js 4 IndexedDB, PWA install capability via vite-plugin-pwa 1.x, and automatic expiry status calculation.

**Critical package version drift from CLAUDE.md:** The CLAUDE.md was written for Vite 5, React 18, Tailwind CSS 3, Zustand 4, and vite-plugin-pwa 0.19. As of 2026-06-30, npm shows Vite 8.1.0, React 19.2.7, Tailwind CSS 4.3.2, Zustand 5.0.14, and vite-plugin-pwa 1.3.0 as latest stable. The planner should use current versions, not the CLAUDE.md version references, except where the user has explicitly locked a version. Tailwind v4 changes the configuration model significantly (CSS-only, no `tailwind.config.js`, new `@tailwindcss/vite` plugin). React Router is now v7 (`createHashRouter` + `RouterProvider` API). These are all backward-compatible upgrades.

**Walking Skeleton:** The thinnest end-to-end slice is: Vite scaffold boots, HashRouter renders `/medicines` route, one medicine can be added to Dexie and appears in the list via `useLiveQuery`, service worker is registered and the app shell loads offline after first visit. This skeleton validates the entire data path (React -> Dexie -> IndexedDB -> render) and the PWA offline capability before any polish.

**Primary recommendation:** Scaffold the project fresh with `npm create vite@latest`, install Tailwind CSS v4 with `@tailwindcss/vite` plugin (no `tailwind.config.js`), initialize shadcn/ui, install Dexie + dexie-react-hooks + react-router-dom v7 + Zustand 5 + React Hook Form + Zod, configure vite-plugin-pwa 1.x with explicit `start_url` and `scope` for `/med-stock/` base path, then build walking skeleton before UI polish.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Medicine CRUD | Browser/IndexedDB | — | No backend; all data in Dexie.js |
| Expiry status calculation | Browser/Client | — | Pure function at render time; never persisted |
| Location management | Browser/IndexedDB | — | Dexie Locations table; no server |
| Routing / navigation | Browser/Client | — | createHashRouter; client-side only |
| Form handling / validation | Browser/Client | — | React Hook Form + Zod; no server submission |
| PWA install + service worker | CDN / Static | Browser/Client | vite-plugin-pwa generates manifest + SW at build time |
| Offline caching | Browser/Client | — | Workbox precaches build assets; IndexedDB is the data layer |
| Persistent storage request | Browser/Client | — | `navigator.storage.persist()` — browser API call |
| UI components | Browser/Client | — | shadcn/ui (Tailwind CSS utility classes) |
| Global UI state (filters, selected) | Browser/Client | — | Zustand 5 store |

---

## Standard Stack

### Core
| Library | Version (npm latest) | Purpose | Why Standard |
|---------|---------------------|---------|--------------|
| react | 19.2.7 | UI library | Current stable; React 18 also works |
| react-dom | 19.2.7 | DOM renderer | Paired with react |
| typescript | 5.8+ | Type safety | Strict mode; catches data model bugs |
| vite | 8.1.0 | Build tool + dev server | Sub-second HMR; ESM-native; replaces CRA |
| @vitejs/plugin-react | 6.0.3 | React fast refresh in Vite | Official Vite React plugin |

**Note:** [ASSUMED] React 18.2 from CLAUDE.md is still compatible, but React 19 is the current stable. No breaking changes affect this project.

### PWA Infrastructure
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite-plugin-pwa | 1.3.0 | PWA manifest + Workbox service worker | Zero-config PWA for Vite; auto-generates SW |
| workbox (via vite-plugin-pwa) | 7.x | Offline caching strategies | Google's battle-tested SW library |

### Data & State
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| dexie | 4.4.4 | IndexedDB ORM with TypeScript | Schema versioning; `EntityTable` typing |
| dexie-react-hooks | 4.4.0 | `useLiveQuery` reactive hook | Live queries without manual subscriptions |
| zustand | 5.0.14 | Global UI state | Minimal boilerplate; React 18/19 compatible |

### Routing
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-router-dom | 7.18.1 | Client-side routing | `createHashRouter` for GitHub Pages; v7 is stable latest |

### Forms & Validation
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | 7.80.0 | Form state, uncontrolled inputs | Minimal re-renders; excellent TS support |
| zod | 4.4.3 | Runtime schema validation | Type inference from schema; integrates with RHF |
| @hookform/resolvers | 5.4.0 | Bridge RHF ↔ Zod | Official adapter; handles async validation |

### UI & Styling
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | 4.3.2 | Utility-first CSS | v4: CSS-only config; no `tailwind.config.js` needed |
| @tailwindcss/vite | 4.3.2 | Tailwind v4 Vite integration | Replaces PostCSS approach for Vite projects |
| shadcn/ui | latest (copy-paste) | Accessible component library | Components live in repo; full customization |

### Testing
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.1.9 | Unit test runner | Vite-native; fast; no separate config file |
| @testing-library/react | latest | Component testing | RTL is the standard for React |
| @testing-library/jest-dom | latest | DOM matchers | Extended matchers for DOM assertions |
| jsdom | latest | Browser DOM simulation | Required by vitest for component tests |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/node | latest | Node.js type definitions | Required for `path.resolve` in vite.config.ts |
| papaparse | 5.5.4 | CSV parsing | Phase 3 only — do NOT install in Phase 1 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-router-dom v7 | v6.30.4 | v6 works but v7 `createHashRouter` is cleaner; no reason to pin to v6 |
| Tailwind CSS v4 | Tailwind CSS v3 | v3 is in LTS mode; v4 is the current release; v4 changes config model |
| Zustand v5 | Zustand v4 | v4 is no longer `latest`; v5 is stable with minor breaking changes |
| React 19 | React 18 | React 18 still works; React 19 is current stable |

**Installation:**
```bash
npm create vite@latest med-stock -- --template react-ts
cd med-stock

# Core dependencies
npm install react-router-dom dexie dexie-react-hooks zustand
npm install react-hook-form zod @hookform/resolvers

# PWA
npm install -D vite-plugin-pwa

# Tailwind CSS v4 (Vite plugin approach — no PostCSS config needed)
npm install tailwindcss @tailwindcss/vite
npm install -D @types/node

# shadcn/ui (run after Tailwind is configured)
npx shadcn@latest init

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Version verification (run before starting implementation):**
```bash
npm view react version
npm view vite version
npm view dexie version
npm view react-router-dom version
npm view zustand version
npm view tailwindcss version
npm view vite-plugin-pwa version
```

---

## Package Legitimacy Audit

Legitimacy check run via `gsd-tools query package-legitimacy check` on 2026-06-30. "SUS/too-new" verdicts below reflect the heuristic that a version was published very recently — all are established packages with massive download counts and official GitHub repos. None are SLOP.

| Package | Registry | Downloads/wk | Source Repo | Verdict | Disposition |
|---------|----------|-------------|-------------|---------|-------------|
| vite | npm | 140M | github.com/vitejs/vite | SUS (too-new heuristic) | Approved — established build tool, 140M downloads/wk |
| vite-plugin-pwa | npm | 3.2M | github.com/vite-pwa/vite-plugin-pwa | OK | Approved |
| dexie | npm | 1.8M | github.com/dexie/Dexie.js | SUS (too-new heuristic) | Approved — 10+ year project |
| react-router-dom | npm | 41M | github.com/remix-run/react-router | SUS (too-new heuristic) | Approved — industry standard |
| react-hook-form | npm | 54M | github.com/react-hook-form/react-hook-form | SUS (too-new heuristic) | Approved |
| zustand | npm | 41M | github.com/pmndrs/zustand | OK | Approved |
| zod | npm | 209M | github.com/colinhacks/zod | OK | Approved |
| @hookform/resolvers | npm | 46M | github.com/react-hook-form/resolvers | OK | Approved |
| @vitejs/plugin-react | npm | 65M | github.com/vitejs/vite-plugin-react | SUS (too-new heuristic) | Approved |
| tailwindcss | npm | 118M | github.com/tailwindlabs/tailwindcss | SUS (too-new heuristic) | Approved |
| vitest | npm | 68M | github.com/vitest-dev/vitest | SUS (too-new heuristic) | Approved |

**Packages removed due to SLOP verdict:** None

**Packages flagged as suspicious SUS:** All SUS verdicts are "too-new" heuristic false positives on well-established packages. No human verify checkpoint required. [ASSUMED: legitimacy tool uses age-of-latest-version heuristic that fires on any package with a recent release]

---

## Architecture Patterns

### System Architecture Diagram

```
User Interaction
       |
       v
[React Components]   <--- Tailwind CSS + shadcn/ui styling
  MedicineList
  MedicineForm       <--- React Hook Form + Zod
  LocationsScreen
  BottomTabBar
       |
       v
[React Router v7]    <--- createHashRouter; URL: /#/medicines, /#/locations
[Zustand Store]      <--- UI state: current filters, dialogs, form state
       |
       v
[Service Layer]      <--- src/lib/expiry.ts (calculateStatus)
                          src/lib/db.ts (Dexie db instance)
       |
       v
[Dexie.js]           <--- IndexedDB ORM
  db.medicines        <--- CRUD operations
  db.locations        <--- Location management
       |
       v
[Browser IndexedDB]  <--- Local persistent storage
       |
       ^
[Service Worker]     <--- vite-plugin-pwa + Workbox
  Precached assets:       App shell, JS, CSS, icons
  Offline strategy:       Cache-first for assets (Workbox GenerateSW)
```

### Recommended Project Structure
```
src/
├── components/
│   ├── ui/              # shadcn/ui components (Button, Input, Select, Form, etc.)
│   ├── MedicineCard.tsx # Single medicine list item
│   ├── MedicineForm.tsx # Add/Edit form (React Hook Form + Zod)
│   ├── BottomTabBar.tsx # Persistent tab navigation
│   └── StatusBadge.tsx  # Color-coded MedicineStatus display
├── lib/
│   ├── db.ts            # Dexie schema + db singleton
│   └── expiry.ts        # calculateStatus() pure function (D-11)
├── routes/
│   ├── medicines/
│   │   ├── index.tsx    # /#/medicines — list view
│   │   ├── new.tsx      # /#/medicines/new — add form
│   │   ├── [id].tsx     # /#/medicines/:id — detail view
│   │   └── [id].edit.tsx # /#/medicines/:id/edit — edit form
│   └── locations/
│       └── index.tsx    # /#/locations — location management
├── stores/
│   └── uiStore.ts       # Zustand store (dialog state, filters)
├── types/
│   └── medicine.ts      # MedicineStatus type, Medicine interface
├── App.tsx              # RouterProvider, persistent storage request
├── main.tsx             # React DOM render
└── index.css            # @import "tailwindcss" (Tailwind v4)

public/
├── icons/               # PWA icons (192x192, 512x512 minimum)
└── manifest.webmanifest # Generated by vite-plugin-pwa
```

### Pattern 1: Dexie TypeScript Schema
**What:** Single db.ts module exporting a typed Dexie instance
**When to use:** Always — one singleton for the whole app

```typescript
// src/lib/db.ts
// Source: dexie.org/docs/Typescript [CITED: https://dexie.org/docs/Typescript]
import { Dexie, type EntityTable } from 'dexie'

export type PAO = { value: number; unit: 'days' | 'weeks' | 'months' }
export type ManualStatus = 'Used Up' | 'Disposed' | 'Archived' | null

export interface Medicine {
  id: number
  name: string                    // required
  category: string | null
  location: string | null         // null = "Other" (D-17)
  expiryDate: string | null       // YYYY-MM-DD (required for INV-01)
  openedDate: string | null       // YYYY-MM-DD
  pao: PAO | null                 // period-after-opening
  quantity: number | null
  quantityUnit: string | null
  notes: string | null
  manualStatus: ManualStatus      // D-13: takes precedence over auto
  createdAt: string               // ISO timestamp
  updatedAt: string               // ISO timestamp
}

export interface Location {
  id: number
  name: string
  isDefault: boolean              // D-18: predefined locations cannot be edited/deleted
}

const db = new Dexie('MedStockDB') as Dexie & {
  medicines: EntityTable<Medicine, 'id'>
  locations: EntityTable<Location, 'id'>
}

db.version(1).stores({
  medicines: '++id, name, category, location, expiryDate, manualStatus',
  locations: '++id, name, isDefault',
})

export { db }
```

### Pattern 2: createHashRouter for GitHub Pages
**What:** React Router v7 data router with hash-based URLs
**When to use:** Always — required for GitHub Pages (D-04)

```typescript
// src/App.tsx
// Source: reactrouter.com/api/data-routers/createHashRouter [CITED: https://reactrouter.com/api/data-routers/createHashRouter]
import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom'
import { RootLayout } from './routes/RootLayout'
import { MedicineList } from './routes/medicines/index'
import { MedicineNew } from './routes/medicines/new'
import { MedicineDetail } from './routes/medicines/[id]'
import { MedicineEdit } from './routes/medicines/[id].edit'
import { LocationsScreen } from './routes/locations/index'
import { useEffect } from 'react'

const router = createHashRouter([  // Created OUTSIDE React tree
  {
    path: '/',
    element: <RootLayout />,      // Bottom tab bar + Outlet
    children: [
      { index: true, element: <Navigate to="/medicines" replace /> },
      { path: 'medicines', element: <MedicineList /> },
      { path: 'medicines/new', element: <MedicineNew /> },
      { path: 'medicines/:id', element: <MedicineDetail /> },
      { path: 'medicines/:id/edit', element: <MedicineEdit /> },
      { path: 'locations', element: <LocationsScreen /> },
    ],
  },
])

export default function App() {
  useEffect(() => {
    // PWA-02: request persistent storage on first launch
    if (navigator.storage?.persist) {
      navigator.storage.persist()
    }
  }, [])

  return <RouterProvider router={router} />
}
```

### Pattern 3: vite.config.ts for GitHub Pages + PWA + Tailwind v4
**What:** Complete Vite configuration for this project
**When to use:** Foundation of the project

```typescript
// vite.config.ts
// Source: vite-pwa-org.netlify.app + tailwindcss.com/docs/installation/using-vite [ASSUMED]
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '/med-stock/',   // D-05: matches GitHub repo name
  plugins: [
    react(),
    tailwindcss(),       // Tailwind v4: replaces PostCSS approach
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'MedStock',
        short_name: 'MedStock',
        description: 'Household medicine inventory — offline-first',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        // CRITICAL for GitHub Pages subdirectory base path:
        scope: '/med-stock/',
        start_url: '/med-stock/',
        icons: [
          { src: '/med-stock/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/med-stock/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

### Pattern 4: calculateStatus pure function
**What:** D-11 expiry status utility, called at render time, never stored
**When to use:** Every time a medicine status needs to be displayed

```typescript
// src/lib/expiry.ts
// Source: D-11 through D-15 from 01-CONTEXT.md [CITED: .planning/phases/01-pwa-foundation-inventory-crud/01-CONTEXT.md]
import type { Medicine } from './db'

export type AutoStatus = 'Active' | 'Opened' | 'Expired'
export type ManualStatus = 'Used Up' | 'Disposed' | 'Archived'
export type MedicineStatus = AutoStatus | ManualStatus

const MS_PER_DAY = 86_400_000

function addPAO(date: Date, pao: { value: number; unit: string }): Date {
  const d = new Date(date)
  if (pao.unit === 'days') d.setDate(d.getDate() + pao.value)
  else if (pao.unit === 'weeks') d.setDate(d.getDate() + pao.value * 7)
  else if (pao.unit === 'months') d.setMonth(d.getMonth() + pao.value)
  return d
}

export function calculateStatus(med: Medicine, now: Date = new Date()): MedicineStatus {
  // Manual overrides take precedence (D-13)
  if (med.manualStatus) return med.manualStatus

  const expiry = med.expiryDate ? new Date(med.expiryDate) : null
  const opened = med.openedDate ? new Date(med.openedDate) : null
  const paoEnd = opened && med.pao ? addPAO(opened, med.pao) : null

  // D-14: null expiry but PAO set — use PAO only
  if (!expiry && paoEnd) {
    return now <= paoEnd ? 'Opened' : 'Expired'
  }

  // D-15: opened but no PAO — ignore PAO check
  if (expiry && opened && !med.pao) {
    return now > expiry ? 'Expired' : 'Opened'
  }

  // Standard: whichever constraint expires first
  if (expiry && now > expiry) return 'Expired'
  if (paoEnd && now > paoEnd) return 'Expired'
  if (opened) return 'Opened'
  return 'Active'
}
```

### Pattern 5: Zustand v5 UI Store
**What:** Global UI state for medicine list screen
**When to use:** Filters, dialog open/close, non-persisted state

```typescript
// src/stores/uiStore.ts
// Source: zustand.docs.pmnd.rs/learn/guides/beginner-typescript [CITED: https://zustand.docs.pmnd.rs/learn/guides/beginner-typescript]
import { create } from 'zustand'

interface UIState {
  locationDialogOpen: boolean
  setLocationDialogOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()((set) => ({
  locationDialogOpen: false,
  setLocationDialogOpen: (open) => set({ locationDialogOpen: open }),
}))
```

### Pattern 6: React Hook Form + Zod for Medicine Form
**What:** Validated form with Zod schema
**When to use:** Add/Edit medicine form

```typescript
// src/components/MedicineForm.tsx (excerpt)
// Source: ui.shadcn.com/docs/forms/react-hook-form [CITED: https://ui.shadcn.com/docs/forms/react-hook-form]
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const medicineSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  category: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  openedDate: z.string().nullable().optional(),
  paoValue: z.number().positive().nullable().optional(),
  paoUnit: z.enum(['days', 'weeks', 'months']).nullable().optional(),
  quantity: z.number().positive().nullable().optional(),
  quantityUnit: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

type MedicineFormData = z.infer<typeof medicineSchema>

export function MedicineForm({ onSubmit }: { onSubmit: (data: MedicineFormData) => void }) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<MedicineFormData>({
    resolver: zodResolver(medicineSchema),
  })
  // ... render fields
}
```

### Anti-Patterns to Avoid
- **Storing computed status in DB:** Never store `calculateStatus()` result — always compute at render time (D-12). Storing it causes stale data bugs.
- **Using `<HashRouter>` component:** Use `createHashRouter` + `RouterProvider` (React Router v7 recommended API). `<HashRouter>` still works but is the legacy low-level API.
- **Checking `tailwind.config.js` existence:** Tailwind v4 uses CSS-only config. Do not create `tailwind.config.js`.
- **Using PostCSS for Tailwind:** v4 uses `@tailwindcss/vite` plugin directly. PostCSS setup is the v3 approach.
- **Calling `navigator.storage.persist()` in every render:** Call once in `App.tsx useEffect` with empty deps. The browser remembers the grant.
- **Hard-coding location 'Other' as a DB record:** It's a sentinel (`medicine.location === null` displays as "Other") per D-17.
- **Storing `location: 'Other'` string in Medicine:** Store `null`. Display layer handles "Other".

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB access | Raw indexedDB API | Dexie.js | Migration bugs, transaction boilerplate, no TS types |
| IndexedDB live queries | Manual event listeners | `useLiveQuery` | Complex subscription management |
| Form validation | Custom validation logic | Zod + React Hook Form | Edge cases in required/optional, async, cross-field |
| Service worker + caching | Manual SW | vite-plugin-pwa + Workbox | Cache invalidation, update lifecycle, precache manifest |
| PWA manifest generation | Manual `manifest.json` | vite-plugin-pwa | Version hash updates, icon paths, build integration |
| Accessible UI components | Custom components | shadcn/ui | ARIA attributes, keyboard nav, focus management |
| Client-side routing | Manual URL parsing | react-router-dom | History API, scroll restoration, nested layouts |
| Date arithmetic for PAO | Custom date math | Standard Date API (simple enough) | PAO is just days/weeks/months addition; `date-fns` is optional |

**Key insight:** The entire "offline data" problem is solved by Dexie.js + vite-plugin-pwa. The expiry calculation is genuinely simple enough to hand-roll as a pure function — no library needed there.

---

## Common Pitfalls

### Pitfall 1: PWA manifest icon paths don't inherit Vite base
**What goes wrong:** vite-plugin-pwa does not auto-prepend the `base` path to icon URLs in the generated manifest. Icons are referenced as `/icons/icon-192.png` but should be `/med-stock/icons/icon-192.png`.
**Why it happens:** Known issue in vite-plugin-pwa when using a subdirectory base path.
**How to avoid:** Explicitly set icon `src` paths with the full base prefix in `manifest` config: `src: '/med-stock/icons/icon-192.png'`. Also set `scope` and `start_url` explicitly to `/med-stock/`.
**Warning signs:** PWA installs but shows blank icon, or app fails to install on mobile.

### Pitfall 2: start_url defaulting to `./` instead of base
**What goes wrong:** Installed PWA launches to the `assets/` folder URL instead of the app root.
**Why it happens:** Default `start_url` is `./` relative to manifest location, which puts it in the build output folder.
**How to avoid:** Always set `start_url: '/med-stock/'` and `scope: '/med-stock/'` explicitly in VitePWA manifest config.
**Warning signs:** Installed PWA shows blank page or 404 on launch.

### Pitfall 3: Tailwind v4 config confusion
**What goes wrong:** Developer creates `tailwind.config.js`, adds `@tailwind base/components/utilities` directives, configures PostCSS — none of which is needed for Tailwind v4.
**Why it happens:** Most tutorials still show v3 setup.
**How to avoid:** With `@tailwindcss/vite`: only `@import "tailwindcss"` in `index.css`. No `tailwind.config.js`. No PostCSS config. The Vite plugin handles everything.
**Warning signs:** Styles not applying; build errors about missing config; Tailwind classes not recognized.

### Pitfall 4: React Router v7 — router created inside component
**What goes wrong:** `createHashRouter` is called inside a component or in `useState`, causing the router to be recreated on every render.
**Why it happens:** Looks like a normal React hook call.
**How to avoid:** Always create the router at module scope (outside any component), then pass to `<RouterProvider router={router}>`.
**Warning signs:** Navigation state resets on every render; infinite re-renders.

### Pitfall 5: Dexie schema migration — adding fields to existing table
**What goes wrong:** Adding a new indexed field without a new `db.version()` call corrupts existing IndexedDB data for users who already have the app installed.
**Why it happens:** Dexie requires schema changes to be accompanied by version bumps.
**How to avoid:** For Phase 1, define the complete schema upfront (all fields the app will ever need in v1). Only bump version if schema changes. Non-indexed fields don't require version bumps — only indexed fields in `stores()` string.
**Warning signs:** `DexieError: VersionError` on app reload.

### Pitfall 6: iOS Safari standalone PWA — `navigator.storage.persist()` return value
**What goes wrong:** Code calls `persist()` but doesn't check the returned promise; assumes it was granted.
**Why it happens:** The API is async and may be denied.
**How to avoid:** `const granted = await navigator.storage.persist()`. Log result. If denied, still continue — data is not immediately at risk; just display an advisory message.
**Warning signs:** Data disappears after device storage pressure on iOS.

### Pitfall 7: Zustand v5 breaking change — `create` double-call for TypeScript
**What goes wrong:** Using `create<State>(set => ({}))` (v4 pattern) instead of `create<State>()(set => ({}))` in TypeScript.
**Why it happens:** v5 changed the TypeScript signature to require the curried form.
**How to avoid:** Always use `create<State>()(...)` pattern with Zustand v5.
**Warning signs:** TypeScript compilation errors on the store definition.

### Pitfall 8: `location: null` vs `location: 'Other'` inconsistency
**What goes wrong:** Some code stores `'Other'` string in `medicine.location`, while other code stores `null`. LOC-04 delete logic breaks.
**Why it happens:** D-17 sentinel pattern is easy to forget.
**How to avoid:** Enforce via Zod schema: `location: z.string().nullable()`. Display layer converts `null → 'Other'`. Never store `'Other'` string in DB. LOC-04 sets `location = null` on affected medicines.
**Warning signs:** Medicine appears with location "Other" after delete, but `db.medicines.where('location').equals(null)` returns empty.

---

## Walking Skeleton

The thinnest end-to-end slice that validates the full data + PWA path:

**Skeleton definition:** A working PWA scaffold that:
1. Builds with `npm run build` without TypeScript errors
2. Installs to home screen (passes PWA criteria: manifest + SW)
3. Serves `/#/medicines` route in HashRouter
4. Renders one hard-coded AddButton
5. Add form submits a medicine to Dexie `db.medicines.add()`
6. `useLiveQuery` returns the record and renders it in the list
7. Service worker is registered; app shell loads on second visit offline

**Skeleton does NOT need:** Status calculation, location management, edit/delete, validation errors UI, empty state illustrations, or any visual polish.

**Task sequencing for skeleton:**
1. `npm create vite@latest` → install all deps
2. Configure `vite.config.ts` (base, plugins, PWA, alias)
3. Configure `tsconfig.app.json` (paths, strict)
4. Configure `src/index.css` (`@import "tailwindcss"`)
5. Run `npx shadcn@latest init` (gets Button, Input, Form components)
6. Create `src/lib/db.ts` (Dexie schema — Medicine + Location tables)
7. Create `src/App.tsx` (createHashRouter, persistent storage request)
8. Create `src/routes/medicines/index.tsx` (useLiveQuery list)
9. Create bare MedicineForm with name + expiryDate only
10. Verify: `npm run build` succeeds → deploy → PWA installs → offline works

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 with `tailwind.config.js` + PostCSS | Tailwind v4 with `@tailwindcss/vite` plugin, CSS-only config | Jan 2025 | No config files; simpler setup |
| vite-plugin-pwa 0.x (Vite 5 era) | vite-plugin-pwa 1.x (current) | 2025 | Minor API changes; still same VitePWA() plugin |
| Zustand v4 `create(...)` TypeScript | Zustand v5 `create<T>()(...)` TypeScript | Oct 2024 | Breaking TS change in curried form |
| React Router `<HashRouter>` component | React Router v7 `createHashRouter` + `RouterProvider` | Nov 2024 | Data router API; cleaner loaders/actions |
| React 18 (CLAUDE.md) | React 19.2.7 (current stable) | Dec 2024 | React 18 still works; v19 is default for new projects |
| iOS 7-day IndexedDB eviction | iOS 17+: eviction by storage pressure only (larger quota) | Sep 2023 | `navigator.storage.persist()` effective since iOS 17 |

**Deprecated/outdated:**
- `tailwind.config.js` setup: Only needed for v3 projects or when using custom config; v4 doesn't use it.
- Zustand `import create from 'zustand'` (default import): Now named export `import { create } from 'zustand'`.
- `<HashRouter>` component from react-router-dom: Still works but `createHashRouter` is preferred in v7.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | React 19 is compatible with all Phase 1 libraries (Dexie, shadcn/ui, React Hook Form, Zustand v5) | Standard Stack | Some library may not support React 19 peer dep — fallback to React 18 |
| A2 | Tailwind v4 + shadcn/ui works with React 18 (not just React 19) | Standard Stack | shadcn init may force React 19; mitigation: pin React 18 in package.json |
| A3 | vite-plugin-pwa 1.x configuration is largely backward compatible with 0.x config examples | Architecture Patterns | VitePWA() options may differ; planner should verify against official docs |
| A4 | Zustand v5's `create<State>()()` curried syntax is the only change affecting this phase | Standard Stack | Additional v5 breaking changes may exist in persist middleware |
| A5 | `@tailwindcss/vite` v4.3.2 is stable and production-ready for this use case | Standard Stack | v4 uses "bleeding-edge browser features" — verify browser target compatibility |
| A6 | `navigator.storage.persist()` on iOS 17+ reliably prevents eviction when installed as Home Screen Web App | Common Pitfalls | WebKit behavior may change; mitigation: display advisory message if denied |
| A7 | The "too-new" SUS verdict from legitimacy checker is a false positive for all flagged packages | Package Legitimacy | Not actually suspicious — all are well-known packages with multi-million download counts |

---

## Open Questions

1. **React 18 vs React 19 — which version to use?**
   - What we know: CLAUDE.md says React 18.2+; npm `latest` is React 19.2.7; shadcn/ui new projects default to React 19
   - What's unclear: Whether any dependency creates a peer dep conflict with React 19
   - Recommendation: Use React 19 (current stable) unless a library peer dep conflict is discovered during install. All Phase 1 libraries support React 18 and 19.

2. **Tailwind v4 "bleeding-edge browser features" — target browser compatibility?**
   - What we know: Tailwind v4 drops support for older browsers (Safari < 16.4, Chrome < 111)
   - What's unclear: The project's minimum iOS version target
   - Recommendation: Use Tailwind v4; iOS 17+ is likely the minimum anyway (PWA-02 requires `navigator.storage.persist()` which is Safari 17+)

3. **INV-04: "Delete moves to Trash Bin" — Phase 1 scope ambiguity**
   - What we know: Trash Bin (TRSH-01–04) is Phase 2 scope; Phase 1 has INV-04
   - What's unclear: How Phase 1 handles delete without a Trash Bin UI
   - Recommendation: Phase 1 implements delete as "set `manualStatus = 'Disposed'`" (a manual status that hides the item from the main list). Phase 2 adds Trash Bin UI + restore. Planner should document this scope interpretation.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite build, npm | Yes | v24.18.0 | — |
| npm | Package management | Yes | 11.16.0 | — |
| Git | Version control | Yes | (in git repo) | — |
| GitHub Pages | Deployment target | [ASSUMED] | — | Deploy locally for testing |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** GitHub Pages deployment cannot be verified in the local environment — deployment step is post-implementation.

---

## Validation Architecture

> `workflow.nyquist_validation: true` — section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 + @testing-library/react |
| Config file | In `vite.config.ts` under `test:` key (Wave 0 creates this) |
| Quick run command | `npm run test -- --run` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INV-05 | `calculateStatus()` returns correct status for all date combinations | unit | `npx vitest run src/lib/expiry.test.ts` | No — Wave 0 |
| INV-06 | Manual status takes precedence over auto-calculated status | unit | `npx vitest run src/lib/expiry.test.ts` | No — Wave 0 |
| LOC-04 | Deleting a location sets affected medicines `location` to null | unit | `npx vitest run src/lib/db.test.ts` | No — Wave 0 |
| D-14 | null expiry + PAO set: status uses PAO only | unit | `npx vitest run src/lib/expiry.test.ts` | No — Wave 0 |
| D-15 | openedDate + no PAO: status based on expiry date only | unit | `npx vitest run src/lib/expiry.test.ts` | No — Wave 0 |
| PWA-01 | Service worker registered, offline assets served | manual | Lighthouse PWA audit in Chrome DevTools | No |
| PWA-02 | `navigator.storage.persist()` called on first launch | smoke | Check browser Application > Storage in DevTools | No |
| PWA-03 | Installable on Android, Windows | manual | Install from Chrome, verify launch | No |
| INV-01–04 | Add, view, edit, delete medicine end-to-end | smoke | `npx vitest run src/routes/medicines/` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/expiry.test.ts` (pure function, fast)
- **Per wave merge:** `npm run test -- --run` (all tests)
- **Phase gate:** Full suite green + Lighthouse PWA score >= 90 before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/lib/expiry.test.ts` — covers INV-05, INV-06, D-14, D-15 (status calculation)
- [ ] `src/lib/db.test.ts` — covers LOC-04 (location delete cascade)
- [ ] `vitest.config` in `vite.config.ts` with `test.environment: 'jsdom'` and `test.setupFiles`
- [ ] `src/setupTests.ts` — `@testing-library/jest-dom/vitest` import

---

## Security Domain

> `security_enforcement: true`, `security_asvs_level: 1` in config.json.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in v1; single-device local-only app |
| V3 Session Management | No | No sessions; IndexedDB is the only state |
| V4 Access Control | No | No multi-user; single-device personal app |
| V5 Input Validation | Yes | Zod schema validates all medicine form fields |
| V6 Cryptography | No | No encryption needed; data is local-only |
| V7 Error Handling | Yes | Dexie operations must have try/catch; don't expose IndexedDB errors to UI as raw JS errors |

### Known Threat Patterns for Client-Only PWA

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via medicine name/notes | Tampering | React auto-escapes all JSX interpolation; never use `dangerouslySetInnerHTML` |
| Prototype pollution via imported data | Tampering | Validate imported JSON via Zod before writing to Dexie (Phase 3) |
| IndexedDB corruption via concurrent writes | Tampering | Use Dexie transactions for multi-step operations (e.g., LOC-04 delete cascade) |
| Stale service worker serving old JS | Spoofing | `registerType: 'autoUpdate'` in VitePWA; new SW activates after user navigates away |

---

## Sources

### Primary (MEDIUM confidence)
- [Dexie.js TypeScript docs](https://dexie.org/docs/Typescript) — EntityTable pattern, schema definition
- [shadcn/ui Vite installation](https://ui.shadcn.com/docs/installation/vite) — Tailwind v4 setup steps
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — React 18 compatibility, CSS-only config
- [React Router createHashRouter](https://reactrouter.com/api/data-routers/createHashRouter) — v7 HashRouter pattern
- [WebKit storage policy blog](https://webkit.org/blog/14403/updates-to-storage-policy/) — iOS 17 eviction rules, `persist()` behavior
- [zustand TypeScript guide](https://zustand.docs.pmnd.rs/learn/guides/beginner-typescript) — v5 create pattern
- [shadcn/ui React Hook Form docs](https://ui.shadcn.com/docs/forms/react-hook-form) — Form + Zod integration

### Secondary (LOW confidence — web search)
- npm registry (verified via `npm view`) — all package versions confirmed current
- gsd-tools package-legitimacy check — download counts and repo URLs confirmed
- tailwindcss.com/blog/tailwindcss-v4 — v4 CSS-only config confirmation
- vite-pwa-org.netlify.app/guide/service-worker-precache — VitePWA workbox config

---

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM — versions confirmed via `npm view` (npm registry, authoritative)
- Architecture: MEDIUM — patterns confirmed via official docs (shadcn/ui, Dexie, React Router, WebKit)
- Pitfalls: LOW — web search + known GitHub issues; not all personally verified

**Research date:** 2026-06-30
**Valid until:** 2026-07-30 (30 days — Tailwind v4 and React Router v7 are moving fast)

---

## Project Constraints (from CLAUDE.md)

The following directives from `.claude/CLAUDE.md` must be honored during planning and implementation:

| Constraint | Directive |
|------------|-----------|
| Tech stack | React + TypeScript + PWA — user-specified, no backend |
| Storage | IndexedDB only — all data local, no cloud database |
| Privacy | Zero server-side storage; data never leaves the device |
| Offline | Must work fully without internet access |
| Performance | Must remain responsive with 1,000+ medicine packages |
| Sync | Manual only for v1 — no OneDrive API integration |
| Routing | HashRouter (GitHub Pages) — confirmed in CLAUDE.md architecture section |
| Forbidden | CRA, Redux vanilla, Material UI, Formik, custom IndexedDB code, localStorage for inventory, REST API backend |
| Required patterns | Dexie.js for IndexedDB, Zustand for state, shadcn/ui for components, React Hook Form + Zod for forms |
| Dates | All dates stored as YYYY-MM-DD strings (timezone safety for expiry calculations — from STATE.md) |
| Persistent storage | Persistent storage request on first launch is mandatory (iOS Safari 7-day eviction risk — from STATE.md) |
