import { Dexie, type EntityTable } from 'dexie'

export type PAO = { value: number; unit: 'days' | 'weeks' | 'months' }
export type ManualStatus = 'UsedUp' | 'Disposed' | 'Archived' | null

export const MedicineForm = {
  Tablet: 'Tablet',
  Capsule: 'Capsule',
  Syrup: 'Syrup',
  Cream: 'Cream',
  Drops: 'Drops',
  Spray: 'Spray',
  Powder: 'Powder',
  Gel: 'Gel',
  Ointment: 'Ointment',
  Patch: 'Patch',
  Inhaler: 'Inhaler',
  Suppository: 'Suppository',
  Other: 'Other',
} as const

export type MedicineForm = typeof MedicineForm[keyof typeof MedicineForm]

export interface Medicine {
  id: number
  catalogId: number             // D-06: references medicine_catalog entry
  location: string | null       // null = "Other" (D-17); NEVER store 'Other' string
  expiryDate: string | null     // YYYY-MM-DD — required for add, nullable for import edge cases
  openedDate: string | null     // YYYY-MM-DD
  pao: PAO | null               // period-after-opening (D-08)
  quantity: number | null
  quantityUnit: string | null
  packCount: number | null     // number of boxes/packs (null means not tracked)
  notes: string | null
  manualStatus: ManualStatus    // D-13: takes precedence over auto-calculated status
  createdAt: string             // ISO timestamp
  updatedAt: string             // ISO timestamp
  deletedAt: string | null      // null = active; ISO string = soft-deleted (D-25).
                                // D-25 deviation: the original spec used manualStatus='Disposed' for
                                // soft-delete but that approach was rejected — manualStatus is a
                                // USER-VISIBLE override field (D-13: values 'UsedUp' and 'Archived')
                                // whose semantics would be corrupted if overloaded with 'Disposed'.
                                // A restored medicine would appear as "Disposed" to the user.
                                // deletedAt provides a precise audit timestamp and clean separation
                                // of concerns: deletion lifecycle ≠ user-driven status override.
}

export interface Location {
  id: number
  name: string
  isDefault: boolean            // D-18: predefined locations cannot be renamed/deleted
}

export interface MedicineCatalog {
  id: number
  name: string                  // title-cased (D-02)
  category: string | null       // most-common from stock entries during migration (D-04)
  form: MedicineForm | null     // null for all migrated entries (D-11)
  notes: string | null          // null for all migrated entries (D-05)
  createdAt: string             // ISO timestamp
  updatedAt: string             // ISO timestamp
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
  medicine_catalog: EntityTable<MedicineCatalog, 'id'>
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
    //
    // D-25 design deviation: soft-delete uses deletedAt (not manualStatus='Disposed').
    // Rationale: manualStatus is reserved for user-visible status overrides (D-13: 'UsedUp',
    // 'Archived'). Using it for deletion lifecycle would corrupt the restore flow and conflate
    // two independent concerns. deletedAt records exactly when a medicine was deleted, which
    // is directly useful for the Trash Bin feature, history log, and future cleanup policies.
    medicines: '++id, name, category, location, expiryDate, manualStatus',
    history:   '++id, medicineId, timestamp',
  })
  .upgrade(tx =>
    tx.table('medicines').toCollection().modify((m: Record<string, unknown>) => {
      m.deletedAt = null
      // D-04 context: catalogId will be set in v3 upgrade; placeholder here
      m.catalogId = 0  // temporary; v3 upgrade will set real catalogId
    })
  )

db.version(3)
  .stores({
    medicines: '++id, catalogId, location, expiryDate, manualStatus',
    medicine_catalog: '++id, name',
    history: '++id, medicineId, timestamp',
  })
  .upgrade(tx => {
    // Step 1: Read all v2 medicines
    return tx.table('medicines').toCollection().toArray().then((medicines: Record<string, unknown>[]) => {
      // Step 2: Deduplicate by normalized name (case-insensitive + trimmed)
      const catalogMap: Map<string, {
        medicines: Record<string, unknown>[]
        categories: Map<string, number>
      }> = new Map()

      for (const med of medicines) {
        const normalized = (med.name as string).trim().toLowerCase()
        if (!catalogMap.has(normalized)) {
          catalogMap.set(normalized, { medicines: [], categories: new Map() })
        }
        const group = catalogMap.get(normalized)!
        group.medicines.push(med)
        const cat = med.category || null
        group.categories.set(cat as string, (group.categories.get(cat as string) ?? 0) + 1)
      }

      // Step 3: Create catalog entries and map to stock IDs
      const catalogEntries: MedicineCatalog[] = []
      const medicineUpdates: { id: number, catalogId: number }[] = []
      let nextCatalogId = 1

      for (const [normalized, group] of catalogMap) {
        // Title-case the name (D-02)
        const titleCased = normalized
          .split(/\s+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

        // Find most-common category (D-04)
        let mostCommonCategory: string | null = null
        let maxCount = 0
        let lowestIdForTiebreak = Infinity

        for (const [cat, count] of group.categories) {
          const candidateId = (group.medicines.find(m => m.category === cat)?.id as number | undefined) ?? Infinity
          if (count > maxCount || (count === maxCount && candidateId < lowestIdForTiebreak)) {
            mostCommonCategory = cat
            maxCount = count
            lowestIdForTiebreak = candidateId
          }
        }

        // Create catalog entry
        const now = new Date().toISOString()
        catalogEntries.push({
          id: nextCatalogId,
          name: titleCased,
          category: mostCommonCategory,
          form: null,      // D-11: no heuristic inference
          notes: null,     // D-05: migrated notes stay in stock entries
          createdAt: now,
          updatedAt: now,
        })

        // Create stock entry updates
        for (const med of group.medicines) {
          medicineUpdates.push({
            id: med.id as number,
            catalogId: nextCatalogId,
          })
        }

        nextCatalogId++
      }

      // Step 4: Bulk insert catalog and update medicines
      return tx.table('medicine_catalog').bulkAdd(catalogEntries)
        .then(() => tx.table('medicines').bulkUpdate(medicineUpdates.map(m => ({ key: m.id, changes: { catalogId: m.catalogId } }))))
    })
  })

db.version(4)
  .stores({
    // D-16: Remove name and category from medicines index (now denormalized in medicine_catalog only)
    medicines: '++id, catalogId, location, expiryDate, manualStatus',
    medicine_catalog: '++id, name',
    history: '++id, medicineId, timestamp',
  })

db.version(5)
  .stores({
    // packCount is not indexed — not queried by index; schema unchanged
    medicines: '++id, catalogId, location, expiryDate, manualStatus',
    medicine_catalog: '++id, name',
    history: '++id, medicineId, timestamp',
  })
  .upgrade(tx =>
    tx.table('medicines').toCollection().modify((m: Record<string, unknown>) => {
      m.packCount = null
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
    { name: 'Refrigerator', isDefault: true },
    { name: 'Travel Kit', isDefault: true },
  ])
})

export { db }
