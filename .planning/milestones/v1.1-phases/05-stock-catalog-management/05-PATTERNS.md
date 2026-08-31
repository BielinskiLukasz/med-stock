# Phase 05: Stock & Catalog Management - Pattern Map

**Mapped:** 2026-07-30  
**Files analyzed:** 16 (12 modified + 4 new)  
**Analogs found:** 16/16 (100% coverage)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/db.ts` | config/schema | CRUD | itself (v3 → v4 migration) | exact |
| `src/lib/historyOps.ts` | utility/service | CRUD (mutations) | itself (no changes) | exact |
| `src/routes/medicines/index.tsx` | route/component | CRUD (read) | itself (catalog join) | exact |
| `src/routes/medicines/[id].tsx` | route/component | CRUD (read + actions) | itself (catalog detail) | exact |
| `src/routes/medicines/new.tsx` | route/component | CRUD (create) | itself (3-step state machine) | exact |
| `src/components/MedicineCard.tsx` | component | request-response | itself (catalog aggregate) | exact |
| `src/components/MedicineForm.tsx` | component | request-response | itself (decompose to subcomponents) | exact |
| `src/components/FilterBottomSheet.tsx` | component | request-response | itself (unchanged) | exact |
| `src/components/FilterChips.tsx` | component | request-response | itself (unchanged) | exact |
| `src/components/ui/sheet.tsx` | component/primitive | request-response | itself (unchanged) | exact |
| `src/components/StatusBadge.tsx` | component | request-response | itself (unchanged) | exact |
| `src/stores/uiStore.ts` | store | state management | itself (filter semantics) | exact |
| `src/components/StockEditSheet.tsx` (new) | component | request-response | `FilterBottomSheet.tsx` | role-match |
| `src/components/MoveStockSheet.tsx` (new) | component | request-response | `FilterBottomSheet.tsx` | role-match |
| `src/components/CatalogEditSheet.tsx` (new) | component | request-response | `MedicineForm.tsx` | role-match |
| `src/components/CatalogAutocomplete.tsx` (new) | component | request-response | `MedicineForm.tsx` | role-match |

---

## Pattern Assignments

### `src/lib/db.ts` (config/schema, CRUD)

**Analog:** `src/lib/db.ts` (existing v1–v3)

**Schema versioning pattern** (lines 82–189):
```typescript
// Dexie uses .version(N) chaining for schema migrations
db.version(1).stores({
  medicines: '++id, name, category, location, expiryDate, manualStatus',
  locations: '++id, name, isDefault',
})

db.version(2)
  .stores({
    medicines: '++id, name, category, location, expiryDate, manualStatus',
    history:   '++id, medicineId, timestamp',
  })
  .upgrade(tx =>
    tx.table('medicines').toCollection().modify((m: any) => {
      m.deletedAt = null
      m.catalogId = 0
    })
  )

// Phase 5: db.version(4) added here
// Remove 'name' and 'category' from medicines index string
// No row data modification needed; Dexie ignores unknown fields
```

**Medicine interface update** (lines 24–47):
```typescript
// Phase 5: Remove name and category fields from Medicine interface
// Stock entries now contain only: id, catalogId, quantity, quantityUnit,
// expiryDate, openedDate, pao, location, manualStatus, notes, createdAt, updatedAt, deletedAt
export interface Medicine {
  id: number
  catalogId: number
  location: string | null       // null = "Other"
  expiryDate: string | null
  openedDate: string | null
  pao: PAO | null
  quantity: number | null
  quantityUnit: string | null
  notes: string | null
  manualStatus: ManualStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}
