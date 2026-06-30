# Phase 2: Search, Dashboard & Audit - Pattern Map

**Mapped:** 2026-06-30
**Files analyzed:** 12 new/modified files
**Analogs found:** 12 / 12

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/db.ts` | config/schema | CRUD | `src/lib/db.ts` (self — extend) | exact |
| `src/stores/uiStore.ts` | store | event-driven | `src/stores/uiStore.ts` (self — extend) | exact |
| `src/lib/historyOps.ts` | utility | CRUD | `src/lib/locationOps.ts` | role-match |
| `src/routes/medicines/index.tsx` | route/component | request-response | `src/routes/medicines/index.tsx` (self — extend) | exact |
| `src/routes/dashboard/index.tsx` | route/component | request-response | `src/routes/locations/index.tsx` | role-match |
| `src/routes/trash/index.tsx` | route/component | request-response | `src/routes/locations/index.tsx` | role-match |
| `src/routes/medicines/[id].tsx` | route/component | request-response | `src/routes/medicines/[id].tsx` (self — modify) | exact |
| `src/App.tsx` | config/routing | request-response | `src/App.tsx` (self — extend) | exact |
| `src/components/BottomTabBar.tsx` | component | event-driven | `src/components/BottomTabBar.tsx` (self — extend) | exact |
| `src/components/SearchBar.tsx` | component | event-driven | `src/components/ui/input.tsx` | partial |
| `src/components/FilterBottomSheet.tsx` | component | event-driven | `src/routes/locations/index.tsx` (modal pattern) | partial |
| `src/components/FilterChips.tsx` | component | event-driven | `src/components/MedicineCard.tsx` | partial |
| `src/components/DashboardCard.tsx` | component | request-response | `src/components/MedicineCard.tsx` | role-match |
| `src/components/ChangeHistory.tsx` | component | request-response | `src/routes/medicines/[id].tsx` (detail section) | role-match |
| `src/components/ui/sheet.tsx` | utility/ui | event-driven | `src/components/ui/alert-dialog.tsx` | role-match |

---

## Pattern Assignments

### `src/lib/db.ts` (config/schema — MODIFY)

**Analog:** `src/lib/db.ts` (self)

**Current structure to preserve** (lines 1–54):
```typescript
import { Dexie, type EntityTable } from 'dexie'
// ... interfaces ...
const db = new Dexie('MedStockDB') as Dexie & {
  medicines: EntityTable<Medicine, 'id'>
  locations: EntityTable<Location, 'id'>
}
db.version(1).stores({ ... })
```

**New interface additions** — add to existing interfaces after line 20 (Medicine):
```typescript
// Add to Medicine interface:
deletedAt: string | null   // null = active; ISO string = soft-deleted (D-25)

// New HistoryEntry interface — add before `const db`:
export interface HistoryEntry {
  id?: number
  medicineId: number
  medicineName: string   // denormalized — readable after medicine hard-deleted (D-36, D-38)
  action: 'created' | 'updated' | 'deleted' | 'restored'
  changedFields: { field: string; oldValue: unknown; newValue: unknown }[]
  timestamp: string      // ISO 8601
}
```

**New version block** — add after line 38 (`db.version(1).stores(...)`), NEVER modify version 1:
```typescript
db.version(2)
  .stores({
    // CRITICAL: deletedAt is NOT in the index string (Pitfall 1 — null is not a valid IndexedDB key)
    // Query active/deleted with toCollection().filter() instead of where().equals(null)
    medicines: '++id, name, category, location, expiryDate, manualStatus',
    history:   '++id, medicineId, timestamp',
  })
  .upgrade(tx =>
    tx.table('medicines').toCollection().modify((m: Medicine) => {
      m.deletedAt = null
    })
  )
```

**EntityTable addition** — update db type cast to include history:
```typescript
const db = new Dexie('MedStockDB') as Dexie & {
  medicines: EntityTable<Medicine, 'id'>
  locations: EntityTable<Location, 'id'>
  history:   EntityTable<HistoryEntry, 'id'>   // NEW
}
```

---

### `src/stores/uiStore.ts` (store — MODIFY)

**Analog:** `src/stores/uiStore.ts` (self, lines 1–13)

**Current pattern to preserve** (lines 1–13):
```typescript
import { create } from 'zustand'

