import { Dexie, type EntityTable } from 'dexie'

export type PAO = { value: number; unit: 'days' | 'weeks' | 'months' }
export type ManualStatus = 'Used Up' | 'Disposed' | 'Archived' | null

export interface Medicine {
  id: number
  name: string
  category: string | null
  location: string | null       // null = "Other" (D-17); NEVER store 'Other' string
  expiryDate: string | null     // YYYY-MM-DD — required for add, nullable for import edge cases
  openedDate: string | null     // YYYY-MM-DD
  pao: PAO | null               // period-after-opening (D-08)
  quantity: number | null
  quantityUnit: string | null
  notes: string | null
  manualStatus: ManualStatus    // D-13: takes precedence over auto-calculated status
  createdAt: string             // ISO timestamp
  updatedAt: string             // ISO timestamp
  deletedAt: string | null      // null = active; ISO string = soft-deleted (D-25)
}

export interface Location {
  id: number
  name: string
  isDefault: boolean            // D-18: predefined locations cannot be renamed/deleted
}

// Phase 2: audit history (D-36, D-38)
export interface HistoryEntry {
  id?: number
  medicineId: number
  medicineName: string          // denormalized — readable after medicine is permanently deleted (D-36, D-38)
  action: 'created' | 'updated' | 'deleted' | 'restored'
  changedFields: { field: string; oldValue: unknown; newValue: unknown }[]
  timestamp: string             // ISO 8601
}

const db = new Dexie('MedStockDB') as Dexie & {
  medicines: EntityTable<Medicine, 'id'>
  locations: EntityTable<Location, 'id'>
  history:   EntityTable<HistoryEntry, 'id'>
}

db.version(1).stores({
  // Only indexed fields listed here; non-indexed fields (pao, openedDate, etc.) don't appear
  // CRITICAL: only add new indexed fields via db.version(2) — never modify version 1 (Pitfall 5)
  medicines: '++id, name, category, location, expiryDate, manualStatus',
  locations: '++id, name, isDefault',
})

db.version(2)
  .stores({
    // CRITICAL: deletedAt is NOT in the index string — null is not a valid IndexedDB key (Pitfall 1).
    // Query active records with toCollection().filter(m => m.deletedAt === null) instead.
    medicines: '++id, name, category, location, expiryDate, manualStatus',
    history:   '++id, medicineId, timestamp',
  })
  .upgrade(tx =>
    tx.table('medicines').toCollection().modify((m: Medicine) => {
      m.deletedAt = null
    })
  )

// Seed predefined locations on first open (D-18, LOC-01)
db.on('populate', async () => {
  await db.locations.bulkAdd([
    { name: 'Bathroom Cabinet', isDefault: true },
    { name: 'Bedroom Cabinet', isDefault: true },
    { name: 'Kitchen Drawer', isDefault: true },
    { name: 'Living Room Cabinet', isDefault: true },
    { name: 'Medicine Box', isDefault: true },
    { name: 'Other', isDefault: true },
    { name: 'Refrigerator', isDefault: true },
    { name: 'Travel Kit', isDefault: true },
  ])
})

export { db }