```

**Seed predefined locations pattern** (lines 190–202):
```typescript
db.on('populate', async () => {
  await db.locations.bulkAdd([
    { name: 'Bathroom Cabinet', isDefault: true },
    { name: 'Bedroom Cabinet', isDefault: true },
    // ... etc
  ])
})
```

---

### `src/lib/historyOps.ts` (utility/service, CRUD)

**Analog:** `src/lib/historyOps.ts` (existing — no changes to this file)

**Key pattern — explicit medicineName parameter** (lines 41–58):
```typescript
// All mutation functions take explicit medicineName parameter (Phase 4, D-06)
// Phase 5 callers supply catalog.name directly
export async function updateMedicineWithHistory(
  id: number,
  before: Medicine,
  changes: Partial<Medicine>,
  medicineName: string  // Caller passes catalog name, not stock entry name
): Promise<void> {
  const now = new Date().toISOString()
  await db.transaction('rw', db.medicines, db.history, async () => {
    await db.medicines.update(id, { ...changes, updatedAt: now })
    await db.history.add({
      medicineId: id,
      medicineName: medicineName,  // Always denormalized for history readability
      action: 'updated',
      changedFields: diffMedicine(before, changes),
      timestamp: now,
    })
  })
}
```

**Note:** Phase 5 does not modify `historyOps.ts`. All callers (in routes and components) are updated to look up catalog name before calling these functions.

---

### `src/routes/medicines/index.tsx` (route/component, CRUD read)

**Analog:** `src/routes/medicines/index.tsx` (existing list view)

**Two-query pattern for catalog-first join** (lines 15–41):
```typescript
// STEP 1: Two separate useLiveQuery hooks — one catalog, one stock
// Then join in useMemo (D-01 from Phase 5 CONTEXT)
const catalogs = useLiveQuery(
  () => db.medicine_catalog.toArray(),
  [],
)

const medicines = useLiveQuery(
  () => {
    const q = searchQuery.toLowerCase().trim()
    return db.medicines
      .toCollection()
      .filter((m) => {
        if (m.deletedAt !== null) return false  // active only
        if (q && !m.catalogId.toString().includes(q)) return false  // optional name search
        return true
      })
      .toArray()
  },
  [searchQuery],
)
```

**In-memory aggregate computation pattern** (lines 43–63):
```typescript
// STEP 2: useMemo joins catalogs + stock entries, computes aggregates
// Per catalog: nearest-expiry status (from soonest expiryDate stock entry),
// total quantity (sum across active stock entries)
const filtered = useMemo(() => {
  if (!catalogs || !medicines) return []
  
  const now = new Date()
  
  // Build per-catalog aggregates
  const byId = new Map<number, {
    catalog: MedicineCatalog
    stock: Medicine[]
    nearestExpiryStock: Medicine | null
    totalQty: number
  }>()
  
  for (const stock of medicines) {
    if (!byId.has(stock.catalogId)) {
      const cat = catalogs.find(c => c.id === stock.catalogId)
      if (!cat) continue
      byId.set(stock.catalogId, {
        catalog: cat,
        stock: [],
        nearestExpiryStock: null,
        totalQty: 0,
      })
    }
    const entry = byId.get(stock.catalogId)!
    entry.stock.push(stock)
    entry.totalQty += stock.quantity ?? 0
  }
  
  // Compute nearest-expiry status per catalog, apply filters/sort
  return Array.from(byId.values())
    .filter(entry => {
      // ... filter by catalog.category, stock.location match-any, status
    })
    .map(entry => {
      // Find stock entry with soonest expiryDate
      entry.nearestExpiryStock = entry.stock.reduce(
        (nearest, current) => {
          if (!current.expiryDate) return nearest
          if (!nearest?.expiryDate) return current
          return current.expiryDate < nearest.expiryDate ? current : nearest
        },
        null as Medicine | null,
      )
      return entry
    })
    .sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1
      if (sortField === 'name') {
        return a.catalog.name.localeCompare(b.catalog.name) * dir
      }
      // ... etc
    })
}, [catalogs, medicines, selectedCategories, selectedLocations, selectedStatuses, sortField, sortDirection])
```

**Render aggregate MedicineCard** (lines 130–137):
```typescript
// Pass aggregate data to MedicineCard (no longer individual stock entry)
{filtered.map((entry) => (
  <MedicineCard
    key={entry.catalog.id}
    catalog={entry.catalog}
    nearestExpiryStock={entry.nearestExpiryStock}
    totalQuantity={entry.totalQty}
  />
))}
```

---

### `src/routes/medicines/[id].tsx` (route/component, CRUD read + actions)

**Analog:** `src/routes/medicines/[id].tsx` (existing detail view)

**Load catalog by ID pattern** (lines 21–23):
```typescript
// :id now refers to catalogId, not medicine.id
// Load catalog + all its active stock entries
const { id } = useParams<{ id: string }>()
const catalog = useLiveQuery(() => db.medicine_catalog.get(Number(id)), [id])
const stockEntries = useLiveQuery(
  () => db.medicines
    .where('catalogId').equals(Number(id))
    .filter(m => m.deletedAt === null)
    .toArray(),
  [id],
)
```

**Soft-delete stock entry pattern** (lines 29–38 of existing):
```typescript
// Stock edit and delete use softDeleteMedicine with catalog name
async function handleDeleteStock(stock: Medicine) {
  const catalog = await db.medicine_catalog.get(stock.catalogId)
  if (!catalog) return
  try {
    await softDeleteMedicine(stock, catalog.name)  // Pass catalog.name, not stock.name
    void navigate('/medicines')
  } catch (err) {
    console.error('Failed to delete stock:', err)
  }
}
```

**Render catalog header + stock list** (new structure):
```typescript
// Render catalog info (name, category, form, notes)
<div className="p-4 space-y-6">
  <div className="flex items-start justify-between gap-2">
    <h1 className="text-xl font-semibold">{catalog.name}</h1>
    {/* Catalog edit icon → CatalogEditSheet */}
  </div>
  
  {/* Stock entries list */}
  <div className="space-y-3">
    {stockEntries.map((stock) => (
      <div key={stock.id} className="border rounded p-3">
        {/* Quantity + location + expiry */}
        {/* Edit button → StockEditSheet */}
        {/* Open box → quick action */}
        {/* Move/Split → MoveStockSheet */}
      </div>
    ))}
  </div>