interface UIState {
  locationDialogOpen: boolean
  setLocationDialogOpen: (open: boolean) => void
}

// CRITICAL: Zustand v5 requires curried form create<T>()(...) for TypeScript (Pitfall 7)
export const useUIStore = create<UIState>()((set) => ({
  locationDialogOpen: false,
  setLocationDialogOpen: (open) => set({ locationDialogOpen: open }),
}))
```

**Extended pattern** — replace entire file, preserving existing state and adding new:
```typescript
import { create } from 'zustand'
import { shallow } from 'zustand/shallow'   // Pitfall 4: needed for array selectors

export type SortField = 'name' | 'expiryDate' | 'category'
export type SortDirection = 'asc' | 'desc'

interface UIState {
  // --- Existing (Phase 1) ---
  locationDialogOpen: boolean
  setLocationDialogOpen: (open: boolean) => void

  // --- New: filter/sort state (D-31) ---
  selectedCategories: string[]
  selectedLocations: string[]
  selectedStatuses: string[]
  sortField: SortField
  sortDirection: SortDirection
  filterSheetOpen: boolean

  toggleCategory: (value: string) => void
  toggleLocation: (value: string) => void
  toggleStatus: (value: string) => void
  setSort: (field: SortField, direction: SortDirection) => void
  clearAllFilters: () => void
  setFilterSheetOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()((set) => ({
  locationDialogOpen: false,
  setLocationDialogOpen: (open) => set({ locationDialogOpen: open }),

  selectedCategories: [],
  selectedLocations: [],
  selectedStatuses: [],
  sortField: 'name',
  sortDirection: 'asc',
  filterSheetOpen: false,

  toggleCategory: (value) => set(s => ({
    selectedCategories: s.selectedCategories.includes(value)
      ? s.selectedCategories.filter(v => v !== value)
      : [...s.selectedCategories, value]
  })),
  toggleLocation: (value) => set(s => ({
    selectedLocations: s.selectedLocations.includes(value)
      ? s.selectedLocations.filter(v => v !== value)
      : [...s.selectedLocations, value]
  })),
  toggleStatus: (value) => set(s => ({
    selectedStatuses: s.selectedStatuses.includes(value)
      ? s.selectedStatuses.filter(v => v !== value)
      : [...s.selectedStatuses, value]
  })),
  setSort: (field, direction) => set({ sortField: field, sortDirection: direction }),
  clearAllFilters: () => set({ selectedCategories: [], selectedLocations: [], selectedStatuses: [] }),
  setFilterSheetOpen: (open) => set({ filterSheetOpen: open }),
}))

// Derived selector — badge count for filter icon (D-29)
export const useActiveFilterCount = () =>
  useUIStore(s => s.selectedCategories.length + s.selectedLocations.length + s.selectedStatuses.length)

// Re-export shallow for consumers of array state (Pitfall 4)
export { shallow }
```

---

### `src/lib/historyOps.ts` (utility — NEW)

**Analog:** `src/lib/locationOps.ts` (lines 1–29) — same role: utility functions that wrap `db.transaction()` calls

**Imports pattern** (copy from locationOps.ts line 1):
```typescript
import { db } from './db'
import type { Medicine, HistoryEntry } from './db'
```

**Transaction pattern** (from locationOps.ts lines 12–18 — `db.transaction('rw', ...)`):
```typescript
await db.transaction('rw', db.locations, db.medicines, async () => {
  // atomic: both writes succeed or both fail
  await db.medicines.where('location').equals(loc.name).modify({ location: trimmed })
  await db.locations.update(locationId, { name: trimmed })
})
```

**Adapted for historyOps.ts** — same transaction pattern, different tables:
```typescript
// Diff utility — JSON.stringify handles PAO object comparison (Pitfall 8)
export function diffMedicine(
  before: Medicine,
  after: Partial<Medicine>
): HistoryEntry['changedFields'] {
  const tracked: (keyof Medicine)[] = [
    'name', 'category', 'location', 'expiryDate', 'openedDate',
    'pao', 'quantity', 'quantityUnit', 'notes', 'manualStatus'
  ]
  return tracked
    .filter(field => JSON.stringify(before[field]) !== JSON.stringify(after[field]))
    .map(field => ({ field, oldValue: before[field], newValue: after[field] as unknown }))
}

// Atomic update + history — same db.transaction pattern as locationOps.ts
export async function updateMedicineWithHistory(
  id: number,
  before: Medicine,
  changes: Partial<Medicine>
): Promise<void> {
  await db.transaction('rw', db.medicines, db.history, async () => {
    await db.medicines.update(id, { ...changes, updatedAt: new Date().toISOString() })
    await db.history.add({
      medicineId: id,
      medicineName: before.name,
      action: 'updated',
      changedFields: diffMedicine(before, changes),
      timestamp: new Date().toISOString(),
    })
  })
}

export async function softDeleteMedicine(medicine: Medicine): Promise<void> {
  const now = new Date().toISOString()
  await db.transaction('rw', db.medicines, db.history, async () => {
    await db.medicines.update(medicine.id, { deletedAt: now, updatedAt: now })
    await db.history.add({
      medicineId: medicine.id,
      medicineName: medicine.name,
      action: 'deleted',
      changedFields: [],
      timestamp: now,
    })
  })
}

export async function restoreMedicine(medicine: Medicine): Promise<void> {
  const now = new Date().toISOString()
  await db.transaction('rw', db.medicines, db.history, async () => {
    await db.medicines.update(medicine.id, { deletedAt: null, updatedAt: now })
    await db.history.add({
      medicineId: medicine.id,
      medicineName: medicine.name,
      action: 'restored',
      changedFields: [],   // D-28: manualStatus unchanged on restore
      timestamp: now,
    })
  })
}

export async function permanentDeleteMedicine(medicine: Medicine): Promise<void> {
  const now = new Date().toISOString()
  await db.transaction('rw', db.medicines, db.history, async () => {
    // History entry first — uses medicine.name before record is gone (D-38)
    await db.history.add({
      medicineId: medicine.id,
      medicineName: medicine.name,
      action: 'deleted',
      changedFields: [],
      timestamp: now,
    })
    await db.medicines.delete(medicine.id)
    // NEVER delete db.history records for this medicineId (D-38, TRSH-04, Pitfall 6)
  })
}
```

**Error handling pattern** (from locationOps.ts — throw, let caller catch):
```typescript
// locationOps.ts throws; callers catch and set local error state
// Adopt same pattern: throw from historyOps; route components catch with try/catch + console.error
```

---

### `src/routes/medicines/index.tsx` (route — MODIFY)

**Analog:** `src/routes/medicines/index.tsx` (self, lines 1–52)

**Current useLiveQuery pattern** (lines 10–17) — must change filter approach:
```typescript
// CURRENT (Phase 1 — REPLACE):
const medicines = useLiveQuery(
  () =>
    db.medicines
      .where('manualStatus')
      .notEqual('Disposed')  // <-- wrong delete mechanism; Phase 2 uses deletedAt
      .sortBy('name'),
  [],
)
```

**New pattern** — two-step query + memo (RESEARCH.md Pattern 3):
```typescript
// STEP 1: Dexie reactive query — re-runs only when DB data changes
const [searchQuery, setSearchQuery] = useState('')
const { selectedCategories, selectedLocations, selectedStatuses, sortField, sortDirection } =
  useUIStore()

const medicines = useLiveQuery(
  () => {
    const q = searchQuery.toLowerCase().trim()
    return db.medicines
      .toCollection()
      .filter(m => {
        if (m.deletedAt !== null) return false   // active only (D-25)
        if (q && !m.name.toLowerCase().includes(q)) return false  // D-21: substring match
        return true
      })
      .toArray()
  },
  [searchQuery],   // re-run when search changes; Zustand filters handled in useMemo below
)

// STEP 2: In-memory filter for status/category/location (calculateStatus is render-time, Pitfall 3)
const filtered = useMemo(() => {
  if (!medicines) return []
  const now = new Date()
  return medicines
    .filter(m => {
      const status = calculateStatus(m, now)
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(status)) return false
      if (selectedCategories.length > 0 && !selectedCategories.includes(m.category ?? 'Other')) return false
      if (selectedLocations.length > 0 && !selectedLocations.includes(m.location ?? 'Other')) return false
      return true
    })
    .sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1
      const va = a[sortField as keyof Medicine] ?? ''
      const vb = b[sortField as keyof Medicine] ?? ''
      return String(va).localeCompare(String(vb)) * dir
    })
}, [medicines, selectedStatuses, selectedCategories, selectedLocations, sortField, sortDirection])
```

**JSX structure pattern** (preserve from current lines 19–52 — loading/empty states):
```typescript
// Keep existing loading/empty state guards (lines 19–31):
if (medicines === undefined) { return <div>Loading...</div> }
if (filtered.length === 0) { /* empty state with Add button */ }
// Map over filtered (not medicines) for the list:
{filtered.map((med) => <MedicineCard key={med.id} medicine={med} />)}
```

---

### `src/routes/dashboard/index.tsx` (route — NEW)

**Analog:** `src/routes/locations/index.tsx` — same role: screen component with useLiveQuery + list render

**Imports pattern** (from locations/index.tsx lines 1–17):
```typescript
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/lib/db'
import { calculateStatus } from '@/lib/expiry'
import { DashboardCard } from '@/components/DashboardCard'
```

**useLiveQuery pattern** (from locations/index.tsx line 20 — single reactive query):
```typescript
// Single full scan — all metric computation in one pass (RESEARCH.md Pattern 9)
const stats = useLiveQuery(async () => {
  const all = await db.medicines
    .toCollection()
    .filter(m => m.deletedAt === null)
    .toArray()
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const in30 = new Date(now.getTime() + 30 * 86_400_000).toISOString().slice(0, 10)
  let expired = 0, expiringSoon = 0, exceededOpenPeriod = 0
  for (const m of all) {
    const status = calculateStatus(m, now)
    if (status === 'Expired') expired++
    if (m.manualStatus === null && m.expiryDate && m.expiryDate > today && m.expiryDate <= in30) expiringSoon++
    if (status === 'Expired' && m.expiryDate && m.expiryDate > today) exceededOpenPeriod++
  }
  return { total: all.length, expired, expiringSoon, exceededOpenPeriod }
}, [])
```

**Loading guard pattern** (from locations/index.tsx line 68):
```typescript
if (!stats) return <div className="p-4">Loading...</div>
```

**Navigation-on-tap pattern** (from [id].tsx line 22, useNavigate):
```typescript
const navigate = useNavigate()
// DashboardCard receives: onTap={() => navigate('/medicines?preset=expired')}
// Or: navigate + set Zustand filter state before navigating
```

---

### `src/routes/trash/index.tsx` (route — NEW)

**Analog:** `src/routes/locations/index.tsx` — list with action buttons per item; confirmation dialogs

**Imports pattern** (from locations/index.tsx lines 1–17):
```typescript
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { restoreMedicine, permanentDeleteMedicine } from '@/lib/historyOps'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
```

**useLiveQuery for deleted records** (inverse of active query):
```typescript
const deletedMedicines = useLiveQuery(
  () =>
    db.medicines
      .toCollection()
      .filter(m => m.deletedAt !== null)
      .sortBy('name'),
  []
)
```

**Action handler pattern** (from locations/index.tsx lines 28–66 — async handlers with try/catch):
```typescript
async function handleRestore(medicine: Medicine) {
  try {
    await restoreMedicine(medicine)
  } catch (err) {
    console.error('Failed to restore medicine:', err)
  }
}
```

**Confirmation dialog pattern** (from locations/index.tsx lines 139–161 — AlertDialog per item):
```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm">Delete permanently</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
      <AlertDialogDescription>
        This cannot be undone. Change history will be preserved.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={() => void handlePermanentDelete(medicine)}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Empty state pattern** (from medicines/index.tsx lines 28–33):
