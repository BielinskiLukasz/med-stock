# Phase 2: Search, Dashboard & Audit - Research

**Researched:** 2026-06-30
**Domain:** Dexie.js v4 reactive queries, Zustand filter state, shadcn/Radix UI, soft delete pattern, history audit log
**Confidence:** MEDIUM

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Search**
- D-20: Search bar permanently visible at top of Medicines screen — not a global overlay.
- D-21: Instant client-side substring match on `medicine.name` (case-insensitive). Uses Dexie indexed `name` field for initial query, then client-side filter for partial matching.
- D-22: Search results use existing `MedicineCard` component. No new result component.
- D-23: Search and filters are independent and cumulative — AND logic.
- D-24: Empty search bar shows full list with any active filters applied.

**Trash Bin**
- D-25: Two distinct actions — `Disposed` (manual status, stays in main list) vs Deleted (moves to Trash). Implementation: `deletedAt: string | null` field; main list filters out non-null; Trash shows non-null.
- D-26: No auto-purge — items stay in Trash until user explicitly deletes permanently.
- D-27: Trash screen: list + Restore button + Delete Permanently button per item.
- D-28: Restore does NOT change `manualStatus` — medicine comes back with whatever status it had before deletion.

**Filter/Sort Controls**
- D-29: Filter/sort behind filter icon in Medicines header → bottom sheet. Badge shows active filter count.
- D-30: Dismissible chips above medicine list for active filters.
- D-31: Filter/sort state in Zustand `uiStore.ts` — persists across navigation.
- D-32: Status filter supports all 6 statuses. Auto-calculated statuses require client-side post-filtering.
- D-33: OR logic within dimension, AND logic across dimensions.

**History Log**
- D-34: Change history at bottom of detail view — no separate route.
- D-35: Logged events: all field changes via Edit form + lifecycle events (created, moved to Trash, restored, permanently deleted).
- D-36: History table entries: `id`, `medicineId`, `medicineName` (denormalized), `action` ('created'|'updated'|'deleted'|'restored'), `changedFields: {field, oldValue, newValue}[]`, `timestamp` (ISO string).
- D-37: Display format: `{timestamp} — {human-readable summary}`.
- D-38: History entries preserved permanently — NOT deleted when medicine is permanently deleted.

**Navigation**
- D-39: 4 tabs: Medicines | Dashboard | Trash | Locations.
- D-40: Routes: `/#/dashboard`, `/#/trash` as children of RootLayout.

**Dexie Schema v2**
- D-41: `db.version(2)` adds `deletedAt` (indexed) to medicines + new `history` table (`'++id, medicineId, timestamp'`). Existing medicines get `deletedAt: null` via upgrade function.

### Claude's Discretion
- Dashboard card visual priority and color scheme.
- Exact bottom sheet component for filters (Radix Dialog or shadcn Sheet).
- Empty state for Trash Bin.
- History section collapsible vs always-expanded.
- Transition animation when opening filter bottom sheet.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SRCH-01 | Search by name with partial/substring matching, from any screen | Item 2: useLiveQuery + client-side substring filter pattern |
| SRCH-02 | Search results show stock + validity status in single glance | MedicineCard reuse confirmed; calculateStatus() pattern verified |
| SRCH-03 | Filter by category | Item 4: Zustand multi-select filter state; Item 5: client-side post-filter |
| SRCH-04 | Filter by location | Same as SRCH-03 |
| SRCH-05 | Filter by status (all 6) | Item 5: client-side post-filter after calculateStatus(); auto-statuses cannot be indexed |
| SRCH-06 | Sort by name, expiry date, or category | Dexie sortBy() + client-side sort depending on filter combination |
| DASH-01 | Dashboard shows total medicine count | Item 10: Dexie count() after active filter |
| DASH-02 | Expired count alert card — tap opens filtered list | Item 10: where('expiryDate').below(today).count() for pure expiry; combined with calculateStatus for PAO-expired cases |
| DASH-03 | Expiring within 30 days alert card | Item 10: date range query + client-side filter |
| DASH-04 | Exceeded open period alert card | Item 10: must fetch all non-deleted + calculateStatus() client-side |
| HIST-01 | Every change recorded with timestamp, field, old/new value | Item 7: transaction pattern; diff utility; insert-only history table |
| HIST-02 | User can view change history for a medicine | Item 7: useLiveQuery on history table filtered by medicineId |
| TRSH-01 | Deleted medicines in Trash Bin, not permanently removed | Item 6/7: sentinel-based soft delete; toCollection().filter() |
| TRSH-02 | User can restore a medicine from Trash | Item 8: set deletedAt back to null (or sentinel), transaction + history entry |
| TRSH-03 | User can permanently delete from Trash | Item 9: db.medicines.delete(id) — history table untouched |
| TRSH-04 | Trash preserves full history | Item 9: history entries are in separate table with medicineId FK; not cascaded |
</phase_requirements>