</div>
```

---

### `src/routes/medicines/new.tsx` (route/component, CRUD create)

**Analog:** `src/routes/medicines/new.tsx` (existing add flow)

**Three-step state machine pattern** (new):
```typescript
// Phase 5 replaces single-step form with internal state machine (D-06)
export function MedicineNew() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'search' | 'create-catalog' | 'stock-form'>('search')
  
  // Catalog search state
  const [catalogSearch, setCatalogSearch] = useState('')
  const [selectedCatalog, setSelectedCatalog] = useState<MedicineCatalog | null>(null)
  
  // Stock form state (preserved across back navigation within flow)
  const [stockData, setStockData] = useState<Partial<Medicine>>({})
  
  function handleCatalogSelect(catalog: MedicineCatalog) {
    setSelectedCatalog(catalog)
    setStep('stock-form')
  }
  
  function handleCreateCatalogClick() {
    setStep('create-catalog')
  }
  
  function handleCatalogCreated(newCatalog: MedicineCatalog) {
    setSelectedCatalog(newCatalog)
    setStep('stock-form')
  }
  
  function handleBackToSearch() {
    setStep('search')
    setStockData({})  // Discard any stock data
  }
  
  async function handleStockSubmit(stockFormData: MedicineFormData) {
    if (!selectedCatalog) return
    
    try {
      const now = new Date().toISOString()
      const newId = await db.medicines.add({
        catalogId: selectedCatalog.id,
        quantity: stockFormData.quantity ?? null,
        quantityUnit: stockFormData.quantityUnit ?? null,
        expiryDate: stockFormData.expiryDate,
        location: stockFormData.location ?? null,
        openedDate: stockFormData.openedDate ?? null,
        pao: stockFormData.paoValue && stockFormData.paoUnit
          ? { value: stockFormData.paoValue, unit: stockFormData.paoUnit }
          : null,
        notes: stockFormData.notes ?? null,
        manualStatus: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      })
      
      const newMedicine = await db.medicines.get(newId)
      if (newMedicine) {
        await addMedicineHistory(newMedicine, selectedCatalog.name, 'created')
      }
      void navigate('/medicines')
    } catch (err) {
      console.error('Failed to add stock:', err)
    }
  }
  
  return (
    <div>
      {step === 'search' && (
        <CatalogAutocomplete
          onSelect={handleCatalogSelect}
          onCreateClick={handleCreateCatalogClick}
        />
      )}
      {step === 'create-catalog' && (
        <CatalogCreateForm
          onCreated={handleCatalogCreated}
          onCancel={() => setStep('search')}
        />
      )}
      {step === 'stock-form' && selectedCatalog && (
        <StockForm
          onSubmit={handleStockSubmit}
          onBack={handleBackToSearch}
          onCancel={() => navigate('/medicines')}
        />
      )}
    </div>
  )
}
```

---

### `src/components/MedicineCard.tsx` (component, request-response)

**Analog:** `src/components/MedicineCard.tsx` (existing card)

**Catalog aggregate card pattern** (new):
```typescript
import { Link } from 'react-router-dom'
import type { Medicine, MedicineCatalog } from '@/lib/db'
import { calculateStatus } from '@/lib/expiry'
import { StatusBadge } from '@/components/StatusBadge'