```typescript
if (deletedMedicines.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <p className="text-gray-500">Trash is empty.</p>
    </div>
  )
}
```

---

### `src/routes/medicines/[id].tsx` (route — MODIFY)

**Analog:** `src/routes/medicines/[id].tsx` (self, lines 1–173)

**Delete handler to replace** (lines 27–38 — REPLACE this block):
```typescript
// CURRENT (Phase 1 — wrong mechanism; sets manualStatus instead of deletedAt):
async function handleDelete() {
  try {
    await db.medicines.update(Number(id), {
      manualStatus: 'Disposed',   // <-- REPLACE with softDeleteMedicine()
      updatedAt: new Date().toISOString(),
    })
    void navigate('/medicines')
  } catch (err) { ... }
}
```

**New delete handler** (uses historyOps.ts):
```typescript
import { softDeleteMedicine } from '@/lib/historyOps'

async function handleDelete() {
  if (!medicine) return
  try {
    await softDeleteMedicine(medicine)   // sets deletedAt + writes history entry
    void navigate('/medicines')
  } catch (err) {
    console.error('Failed to delete medicine:', err)
  }
}
```

**History section addition** — add after line 128 (after notes field, before Actions):
```typescript
import { ChangeHistory } from '@/components/ChangeHistory'

// Inside JSX, below the <dl> field list:
<ChangeHistory medicineId={medicine.id} />
```

