import { db } from '@/lib/db'
import type { Medicine } from '@/lib/db'
import {
  addMedicineHistory,
  updateMedicineWithHistory,
  softDeleteMedicine,
} from '@/lib/historyOps'

export async function addStockEntry(
  catalogId: number,
  data: Omit<Medicine, 'id' | 'catalogId' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  medicineName: string
): Promise<number> {
  const now = new Date().toISOString()
  let newId = 0
  await db.transaction('rw', db.medicines, db.history, async () => {
    newId = await db.medicines.add({
      catalogId,
      ...data,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
    const newMedicine = await db.medicines.get(newId)
    if (newMedicine) {
      await addMedicineHistory(newMedicine, medicineName, 'created')
    }
  })
  return newId
}

export async function editStockEntry(
  stockId: number,
  before: Medicine,
  changes: Partial<Medicine>,
  medicineName: string
): Promise<void> {
  await updateMedicineWithHistory(
    stockId,
    before,
    { ...changes, updatedAt: new Date().toISOString() },
    medicineName
  )
}

export async function softDeleteStock(
  _stockId: number,
  stock: Medicine,
  medicineName: string
): Promise<void> {
  await softDeleteMedicine(stock, medicineName)
}

export async function moveStock(
  stockId: number,
  quantityToMove: number,
  targetLocation: string | null,
  stock: Medicine,
  medicineName: string,
  packCountToMove?: number
): Promise<number> {
  if (quantityToMove > (stock.quantity ?? 0)) {
    throw new Error(
      `Cannot move ${quantityToMove} units; only ${stock.quantity ?? 0} available`
    )
  }

  const now = new Date().toISOString()
  let newId = 0
  await db.transaction('rw', db.medicines, db.history, async () => {
    const newOriginalQty = (stock.quantity ?? 0) - quantityToMove

    // Create new entry at target location
    newId = await db.medicines.add({
      catalogId: stock.catalogId,
      quantity: quantityToMove,
      quantityUnit: stock.quantityUnit,
      expiryDate: stock.expiryDate,
      openedDate: stock.openedDate,
      pao: stock.pao,
      location: targetLocation,
      manualStatus: null,
      packCount: packCountToMove ?? null,
      notes: stock.notes,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })

    // Record history for original decrement (include packCount update when moving boxes)
    const originalUpdate: Partial<Medicine> & { updatedAt: string } = { quantity: newOriginalQty, updatedAt: now }
    if (packCountToMove !== undefined && stock.packCount !== null) {
      originalUpdate.packCount = stock.packCount - packCountToMove
    }
    await updateMedicineWithHistory(
      stockId,
      stock,
      originalUpdate,
      medicineName
    )

    // Record history for new entry
    const newStock = await db.medicines.get(newId)
    if (newStock) {
      await addMedicineHistory(newStock, medicineName, 'created')
    }
  })
  return newId
}

export async function deleteCatalogEntry(catalogId: number): Promise<void> {
  await db.transaction('rw', db.medicine_catalog, db.medicines, async () => {
    // Count ALL stock entries (active + soft-deleted) — prevents orphan trash entries
    const totalCount = await db.medicines
      .where('catalogId')
      .equals(catalogId)
      .count()
    if (totalCount > 0) {
      throw new Error(
        'Cannot delete catalog: stock entries exist (including trashed). Permanently delete all stock entries first.'
      )
    }
    await db.medicine_catalog.delete(catalogId)
  })
}
