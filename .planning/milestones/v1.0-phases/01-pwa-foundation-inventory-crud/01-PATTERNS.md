# Phase 1: PWA Foundation & Inventory CRUD - Pattern Map

**Mapped:** 2026-06-30
**Files analyzed:** 18 new files
**Analogs found:** 0 / 18 — blank-slate project; all patterns sourced from RESEARCH.md

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `vite.config.ts` | config | — | None — new project | no analog |
| `tsconfig.app.json` | config | — | None — new project | no analog |
| `src/index.css` | config | — | None — new project | no analog |
| `src/main.tsx` | config | request-response | None — new project | no analog |
| `src/App.tsx` | provider | request-response | None — new project | no analog |
| `src/lib/db.ts` | service | CRUD | None — new project | no analog |
| `src/lib/expiry.ts` | utility | transform | None — new project | no analog |
| `src/types/medicine.ts` | model | — | None — new project | no analog |
| `src/stores/uiStore.ts` | store | event-driven | None — new project | no analog |
| `src/routes/RootLayout.tsx` | component | request-response | None — new project | no analog |
| `src/routes/medicines/index.tsx` | component | CRUD | None — new project | no analog |
| `src/routes/medicines/new.tsx` | component | CRUD | None — new project | no analog |
| `src/routes/medicines/[id].tsx` | component | CRUD | None — new project | no analog |
| `src/routes/medicines/[id].edit.tsx` | component | CRUD | None — new project | no analog |
| `src/routes/locations/index.tsx` | component | CRUD | None — new project | no analog |
| `src/components/MedicineForm.tsx` | component | CRUD | None — new project | no analog |
| `src/components/MedicineCard.tsx` | component | request-response | None — new project | no analog |
| `src/components/StatusBadge.tsx` | component | transform | None — new project | no analog |
| `src/components/BottomTabBar.tsx` | component | request-response | None — new project | no analog |
| `src/lib/expiry.test.ts` | test | transform | None — new project | no analog |
| `src/setupTests.ts` | config | — | None — new project | no analog |

---

## Pattern Assignments

All patterns below are sourced from RESEARCH.md (01-RESEARCH.md), which derives them from official library documentation. No in-codebase analogs exist.

---

### `vite.config.ts` (config)

**Source pattern:** RESEARCH.md §Pattern 3 — vite.config.ts for GitHub Pages + PWA + Tailwind v4

**Complete pattern:**
```typescript
// vite.config.ts
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

**Critical pitfalls:**
- Icon `src` paths MUST include full `/med-stock/` prefix — vite-plugin-pwa does NOT auto-prepend base path (Pitfall 1)
- `scope` and `start_url` MUST be explicitly set to `/med-stock/` (Pitfall 2)
- Do NOT add `tailwind.config.js` — Tailwind v4 uses CSS-only config (Pitfall 3)
- Vitest config goes under `test:` key in this same file

---

### `src/index.css` (config)

**Source pattern:** RESEARCH.md §Common Pitfalls — Tailwind v4 setup

**Complete pattern:**
```css
/* src/index.css — entire file */
@import "tailwindcss";
```

**Critical:** This is the ONLY Tailwind directive needed for v4. Do NOT add `@tailwind base`, `@tailwind components`, `@tailwind utilities` — those are v3 directives.

---

### `src/main.tsx` (config, request-response)

**Source pattern:** Standard Vite + React entry point

**Complete pattern:**
```typescript
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

### `src/App.tsx` (provider, request-response)

**Source pattern:** RESEARCH.md §Pattern 2 — createHashRouter for GitHub Pages

**Complete pattern:**
```typescript
// src/App.tsx
import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom'
import { RootLayout } from './routes/RootLayout'
import { MedicineList } from './routes/medicines/index'
import { MedicineNew } from './routes/medicines/new'
import { MedicineDetail } from './routes/medicines/[id]'
import { MedicineEdit } from './routes/medicines/[id].edit'
import { LocationsScreen } from './routes/locations/index'
import { useEffect } from 'react'

// CRITICAL: router created OUTSIDE React tree — never inside a component or useState (Pitfall 4)
const router = createHashRouter([
  {
    path: '/',
    element: <RootLayout />,
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
    // PWA-02: request persistent storage on first launch (once only — empty deps)
    if (navigator.storage?.persist) {
      navigator.storage.persist().then((granted) => {
        // Pitfall 6: check return value; don't assume granted
        if (!granted) console.warn('Persistent storage not granted')
      })
    }
  }, [])

  return <RouterProvider router={router} />
}
```