**Edit handler update** (medicine edit should use `updateMedicineWithHistory`):
```typescript
// In [id].edit.tsx handleSubmit — replace direct db.medicines.update() with:
import { updateMedicineWithHistory } from '@/lib/historyOps'
// await updateMedicineWithHistory(id, beforeSnapshot, formValues)
```

---

### `src/App.tsx` (routing — MODIFY)

**Analog:** `src/App.tsx` (self, lines 1–42)

**Import additions** (after line 8):
```typescript
import { DashboardScreen } from '@/routes/dashboard/index'
import { TrashScreen } from '@/routes/trash/index'
```

**Route additions** (inside children array, after line 21):
```typescript
{ path: 'dashboard', element: <DashboardScreen /> },
{ path: 'trash', element: <TrashScreen /> },
```

**Router created outside component** — preserve critical pattern from line 11:
```typescript
// CRITICAL: router created OUTSIDE React tree — never inside a component or useState (Pitfall 4)
const router = createHashRouter([...])
```

---

### `src/components/BottomTabBar.tsx` (component — MODIFY)

**Analog:** `src/components/BottomTabBar.tsx` (self, lines 1–35)

**NavLink pattern to copy** (lines 7–19) for each new tab:
```typescript
<NavLink
  to="/dashboard"
  className={({ isActive }) =>
    cn(
      'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
      isActive
        ? 'text-primary border-t-2 border-primary'
        : 'text-gray-500 hover:text-gray-700',
    )
  }
>
  <span>Dashboard</span>
</NavLink>
```

