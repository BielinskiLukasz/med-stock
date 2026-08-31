import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/lib/db'
import type { Medicine } from '@/lib/db'
import {
  addStockEntry,
  editStockEntry,
  softDeleteStock,
  moveStock,
} from '@/lib/stockOps'

const baseCatalogEntry = {
  name: 'Ibuprofen',
  category: 'Painkiller' as string | null,
  form: null as null,
  notes: null as null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const baseStockData: Omit<Medicine, 'id' | 'catalogId' | 'createdAt' | 'updatedAt' | 'deletedAt'> = {
  location: 'Bathroom Cabinet',
  expiryDate: '2027-01-01',
  openedDate: null,
  pao: null,
  quantity: 20,
  quantityUnit: 'tablets',
  packCount: null,
  notes: null,
  manualStatus: null,
}

let catalogId: number

beforeEach(async () => {
  await db.delete()
  await db.open()
  catalogId = await db.medicine_catalog.add({ ...baseCatalogEntry })
})

describe('addStockEntry', () => {
  it('inserts a medicine row with the given catalogId', async () => {
    const newId = await addStockEntry(catalogId, baseStockData, 'Ibuprofen')
    const row = await db.medicines.get(newId)
    expect(row).toBeDefined()
    expect(row?.catalogId).toBe(catalogId)
    expect(row?.quantity).toBe(20)
  })

  it('sets deletedAt to null on creation', async () => {
    const newId = await addStockEntry(catalogId, baseStockData, 'Ibuprofen')
    const row = await db.medicines.get(newId)
    expect(row?.deletedAt).toBeNull()
  })

  it('creates a history entry with action="created"', async () => {
    const newId = await addStockEntry(catalogId, baseStockData, 'Ibuprofen')
    const entries = await db.history.where('medicineId').equals(newId).toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].action).toBe('created')
    expect(entries[0].medicineName).toBe('Ibuprofen')
    expect(entries[0].changedFields).toEqual([])
  })

  it('handles null expiryDate', async () => {
    const newId = await addStockEntry(catalogId, { ...baseStockData, expiryDate: null }, 'Ibuprofen')
    const row = await db.medicines.get(newId)
    expect(row?.expiryDate).toBeNull()
  })

  it('handles null quantity', async () => {
    const newId = await addStockEntry(catalogId, { ...baseStockData, quantity: null }, 'Ibuprofen')
    const row = await db.medicines.get(newId)
    expect(row?.quantity).toBeNull()
  })

  it('handles null location (Other)', async () => {
    const newId = await addStockEntry(catalogId, { ...baseStockData, location: null }, 'Ibuprofen')
    const row = await db.medicines.get(newId)
    expect(row?.location).toBeNull()
  })

  it('returns the new stock ID', async () => {
    const id = await addStockEntry(catalogId, baseStockData, 'Ibuprofen')
    expect(typeof id).toBe('number')
    expect(id).toBeGreaterThan(0)
  })
})

describe('editStockEntry', () => {
  it('updates the specified fields on the medicine row', async () => {
    const stockId = await db.medicines.add({
      ...baseStockData, catalogId, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), deletedAt: null,
    })
    const before = await db.medicines.get(stockId) as Medicine
    await editStockEntry(stockId, before, { expiryDate: '2028-06-01' }, 'Ibuprofen')
    const updated = await db.medicines.get(stockId)
    expect(updated?.expiryDate).toBe('2028-06-01')
  })

  it('creates a history entry with action="updated"', async () => {
    const stockId = await db.medicines.add({
      ...baseStockData, catalogId, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), deletedAt: null,
    })
    const before = await db.medicines.get(stockId) as Medicine
    await editStockEntry(stockId, before, { expiryDate: '2028-06-01' }, 'Ibuprofen')
    const entries = await db.history.where('medicineId').equals(stockId).toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].action).toBe('updated')
    expect(entries[0].changedFields).toEqual([
      { field: 'expiryDate', oldValue: '2027-01-01', newValue: '2028-06-01' },
    ])
  })

  it('records changed location in history', async () => {
    const stockId = await db.medicines.add({
      ...baseStockData, catalogId, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), deletedAt: null,
    })
    const before = await db.medicines.get(stockId) as Medicine
    await editStockEntry(stockId, before, { location: 'Kitchen Drawer' }, 'Ibuprofen')
    const entries = await db.history.where('medicineId').equals(stockId).toArray()
    expect(entries[0].changedFields).toEqual([
      { field: 'location', oldValue: 'Bathroom Cabinet', newValue: 'Kitchen Drawer' },
    ])
  })

  it('sets updatedAt to a newer timestamp', async () => {
    const stockId = await db.medicines.add({
      ...baseStockData, catalogId, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), deletedAt: null,
    })
    const before = await db.medicines.get(stockId) as Medicine
    await new Promise(r => setTimeout(r, 10))
    await editStockEntry(stockId, before, { quantity: 15 }, 'Ibuprofen')
    const updated = await db.medicines.get(stockId)
    expect(updated?.updatedAt).not.toBe(before.updatedAt)
  })
})