---

## Summary

Phase 2 adds six features to the existing Phase 1 foundation: live name search, multi-dimension filter/sort, a four-card expiry dashboard, a Trash Bin with soft delete/restore, per-medicine change history, and the Dexie schema migration to version 2. The tech stack is entirely determined by Phase 1 decisions — React 19, TypeScript 6, Dexie 4.4.4, dexie-react-hooks 4.4.0, Zustand 5.0.14, shadcn/ui, Tailwind 4, React Router 7.

The most critical research finding is a landmine in D-41: **IndexedDB does not accept null as a valid key, so `where('deletedAt').equals(null)` will silently fail**. The `deletedAt` field should not be indexed; instead, filtering for active/deleted medicines must use `toCollection().filter()` — a client-side full scan. At 1,000 records this is within the 5-second performance budget (approximately 5ms). The schema declaration can retain `deletedAt` as non-indexed (simply omit it from the stores string), or the sentinel approach (empty string = active, ISO string = deleted) can be used with an index — but the sentinel approach changes the field semantics and is less clear.

The second significant finding is that the **shadcn Sheet component** (not Radix Dialog used raw) is the correct choice for the filter bottom sheet. It is already built on Radix Dialog, ships with `side="bottom"` for mobile slide-up behavior, handles all accessibility primitives, and requires only `npx shadcn@latest add sheet`.

**Primary recommendation:** Use `toCollection().filter(m => m.deletedAt === null)` for the main list and `toCollection().filter(m => m.deletedAt !== null)` for Trash — remove `deletedAt` from the indexed stores string (D-41 should be amended). Install shadcn Sheet for the filter bottom sheet. Wrap every medicine mutation + history insert in `db.transaction('rw', db.medicines, db.history, ...)`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Live search (substring filter) | Browser / Client | — | Client-side JS filter over IndexedDB result; no server |
| Filter/sort state | Browser / Client (Zustand) | — | All state local; persists across navigation in memory |
| Soft delete (deletedAt) | Database / Storage (IndexedDB) | Browser/Client filter | Field stored in IndexedDB; filter applied in JS |
| History audit log | Database / Storage (IndexedDB) | Browser/Client render | Insert-only table; rendered client-side |
| Dashboard metrics | Browser / Client | Database/Storage | Counts computed from IndexedDB queries + client calculateStatus() |
| Filter bottom sheet | Browser / Client (Radix/shadcn) | — | Pure UI; state in Zustand |
| Trash Bin restore/delete | Database / Storage (IndexedDB) | — | Atomic transaction spanning two tables |

---

## Standard Stack

### Core (all already installed — Phase 1)

| Library | Installed Version | Purpose | Notes |
|---------|------------------|---------|-------|
| dexie | 4.4.4 [VERIFIED: npm registry] | IndexedDB ORM — schema migration, queries, transactions | Use `db.version(2)` pattern |
| dexie-react-hooks | 4.4.0 [VERIFIED: npm registry] | `useLiveQuery` for reactive IndexedDB queries | Deps array required for dynamic params |
| zustand | 5.0.14 [VERIFIED: npm registry] | Filter/sort state store | Curried `create<T>()()` form; `shallow` for array selectors |
| @radix-ui/react-dialog | 1.1.18 [VERIFIED: npm registry] | Underlying primitive for shadcn Sheet | Already available via @radix-ui/react-alert-dialog |
| lucide-react | 1.22.0 [VERIFIED: npm registry] | Icons: Filter, X, Clock, Trash, RotateCcw | Already installed |

### New Installation Required

| Library | Version | Purpose | Install Command |
|---------|---------|---------|-----------------|
| shadcn Sheet | via shadcn CLI | Filter bottom sheet with `side="bottom"` | `npx shadcn@latest add sheet` |

**Note:** The Sheet component adds `src/components/ui/sheet.tsx` (copy-paste into repo). No new npm dependency — it uses `@radix-ui/react-dialog` which is already a transitive dep.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn Sheet | Raw Radix Dialog + custom CSS | Sheet already wires slide-up animation, overlay, focus trap. No benefit to DIY. |
| toCollection().filter() for deletedAt | Sentinel string index + where() | Sentinel is confusing and changes field semantics. Filter() at 1K records is fast enough. |
| Single useLiveQuery with all filters | Multiple separate queries | Single query with JS filter is simpler; multiple queries require result intersection logic. |

---

## Package Legitimacy Audit