**Tab order** (D-39): Medicines | Dashboard | Trash | Locations

---

### `src/components/SearchBar.tsx` (component — NEW)

**Analog:** `src/components/ui/input.tsx` + pattern from `src/routes/locations/index.tsx` lines 79–95 (Input with onChange)

**Imports pattern**:
```typescript
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
```

**Core pattern** (controlled input with clear button):
```typescript
interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search medicines…' }: SearchBarProps) {
  return (
    <div className="relative flex items-center">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-8"
        autoComplete="off"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 h-6 w-6 p-0"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          ×
        </Button>
      )}
    </div>
  )
}
```

---

### `src/components/FilterBottomSheet.tsx` (component — NEW)

**Analog:** `src/routes/locations/index.tsx` lines 1–17 (imports) + `src/components/ui/alert-dialog.tsx` (Radix-backed sheet pattern)

**Imports pattern** (shadcn Sheet — installed via `npx shadcn@latest add sheet`):
```typescript
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useUIStore, shallow } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
```

**Core pattern**:
```typescript
export function FilterBottomSheet() {
  const { filterSheetOpen, setFilterSheetOpen, clearAllFilters } = useUIStore()
  const selectedCategories = useUIStore(s => s.selectedCategories, shallow)  // Pitfall 4
  const selectedLocations  = useUIStore(s => s.selectedLocations, shallow)
  const selectedStatuses   = useUIStore(s => s.selectedStatuses, shallow)

  return (
    <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Filter & Sort</SheetTitle>
        </SheetHeader>
        {/* Filter sections: status, category, location checkboxes */}
        {/* Clear all button */}
        <Button variant="outline" onClick={clearAllFilters}>Clear all filters</Button>
      </SheetContent>
    </Sheet>
  )
}
```

---

### `src/components/DashboardCard.tsx` (component — NEW)

**Analog:** `src/components/MedicineCard.tsx` (lines 1–35) — card layout with status-driven color

**Imports pattern** (from MedicineCard.tsx lines 1–4):
```typescript
import { cn } from '@/lib/utils'
```