---

### `src/lib/db.ts` (service, CRUD)

**Source pattern:** RESEARCH.md §Pattern 1 — Dexie TypeScript Schema

**Complete pattern:**
```typescript
// src/lib/db.ts
import { Dexie, type EntityTable } from 'dexie'

export type PAO = { value: number; unit: 'days' | 'weeks' | 'months' }
export type ManualStatus = 'Used Up' | 'Disposed' | 'Archived' | null

export interface Medicine {
  id: number
  name: string                    // required (D-07)
  category: string | null
  location: string | null         // null = "Other" (D-17); NEVER store 'Other' string
  expiryDate: string | null       // YYYY-MM-DD — required for add, nullable for import edge cases
  openedDate: string | null       // YYYY-MM-DD
  pao: PAO | null                 // period-after-opening (D-08)
  quantity: number | null
  quantityUnit: string | null
  notes: string | null
  manualStatus: ManualStatus      // D-13: takes precedence over auto-calculated status
  createdAt: string               // ISO timestamp
  updatedAt: string               // ISO timestamp
}

export interface Location {
  id: number
  name: string
  isDefault: boolean              // D-18: predefined locations cannot be renamed/deleted
}

const db = new Dexie('MedStockDB') as Dexie & {
  medicines: EntityTable<Medicine, 'id'>
  locations: EntityTable<Location, 'id'>
}

db.version(1).stores({
  // Only indexed fields listed here; non-indexed fields (pao, openedDate, etc.) don't appear
  // CRITICAL: only add new indexed fields via db.version(2) — never modify version 1 (Pitfall 5)
  medicines: '++id, name, category, location, expiryDate, manualStatus',
  locations: '++id, name, isDefault',
})

// Seed predefined locations on first open
db.on('populate', async () => {
  await db.locations.bulkAdd([
    { name: 'Bathroom cabinet', isDefault: true },
    { name: 'Kitchen', isDefault: true },
    { name: 'Bedroom', isDefault: true },
    { name: 'First aid kit', isDefault: true },
    { name: 'Car', isDefault: true },
  ])
})

export { db }
```

**LOC-04 delete cascade pattern (Dexie transaction):**
```typescript
// Called when user deletes a custom location
async function deleteLocation(locationId: number) {
  await db.transaction('rw', db.locations, db.medicines, async () => {
    const loc = await db.locations.get(locationId)
    if (!loc || loc.isDefault) throw new Error('Cannot delete default location')
    // Set all affected medicines to location: null (sentinel "Other")
    await db.medicines
      .where('location')
      .equals(loc.name)
      .modify({ location: null })
    await db.locations.delete(locationId)
  })
}
```

---

### `src/lib/expiry.ts` (utility, transform)

**Source pattern:** RESEARCH.md §Pattern 4 — calculateStatus pure function

**Complete pattern:**
```typescript
// src/lib/expiry.ts
import type { Medicine } from './db'

export type AutoStatus = 'Active' | 'Opened' | 'Expired'
export type ManualStatus = 'Used Up' | 'Disposed' | 'Archived'
export type MedicineStatus = AutoStatus | ManualStatus

function addPAO(date: Date, pao: { value: number; unit: string }): Date {
  const d = new Date(date)
  if (pao.unit === 'days') d.setDate(d.getDate() + pao.value)
  else if (pao.unit === 'weeks') d.setDate(d.getDate() + pao.value * 7)
  else if (pao.unit === 'months') d.setMonth(d.getMonth() + pao.value)
  return d
}

export function calculateStatus(med: Medicine, now: Date = new Date()): MedicineStatus {
  // D-13: Manual override takes precedence
  if (med.manualStatus) return med.manualStatus

  const expiry = med.expiryDate ? new Date(med.expiryDate) : null
  const opened = med.openedDate ? new Date(med.openedDate) : null
  const paoEnd = opened && med.pao ? addPAO(opened, med.pao) : null

  // D-14: null expiry but PAO set — use PAO only
  if (!expiry && paoEnd) {
    return now <= paoEnd ? 'Opened' : 'Expired'
  }

  // D-15: opened but no PAO — ignore PAO, check expiry only
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

**Critical:** Status is NEVER stored in DB (D-12). Always call `calculateStatus()` at render time.

---

### `src/types/medicine.ts` (model)

**Complete pattern:**
```typescript
// src/types/medicine.ts
// Re-exports DB types + adds display/UI types
export type { Medicine, Location, PAO, ManualStatus } from '@/lib/db'
export type { MedicineStatus, AutoStatus } from '@/lib/expiry'

