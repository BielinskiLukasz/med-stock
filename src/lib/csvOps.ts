import Papa from 'papaparse'
import { db } from './db'
import type { Medicine } from './db'

// Valid medicine field names for CSV column mapping (D-52)
// Note: 'name' and 'category' resolve to a medicine_catalog entry (looked up or
// created by commitCSVImport), not to fields stored directly on the stock entry (D-16)
export const MEDICINE_FIELDS: string[] = [
  'name',
  'category',
  'location',
  'expiryDate',
  'openedDate',
  'quantity',
  'quantityUnit',
  'notes',
]

/** A parsed CSV row's medicine data, prior to catalog resolution by commitCSVImport. */
export type ParsedCSVMedicine = Omit<Medicine, 'id' | 'catalogId'> & {
  name: string
  category: string | null
}

// Sentinel value used when a CSV column is intentionally not mapped (D-52)
export const SKIP_VALUE = '(skip)'

/**
 * Parses a CSV File using Papa Parse.
 * Wraps Papa.parse callback API as a Promise.
 */
export function parseCSVFile(
  file: File
): Promise<Papa.ParseResult<Record<string, string>>> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => resolve(result),
      error: (error) => reject(error),
    })
  })
}

/**
 * Converts parsed CSV rows into Medicine objects using a column mapping.
 * Pure, synchronous — no DB access, no side effects.
 *
 * @param rows - Parsed CSV rows from Papa.ParseResult.data
 * @param columnMapping - Maps CSV column header → medicine field name (or SKIP_VALUE)
 * @returns { medicines, skippedCount }
 */
export function mergeCSVRowsToMedicines(
  rows: Record<string, string>[],
  columnMapping: Record<string, string>
): { medicines: ParsedCSVMedicine[]; skippedCount: number } {
  const now = new Date().toISOString()
  const medicines: ParsedCSVMedicine[] = []
  let skippedCount = 0

  for (const row of rows) {
    // Helper to get mapped field value (returns empty string if mapped to SKIP_VALUE or absent)
    const getMappedValue = (fieldName: string): string => {
      const csvHeader = Object.entries(columnMapping).find(
        ([, fn]) => fn === fieldName
      )?.[0]
      if (!csvHeader || columnMapping[csvHeader] === SKIP_VALUE) return ''
      return (row[csvHeader] ?? '').trim()
    }

    const nameVal = getMappedValue('name')
    const categoryVal = getMappedValue('category')
    const locationVal = getMappedValue('location')
    const expiryDateVal = getMappedValue('expiryDate')
    const openedDateVal = getMappedValue('openedDate')
    const quantityRaw = getMappedValue('quantity')
    const quantityUnitVal = getMappedValue('quantityUnit')
    const notesVal = getMappedValue('notes')

    // Parse quantity: use parseFloat; if not finite, set to null (T-03-05)
    let quantity: number | null = null
    if (quantityRaw !== '') {
      const parsed = parseFloat(quantityRaw)
      quantity = isFinite(parsed) ? parsed : null
    }

    // Skip rows that are completely empty in the original CSV (blank lines after header)
    const hasAnyRawData = Object.values(row).some(v => v !== undefined && String(v).trim() !== '')
    if (!hasAnyRawData) {
      skippedCount++
      continue
    }

    // Skip rows with no resolvable name — either no column mapped to 'name', or the
    // mapped column's cell is blank. name is required to resolve/create a catalog entry.
    if (nameVal === '') {
      skippedCount++
      continue
    }

    medicines.push({
      name: nameVal,
      category: categoryVal || null,
      location: locationVal || null,
      expiryDate: expiryDateVal || null,
      openedDate: openedDateVal || null,
      pao: null, // CSV cannot represent complex PAO object — always null for imported rows
      quantity,
      quantityUnit: quantityUnitVal || null,
      packCount: null, // CSV cannot represent pack count — always null for imported rows
      notes: notesVal || null,
      manualStatus: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
  }

  return { medicines, skippedCount }
}

/**
 * Resolves each parsed CSV row to a medicine_catalog entry (case-insensitive dedup,
 * both against existing entries and within this same batch) and bulk-inserts the
 * resulting stock entries. All work happens inside a single Dexie transaction.
 */
export async function commitCSVImport(
  medicines: ParsedCSVMedicine[]
): Promise<{ importedCount: number }> {
  return db.transaction('rw', db.medicine_catalog, db.medicines, async () => {
    const now = new Date().toISOString()
    const stockRows: Omit<Medicine, 'id'>[] = []

    for (const { name, category, ...rest } of medicines) {
      let catalogId: number
      const existing = await db.medicine_catalog
        .where('name')
        .equalsIgnoreCase(name)
        .first()

      if (existing) {
        catalogId = existing.id
      } else {
        catalogId = await db.medicine_catalog.add({
          name,
          category,
          form: null,
          notes: null,
          createdAt: now,
          updatedAt: now,
        })
      }

      stockRows.push({ ...rest, catalogId })
    }

    await db.medicines.bulkAdd(stockRows)

    return { importedCount: stockRows.length }
  })
}