interface MedicineCardProps {
  catalog: MedicineCatalog
  nearestExpiryStock: Medicine | null
  totalQuantity: number
}

export function MedicineCard({
  catalog,
  nearestExpiryStock,
  totalQuantity,
}: MedicineCardProps) {
  // Compute status from nearest-expiry stock entry
  const status = nearestExpiryStock ? calculateStatus(nearestExpiryStock) : 'Active'
  
  // Aggregate display
  const quantityDisplay = nearestExpiryStock?.quantityUnit
    ? `${totalQuantity} ${nearestExpiryStock.quantityUnit}`
    : `${totalQuantity} units`
  
  return (
    <Link
      to={`/medicines/${catalog.id}`}
      className="block bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:border-gray-300 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{catalog.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {quantityDisplay}
          </p>
          {nearestExpiryStock?.expiryDate && (
            <p className="text-sm text-gray-500 mt-0.5">
              Expires: {nearestExpiryStock.expiryDate}
            </p>
          )}
        </div>
        <StatusBadge status={status} />
      </div>
    </Link>
  )
}
```

---

### `src/components/MedicineForm.tsx` (component, request-response)

**Analog:** `src/components/MedicineForm.tsx` (existing form)

**Decompose into subcomponents** (new structure):
```typescript
// Phase 5 decomposes MedicineForm into:
// 1. CatalogFields — name, category, form, notes (for catalog creation)
// 2. StockFields — quantity, quantityUnit, expiryDate, location, openedDate, pao, notes

// Copy these patterns from existing MedicineForm:

// Zod schema pattern (lines 28–39)
export const medicineSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  category: z.string().nullable().optional(),
  location: z.string().nullable().optional(),  // null = "Other"
  openedDate: z.string().nullable().optional(),
  paoValue: z.number().positive().nullable().optional(),
  paoUnit: z.enum(['days', 'weeks', 'months']).nullable().optional(),
  quantity: z.number().positive().nullable().optional(),
  quantityUnit: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

// react-hook-form + resolver pattern (lines 52–82)
const form = useForm<MedicineFormData>({
  resolver: zodResolver(medicineSchema),
  defaultValues: {
    name: '',
    category: null,
    location: null,
    // ... etc
  },
})

// Sentinel value pattern for null in Select (line 50)
const NULL_SENTINEL = '__NULL__'