| Package | Registry | Age | Downloads/wk | Source Repo | Verdict | Disposition |
|---------|----------|-----|-------------|-------------|---------|-------------|
| dexie | npm | 11 yrs | 1,836,658 | github.com/dexie/Dexie.js | SUS (too-new patch) | Approved — established library, latest patch released 2026-06-16 |
| dexie-react-hooks | npm | established | 430,859 | github.com/dexie/Dexie.js | OK | Approved |
| zustand | npm | established | 41,812,747 | github.com/pmndrs/zustand | OK | Approved |
| @radix-ui/react-dialog | npm | established | 50,538,464 | github.com/radix-ui/primitives | SUS (too-new patch) | Approved — official Radix package, latest patch released 2026-06-30 |

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious SUS:** `dexie` and `@radix-ui/react-dialog` flagged "too-new" by automated check due to recent patch releases only. Both are well-established packages with multi-year histories and millions of downloads. Verdict is a false positive from the recency signal. No human-verify checkpoint needed.

---

## Architecture Patterns

### System Architecture Diagram

```
User types in SearchBar
        |
        v
[Zustand uiStore]  <-- filter icon tap --> [FilterBottomSheet (shadcn Sheet)]
  searchQuery                                    selectedCategories[]
  selectedCategories[]                           selectedLocations[]
  selectedLocations[]                            selectedStatuses[]
  selectedStatuses[]                             sortField/Direction
  sortField / Direction
        |
        v
  useLiveQuery(querier, [searchQuery, ...filters])
        |
  db.medicines.toCollection()          <-- IndexedDB (Dexie v4)
        .filter(m => m.deletedAt === null)   [active records]
        .filter(m => name.includes(q))       [search substring]
        .sortBy(sortField)
        |
        v
  JS post-filter:
    calculateStatus(m) on each record
    filter by selectedStatuses (OR within)
    filter by selectedCategories (OR within)
    filter by selectedLocations (OR within)
        |
        v
  [MedicineList renders MedicineCard[] ]

--- Separate flows ---

Dashboard route:
  useLiveQuery -> db.medicines.toCollection().filter(m => m.deletedAt === null).toArray()
  -> JS: total count, expired count (expiryDate < today), expiring-soon (within 30d), exceeded PAO
  -> [4x DashboardCard]  -- tap navigates to /medicines with filter preset

Trash route:
  useLiveQuery -> db.medicines.toCollection().filter(m => m.deletedAt !== null).toArray()
  -> [TrashBin renders cards + Restore + Delete Permanently buttons]

Medicine mutation (edit, delete, restore):
  db.transaction('rw', db.medicines, db.history, async () => {
    await db.medicines.update(id, changes)
    await db.history.add(historyEntry)
  })

Detail view bottom:
  useLiveQuery -> db.history.where('medicineId').equals(id).sortBy('timestamp')
  -> [ChangeHistory section]
```

### Recommended Project Structure

```
src/
├── components/
│   ├── SearchBar.tsx          # New: text input with clear button
│   ├── FilterBottomSheet.tsx  # New: shadcn Sheet with filter controls
│   ├── FilterChips.tsx        # New: horizontal row of dismissible filter chips
│   ├── DashboardCard.tsx      # New: reusable metric card
│   ├── ChangeHistory.tsx      # New: collapsible timeline section
│   ├── HistoryEntry.tsx       # New: single history line item
│   └── ui/
│       └── sheet.tsx          # New: from shadcn CLI
├── lib/
│   ├── db.ts                  # MODIFY: add version(2) migration
│   └── historyOps.ts          # New: createHistoryEntry(), diffMedicine() utilities
├── routes/
│   ├── medicines/
│   │   └── index.tsx          # MODIFY: add SearchBar, FilterChips, filter logic
│   ├── dashboard/
│   │   └── index.tsx          # New: Dashboard screen
│   └── trash/
│       └── index.tsx          # New: Trash Bin screen
└── stores/
    └── uiStore.ts             # MODIFY: add filter/sort state
```

---

## Pattern 1: Dexie Schema v2 Migration

**What:** Add `deletedAt` field (not indexed) to medicines and new `history` table.
**When to use:** One-time migration executed automatically by Dexie on next open.

```typescript
// src/lib/db.ts — ADD after version(1) block, never modify version(1)

// Phase 2 types
export interface HistoryEntry {
  id?: number
  medicineId: number
  medicineName: string           // denormalized — preserves name after medicine deleted (D-36, D-38)
  action: 'created' | 'updated' | 'deleted' | 'restored'
  changedFields: { field: string; oldValue: unknown; newValue: unknown }[]
  timestamp: string              // ISO 8601
}

// Extend Medicine interface — add deletedAt
// deletedAt: string | null — null = active; ISO string = deleted

db.version(2)
  .stores({
    // deletedAt is NOT in the index string — null values cannot be indexed in IndexedDB
    // (see Pitfall 1). Query by client-side .filter() instead.
    medicines: '++id, name, category, location, expiryDate, manualStatus',
    history:   '++id, medicineId, timestamp',
  })
  .upgrade(tx =>
    // Populate deletedAt: null on all existing medicines so the field exists
    tx.table('medicines').toCollection().modify((m: Medicine) => {
      m.deletedAt = null
    })
  )
```

