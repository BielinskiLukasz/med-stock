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
  // Box mode: quantity is per-box — only packCount changes, quantity stays the same on both entries.
  // Unit mode: quantity is total — subtract from original, assign to new entry.
  const isBoxMode = packCountToMove !== undefined && (stock.packCount ?? 0) > 1

  if (isBoxMode) {
    if (packCountToMove > (stock.packCount ?? 0)) {
      throw new Error(`Cannot move ${packCountToMove} boxes; only ${stock.packCount ?? 0} available`)
    }
  } else {
    if (quantityToMove > (stock.quantity ?? 0)) {
      throw new Error(`Cannot move ${quantityToMove} units; only ${stock.quantity ?? 0} available`)
    }
  }

  const now = new Date().toISOString()
  let newId = 0
  await db.transaction('rw', db.medicines, db.history, async () => {
    if (isBoxMode) {
      // New entry inherits per-box quantity unchanged; packCount = boxes being moved
      newId = await db.medicines.add({
        catalogId: stock.catalogId,
        quantity: stock.quantity,
        quantityUnit: stock.quantityUnit,
        expiryDate: stock.expiryDate,
        openedDate: stock.openedDate,
        pao: stock.pao,
        location: targetLocation,
        manualStatus: null,
        packCount: packCountToMove,
        notes: stock.notes,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      })
      await updateMedicineWithHistory(
        stockId,
        stock,
        { packCount: (stock.packCount ?? 0) - packCountToMove, updatedAt: now },
        medicineName
      )
    } else {
      // Unit mode: split quantity between two entries
      newId = await db.medicines.add({
        catalogId: stock.catalogId,
        quantity: quantityToMove,
        quantityUnit: stock.quantityUnit,
        expiryDate: stock.expiryDate,
        openedDate: stock.openedDate,
        pao: stock.pao,
        location: targetLocation,
        manualStatus: null,
        packCount: null,
        notes: stock.notes,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      })
      await updateMedicineWithHistory(
        stockId,
        stock,
        { quantity: (stock.quantity ?? 0) - quantityToMove, updatedAt: now },
        medicineName
      )
    }

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
