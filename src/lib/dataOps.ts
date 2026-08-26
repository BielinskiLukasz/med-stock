import { z } from 'zod'
import { db } from './db'
import type { Medicine, Location, HistoryEntry } from './db'

// ─── Backup Schema ────────────────────────────────────────────────────────────
// Mirrors Medicine, Location, HistoryEntry interfaces exactly.
// Called before any DB write (D-50 requirement).

export const BackupSchema = z.object({
  medicines: z.array(
    z.object({
      id: z.number(),
      catalogId: z.number().optional().default(0),  // D-16: optional for v1/v2 backup compat
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
      packCount: z.number().nullable().optional().default(null), // added: prevent silent data loss on import round-trip
      notes: z.string().nullable(),
      manualStatus: z.enum(['UsedUp', 'Disposed', 'Archived']).nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
      deletedAt: z.string().nullable(),
    })
  ),
  medicine_catalog: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      category: z.string().nullable(),
      form: z.enum([
        'Tablet', 'Capsule', 'Syrup', 'Cream', 'Drops', 'Spray', 'Powder',
        'Gel', 'Ointment', 'Patch', 'Inhaler', 'Suppository', 'Other'
      ]).nullable(),
      notes: z.string().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
  ).optional().default([]),  // optional for backward compat with v1/v2 backups
  locations: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      isDefault: z.boolean(),
    })
  ),
  history: z.array(
    z.object({
      id: z.number().optional(),
      medicineId: z.number(),
      medicineName: z.string(),
      action: z.enum(['created', 'updated', 'deleted', 'restored']),
      changedFields: z.array(
        z.object({
          field: z.string(),
          oldValue: z.unknown(),
          newValue: z.unknown(),
        })
      ),
      timestamp: z.string(),
    })
  ),
})

export type BackupData = z.infer<typeof BackupSchema>

// ─── exportToJSON ─────────────────────────────────────────────────────────────
// Reads all three tables from Dexie and triggers a Blob download.
// Filename: medstock-backup-YYYY-MM-DD.json (D-46).
// No library used — Blob API + anchor pattern (D-46).

export async function exportToJSON(): Promise<void> {
  const [medicines, medicine_catalog, locations, history] = await Promise.all([
    db.medicines.toArray() as Promise<Medicine[]>,
    db.medicine_catalog.toArray(),
    db.locations.toArray() as Promise<Location[]>,
    db.history.toArray() as Promise<HistoryEntry[]>,
  ])

  const backup: BackupData = { medicines, medicine_catalog, locations, history }
  const jsonStr = JSON.stringify(backup, null, 2)

  const blob = new Blob([jsonStr], { type: 'application/json' })
  const dateStr = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const anchor = document.createElement('a')
  anchor.href = URL.createObjectURL(blob)
  anchor.download = 'medstock-backup-' + dateStr + '.json'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(anchor.href)
}

// ─── importFromJSON ───────────────────────────────────────────────────────────
// Full replace: wipes medicines, locations, history then bulkAdds all three.
// Uses a single 3-table Dexie transaction (D-47 — atomic, all-or-nothing).
// NOTE: Zod validation is the CALLER'S responsibility. This function accepts
// already-validated BackupData and does not validate internally.
// For v1.0 imports (without catalogId), assigns temporary catalogId=0 (will be
// migrated to proper catalogs in a later phase).

export async function importFromJSON(
  data: BackupData
): Promise<{ medicineCount: number; locationCount: number }> {
  // Ensure all medicines have a catalogId (v1.0 compat: assign temporary 0)
  const medicinesWithCatalogId = data.medicines.map(m => ({
    ...m,
    catalogId: m.catalogId ?? 0,
  })) as Medicine[]

  await db.transaction('rw', db.medicines, db.medicine_catalog, db.locations, db.history, async () => {
    await db.medicines.clear()
    await db.medicine_catalog.clear()
    await db.locations.clear()
    await db.history.clear()

    await db.medicine_catalog.bulkAdd(data.medicine_catalog)
    await db.medicines.bulkAdd(medicinesWithCatalogId)
    await db.locations.bulkAdd(data.locations)
    await db.history.bulkAdd(data.history)
  })

  return {
    medicineCount: data.medicines.length,
    locationCount: data.locations.length,
  }
}