export const CATEGORIES = [
  'Pain & Fever',
  'Antibiotics',
  'Allergy',
  'Digestive',
  'Vitamins & Supplements',
  'Skin & Topical',
  'Eye & Ear',
  'Cold & Flu',
  'Heart & Circulation',
  'Other',
] as const

export const QUANTITY_UNITS = [
  'tablets',
  'capsules',
  'ml',
  'g',
  'pcs',
  'patches',
  'drops',
  'doses',
] as const
```

---

### `src/stores/uiStore.ts` (store, event-driven)

**Source pattern:** RESEARCH.md §Pattern 5 — Zustand v5 UI Store

**Complete pattern:**
```typescript
// src/stores/uiStore.ts
import { create } from 'zustand'  // Zustand v5: named export (not default)

interface UIState {
  locationDialogOpen: boolean
  setLocationDialogOpen: (open: boolean) => void
  // Extend as Phase 1 adds filter state, selected medicine, etc.
}

// CRITICAL: Zustand v5 requires curried form create<T>()(...) for TypeScript (Pitfall 7)
export const useUIStore = create<UIState>()((set) => ({
  locationDialogOpen: false,
  setLocationDialogOpen: (open) => set({ locationDialogOpen: open }),
}))
```

---

### `src/routes/RootLayout.tsx` (component, request-response)

**Complete pattern:**
```typescript
// src/routes/RootLayout.tsx
import { Outlet } from 'react-router-dom'
import { BottomTabBar } from '@/components/BottomTabBar'

export function RootLayout() {
  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-y-auto pb-16">
        {/* pb-16: padding-bottom to avoid content hiding behind bottom tab bar */}
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  )
}
```

---

### `src/routes/medicines/index.tsx` (component, CRUD)

**useLiveQuery pattern for live medicine list:**
```typescript
// src/routes/medicines/index.tsx
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { calculateStatus } from '@/lib/expiry'
import { MedicineCard } from '@/components/MedicineCard'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function MedicineList() {
  // useLiveQuery: re-renders whenever IndexedDB changes
  const medicines = useLiveQuery(
    () => db.medicines
      .where('manualStatus')
      .notEqual('Disposed')  // INV-04: hide soft-deleted items
      .sortBy('name'),
    []
  )

  if (!medicines) return <div>Loading...</div>

  if (medicines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <p className="text-muted-foreground">No medicines yet. Add your first one.</p>
        <Button asChild>
          <Link to="/medicines/new">Add Medicine</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Medicines</h1>
        <Button asChild size="sm">
          <Link to="/medicines/new">Add</Link>
        </Button>
      </div>
      {medicines.map((med) => (
        <MedicineCard
          key={med.id}
          medicine={med}
          status={calculateStatus(med)}
        />
      ))}
    </div>
  )
}
```

---

### `src/components/MedicineForm.tsx` (component, CRUD)

**Source pattern:** RESEARCH.md §Pattern 6 — React Hook Form + Zod

**Zod schema + form pattern:**
```typescript
// src/components/MedicineForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CATEGORIES, QUANTITY_UNITS } from '@/types/medicine'

const medicineSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  category: z.string().nullable().optional(),
  location: z.string().nullable().optional(),  // null = "Other" (D-17); never store 'Other' string
  openedDate: z.string().nullable().optional(),
  paoValue: z.number().positive().nullable().optional(),
  paoUnit: z.enum(['days', 'weeks', 'months']).nullable().optional(),
  quantity: z.number().positive().nullable().optional(),
  quantityUnit: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type MedicineFormData = z.infer<typeof medicineSchema>

interface MedicineFormProps {
  defaultValues?: Partial<MedicineFormData>
  onSubmit: (data: MedicineFormData) => Promise<void>
  submitLabel?: string
}

export function MedicineForm({ defaultValues, onSubmit, submitLabel = 'Save' }: MedicineFormProps) {
  const form = useForm<MedicineFormData>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: '',
      expiryDate: '',
      category: null,
      location: null,
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Ibuprofen 400mg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Repeat pattern for all other fields */}
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {submitLabel}
        </Button>
      </form>
    </Form>
  )
}
```

---

### `src/routes/medicines/new.tsx` (component, CRUD)

**Dexie add pattern:**
```typescript
// src/routes/medicines/new.tsx
import { useNavigate } from 'react-router-dom'
import { db } from '@/lib/db'
import { MedicineForm, type MedicineFormData } from '@/components/MedicineForm'

