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

const baseMedicine: Omit<Medicine, 'id'> = {
  catalogId: 1,  // Will be updated in migration tests
  location: 'Bathroom Cabinet',
  expiryDate: '2027-01-01',
  openedDate: null,
  pao: null,
  quantity: 20,
  quantityUnit: 'tablets',
  packCount: null,
  notes: null,
  manualStatus: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
}

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('diffMedicine', () => {
  it('detects changed string fields', () => {
    const before = { ...baseMedicine, id: 1 } as Medicine
    const changes = { expiryDate: '2028-06-01' }
    const result = diffMedicine(before, changes)
    expect(result).toEqual([{ field: 'expiryDate', oldValue: '2027-01-01', newValue: '2028-06-01' }])
  })

  it('returns empty array when no tracked fields changed', () => {
    const before = { ...baseMedicine, id: 1 } as Medicine
    const changes = { updatedAt: new Date().toISOString() } // not a tracked field
    const result = diffMedicine(before, changes)
    expect(result).toEqual([])
  })

  it('detects PAO object change using JSON.stringify comparison', () => {
    const before = { ...baseMedicine, id: 1, pao: { value: 3, unit: 'months' as const } } as Medicine
    const changes = { pao: { value: 6, unit: 'months' as const } }
    const result = diffMedicine(before, changes)
    expect(result).toEqual([{ field: 'pao', oldValue: { value: 3, unit: 'months' }, newValue: { value: 6, unit: 'months' } }])
  })

  it('returns empty array when PAO value is identical (JSON.stringify equality)', () => {
    const pao = { value: 3, unit: 'months' as const }
    const before = { ...baseMedicine, id: 1, pao } as Medicine
    const changes = { pao: { value: 3, unit: 'months' as const } }
    const result = diffMedicine(before, changes)
    expect(result).toEqual([])
  })

  it('detects multiple changed fields', () => {
    const before = { ...baseMedicine, id: 1 } as Medicine
    const changes = { expiryDate: '2028-06-01', location: 'Kitchen Drawer' }
    const result = diffMedicine(before, changes)
    expect(result).toHaveLength(2)
    expect(result.find(f => f.field === 'expiryDate')).toEqual({ field: 'expiryDate', oldValue: '2027-01-01', newValue: '2028-06-01' })
    expect(result.find(f => f.field === 'location')).toEqual({ field: 'location', oldValue: 'Bathroom Cabinet', newValue: 'Kitchen Drawer' })
  })
})

describe('softDeleteMedicine', () => {
  it('sets deletedAt to a non-null ISO string', async () => {
    const id = await db.medicines.add({ ...baseMedicine })
    const medicine = await db.medicines.get(id) as Medicine
    await softDeleteMedicine(medicine, 'Ibuprofen')
    const updated = await db.medicines.get(id)
    expect(updated?.deletedAt).not.toBeNull()
    expect(typeof updated?.deletedAt).toBe('string')
  })

  it('writes a history entry with action="deleted" and empty changedFields', async () => {
    const id = await db.medicines.add({ ...baseMedicine })
    const medicine = await db.medicines.get(id) as Medicine
    await softDeleteMedicine(medicine, 'Ibuprofen')
    const entries = await db.history.where('medicineId').equals(id).toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].action).toBe('deleted')
    expect(entries[0].changedFields).toEqual([])
    expect(entries[0].medicineName).toBe('Ibuprofen')
  })
})

describe('restoreMedicine', () => {
  it('sets deletedAt back to null', async () => {
    const now = new Date().toISOString()
    const id = await db.medicines.add({ ...baseMedicine, deletedAt: now })
    const medicine = await db.medicines.get(id) as Medicine
    await restoreMedicine(medicine, 'Ibuprofen')
    const updated = await db.medicines.get(id)
    expect(updated?.deletedAt).toBeNull()
  })

  it('writes a history entry with action="restored" and empty changedFields', async () => {
    const now = new Date().toISOString()
    const id = await db.medicines.add({ ...baseMedicine, deletedAt: now })
    const medicine = await db.medicines.get(id) as Medicine
    await restoreMedicine(medicine, 'Ibuprofen')
    const entries = await db.history.where('medicineId').equals(id).toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].action).toBe('restored')
    expect(entries[0].changedFields).toEqual([])
  })

  it('does NOT change manualStatus (D-28)', async () => {
    const now = new Date().toISOString()
    const id = await db.medicines.add({ ...baseMedicine, deletedAt: now, manualStatus: 'Archived' })
    const medicine = await db.medicines.get(id) as Medicine
    await restoreMedicine(medicine, 'Ibuprofen')
    const updated = await db.medicines.get(id)
    expect(updated?.manualStatus).toBe('Archived')
  })
})