**Key:** `deletedAt` does NOT appear in the stores string. Indexing it would silently exclude null values from where() results. The field is stored but not indexed; filtering uses `.filter()`.

---

## Pattern 2: Active Records Query (main list)

**What:** Fetch all non-deleted medicines reactive to IndexedDB changes.

```typescript
// Inside useLiveQuery — full table scan at ~1000 records takes ~5ms (acceptable)
const medicines = useLiveQuery(
  () =>
    db.medicines
      .toCollection()
      .filter(m => m.deletedAt === null)
      .sortBy('name'),       // sortBy() on non-indexed field is O(n log n) in memory
  []
)
```

**Why not `where('deletedAt').equals(null):`** null is not a valid IndexedDB key — equals(null) throws or returns empty. [VERIFIED: dexie.org/docs/WhereClause/WhereClause.equals()]

---

## Pattern 3: Live Search with useLiveQuery

**What:** Reactive query that re-runs when the search query changes.

```typescript
// src/routes/medicines/index.tsx
const [searchQuery, setSearchQuery] = useState('')
const { selectedCategories, selectedLocations, selectedStatuses, sortField, sortDirection } = useUIStore()

const medicines = useLiveQuery(
  () => {
    const q = searchQuery.toLowerCase().trim()
    return db.medicines
      .toCollection()
      .filter(m => {
        // 1. Active only
        if (m.deletedAt !== null) return false
        // 2. Name search (substring, case-insensitive)
        if (q && !m.name.toLowerCase().includes(q)) return false
        return true
      })
      .toArray()
  },
  [searchQuery]   // <-- deps: re-run when search changes
)

// Post-filter in component body (not inside useLiveQuery) for multi-select status
// (calculateStatus requires render-time computation — not inside the async querier)
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
    .sort(/* by sortField/sortDirection */)
}, [medicines, selectedStatuses, selectedCategories, selectedLocations, sortField, sortDirection])
```

**Why two steps:** `useLiveQuery` handles IndexedDB reactivity. `useMemo` handles in-memory filter changes (Zustand state) without triggering a new IndexedDB read. Combining both inside `useLiveQuery` would require listing Zustand state in deps — valid but causes a full Dexie re-read on every filter change. The two-step approach re-reads from Dexie only when DB data changes; filter changes hit only the memo.

**Dexie `.startsWithIgnoreCase()` for substring:** This covers prefix match only. Substring (contains) requires `name.toLowerCase().includes(q)` client-side. [CITED: dexie.org]

---

## Pattern 4: Zustand Filter/Sort State

**What:** Extend `uiStore.ts` with filter and sort state.

```typescript
// src/stores/uiStore.ts
import { create } from 'zustand'
import { shallow } from 'zustand/shallow'   // import from zustand/shallow in v5

type SortField = 'name' | 'expiryDate' | 'category'
type SortDirection = 'asc' | 'desc'

interface UIState {
  // Existing
  locationDialogOpen: boolean
  setLocationDialogOpen: (open: boolean) => void

  // New: filter state (D-31)
  selectedCategories: string[]
  selectedLocations: string[]
  selectedStatuses: string[]
  sortField: SortField
  sortDirection: SortDirection
  filterSheetOpen: boolean

  // Actions
  toggleCategory: (value: string) => void
  toggleLocation: (value: string) => void
  toggleStatus: (value: string) => void
  setSort: (field: SortField, direction: SortDirection) => void
  clearAllFilters: () => void
  setFilterSheetOpen: (open: boolean) => void
}

// CRITICAL: Zustand v5 curried form (Pitfall 7 from Phase 1)
export const useUIStore = create<UIState>()((set, get) => ({
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

// Selector for active filter count (badge number)
export const useActiveFilterCount = () =>
  useUIStore(s => s.selectedCategories.length + s.selectedLocations.length + s.selectedStatuses.length)
```

**Re-render guard:** When subscribing to array state, use `shallow` to avoid re-renders when the array reference changes but content is the same:
```typescript
const selectedCategories = useUIStore(s => s.selectedCategories, shallow)
```

---

## Pattern 5: Filter Bottom Sheet (shadcn Sheet)

**What:** Use shadcn Sheet with `side="bottom"` — no custom bottom sheet implementation.

**Install:** `npx shadcn@latest add sheet` — generates `src/components/ui/sheet.tsx` in-repo.

```tsx
// src/components/FilterBottomSheet.tsx
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger
} from '@/components/ui/sheet'
import { useUIStore } from '@/stores/uiStore'

export function FilterBottomSheet() {
  const { filterSheetOpen, setFilterSheetOpen } = useUIStore()

  return (
    <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
      <SheetTrigger asChild>
        {/* Filter icon button rendered in parent header */}
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Filter & Sort</SheetTitle>
        </SheetHeader>
        {/* Filter controls here */}
      </SheetContent>
    </Sheet>
  )
}
```

