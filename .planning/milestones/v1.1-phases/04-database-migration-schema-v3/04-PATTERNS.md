# Phase 04: Database Migration & Schema v3 - Pattern Map

**Mapped:** 2026-07-28  
**Files analyzed:** 4 (3 modified, 1 read-only context)  
**Analogs found:** 4 / 4 (exact analogs for all files)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/db.ts` | utility (schema) | DDL + migration | `src/lib/db.ts` (current v2) | exact |
| `src/lib/historyOps.ts` | utility (mutation layer) | CRUD + transaction | `src/lib/historyOps.ts` (current) | exact |
| `src/lib/historyOps.test.ts` | test | CRUD + transaction | `src/lib/historyOps.test.ts` (current) | exact |
| `src/lib/dataOps.ts` | utility (backup/restore) | request-response | `src/lib/dataOps.ts` (current) | read-only context |

---

## Pattern Assignments

### `src/lib/db.ts` (utility, DDL + migration)

**Analog:** `src/lib/db.ts` (current, lines 1–93)

**Imports pattern** (lines 1–2):
```typescript
import { Dexie, type EntityTable } from 'dexie'
```

**Type definitions pattern** (lines 3–44):
```typescript
export type PAO = { value: number; unit: 'days' | 'weeks' | 'months' }
export type ManualStatus = 'UsedUp' | 'Disposed' | 'Archived' | null