describe('permanentDeleteMedicine', () => {
  it('removes the medicine record', async () => {
    const id = await db.medicines.add({ ...baseMedicine })
    const medicine = await db.medicines.get(id) as Medicine
    await permanentDeleteMedicine(medicine, 'Ibuprofen')
    const deleted = await db.medicines.get(id)
    expect(deleted).toBeUndefined()
  })

  it('preserves history entries after permanent delete (D-38)', async () => {
    const id = await db.medicines.add({ ...baseMedicine })
    const medicine = await db.medicines.get(id) as Medicine
    await permanentDeleteMedicine(medicine, 'Ibuprofen')
    const count = await db.history.where('medicineId').equals(id).count()
    expect(count).toBeGreaterThan(0)
  })

  it('writes a history entry with action="deleted" before deleting medicine', async () => {
    const id = await db.medicines.add({ ...baseMedicine })
    const medicine = await db.medicines.get(id) as Medicine
    await permanentDeleteMedicine(medicine, 'Ibuprofen')
    const entries = await db.history.where('medicineId').equals(id).toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].action).toBe('deleted')
    expect(entries[0].medicineName).toBe('Ibuprofen')
    expect(entries[0].changedFields).toEqual([])
  })
})

describe('updateMedicineWithHistory', () => {
  it('applies changes to the medicine record', async () => {
    const id = await db.medicines.add({ ...baseMedicine })
    const before = await db.medicines.get(id) as Medicine
    await updateMedicineWithHistory(id, before, { expiryDate: '2028-06-01' }, 'Ibuprofen')
    const updated = await db.medicines.get(id)
    expect(updated?.expiryDate).toBe('2028-06-01')
  })

  it('writes a history entry with action="updated" and changedFields from diffMedicine', async () => {
    const id = await db.medicines.add({ ...baseMedicine })
    const before = await db.medicines.get(id) as Medicine
    await updateMedicineWithHistory(id, before, { expiryDate: '2028-06-01' }, 'Ibuprofen')
    const entries = await db.history.where('medicineId').equals(id).toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].action).toBe('updated')
    expect(entries[0].changedFields).toEqual([{ field: 'expiryDate', oldValue: '2027-01-01', newValue: '2028-06-01' }])
  })

  it('sets updatedAt on the medicine record', async () => {
    const id = await db.medicines.add({ ...baseMedicine })
    const before = await db.medicines.get(id) as Medicine
    const oldUpdatedAt = before.updatedAt
    // Ensure time difference
    await new Promise(r => setTimeout(r, 10))
    await updateMedicineWithHistory(id, before, { expiryDate: '2028-06-01' }, 'Ibuprofen')
    const updated = await db.medicines.get(id)
    expect(updated?.updatedAt).not.toBe(oldUpdatedAt)
  })
})

describe('addMedicineHistory', () => {
  it('writes a history entry with action="created" and empty changedFields', async () => {
    const id = await db.medicines.add({ ...baseMedicine })
    const medicine = await db.medicines.get(id) as Medicine
    await addMedicineHistory(medicine, 'Ibuprofen', 'created')
    const entries = await db.history.where('medicineId').equals(id).toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].action).toBe('created')
    expect(entries[0].changedFields).toEqual([])
    expect(entries[0].medicineName).toBe('Ibuprofen')
  })
})