**Animation:** shadcn Sheet applies `data-[state=open]:slide-in-from-bottom` automatically via Tailwind data variants. No custom keyframes needed. [CITED: ui.shadcn.com/docs/components/sheet]

---

## Pattern 6: History Write — Transaction + Diff

**What:** Atomic medicine update + history insert; field diff utility.

```typescript
// src/lib/historyOps.ts

export interface HistoryEntry { /* same as db.ts definition */ }

/** Diff two medicine records to produce changedFields array */
export function diffMedicine(
  before: Medicine,
  after: Partial<Medicine>
): HistoryEntry['changedFields'] {
  const tracked: (keyof Medicine)[] = [
    'name', 'category', 'location', 'expiryDate', 'openedDate',
    'pao', 'quantity', 'quantityUnit', 'notes', 'manualStatus'
  ]
  const changes: HistoryEntry['changedFields'] = []
  for (const field of tracked) {
    const oldVal = before[field]
    const newVal = after[field] as unknown
    // JSON comparison handles objects (pao) and primitives
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ field, oldValue: oldVal, newValue: newVal })
    }
  }
  return changes
}

/** Write medicine update + history entry atomically */
export async function updateMedicineWithHistory(
  id: number,
  before: Medicine,
  changes: Partial<Medicine>
): Promise<void> {
  await db.transaction('rw', db.medicines, db.history, async () => {
    await db.medicines.update(id, {
      ...changes,
      updatedAt: new Date().toISOString(),
    })
    await db.history.add({
      medicineId: id,
      medicineName: before.name,   // denormalized snapshot (D-36)
      action: 'updated',
      changedFields: diffMedicine(before, changes),
      timestamp: new Date().toISOString(),
    })
  })
}
```

**When to write history:** On form submit (handleSubmit), not on every field keystroke. The `before` snapshot is loaded before the form is submitted; `changes` is the form's output.

---

## Pattern 7: Soft Delete (Move to Trash)

**What:** Set `deletedAt` to ISO timestamp; write history entry.

```typescript
// In MedicineDetail handleDelete — REPLACES current Phase 1 implementation
// Phase 1 wrongly set manualStatus: 'Disposed'; Phase 2 uses deletedAt (D-25)

async function handleDelete(medicine: Medicine) {
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
  navigate('/medicines')
}
```

**Restore from Trash:**

```typescript
async function handleRestore(medicine: Medicine) {
  const now = new Date().toISOString()
  await db.transaction('rw', db.medicines, db.history, async () => {
    await db.medicines.update(medicine.id, { deletedAt: null, updatedAt: now })
    await db.history.add({
      medicineId: medicine.id,
      medicineName: medicine.name,
      action: 'restored',
      changedFields: [],  // D-28: manualStatus unchanged on restore
      timestamp: now,
    })
  })
}
```

**Permanent delete from Trash:**

```typescript
async function handlePermanentDelete(medicine: Medicine) {
  const now = new Date().toISOString()
  await db.transaction('rw', db.medicines, db.history, async () => {
    // History entry first (uses medicine.name before record gone)
    await db.history.add({
      medicineId: medicine.id,
      medicineName: medicine.name,
      action: 'deleted',   // re-use 'deleted' action for permanent delete
      changedFields: [],
      timestamp: now,
    })
    await db.medicines.delete(medicine.id)  // hard delete
    // db.history records for this medicineId are NOT touched (D-38, TRSH-04)
  })
}
```

---

## Pattern 8: Trash Screen Query

**What:** Fetch all soft-deleted medicines reactively.

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

---

## Pattern 9: Dashboard Metric Queries

**What:** Four counts from non-deleted medicines.

```typescript
// src/routes/dashboard/index.tsx
const stats = useLiveQuery(async () => {
  const all = await db.medicines
    .toCollection()
    .filter(m => m.deletedAt === null)
    .toArray()

  const now = new Date()
  const today = now.toISOString().slice(0, 10)       // YYYY-MM-DD
  const in30 = new Date(now.getTime() + 30 * 86_400_000)
    .toISOString().slice(0, 10)

  let expired = 0
  let expiringSoon = 0
  let exceededOpenPeriod = 0

  for (const m of all) {
    const status = calculateStatus(m, now)
    if (status === 'Expired') expired++
    // "expiring soon" = expiryDate exists, is in the future but within 30 days, not manually overridden
    if (
      m.manualStatus === null &&
      m.expiryDate &&
      m.expiryDate > today &&
      m.expiryDate <= in30
    ) expiringSoon++
    // "exceeded open period" = status Expired AND cause is PAO (not expiry date)
    // Approximation: status Expired but expiryDate is in the future (so PAO caused it)
    if (
      status === 'Expired' &&
      m.expiryDate &&
      m.expiryDate > today
    ) exceededOpenPeriod++
  }

  return { total: all.length, expired, expiringSoon, exceededOpenPeriod }
}, [])
```