describe('softDeleteStock', () => {
  it('sets deletedAt to a non-null ISO string', async () => {
    const stockId = await db.medicines.add({
      ...baseStockData, catalogId, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), deletedAt: null,
    })
    const stock = await db.medicines.get(stockId) as Medicine
    await softDeleteStock(stockId, stock, 'Ibuprofen')
    const updated = await db.medicines.get(stockId)
    expect(updated?.deletedAt).not.toBeNull()
    expect(typeof updated?.deletedAt).toBe('string')
  })

  it('creates a history entry with action="deleted"', async () => {
    const stockId = await db.medicines.add({
      ...baseStockData, catalogId, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), deletedAt: null,
    })
    const stock = await db.medicines.get(stockId) as Medicine
    await softDeleteStock(stockId, stock, 'Ibuprofen')
    const entries = await db.history.where('medicineId').equals(stockId).toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].action).toBe('deleted')
    expect(entries[0].medicineName).toBe('Ibuprofen')
    expect(entries[0].changedFields).toEqual([])
  })

  it('stock appears in trash after soft-delete (deletedAt non-null)', async () => {
    const stockId = await db.medicines.add({
      ...baseStockData, catalogId, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), deletedAt: null,
    })
    const stock = await db.medicines.get(stockId) as Medicine
    await softDeleteStock(stockId, stock, 'Ibuprofen')
    const trashed = await db.medicines.toCollection().filter(m => m.deletedAt !== null).toArray()
    expect(trashed).toHaveLength(1)
    expect(trashed[0].id).toBe(stockId)
  })
})

describe('moveStock', () => {
  it('decrements the original stock quantity by the moved amount', async () => {
    const stockId = await db.medicines.add({
      ...baseStockData, quantity: 20, catalogId, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), deletedAt: null,
    })
    const stock = await db.medicines.get(stockId) as Medicine
    await moveStock(stockId, 5, 'Kitchen Drawer', stock, 'Ibuprofen')
    const original = await db.medicines.get(stockId)
    expect(original?.quantity).toBe(15)
  })

  it('creates a new stock entry at the target location with the moved quantity', async () => {
    const stockId = await db.medicines.add({
      ...baseStockData, quantity: 20, catalogId, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), deletedAt: null,
    })
    const stock = await db.medicines.get(stockId) as Medicine
    const newId = await moveStock(stockId, 5, 'Kitchen Drawer', stock, 'Ibuprofen')
    const newEntry = await db.medicines.get(newId)
    expect(newEntry).toBeDefined()
    expect(newEntry?.location).toBe('Kitchen Drawer')
    expect(newEntry?.quantity).toBe(5)
    expect(newEntry?.catalogId).toBe(catalogId)
    expect(newEntry?.deletedAt).toBeNull()
  })

  it('returns the new stock ID', async () => {
    const stockId = await db.medicines.add({
      ...baseStockData, quantity: 20, catalogId, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), deletedAt: null,
    })
    const stock = await db.medicines.get(stockId) as Medicine
    const newId = await moveStock(stockId, 5, 'Kitchen Drawer', stock, 'Ibuprofen')
    expect(typeof newId).toBe('number')
    expect(newId).not.toBe(stockId)
  })

  it('throws when quantityToMove exceeds available quantity', async () => {
    const stockId = await db.medicines.add({
      ...baseStockData, quantity: 10, catalogId, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), deletedAt: null,
    })
    const stock = await db.medicines.get(stockId) as Medicine
    await expect(moveStock(stockId, 15, 'Kitchen Drawer', stock, 'Ibuprofen'))
      .rejects.toThrow()
  })

  it('allows moving all quantity (original qty becomes 0)', async () => {
    const stockId = await db.medicines.add({
      ...baseStockData, quantity: 10, catalogId, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), deletedAt: null,
    })
    const stock = await db.medicines.get(stockId) as Medicine
    await moveStock(stockId, 10, 'Kitchen Drawer', stock, 'Ibuprofen')
    const original = await db.medicines.get(stockId)
    expect(original?.quantity).toBe(0)
  })

  it('handles null target location (Other)', async () => {
    const stockId = await db.medicines.add({
      ...baseStockData, quantity: 10, catalogId, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), deletedAt: null,
    })
    const stock = await db.medicines.get(stockId) as Medicine
    const newId = await moveStock(stockId, 5, null, stock, 'Ibuprofen')
    const newEntry = await db.medicines.get(newId)
    expect(newEntry?.location).toBeNull()
  })

  it('creates history entries for both original decrement and new entry', async () => {
    const stockId = await db.medicines.add({
      ...baseStockData, quantity: 20, catalogId, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), deletedAt: null,
    })
    const stock = await db.medicines.get(stockId) as Medicine
    const newId = await moveStock(stockId, 5, 'Kitchen Drawer', stock, 'Ibuprofen')
    const originalHistory = await db.history.where('medicineId').equals(stockId).toArray()
    const newHistory = await db.history.where('medicineId').equals(newId).toArray()
    expect(originalHistory.length).toBeGreaterThan(0)
    expect(newHistory.length).toBeGreaterThan(0)
    expect(newHistory[0].action).toBe('created')
  })

  it('treats null original quantity as 0 when computing remainder (D-ASUM-01)', async () => {
    const stockId = await db.medicines.add({
      ...baseStockData, quantity: null, catalogId, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), deletedAt: null,
    })
    const stock = await db.medicines.get(stockId) as Medicine
    await expect(moveStock(stockId, 5, 'Kitchen Drawer', stock, 'Ibuprofen'))
      .rejects.toThrow()
  })
})
