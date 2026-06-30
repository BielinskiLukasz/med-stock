import { db } from './db'
import type { Medicine, HistoryEntry } from './db'

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

/**
 * Compute the diff between the before state and a partial update.
 * Uses JSON.stringify for each field to correctly handle PAO object equality (Pitfall 8).
 */
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

/**
 * Apply changes to a medicine and record an 'updated' history entry.
 * All mutations happen inside a single transaction (atomic).
 */
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

/**
 * Soft-delete a medicine by setting deletedAt to the current timestamp.
 * Writes a history entry with action='deleted'.
 */
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

/**
 * Restore a soft-deleted medicine by setting deletedAt back to null.
 * Writes a history entry with action='restored'.
 * NOTE: manualStatus is NOT changed — user's override is preserved (D-28).
 */
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

/**
 * Permanently delete a medicine record.
 * CRITICAL: writes history entry FIRST, then deletes the medicine.
 * NEVER deletes history entries — they are preserved forever (D-38, Pitfall 6).
 */
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

/**
 * Record a 'created' history entry for a new medicine.
 * Used when adding a new medicine via the add form (Plan 02-04).
 */
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