export interface Medicine {
  id: number
  name: string
  category: string | null
  location: string | null
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

export interface Location {
  id: number
  name: string
  isDefault: boolean
}

export interface HistoryEntry {
  id?: number
  medicineId: number
  medicineName: string
  action: 'created' | 'updated' | 'deleted' | 'restored'
  changedFields: { field: string; oldValue: unknown; newValue: unknown }[]
  timestamp: string
}
```

**Dexie instantiation pattern** (lines 46–50):
```typescript
const db = new Dexie('MedStockDB') as Dexie & {
  medicines: EntityTable<Medicine, 'id'>
  locations: EntityTable<Location, 'id'>
  history:   EntityTable<HistoryEntry, 'id'>
}
```

**Version upgrade pattern** (lines 59–76):
```typescript
db.version(2)
  .stores({
    medicines: '++id, name, category, location, expiryDate, manualStatus',
    history:   '++id, medicineId, timestamp',
  })
  .upgrade(tx =>
    tx.table('medicines').toCollection().modify((m: Medicine) => {
      m.deletedAt = null
    })
  )
```

**For Phase 04 v3 upgrade:**
- Follow the same `.stores({...}).upgrade(tx => ...)` pattern
- Add `medicine_catalog: EntityTable<MedicineCatalog, 'id'>` to the Dexie type union
- In the upgrade callback (`tx =>`), use `tx.table('medicines').toCollection().modify(...)` to denormalize catalog data and update stock entries
- Use `tx.table('medicine_catalog').bulkAdd(...)` to create catalog entries from deduplicated medicine names

**Seed pattern** (lines 78–90):
```typescript
db.on('populate', async () => {
  await db.locations.bulkAdd([
    { name: 'Bathroom Cabinet', isDefault: true },
    // ... more locations
  ])
})
```

**Export pattern** (line 92):
```typescript
export { db }
```

---

### `src/lib/historyOps.ts` (utility, CRUD + transaction)

**Analog:** `src/lib/historyOps.ts` (current, lines 1–134)

**Imports pattern** (lines 1–2):
```typescript
import { db } from './db'
import type { Medicine, HistoryEntry } from './db'
```

**Tracked fields pattern** (lines 4–15):
```typescript
const TRACKED_FIELDS: (keyof Medicine)[] = [
  'name',
  'category',
  'location',
  'expiryDate',
  'openedDate',
  'pao',
  'quantity',
  'quantityUnit',
  'notes',
  'manualStatus',
]
```

**Helper function pattern — diffMedicine** (lines 21–35):
```typescript
export function diffMedicine(
  before: Medicine,
  after: Partial<Medicine>
): HistoryEntry['changedFields'] {
  const changes: HistoryEntry['changedFields'] = []
  for (const field of TRACKED_FIELDS) {
    if (!(field in after)) continue
    const oldVal = before[field]
    const newVal = after[field as keyof typeof after]
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ field, oldValue: oldVal, newValue: newVal })
    }
  }
  return changes
}
```

**Transaction pattern with atomic history recording** (lines 41–57):
```typescript
export async function updateMedicineWithHistory(
  id: number,
  before: Medicine,
  changes: Partial<Medicine>
): Promise<void> {
  const now = new Date().toISOString()
  await db.transaction('rw', db.medicines, db.history, async () => {
    await db.medicines.update(id, { ...changes, updatedAt: now })
    await db.history.add({
      medicineId: id,
      medicineName: before.name,
      action: 'updated',
      changedFields: diffMedicine(before, changes),
      timestamp: now,
    })
  })
}
```

**For Phase 04 signature updates:**

Current signature (accepts full `medicine` object):
```typescript
export async function updateMedicineWithHistory(
  id: number,
  before: Medicine,
  changes: Partial<Medicine>
): Promise<void>
```

Phase 04 new signature (adds explicit `medicineName` parameter):
```typescript
export async function updateMedicineWithHistory(
  id: number,
  before: Medicine,
  changes: Partial<Medicine>,
  medicineName: string  // D-06: explicit parameter from caller
): Promise<void>
```

Apply this pattern to all 5 mutation functions:
- `updateMedicineWithHistory` — add `medicineName: string` as last parameter
- `softDeleteMedicine` — change signature from `(medicine: Medicine)` to `(medicine: Medicine, medicineName: string)`
- `restoreMedicine` — change signature from `(medicine: Medicine)` to `(medicine: Medicine, medicineName: string)`
- `permanentDeleteMedicine` — change signature from `(medicine: Medicine)` to `(medicine: Medicine, medicineName: string)`
- `addMedicineHistory` — change signature from `(medicine: Medicine, action: 'created')` to `(medicine: Medicine, medicineName: string, action: 'created')`

**Update history entry writing:**
Replace `medicineName: medicine.name` with `medicineName: medicineName` (use the explicit parameter).

**Soft-delete pattern** (lines 63–75):
```typescript
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
```

**Restore pattern** (lines 82–94):
```typescript
export async function restoreMedicine(medicine: Medicine): Promise<void> {
  const now = new Date().toISOString()
  await db.transaction('rw', db.medicines, db.history, async () => {
    await db.medicines.update(medicine.id, { deletedAt: null, updatedAt: now })
    await db.history.add({
      medicineId: medicine.id,
      medicineName: medicine.name,
      action: 'restored',
      changedFields: [],
      timestamp: now,
    })
  })
}
```

**Permanent delete pattern** (lines 101–113):
```typescript
export async function permanentDeleteMedicine(medicine: Medicine): Promise<void> {
  const now = new Date().toISOString()
  await db.transaction('rw', db.medicines, db.history, async () => {
    await db.history.add({
      medicineId: medicine.id,
      medicineName: medicine.name,
      action: 'deleted',
      changedFields: [],
      timestamp: now,
    })
    await db.medicines.delete(medicine.id)
  })
}
```

**Add history pattern** (lines 119–133):
```typescript
export async function addMedicineHistory(
  medicine: Medicine,
  action: 'created'
): Promise<void> {
  const now = new Date().toISOString()
  await db.transaction('rw', db.history, async () => {
    await db.history.add({
      medicineId: medicine.id,
      medicineName: medicine.name,
      action,
      changedFields: [],
      timestamp: now,
    })
  })
}
```

---

### `src/lib/historyOps.test.ts` (test, CRUD + transaction)

**Analog:** `src/lib/historyOps.test.ts` (current, lines 1–200)

**Setup and imports pattern** (lines 1–12):
```typescript
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/lib/db'
import type { Medicine } from '@/lib/db'
import {
  diffMedicine,
  softDeleteMedicine,
  restoreMedicine,
  permanentDeleteMedicine,
  updateMedicineWithHistory,
  addMedicineHistory,
} from '@/lib/historyOps'
```

**Base fixture pattern** (lines 14–28):
```typescript
const baseMedicine: Omit<Medicine, 'id'> = {
  name: 'Ibuprofen',
  category: 'Painkiller',
  location: 'Bathroom Cabinet',
  expiryDate: '2027-01-01',
  openedDate: null,
  pao: null,
  quantity: 20,
  quantityUnit: 'tablets',
  notes: null,
  manualStatus: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
}
```

**Lifecycle pattern** (lines 30–33):
```typescript
beforeEach(async () => {
  await db.delete()
  await db.open()
})
```

**Test structure pattern** (lines 35–73):
```typescript
describe('diffMedicine', () => {
  it('detects changed string fields', () => {
    const before = { ...baseMedicine, id: 1 } as Medicine
    const changes = { name: 'Ibuprofen Plus' }
    const result = diffMedicine(before, changes)
    expect(result).toEqual([{ field: 'name', oldValue: 'Ibuprofen', newValue: 'Ibuprofen Plus' }])
  })

  it('returns empty array when no tracked fields changed', () => {
    // ...
  })

  // ... more test cases
})
```

**Async test pattern with database operations** (lines 75–94):
```typescript
describe('softDeleteMedicine', () => {
  it('sets deletedAt to a non-null ISO string', async () => {
    const id = await db.medicines.add({ ...baseMedicine })
    const medicine = await db.medicines.get(id) as Medicine
    await softDeleteMedicine(medicine)
    const updated = await db.medicines.get(id)
    expect(updated?.deletedAt).not.toBeNull()
    expect(typeof updated?.deletedAt).toBe('string')
  })

  it('writes a history entry with action="deleted" and empty changedFields', async () => {
    const id = await db.medicines.add({ ...baseMedicine })
    const medicine = await db.medicines.get(id) as Medicine
    await softDeleteMedicine(medicine)
    const entries = await db.history.where('medicineId').equals(id).toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].action).toBe('deleted')
    expect(entries[0].changedFields).toEqual([])
    expect(entries[0].medicineName).toBe('Ibuprofen')
  })
})
```

**For Phase 04 test updates:**
- Update all function calls to match new signatures with explicit `medicineName` parameter
- Example: `await softDeleteMedicine(medicine, 'Ibuprofen')` instead of `await softDeleteMedicine(medicine)`
- All test expectations remain the same; only the call signatures change
- `beforeEach`, fixtures, and async patterns remain unchanged

---

### `src/lib/dataOps.ts` (utility, backup/restore — read-only context)

**Analog:** `src/lib/dataOps.ts` (current, lines 1–111)

**IMPORTANT:** Phase 04 does NOT modify this file. It is listed as read-only context only to ensure Phase 4 modifications to `src/lib/db.ts` do not break the `BackupSchema` Zod definition.

**Current BackupSchema structure** (lines 9–56):
```typescript
export const BackupSchema = z.object({
  medicines: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      category: z.string().nullable(),
      location: z.string().nullable(),
      expiryDate: z.string().nullable(),
      openedDate: z.string().nullable(),
      pao: z
        .object({
          value: z.number(),
          unit: z.enum(['days', 'weeks', 'months']),
        })
        .nullable(),
      quantity: z.number().nullable(),
      quantityUnit: z.string().nullable(),
      notes: z.string().nullable(),
      manualStatus: z.enum(['UsedUp', 'Disposed', 'Archived']).nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
      deletedAt: z.string().nullable(),
    })
  ),
  locations: z.array(...),
  history: z.array(...),
})
```

**Note for Phase 4:**
- `BackupSchema` currently mirrors `Medicine` (now stock entries) but must continue to work during the migration
- Phase 6 (backup/restore) will update `BackupSchema` to handle both catalog and stock tables
- Phase 4 must not break the import: `type { Medicine, Location, HistoryEntry } from './db'` used in dataOps.ts line 3

---

## Shared Patterns

### Dexie Transaction Pattern
**Source:** `src/lib/db.ts` (line 59) and `src/lib/historyOps.ts` (lines 47, 65, 84, 103, 124)  
**Apply to:** All CRUD operations in phase 04

The transaction pattern ensures atomicity: medicine updates and history recording happen in the same transaction, or both roll back.

```typescript
await db.transaction('rw', db.medicines, db.history, async () => {
  // Update medicine
  // Add history entry
  // Both succeed or both fail
})
```

### Timestamp Pattern
**Source:** `src/lib/historyOps.ts` (lines 46, 64, 83, 102, 123)  
**Apply to:** All new catalog entries and migration operations

Use ISO 8601 strings (as returned by `new Date().toISOString()`):
```typescript
const now = new Date().toISOString()
```

Do NOT use `YYYY-MM-DD` for historical timestamps. Use `YYYY-MM-DD` only for user-facing date fields like `expiryDate`.

### Denormalized Name Pattern
**Source:** `src/lib/historyOps.ts` (lines 51, 69, 89, 106)  
**Apply to:** All history entries (unchanged in phase 04)

Store `medicineName: string` explicitly in each history entry, not just the reference. This ensures readability after a medicine is permanently deleted.

```typescript
await db.history.add({
  medicineId: id,
  medicineName: medicineName,  // explicit denormalized string
  action: 'updated',
  changedFields: diffMedicine(before, changes),
  timestamp: now,
})
```

---

## No Analog Found

None — all files in Phase 04 have direct analogs in the current codebase.

---

## Implementation Notes for Planner

### Migration Callback Structure (`db.version(3).upgrade(tx => ...)`)

The upgrade callback must:

1. **Read all v2 medicines** — use `tx.table('medicines').toCollection().toArray()`
2. **Deduplicate and group** — normalize names (case-insensitive, trimmed), count categories
3. **Create catalog entries** — one per unique name, with title-cased display name and most-common category
4. **Update stock entries** — add `catalogId` field to each medicine pointing to its catalog entry
5. **Bulk insert catalogs** — use `tx.table('medicine_catalog').bulkAdd(catalogEntries)`
6. **Bulk update medicines** — use `tx.table('medicines').bulkUpdate(updatedMedicines)`

### Signature Change Pattern for Phase 4

All 5 historyOps functions change from reading `medicine.name` to accepting explicit `medicineName: string` parameter:

- Caller (Phase 5 forms/routes) supplies `medicineName` from catalog context
- Function writes it directly to history entry without reading from any table
- This breaks the coupling: historyOps does not need to import `MedicineCatalog` type

Example transformation:

**Before (v2):**
```typescript
export async function softDeleteMedicine(medicine: Medicine): Promise<void> {
  // ...
  medicineName: medicine.name,  // read from medicine object
}
```

**After (v3):**
```typescript
export async function softDeleteMedicine(medicine: Medicine, medicineName: string): Promise<void> {
  // ...
  medicineName: medicineName,  // explicit parameter
}
```

---

## Metadata

**Analog search scope:** `src/lib/` (schema, mutation, test, backup layers)  
**Files scanned:** 12 files in `src/lib/`  
**Pattern extraction date:** 2026-07-28  
**Context sources:** 04-CONTEXT.md (decisions D-01 to D-11), current codebase (db.ts v2, historyOps.ts, historyOps.test.ts, dataOps.ts)
