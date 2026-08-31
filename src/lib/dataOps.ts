import { z } from 'zod'
import { db } from './db'
import type { Medicine, Location, HistoryEntry, MedicineCatalog } from './db'

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

// ─── inferCatalogEntriesFromLegacyMedicines ───────────────────────────────────
// Pure synchronous function. Converts an array of legacy medicine records
// (with name/category fields) into typed MedicineCatalog entries using the
// same deduplication algorithm as the Phase 4 db.version(3) migration.
// Used by importFromJSON (Plan 06-02) for old-format (pre-v1.1) backup import.
// No Dexie calls — pure synchronous function.

export function inferCatalogEntriesFromLegacyMedicines(
  medicines: { id: number; name: string; category: string | null }[]
): { entries: MedicineCatalog[]; nameToId: Map<string, number> } {
  // Step 1: Build a Map keyed by normalized name (trim + lowercase).
  // Each value tracks: raw medicines in that group, and a frequency Map of category → count.
  const catalogMap: Map<string, {
    medicines: { id: number; name: string; category: string | null }[]
    categories: Map<string | null, number>
  }> = new Map()

  for (const med of medicines) {
    const normalized = med.name.trim().toLowerCase()
    if (!catalogMap.has(normalized)) {
      catalogMap.set(normalized, { medicines: [], categories: new Map() })
    }
    const group = catalogMap.get(normalized)!
    group.medicines.push(med)
    const cat = med.category ?? null
    group.categories.set(cat, (group.categories.get(cat) ?? 0) + 1)
  }

  // Step 2: For each group, produce a catalog entry.
  const entries: MedicineCatalog[] = []
  let nextCatalogId = 1

  for (const [normalized, group] of catalogMap) {
    // Title-case: capitalize first char of each whitespace-separated word
    const titleCased = normalized
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    // Most-common category; lowest original medicine id breaks ties
    let mostCommonCategory: string | null = null
    let maxCount = 0
    let lowestIdForTiebreak = Infinity

    for (const [cat, count] of group.categories) {
      const candidateId = (group.medicines.find(m => m.category === cat)?.id) ?? Infinity
      if (count > maxCount || (count === maxCount && candidateId < lowestIdForTiebreak)) {
        mostCommonCategory = cat
        maxCount = count
        lowestIdForTiebreak = candidateId
      }
    }

    const now = new Date().toISOString()
    entries.push({
      id: nextCatalogId,
      name: titleCased,
      category: mostCommonCategory,
      form: null,   // D-07: no heuristic form inference
      notes: null,
      createdAt: now,
      updatedAt: now,
    })

    nextCatalogId++
  }

  // Step 3: Build nameToId Map: normalized name → catalogId
  const nameToId = new Map<string, number>()
  let idx = 0
  for (const [normalized] of catalogMap) {
    nameToId.set(normalized, entries[idx].id)
    idx++
  }

  return { entries, nameToId }
}

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