// Location select with inline quick-add pattern (lines 165–242)
<FormField
  control={form.control}
  name="location"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Location</FormLabel>
      <Select
        value={field.value ?? NULL_SENTINEL}
        onValueChange={(val) => {
          if (val === '__ADD_NEW__') {
            setShowQuickAddLocation(true)
            return
          }
          field.onChange(val === NULL_SENTINEL ? null : val)
        }}
      >
        {/* Options: NULL_SENTINEL, all locations, __ADD_NEW__ */}
      </Select>
      {showQuickAddLocation && (
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="New location name"
            value={newLocationInput}
            onChange={(e) => setNewLocationInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleAddLocation()
              }
            }}
          />
          <Button type="button" size="sm" onClick={() => void handleAddLocation()}>
            Add
          </Button>
        </div>
      )}
    </FormItem>
  )}
/>

// Quantity + unit pattern (lines 327–398)
<div className="space-y-2">
  <p className="text-sm font-medium">Quantity</p>
  <div className="flex gap-2">
    <FormField control={form.control} name="quantity" render={...} />
    <FormField control={form.control} name="quantityUnit" render={...} />
  </div>
</div>
```

**Create CatalogFields subcomponent** (extract from existing):
```typescript
// src/components/CatalogFields.tsx
// Fields: name (required), category (required), form (optional), notes (optional)
// Use same patterns: FormField, Select with NULL_SENTINEL, Textarea
```

**Create StockFields subcomponent** (extract from existing):
```typescript
// src/components/StockFields.tsx
// Fields: quantity, quantityUnit, expiryDate, location, openedDate, pao, notes
// Copy all from MedicineForm (quantity + unit pattern, PAO pattern, etc.)
```

---

### `src/components/FilterBottomSheet.tsx` (component, request-response)

**Analog:** `src/components/FilterBottomSheet.tsx` (unchanged)

**Sheet + toggle button pattern** (lines 38–199):
```typescript
// No changes to this file for Phase 5 (filter semantics update is in list view logic)
// Keep existing Sheet pattern as-is