**Core pattern** (card with tap handler, similar to MedicineCard's Link wrapper):
```typescript
interface DashboardCardProps {
  label: string
  count: number
  colorClass: string   // e.g. 'text-red-600 border-red-200 bg-red-50'
  onTap: () => void
}

export function DashboardCard({ label, count, colorClass, onTap }: DashboardCardProps) {
  return (
    <button
      onClick={onTap}
      className={cn(
        'block w-full rounded-lg border p-4 text-left shadow-sm transition-colors hover:border-gray-300',
        colorClass
      )}
    >
      <p className="text-3xl font-bold">{count}</p>
      <p className="text-sm font-medium mt-1">{label}</p>
    </button>
  )
}
```

---

### `src/components/ChangeHistory.tsx` (component — NEW)

**Analog:** `src/routes/medicines/[id].tsx` lines 24–25 (`useLiveQuery` with `[id]` dep) + `src/routes/locations/index.tsx` (list render pattern)

**Imports pattern**:
```typescript
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { HistoryEntry } from '@/lib/db'
```

**useLiveQuery with dep** (from [id].tsx line 24):
```typescript
// [id].tsx: const medicine = useLiveQuery(() => db.medicines.get(Number(id)), [id])
// Adapt:
const history = useLiveQuery(
  () =>
    db.history
      .where('medicineId')
      .equals(medicineId)
      .sortBy('timestamp'),
  [medicineId]
)
```

**Entry formatting and render**:
```typescript
function formatEntry(entry: HistoryEntry): string {
  const ts = new Date(entry.timestamp).toLocaleString('en-GB', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
  if (entry.action === 'created') return `${ts} — Medicine added`
  if (entry.action === 'deleted') return `${ts} — Moved to Trash Bin`
  if (entry.action === 'restored') return `${ts} — Restored from Trash Bin`
  if (entry.changedFields.length === 1) {
    const { field, oldValue, newValue } = entry.changedFields[0]
    return `${ts} — ${field} changed from "${String(oldValue)}" to "${String(newValue)}"`
  }
  return `${ts} — ${entry.changedFields.length} fields updated`
}
```

---

### `src/components/FilterChips.tsx` (component — NEW)

**Analog:** `src/components/MedicineCard.tsx` (small visual unit pattern) + `src/stores/uiStore.ts` (toggle actions)

**Core pattern** (dismissible chip row):
```typescript
import { useUIStore, shallow } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'

export function FilterChips() {
  const selectedCategories = useUIStore(s => s.selectedCategories, shallow)
  const selectedLocations  = useUIStore(s => s.selectedLocations, shallow)
  const selectedStatuses   = useUIStore(s => s.selectedStatuses, shallow)
  const { toggleCategory, toggleLocation, toggleStatus } = useUIStore()

  const all = [
    ...selectedCategories.map(v => ({ label: `Category: ${v}`, remove: () => toggleCategory(v) })),
    ...selectedLocations.map(v => ({ label: `Location: ${v}`, remove: () => toggleLocation(v) })),
    ...selectedStatuses.map(v => ({ label: `Status: ${v}`, remove: () => toggleStatus(v) })),
  ]
  if (all.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {all.map(chip => (
        <span key={chip.label} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
          {chip.label}
          <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={chip.remove} aria-label={`Remove ${chip.label}`}>×</Button>
        </span>
      ))}
    </div>
  )
}
```

---

### `src/components/ui/sheet.tsx` (ui primitive — NEW)

**Analog:** `src/components/ui/alert-dialog.tsx` — same shadcn copy-paste pattern (Radix-backed)

**Install:** `npx shadcn@latest add sheet`

This generates `src/components/ui/sheet.tsx` in-repo. It follows the exact same copy-paste pattern as `alert-dialog.tsx` — imports from `@radix-ui/react-dialog`, re-exports named sub-components. No manual coding needed.

---

## Shared Patterns

### useLiveQuery Reactive Query
**Source:** `src/routes/medicines/index.tsx` lines 10–17 and `src/routes/medicines/[id].tsx` line 24
**Apply to:** `dashboard/index.tsx`, `trash/index.tsx`, `ChangeHistory.tsx`, `medicines/index.tsx` (modified)

```typescript
// Pattern: useLiveQuery(querier, [deps])
// - querier is async; re-runs when IndexedDB tables change OR deps array changes
// - always guard undefined (loading) before rendering
const data = useLiveQuery(() => db.someTable.toArray(), [someId])
if (data === undefined) return <div className="p-4">Loading...</div>
```

### Dexie Transaction (multi-table atomic write)
**Source:** `src/lib/locationOps.ts` lines 12–18
**Apply to:** All functions in `historyOps.ts`

```typescript
await db.transaction('rw', db.medicines, db.history, async () => {
  await db.medicines.update(id, changes)
  await db.history.add(historyEntry)
})
```

### Error Handling in Route Handlers
**Source:** `src/routes/locations/index.tsx` lines 28–36, 46–54, 58–65
**Apply to:** `trash/index.tsx` restore/delete handlers, `[id].tsx` modified delete handler

```typescript
async function handleAction() {
  try {
    await someOp()
  } catch (err) {
    console.error('Failed to <action>:', err)
    // Optionally: setError('Human-readable message')
  }
}
```

### AlertDialog Confirmation for Destructive Actions
**Source:** `src/routes/medicines/[id].tsx` lines 137–163 and `src/routes/locations/index.tsx` lines 139–161
**Apply to:** Permanent delete button in `trash/index.tsx`

```typescript
<AlertDialog>
  <AlertDialogTrigger asChild><Button variant="destructive">...</Button></AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>...</AlertDialogTitle>
      <AlertDialogDescription>...</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={() => void handler()}>Confirm</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Zustand Array Selector with shallow
**Source:** `src/stores/uiStore.ts` (extended pattern)
**Apply to:** `FilterBottomSheet.tsx`, `FilterChips.tsx`, `medicines/index.tsx`

```typescript
import { shallow } from 'zustand/shallow'
// Use shallow as second arg to prevent re-render when array reference changes (Pitfall 4):
const items = useUIStore(s => s.selectedCategories, shallow)
```

### `toCollection().filter()` for Non-Indexed Fields
**Source:** RESEARCH.md Pattern 2 (critical finding — Pitfall 1)
**Apply to:** `medicines/index.tsx`, `dashboard/index.tsx`, `trash/index.tsx`

```typescript
// NEVER: db.medicines.where('deletedAt').equals(null)  — null is not a valid IndexedDB key
// ALWAYS:
db.medicines.toCollection().filter(m => m.deletedAt === null).toArray()
db.medicines.toCollection().filter(m => m.deletedAt !== null).toArray()
```

### calculateStatus at Render Time (not inside useLiveQuery)
**Source:** `src/components/MedicineCard.tsx` line 12, `src/routes/medicines/[id].tsx` line 61
**Apply to:** `medicines/index.tsx` useMemo, `dashboard/index.tsx` stats computation

```typescript
// D-11, Pitfall 3: calculateStatus() uses current time — must run at render time, not inside the async querier
// In components: const status = calculateStatus(medicine)
// In useMemo / non-async context: const status = calculateStatus(m, now)
```

---

## No Analog Found

All files have close analogs in the existing codebase. No entries.

---

## Critical Pitfalls to Carry into Planning

| # | File(s) Affected | Pitfall | Guard |
|---|-----------------|---------|-------|
| P1 | `db.ts`, `medicines/index.tsx`, `dashboard/index.tsx`, `trash/index.tsx` | Indexing `deletedAt` silently breaks null queries | Remove `deletedAt` from stores string; use `.filter()` |
| P2 | `[id].tsx`, `[id].edit.tsx` | Phase 1 delete sets `manualStatus: 'Disposed'`; must be replaced with `deletedAt` | Replace `handleDelete` to call `softDeleteMedicine()` |
| P3 | `medicines/index.tsx`, `dashboard/index.tsx` | `calculateStatus()` inside useLiveQuery querier won't update on time change | Keep `calculateStatus` in `useMemo` or render body |
| P4 | `FilterBottomSheet.tsx`, `FilterChips.tsx`, `medicines/index.tsx` | Array state selector without `shallow` causes excessive re-renders | Always use `useUIStore(s => s.arr, shallow)` |
| P5 | `historyOps.ts`, `trash/index.tsx` | Lifecycle events (delete/restore) missing history entry | All mutations via `db.transaction` that includes `db.history.add()` |
| P6 | `trash/index.tsx` | Permanent delete must NOT remove history entries | `db.medicines.delete(id)` only; never touch `db.history` |

---

## Metadata

**Analog search scope:** `src/` (all TypeScript/TSX files)
**Files scanned:** 29
**Pattern extraction date:** 2026-06-30
