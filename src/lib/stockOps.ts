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
  medicineName: string
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
      notes: stock.notes,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })

    // Record history for original decrement
    await updateMedicineWithHistory(
      stockId,
      stock,
      { quantity: newOriginalQty, updatedAt: now },
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
  const activeCount = await db.medicines
    .where('catalogId')
    .equals(catalogId)
    .filter(m => m.deletedAt === null)
    .count()
  if (activeCount > 0) {
    throw new Error('Cannot delete catalog with active stock entries')
  }
  await db.transaction('rw', db.medicine_catalog, async () => {
    await db.medicine_catalog.delete(catalogId)
  })
}