export function FilterBottomSheet() {
  const {
    filterSheetOpen,
    setFilterSheetOpen,
    // ... other store methods
  } = useUIStore()
  
  const selectedCategories = useUIStore(useShallow((s) => s.selectedCategories))
  const selectedLocations = useUIStore(useShallow((s) => s.selectedLocations))
  const selectedStatuses = useUIStore(useShallow((s) => s.selectedStatuses))
  
  return (
    <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-xl px-4 pb-6">
        <SheetHeader>
          <SheetTitle>Filter &amp; Sort</SheetTitle>
        </SheetHeader>
        
        {/* Toggle button pattern for filters */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
          <div className="flex flex-wrap gap-2">
            {ALL_STATUSES.map((status) => {
              const isSelected = selectedStatuses.includes(status)
              return (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {isSelected && <span className="mr-1">&#10003;</span>}
                  {STATUS_LABELS[status]}
                </button>
              )
            })}
          </div>
        </div>
        
        {/* ... category and location filters with same pattern ... */}
      </SheetContent>
    </Sheet>
  )
}
```

---

### `src/components/FilterChips.tsx` (component, request-response)

**Analog:** `src/components/FilterChips.tsx` (unchanged)

**Chip rendering pattern** (lines 1–50):
```typescript
// No changes to this file for Phase 5
// Keep existing pattern as-is

export function FilterChips() {
  const selectedCategories = useUIStore(useShallow((s) => s.selectedCategories))
  const selectedLocations = useUIStore(useShallow((s) => s.selectedLocations))
  const selectedStatuses = useUIStore(useShallow((s) => s.selectedStatuses))
  const { toggleCategory, toggleLocation, toggleStatus } = useUIStore()
  
  const all = [
    ...selectedCategories.map((v) => ({
      label: `Category: ${v}`,
      remove: () => toggleCategory(v),
    })),
    ...selectedLocations.map((v) => ({
      label: `Location: ${v}`,
      remove: () => toggleLocation(v),
    })),
    ...selectedStatuses.map((v) => ({
      label: `Status: ${STATUS_LABELS[v as MedicineStatus] ?? v}`,
      remove: () => toggleStatus(v),
    })),
  ]
  
  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {all.map((chip) => (
        <span key={chip.label} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
          {chip.label}
          <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1" onClick={chip.remove}>
            ×
          </Button>
        </span>
      ))}
    </div>
  )
}
```

---

### `src/components/ui/sheet.tsx` (component/primitive, request-response)

**Analog:** `src/components/ui/sheet.tsx` (unchanged)

**Reuse for stock edit and move/split sheets** (no changes to the sheet primitive itself):
```typescript
// This file remains unchanged.
// New components (StockEditSheet, MoveStockSheet) will import and use:
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
```

---

### `src/components/StatusBadge.tsx` (component, request-response)

**Analog:** `src/components/StatusBadge.tsx` (unchanged)

**No changes — reuse as-is** (lines 1–26):
```typescript
// Phase 5 does not modify this file.
// All new components pass status computed from nearest-expiry stock entry:
// const status = calculateStatus(nearestExpiryStock)

export function StatusBadge({ status }: { status: MedicineStatus }) {
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded-full text-xs font-medium',
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
```

---

### `src/stores/uiStore.ts` (store, state management)

**Analog:** `src/stores/uiStore.ts` (existing Zustand store)

**Zustand v5 curried syntax pattern** (lines 30–63):
```typescript
// No significant changes; filter semantics update is in list view logic
// Keep existing store structure with Zustand v5 curried syntax

export const useUIStore = create<UIState>()((set) => ({
  selectedCategories: [],
  selectedLocations: [],
  selectedStatuses: [],
  sortField: 'name',
  sortDirection: 'asc',
  filterSheetOpen: false,
  
  toggleCategory: (value) =>
    set((s) => ({
      selectedCategories: s.selectedCategories.includes(value)
        ? s.selectedCategories.filter((v) => v !== value)
        : [...s.selectedCategories, value],
    })),
  
  toggleLocation: (value) =>
    set((s) => ({
      selectedLocations: s.selectedLocations.includes(value)
        ? s.selectedLocations.filter((v) => v !== value)
        : [...s.selectedLocations, value],
    })),
  
  setSort: (field, direction) => set({ sortField: field, sortDirection: direction }),
  clearAllFilters: () =>
    set({ selectedCategories: [], selectedLocations: [], selectedStatuses: [] }),
  setFilterSheetOpen: (open) => set({ filterSheetOpen: open }),
}))

// useShallow for array selectors (lines 74–77)
export { shallow, useShallow }

// Usage pattern in components:
const selectedLocations = useUIStore(useShallow((s) => s.selectedLocations))
```

---

## New Component Analogs

### `src/components/StockEditSheet.tsx` (new, component, request-response)

**Analog:** `src/components/FilterBottomSheet.tsx`

**Bottom sheet + form pattern:**
```typescript
// Copy FilterBottomSheet pattern for sheet structure:
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export function StockEditSheet({ stock, onSave, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-xl px-4 pb-6">
        <SheetHeader>
          <SheetTitle>Edit Stock Entry</SheetTitle>
        </SheetHeader>
        
        {/* Use StockFields subcomponent from decomposed MedicineForm */}
        <StockFields
          defaultValues={stock}
          onSubmit={onSave}
        />
      </SheetContent>
    </Sheet>
  )
}
```

---

### `src/components/MoveStockSheet.tsx` (new, component, request-response)

**Analog:** `src/components/FilterBottomSheet.tsx`

**Bottom sheet + move/split form pattern:**
```typescript
// Copy FilterBottomSheet sheet structure:
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const moveSchema = z.object({
  quantity: z.number().min(1).max(originalQty),
  targetLocation: z.string(),
})

export function MoveStockSheet({ stock, onMove, open, onOpenChange }: Props) {
  const form = useForm({
    resolver: zodResolver(moveSchema),
    defaultValues: { quantity: 1, targetLocation: stock.location ?? null },
  })
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] rounded-t-xl px-4 pb-6">
        <SheetHeader>
          <SheetTitle>Move/Split Stock</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={form.handleSubmit(onMove)} className="space-y-4 pt-4">
          {/* Quantity input + Location select — copy patterns from MedicineForm */}
          <FormField control={form.control} name="quantity" render={...} />
          <FormField control={form.control} name="targetLocation" render={...} />
          
          <Button type="submit" className="w-full">Move</Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
```

---

### `src/components/CatalogEditSheet.tsx` (new, component, request-response)

**Analog:** `src/components/MedicineForm.tsx`

**Bottom sheet + form pattern:**
```typescript
// Copy MedicineForm patterns (react-hook-form + zod):
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CatalogFields } from '@/components/CatalogFields'

const catalogSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().nullable().optional(),
  form: z.enum([...MedicineForm values]).nullable().optional(),
  notes: z.string().nullable().optional(),
})