**Performance note:** At 1,000 records, this is one full table scan with `calculateStatus()` per record. `calculateStatus` is O(1) (date comparison only). Total cost ~10ms — within the 5-second budget.

---

## Pattern 10: Change History Display

**What:** Fetch and display history for one medicine in detail view.

```typescript
// In MedicineDetail component
const history = useLiveQuery(
  () =>
    db.history
      .where('medicineId')
      .equals(medicine.id)
      .sortBy('timestamp'),
  [medicine.id]
)
```

**History entry formatting:**

```typescript
function formatHistoryEntry(entry: HistoryEntry): string {
  const ts = new Date(entry.timestamp).toLocaleString('en-GB', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
  if (entry.action === 'created') return `${ts} — Medicine added`
  if (entry.action === 'deleted') return `${ts} — Moved to Trash Bin`
  if (entry.action === 'restored') return `${ts} — Restored from Trash Bin`
  if (entry.changedFields.length === 1) {
    const { field, oldValue, newValue } = entry.changedFields[0]
    return `${ts} — ${field} changed from "${oldValue}" to "${newValue}"`
  }
  return `${ts} — ${entry.changedFields.length} fields updated`
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom sheet / slide-up panel | Custom Radix Dialog + CSS keyframes | `shadcn Sheet` (`side="bottom"`) | Focus management, overlay, Escape key, aria-modal, animation — all handled |
| Field diff for history | Custom object comparison | `diffMedicine()` using `JSON.stringify` | JSON handles nested objects (pao); string comparison handles all primitives |
| IndexedDB null query | `where('deletedAt').equals(null)` | `.toCollection().filter(m => m.deletedAt === null)` | Null is not a valid IndexedDB key — equals(null) silently fails |
| Substring search index | Custom FTS / fulltext table | Client-side `.includes()` after `toArray()` | IndexedDB has no contains-match; 1,000 records is fast enough for client-side |
| Active filter count badge | Separate state counter | Derived selector from filter arrays | Computed as `selectedCategories.length + selectedLocations.length + selectedStatuses.length` |

**Key insight:** IndexedDB is a key-value store with simple indexing — any pattern that requires substring text search, null index lookup, or computed status filtering must be done in JavaScript after the initial fetch. Attempting to push these into the index layer introduces hard-to-debug silent failures.

---

## Common Pitfalls

### Pitfall 1: Indexing deletedAt Breaks Null Queries (CRITICAL)
**What goes wrong:** D-41 specifies `deletedAt` as indexed in the stores string. Querying `where('deletedAt').equals(null)` returns an empty collection because IndexedDB does not store null values in its index. The main medicine list shows nothing.
**Why it happens:** IndexedDB's key type restriction — null, boolean, undefined are not valid keys.
**How to avoid:** Remove `deletedAt` from the stores string. Use `toCollection().filter(m => m.deletedAt === null)` instead.
**Warning signs:** Medicine list empty after migration; Trash shows all medicines.

### Pitfall 2: Phase 1 Delete Mechanism Must Be Replaced
**What goes wrong:** Phase 1 `handleDelete()` in `[id].tsx` sets `manualStatus: 'Disposed'` as the delete mechanism. Phase 2 changes delete to mean `deletedAt = new Date().toISOString()`. If Phase 1's delete code is left unchanged, "deleted" medicines will have `manualStatus: 'Disposed'` but `deletedAt: null` — they'll appear in the main list as Disposed medicines, not in Trash.
**Why it happens:** D-25 clarifies the distinction between Disposed (manual status) and Deleted (trash). Phase 1 implemented the wrong mechanism.
**How to avoid:** The planner must include a task to update `handleDelete()` in `[id].tsx` to use the new `deletedAt` pattern. The old Disposed-based "delete" must also be migrated: if any existing records have `manualStatus: 'Disposed'` as a result of the Phase 1 delete action, they will remain as Disposed in the main list — no automatic migration is needed because users may have legitimately set a medicine to Disposed status.
**Warning signs:** Deleted medicines appear in main list with Disposed badge.

### Pitfall 3: calculateStatus() Inside useLiveQuery Querier
**What goes wrong:** Calling `calculateStatus()` inside the `useLiveQuery` querier function (the async callback) — the status filter then only updates when IndexedDB changes, not when time passes. A medicine that becomes Expired at midnight won't update until another DB write happens.
**Why it happens:** `useLiveQuery` only re-runs the querier when observed IndexedDB tables change, not on timer ticks.
**How to avoid:** Keep `calculateStatus()` in `useMemo` or at render time. For Dashboard expired count specifically: use expiryDate comparisons inside the querier (date strings compare correctly as ISO strings), but for PAO-derived expiry use the render-time calculation.
**Warning signs:** Dashboard expired count doesn't update overnight without user interaction.

### Pitfall 4: Zustand Array State Selector Without shallow
**What goes wrong:** `const cats = useUIStore(s => s.selectedCategories)` — every Zustand state update creates a new array reference even if contents are identical. Components re-render on every unrelated store write.
**Why it happens:** Zustand uses reference equality by default.
**How to avoid:** `import { shallow } from 'zustand/shallow'` then `useUIStore(s => s.selectedCategories, shallow)`.
**Warning signs:** Medicine list re-renders visibly on location dialog open/close.

### Pitfall 5: History Not Written for Lifecycle Events
**What goes wrong:** Move-to-Trash and Restore actions update `deletedAt` but don't insert a history entry. Detail view shows no history for delete/restore events.
**Why it happens:** Lifecycle events are easy to forget when implementing — the pattern only feels obvious for field edits.
**How to avoid:** Wrap ALL medicine mutations in `updateMedicineWithHistory()` or `db.transaction()` that includes a history insert. The planner must ensure each action (delete, restore, permanent delete, create, edit) has a corresponding history write task.

### Pitfall 6: Permanent Delete Removes History
**What goes wrong:** `db.medicines.delete(id)` is followed by `db.history.where('medicineId').equals(id).delete()` — wiping history violates D-38 and TRSH-04.
**Why it happens:** Developer assumes FK cascade behavior.
**How to avoid:** Never delete history entries. The `medicineName` denormalization exists precisely so history is readable after the medicine record is gone.
**Warning signs:** Trash screen shows "No history" after permanent delete.

### Pitfall 7: sortBy() on Non-Indexed Fields After Filter()
**What goes wrong:** `db.medicines.toCollection().filter(...).sortBy('name')` — Dexie's `sortBy()` does a full in-memory sort, which is fine. However, developers sometimes try `orderBy('name')` before `filter()`, then call `toArray()` — this returns ordered results but the filter may break ordering expectations.
**Why it happens:** Confusion between `sortBy()` (memory sort, works after filter) and `orderBy()` (index-based, must be first).
**How to avoid:** Always use `sortBy()` after `filter()` when filtering by non-indexed criteria. `orderBy()` only when the indexed field is the first operation.

### Pitfall 8: diffMedicine Comparing pao Objects
**What goes wrong:** `before.pao === after.pao` returns false even when both are `{ value: 3, unit: 'months' }` because object references differ.
**Why it happens:** JavaScript reference equality for objects.
**How to avoid:** Use `JSON.stringify(oldVal) !== JSON.stringify(newVal)` in `diffMedicine()` — handles both primitive and object field comparison correctly. PAO field is order-stable so stringify is reliable.

---

## Runtime State Inventory

This is not a rename/refactor phase. No runtime state inventory required.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build | Assumed present (Phase 1 built) | — | — |
| npm / npx | shadcn Sheet install | Assumed present | — | Manually copy sheet.tsx from shadcn source |
| IndexedDB | Dexie v2 migration | Browser built-in | All modern browsers | fake-indexeddb in tests |
| @radix-ui/react-dialog | shadcn Sheet (transitive) | Already installed via @radix-ui/react-alert-dialog | 1.1.18 | — |

**Missing dependencies with no fallback:** none
**Missing dependencies with fallback:** shadcn Sheet requires `npx shadcn@latest add sheet` — if npx unavailable, copy `src/components/ui/sheet.tsx` from shadcn GitHub directly.

---

## Security Domain

Security enforcement enabled, ASVS level 1, block on "high" severity issues.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No user auth in this app |
| V3 Session Management | No | No sessions; local-only |
| V4 Access Control | No | Single-user, local-only data |
| V5 Input Validation | Yes | Zod schema on medicine form; search input is client-side only (no injection surface) |
| V6 Cryptography | No | No secrets stored |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Search input XSS | Spoofing/Tampering | React escapes all rendered strings by default; never use `dangerouslySetInnerHTML` with `searchQuery` |
| IndexedDB data corruption via malformed form | Tampering | Zod validation on MedicineForm; `diffMedicine()` only touches known fields |
| History injection (fake entries) | Tampering | History entries are created only by app code; no user-editable history endpoint |
| Accidental permanent delete without confirmation | Elevation of Privilege | AlertDialog confirmation required before `db.medicines.delete()` (UI-SPEC pattern) |

**No high-severity risks identified.** All data is local; there is no server-side surface, no authentication, and no network transmission of user data. XSS is the only browser-side concern and React's default escaping handles it.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `manualStatus: 'Disposed'` as delete mechanism (Phase 1) | `deletedAt: ISO string` soft delete (Phase 2) | Phase 2 | Requires updating handleDelete() in [id].tsx |
| No filter state | Zustand filter/sort store | Phase 2 | Filter state persists across navigation |
| No audit log | Insert-only history table | Phase 2 | All mutations must include history write |

**Deprecated/outdated in this codebase:**
- Phase 1 `handleDelete()` using `manualStatus: 'Disposed'`: Replace with `deletedAt` pattern. The old approach is not wrong for a Disposed badge but it is wrong as a delete mechanism.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `toCollection().filter()` at 1,000 records takes ~5ms | Pattern 2, Pattern 9 | If user has 10,000+ records, dashboard query may be perceptible. Mitigate: add record count warning or pagination in Phase 3. |
| A2 | `JSON.stringify` comparison in `diffMedicine` is stable for `pao` object | Pattern 6 | If key order varies, false positives in diff. Mitigate: sort keys before stringify or compare fields individually. |
| A3 | shadcn Sheet `side="bottom"` animation works without additional CSS in Tailwind 4 | Pattern 5 | Tailwind 4 changed class naming — data variant animations may need a `plugin` registration. Check at implementation time. |
| A4 | `@radix-ui/react-dialog` is already present as a transitive dep and Sheet can use it | Environment section | If transitive dep is not hoisted, `npx shadcn add sheet` resolves it by adding the direct dep to package.json. No risk. |

**If this table were empty:** All claims were verified — it is not empty because A1 and A2 are performance/behavior assumptions worth flagging.

---

## Open Questions

1. **deletedAt field in TypeScript types**
   - What we know: `Medicine` interface in `db.ts` must gain `deletedAt: string | null`
   - What's unclear: Whether the upgrade function needs to handle records with `deletedAt: undefined` (from before migration) differently from records with `deletedAt: null`
   - Recommendation: The upgrade function sets `deletedAt = null` on all existing records, so post-migration all records have `null` not `undefined`. TypeScript type should be `string | null` (not `string | null | undefined`).

2. **Dashboard "exceeded open period" count definition**
   - What we know: D-33 / DASH-04 says "exceeded open period" is a tappable card
   - What's unclear: Exact definition — is this medicines where `calculateStatus() === 'Expired'` AND the cause is PAO (not expiry date)? Or any opened medicine past its PAO regardless of expiry?
   - Recommendation: Use the approximation `status === 'Expired' AND expiryDate > today` (i.e., expired due to PAO, not expiry date). Document the approximation in code.

3. **Sort after combined filter**
   - What we know: Dexie's `sortBy()` works post-filter for in-memory sort
   - What's unclear: Whether the sort should apply before or after the `useMemo` status filter
   - Recommendation: Apply sort in `useMemo` after all filters, on the filtered result. This ensures sort respects applied filters.

---

## Sources

### Primary (MEDIUM confidence — Dexie official docs)
- [dexie.org/docs/WhereClause/WhereClause.equals()](https://dexie.org/docs/WhereClause/WhereClause.equals/) — null key restriction confirmed
- [dexie.org/docs/WhereClause/WhereClause.notEqual()](https://dexie.org/docs/WhereClause/WhereClause.notEqual()) — null exclusion behavior confirmed
- [dexie.org/docs/Dexie/Dexie.transaction()](https://dexie.org/docs/Dexie/Dexie.transaction/) — transaction API confirmed
- [dexie.org/docs/Dexie/Dexie.version()](https://dexie.org/docs/Dexie/Dexie.version()) — schema migration pattern
- [dexie.org/docs/dexie-react-hooks/useLiveQuery()](https://dexie.org/docs/dexie-react-hooks/useLiveQuery()) — deps array and hook signature
- [dexie.org/docs/liveQuery()](https://dexie.org/docs/liveQuery()) — reactive query behavior

### Secondary (MEDIUM confidence — official library docs)
- [radix-ui.com/primitives/docs/components/dialog](https://www.radix-ui.com/primitives/docs/components/dialog) — Dialog sub-components and animation data attributes
- [ui.shadcn.com/docs/components/sheet](https://ui.shadcn.com/docs/components/sheet) — Sheet component with side="bottom"
- [zustand.docs.pmnd.rs/learn/guides/slices-pattern](https://zustand.docs.pmnd.rs/learn/guides/slices-pattern) — Zustand slices pattern

### Tertiary (LOW confidence — websearch/community)
- Dexie null index behavior cross-confirmed via [GitHub issue #153](https://github.com/dfahlander/Dexie.js/issues/153)
- Zustand shallow import confirmed via Zustand v5 migration notes [ASSUMED]

---

## Metadata

**Confidence breakdown:**
- Dexie schema/query patterns: MEDIUM — confirmed via official dexie.org docs
- Null index limitation (critical finding): MEDIUM — confirmed via official docs + GitHub issue
- Zustand filter state design: LOW — standard pattern, unverified against Zustand v5 docs directly
- shadcn Sheet bottom sheet: MEDIUM — confirmed via ui.shadcn.com docs
- Performance estimates (5ms scan): LOW — assumed, not benchmarked against fake-indexeddb

**Research date:** 2026-06-30
**Valid until:** 2026-07-30 (Dexie and Zustand are stable; shadcn Sheet API is stable)