export function MedicineNew() {
  const navigate = useNavigate()

  async function handleSubmit(data: MedicineFormData) {
    try {
      const now = new Date().toISOString()
      await db.medicines.add({
        name: data.name,
        expiryDate: data.expiryDate,
        category: data.category ?? null,
        location: data.location ?? null,  // null = "Other" sentinel
        openedDate: data.openedDate ?? null,
        pao: data.paoValue && data.paoUnit
          ? { value: data.paoValue, unit: data.paoUnit }
          : null,
        quantity: data.quantity ?? null,
        quantityUnit: data.quantityUnit ?? null,
        notes: data.notes ?? null,
        manualStatus: null,
        createdAt: now,
        updatedAt: now,
      })
      navigate('/medicines')
    } catch (err) {
      // V7: Don't expose raw Dexie errors to UI
      console.error('Failed to add medicine:', err)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold p-4">Add Medicine</h1>
      <MedicineForm onSubmit={handleSubmit} submitLabel="Add Medicine" />
    </div>
  )
}
```

---

### `src/routes/medicines/[id].edit.tsx` (component, CRUD)

**Dexie update pattern:**
```typescript
// src/routes/medicines/[id].edit.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { MedicineForm, type MedicineFormData } from '@/components/MedicineForm'

export function MedicineEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const medicine = useLiveQuery(() => db.medicines.get(Number(id)), [id])

  async function handleSubmit(data: MedicineFormData) {
    try {
      await db.medicines.update(Number(id), {
        ...data,
        pao: data.paoValue && data.paoUnit
          ? { value: data.paoValue, unit: data.paoUnit }
          : null,
        location: data.location ?? null,
        updatedAt: new Date().toISOString(),
      })
      navigate(`/medicines/${id}`)
    } catch (err) {
      console.error('Failed to update medicine:', err)
    }
  }

  if (!medicine) return <div>Loading...</div>

  return (
    <div>
      <h1 className="text-xl font-semibold p-4">Edit Medicine</h1>
      <MedicineForm
        defaultValues={{ name: medicine.name, expiryDate: medicine.expiryDate ?? '' /* ... */ }}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
    </div>
  )
}
```

---

### `src/routes/locations/index.tsx` (component, CRUD)

**Location management with isDefault guard:**
```typescript
// src/routes/locations/index.tsx
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'

export function LocationsScreen() {
  const locations = useLiveQuery(
    () => db.locations.orderBy('name').toArray(),
    []
  )

  async function handleDelete(locationId: number, locationName: string) {
    // LOC-04: transaction — update medicines, delete location
    await db.transaction('rw', db.locations, db.medicines, async () => {
      await db.medicines
        .where('location')
        .equals(locationName)
        .modify({ location: null })  // null = "Other" sentinel (D-17)
      await db.locations.delete(locationId)
    })
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Locations</h1>
      {locations?.map((loc) => (
        <div key={loc.id} className="flex justify-between items-center py-2">
          <span>{loc.name}</span>
          {/* D-18: Hide edit/delete for isDefault locations */}
          {!loc.isDefault && (
            <button onClick={() => handleDelete(loc.id, loc.name)}>Delete</button>
          )}
        </div>
      ))}
    </div>
  )
}
```

---

### `src/components/StatusBadge.tsx` (component, transform)

**Status to color mapping:**
```typescript
// src/components/StatusBadge.tsx
import type { MedicineStatus } from '@/types/medicine'
import { cn } from '@/lib/utils'  // shadcn/ui utility

const STATUS_STYLES: Record<MedicineStatus, string> = {
  Active: 'bg-green-100 text-green-800',
  Opened: 'bg-blue-100 text-blue-800',
  Expired: 'bg-red-100 text-red-800',
  'Used Up': 'bg-gray-100 text-gray-600',
  Disposed: 'bg-gray-100 text-gray-600',
  Archived: 'bg-yellow-100 text-yellow-800',
}

export function StatusBadge({ status }: { status: MedicineStatus }) {
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_STYLES[status])}>
      {status}
    </span>
  )
}
```

---

### `src/lib/expiry.test.ts` (test, transform)

**Vitest + test structure for calculateStatus:**
```typescript
// src/lib/expiry.test.ts
import { describe, it, expect } from 'vitest'
import { calculateStatus } from './expiry'
import type { Medicine } from './db'