export function CatalogEditSheet({ catalog, onSave, open, onOpenChange }: Props) {
  const form = useForm({
    resolver: zodResolver(catalogSchema),
    defaultValues: {
      name: catalog.name,
      category: catalog.category ?? null,
      form: catalog.form ?? null,
      notes: catalog.notes ?? null,
    },
  })
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-xl px-4 pb-6">
        <SheetHeader>
          <SheetTitle>Edit Catalog</SheetTitle>
        </SheetHeader>
        
        {/* Use CatalogFields subcomponent from decomposed MedicineForm */}
        <CatalogFields form={form} onSubmit={onSave} />
      </SheetContent>
    </Sheet>
  )
}
```

---

### `src/components/CatalogAutocomplete.tsx` (new, component, request-response)

**Analog:** `src/components/MedicineForm.tsx` (location select pattern)

**Autocomplete dropdown pattern:**
```typescript
// Copy from MedicineForm location select with focus behavior:
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { MedicineCatalog } from '@/lib/db'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface CatalogAutocompleteProps {
  onSelect: (catalog: MedicineCatalog) => void
  onCreateClick: (typedName: string) => void
}

export function CatalogAutocomplete({ onSelect, onCreateClick }: CatalogAutocompleteProps) {
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  
  // Load all catalogs (D-07: show all on focus, no char delay)
  const allCatalogs = useLiveQuery(() => db.medicine_catalog.toArray(), [])
  
  // Filter by case-insensitive substring match
  const filtered = (allCatalogs ?? []).filter(cat =>
    cat.name.toLowerCase().includes(searchText.toLowerCase())
  )
  
  // Show "Create [name]" when search has value but 0 matches (D-08)
  const shouldShowCreate = searchText.trim() && filtered.length === 0
  
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Select or Create Medicine</h2>
      
      <div className="space-y-2">
        <Input
          placeholder="Start typing a medicine name…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        
        {open && (
          <div className="border rounded bg-white shadow-sm">
            {/* Show all catalogs when focused (D-07) */}
            {allCatalogs && allCatalogs.length > 0 && (
              <div className="max-h-64 overflow-y-auto">
                {filtered.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onSelect(cat)
                      setOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
            
            {/* "Create [name]" when no matches (D-08) */}
            {shouldShowCreate && (
              <button
                onClick={() => {
                  onCreateClick(searchText)
                  setOpen(false)
                }}
                className="w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors"
              >
                Create "{searchText}"
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Shared Patterns

### Error Handling
**Source:** `src/lib/historyOps.ts`, `src/routes/medicines/new.tsx`
**Apply to:** All mutations (stock add/edit/delete, catalog operations)
```typescript
try {
  // DB operations
  await db.medicines.add(...)
  await addMedicineHistory(...)
} catch (err) {
  // CRITICAL: never expose raw Dexie errors to UI
  console.error('Failed to add medicine:', err)
  // Use sonner for user-facing error toast
  toast.error('Failed to save. Please try again.')
}
```

### Date Handling
**Source:** `src/lib/db.ts`, `src/routes/medicines/new.tsx`
**Apply to:** All new stock entries and catalog operations
```typescript
// Always use YYYY-MM-DD strings for expiryDate, openedDate
// Never store Date objects in IndexedDB
const now = new Date().toISOString()  // For createdAt/updatedAt timestamps
const expiryDate = '2025-12-31'       // For user-facing dates

// Date input fields use type="date" which returns YYYY-MM-DD string
<Input type="date" value={field.value ?? ''} onChange={...} />
```

### null Sentinel Values
**Source:** `src/lib/db.ts`, `src/components/MedicineForm.tsx`
**Apply to:** All forms with optional dropdowns
```typescript
// Location null means "Other" — never store the string 'Other'
location: null

// Select dropdowns use __NULL__ sentinel to represent null in form state
const NULL_SENTINEL = '__NULL__'
<Select value={field.value ?? NULL_SENTINEL} onValueChange={(val) => field.onChange(val === NULL_SENTINEL ? null : val)} />

// __ADD_NEW__ for location quick-add, __CUSTOM__ for custom quantity unit
if (val === '__ADD_NEW__') {
  setShowQuickAddLocation(true)
  return
}
```

### Zustand State Management
**Source:** `src/stores/uiStore.ts`
**Apply to:** All new UI state (sheet open flags, form state if needed)
```typescript
// Zustand v5 curried syntax: create<T>()((set) => {...})
export const useMyStore = create<MyState>()((set) => ({
  isOpen: false,
  setOpen: (open) => set({ isOpen: open }),
  
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
}))

// Array selectors must use useShallow to avoid unnecessary re-renders
const items = useMyStore(useShallow((s) => s.items))
```

### Database Transactions
**Source:** `src/lib/historyOps.ts`
**Apply to:** Any mutation that must be atomic (stock create + history, catalog update + history)
```typescript
await db.transaction('rw', db.medicines, db.history, async () => {
  // All operations inside are atomic — rolled back together on error
  await db.medicines.update(id, changes)
  await db.history.add(historyEntry)
})
```

### Dexie Reactive Queries
**Source:** `src/routes/medicines/index.tsx`
**Apply to:** All data fetching in routes/components
```typescript
// Do NOT call calculateStatus() inside useLiveQuery — use it at render time
const medicines = useLiveQuery(
  () => db.medicines.toCollection().filter(m => m.deletedAt === null).toArray(),
  [searchQuery],  // Dependencies for cache invalidation
)

// Do NOT use where('field').equals(null) — null not valid IndexedDB key
// Use toCollection().filter(m => m.deletedAt === null) instead

// Status computation happens in useMemo (after query returns)
const status = useMemo(() => {
  if (!medicine) return 'Active'
  return calculateStatus(medicine)
}, [medicine])
```

### Form Validation
**Source:** `src/components/MedicineForm.tsx`
**Apply to:** All new forms (stock form, catalog form, move/split form)
```typescript
// Zod schema + react-hook-form + zodResolver pattern
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().positive().nullable().optional(),
})

const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {...},
})

// Submit handling
async function onSubmit(data: FormData) {
  try {
    await db.medicines.add({...})
  } catch (err) {
    console.error('Failed:', err)
  }
}
```

---

## No Analog Found

All 16 files have strong analogs in the existing codebase.

| File | Role | Reason |
|------|------|--------|
| (none) | — | Full coverage; all new files follow established patterns |

---

## Metadata

**Analog search scope:** `src/lib/`, `src/routes/`, `src/components/`, `src/stores/`  
**Files scanned:** 28 existing files + 4 new files = 32 total  
**Pattern extraction date:** 2026-07-30

---

*End of Phase 05 Pattern Map*