describe('v2→v3 migration', () => {
  // Helper function to simulate the migration logic
  async function simulateMigration() {
    // Read all v2 medicines (currently all with catalogId=0)
    const medicines = await db.medicines.toArray() as any[]

    // Deduplicate by normalized name (case-insensitive + trimmed)
    const catalogMap: Map<string, {
      medicines: any[]
      categories: Map<string, number>
    }> = new Map()

    for (const med of medicines) {
      const normalized = med.name.trim().toLowerCase()
      if (!catalogMap.has(normalized)) {
        catalogMap.set(normalized, { medicines: [], categories: new Map() })
      }
      const group = catalogMap.get(normalized)!
      group.medicines.push(med)
      const cat = med.category || null
      group.categories.set(cat as string, (group.categories.get(cat as string) ?? 0) + 1)
    }

    // Create catalog entries and map to stock IDs
    const catalogEntries: any[] = []
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
        if (count > maxCount || (count === maxCount && group.medicines.find(m => m.category === cat)?.id < lowestIdForTiebreak)) {
          mostCommonCategory = cat
          maxCount = count
          lowestIdForTiebreak = group.medicines.find(m => m.category === cat)?.id ?? Infinity
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
          id: med.id,
          catalogId: nextCatalogId,
        })
      }

      nextCatalogId++
    }

    // Bulk insert catalog and update medicines
    await db.medicine_catalog.bulkAdd(catalogEntries)
    await db.medicines.bulkUpdate(medicineUpdates.map(m => ({ key: m.id, changes: { catalogId: m.catalogId } })))
  }

  it('deduplicates by case-insensitive name and creates one catalog entry', async () => {
    // Add 4 medicines: "Paracetamol" variants and "IBUPROFEN" (legacy v2 format with name/category)
    await db.medicines.add({ ...baseMedicine, id: 1, name: 'Paracetamol', category: 'Painkiller', catalogId: 0 } as any)
    await db.medicines.add({ ...baseMedicine, id: 2, name: 'paracetamol', category: 'Painkiller', catalogId: 0 } as any)
    await db.medicines.add({ ...baseMedicine, id: 3, name: ' Paracetamol ', category: 'Painkiller', catalogId: 0 } as any)
    await db.medicines.add({ ...baseMedicine, id: 4, name: 'IBUPROFEN', category: 'Painkiller', catalogId: 0 } as any)

    // Run the migration logic
    await simulateMigration()

    // Verify results
    const catalogCount = await db.medicine_catalog.count()
    expect(catalogCount).toBe(2)

    // Check catalog entries are title-cased
    const catalogs = await db.medicine_catalog.toArray()
    const paracetamolCatalog = catalogs.find(c => c.name === 'Paracetamol')
    const ibuprofenCatalog = catalogs.find(c => c.name === 'Ibuprofen')
    expect(paracetamolCatalog).toBeDefined()
    expect(ibuprofenCatalog).toBeDefined()

    // Check all medicines point to correct catalogs
    const medicines = await db.medicines.toArray() as any[]
    expect(medicines.filter(m => m.catalogId === paracetamolCatalog!.id)).toHaveLength(3)
    expect(medicines.filter(m => m.catalogId === ibuprofenCatalog!.id)).toHaveLength(1)
  })

  it('resolves category conflicts to most-common category', async () => {
    // Add 3 medicines with same normalized name but different categories (legacy v2 format)
    await db.medicines.add({ ...baseMedicine, id: 1, name: 'Aspirin', category: 'Painkiller', catalogId: 0 } as any)
    await db.medicines.add({ ...baseMedicine, id: 2, name: 'aspirin', category: 'Fever', catalogId: 0 } as any)
    await db.medicines.add({ ...baseMedicine, id: 3, name: 'ASPIRIN', category: 'Painkiller', catalogId: 0 } as any)

    // Run the migration logic
    await simulateMigration()

    // Verify catalog has most-common category
    const catalogs = await db.medicine_catalog.toArray()
    expect(catalogs).toHaveLength(1)
    expect(catalogs[0].category).toBe('Painkiller')
  })

  it('tiebreaks by lowest id when categories equally frequent', async () => {
    // Add 2 medicines with same normalized name but different categories (legacy v2 format)
    await db.medicines.add({ ...baseMedicine, id: 5, name: 'Vitamin C', category: 'Vitamin', catalogId: 0 } as any)
    await db.medicines.add({ ...baseMedicine, id: 6, name: 'vitamin c', category: 'Supplement', catalogId: 0 } as any)

    // Run the migration logic
    await simulateMigration()

    // Verify catalog uses category from lowest id (id=5)
    const catalogs = await db.medicine_catalog.toArray()
    expect(catalogs).toHaveLength(1)
    expect(catalogs[0].category).toBe('Vitamin')
  })
})
