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

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('diffMedicine', () => {
  it('detects changed string fields', () => {
    const before = { ...baseMedicine, id: 1 } as Medicine
    const changes = { name: 'Ibuprofen Plus' }
    const result = diffMedicine(before, changes)
    expect(result).toEqual([{ field: 'name', oldValue: 'Ibuprofen', newValue: 'Ibuprofen Plus' }])
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
    const changes = { name: 'Aspirin', category: 'Blood Thinner' }
    const result = diffMedicine(before, changes)
    expect(result).toHaveLength(2)
    expect(result.find(f => f.field === 'name')).toEqual({ field: 'name', oldValue: 'Ibuprofen', newValue: 'Aspirin' })
    expect(result.find(f => f.field === 'category')).toEqual({ field: 'category', oldValue: 'Painkiller', newValue: 'Blood Thinner' })
  })
})

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

describe('restoreMedicine', () => {
  it('sets deletedAt back to null', async () => {
    const now = new Date().toISOString()
    const id = await db.medicines.add({ ...baseMedicine, deletedAt: now })
    const medicine = await db.medicines.get(id) as Medicine
    await restoreMedicine(medicine)
    const updated = await db.medicines.get(id)
    expect(updated?.deletedAt).toBeNull()
  })

  it('writes a history entry with action="restored" and empty changedFields', async () => {
    const now = new Date().toISOString()
    const id = await db.medicines.add({ ...baseMedicine, deletedAt: now })
    const medicine = await db.medicines.get(id) as Medicine
    await restoreMedicine(medicine)
    const entries = await db.history.where('medicineId').equals(id).toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].action).toBe('restored')
    expect(entries[0].changedFields).toEqual([])
  })

  it('does NOT change manualStatus (D-28)', async () => {
    const now = new Date().toISOString()
    const id = await db.medicines.add({ ...baseMedicine, deletedAt: now, manualStatus: 'Archived' })
    const medicine = await db.medicines.get(id) as Medicine
    await restoreMedicine(medicine)
    const updated = await db.medicines.get(id)
    expect(updated?.manualStatus).toBe('Archived')
  })
})

describe('permanentDeleteMedicine', () => {
  it('removes the medicine record', async () => {
    const id = await db.medicines.add({ ...baseMedicine })
    const medicine = await db.medicines.get(id) as Medicine
    await permanentDeleteMedicine(medicine)
    const deleted = await db.medicines.get(id)
    expect(deleted).toBeUndefined()
  })

  it('preserves history entries after permanent delete (D-38)', async () => {
    const id = await db.medicines.add({ ...baseMedicine })
    const medicine = await db.medicines.get(id) as Medicine
    await permanentDeleteMedicine(medicine)
    const count = await db.history.where('medicineId').equals(id).count()
    expect(count).toBeGreaterThan(0)
  })

  it('writes a history entry with action="deleted" before deleting medicine', async () => {
    const id = await db.medicines.add({ ...baseMedicine })
    const medicine = await db.medicines.get(id) as Medicine
    await permanentDeleteMedicine(medicine)
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
    await updateMedicineWithHistory(id, before, { name: 'Aspirin' })
    const updated = await db.medicines.get(id)
    expect(updated?.name).toBe('Aspirin')
  })

  it('writes a history entry with action="updated" and changedFields from diffMedicine', async () => {
    const id = await db.medicines.add({ ...baseMedicine })
    const before = await db.medicines.get(id) as Medicine
    await updateMedicineWithHistory(id, before, { name: 'Aspirin' })
    const entries = await db.history.where('medicineId').equals(id).toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].action).toBe('updated')
    expect(entries[0].changedFields).toEqual([{ field: 'name', oldValue: 'Ibuprofen', newValue: 'Aspirin' }])
  })

  it('sets updatedAt on the medicine record', async () => {
    const id = await db.medicines.add({ ...baseMedicine })
    const before = await db.medicines.get(id) as Medicine
    const oldUpdatedAt = before.updatedAt
    // Ensure time difference
    await new Promise(r => setTimeout(r, 10))
    await updateMedicineWithHistory(id, before, { name: 'Aspirin' })
    const updated = await db.medicines.get(id)
    expect(updated?.updatedAt).not.toBe(oldUpdatedAt)
  })
})

describe('addMedicineHistory', () => {
  it('writes a history entry with action="created" and empty changedFields', async () => {
    const id = await db.medicines.add({ ...baseMedicine })
    const medicine = await db.medicines.get(id) as Medicine
    await addMedicineHistory(medicine, 'created')
    const entries = await db.history.where('medicineId').equals(id).toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].action).toBe('created')
    expect(entries[0].changedFields).toEqual([])
    expect(entries[0].medicineName).toBe('Ibuprofen')
  })
})