const base: Medicine = {
  id: 1,
  name: 'Test',
  category: null,
  location: null,
  expiryDate: null,
  openedDate: null,
  pao: null,
  quantity: null,
  quantityUnit: null,
  notes: null,
  manualStatus: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const future = new Date('2030-01-01')
const past = new Date('2020-01-01')

describe('calculateStatus', () => {
  it('returns Active when expiry is in future and not opened', () => {
    const med = { ...base, expiryDate: '2030-12-31' }
    expect(calculateStatus(med, past)).toBe('Active')
  })

  it('returns Expired when past expiry date', () => {
    const med = { ...base, expiryDate: '2020-01-01' }
    expect(calculateStatus(med, future)).toBe('Expired')
  })

  it('D-13: manual status takes precedence', () => {
    const med = { ...base, expiryDate: '2020-01-01', manualStatus: 'Archived' as const }
    expect(calculateStatus(med, future)).toBe('Archived')
  })

  it('D-14: null expiry + PAO set, uses PAO only', () => {
    const med = {
      ...base,
      expiryDate: null,
      openedDate: '2026-06-01',
      pao: { value: 30, unit: 'days' as const },
    }
    const withinPAO = new Date('2026-06-15')
    const afterPAO = new Date('2026-07-15')
    expect(calculateStatus(med, withinPAO)).toBe('Opened')
    expect(calculateStatus(med, afterPAO)).toBe('Expired')
  })

  it('D-15: opened + no PAO — status based on expiry only', () => {
    const med = {
      ...base,
      expiryDate: '2026-12-31',
      openedDate: '2026-06-01',
      pao: null,
    }
    expect(calculateStatus(med, new Date('2026-06-15'))).toBe('Opened')
    expect(calculateStatus(med, new Date('2027-01-01'))).toBe('Expired')
  })
})
```

---

### `src/setupTests.ts` (config)

```typescript
// src/setupTests.ts
import '@testing-library/jest-dom'
```

**Vitest config block (add to `vite.config.ts` under `defineConfig`):**
```typescript
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
  },
```

---

## Shared Patterns

### Dexie Live Query Pattern
**Apply to:** All route components that read medicine or location data
```typescript
const data = useLiveQuery(() => db.table.toArray(), [])
if (!data) return <div>Loading...</div>
```
`useLiveQuery` returns `undefined` on first render — always guard with loading state.

### Error Handling for Dexie Writes
**Apply to:** All components that call `db.medicines.add()`, `.update()`, `.delete()`
```typescript
try {
  await db.medicines.add(...)
} catch (err) {
  // V7 (ASVS): never expose raw Dexie errors to UI
  console.error('Operation failed:', err)
  // Show user-friendly toast/message instead
}
```

### location null Sentinel Pattern
**Apply to:** All code that reads or writes `medicine.location`
- Store: `location: null` means "Other"
- Display: `medicine.location ?? 'Other'`
- Query (LOC-04): `db.medicines.where('location').equals(locationName).modify({ location: null })`
- Zod schema: `z.string().nullable()` — never `.default('Other')`

### shadcn/ui Import Pattern
**Apply to:** All UI components
```typescript
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
```
All imports use `@/` alias (configured in `vite.config.ts` → `resolve.alias`).

### Dates as YYYY-MM-DD Strings
**Apply to:** All date fields in Medicine (expiryDate, openedDate)
```typescript
// Store as string: '2026-12-31'
// Parse for calculation: new Date(med.expiryDate)
// Never store as Date object — causes timezone bugs in IndexedDB
```

---

## No Analog Found

All 21 files have no codebase analog — this is a blank-slate project. The patterns above are sourced entirely from RESEARCH.md, which cites official library documentation.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| All 21 files | various | various | Blank-slate project — first phase establishes all foundational patterns |

---

## Metadata

**Analog search scope:** Entire repository — only `.planning/` directory found (no `src/` exists)
**Files scanned:** 0 source files (codebase has no implementation files yet)
**Pattern extraction date:** 2026-06-30
**Pattern sources:** RESEARCH.md (01-RESEARCH.md) citing official docs for Dexie, React Router v7, Zustand v5, Tailwind v4, vite-plugin-pwa, React Hook Form + Zod
