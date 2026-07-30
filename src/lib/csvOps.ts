import Papa from 'papaparse'
import type { Medicine } from './db'

// Valid medicine (stock entry) field names for CSV column mapping (D-52)
// Note: 'name' and 'category' belong to the catalog, not the stock entry (D-16)
export const MEDICINE_FIELDS: string[] = [
  'location',
  'expiryDate',
  'openedDate',
  'quantity',
  'quantityUnit',
  'notes',
]

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
): { medicines: Omit<Medicine, 'id'>[]; skippedCount: number } {
  const now = new Date().toISOString()
  const medicines: Omit<Medicine, 'id'>[] = []
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

    // Note: name and category are now catalog fields, not stock entry fields (D-16)
    // For CSV import, we create stock entries without explicit name/category
    // TODO Phase 5: CSV import should create catalog entries from name/category columns

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

    // For now, create stock entries without catalog assignment (catalogId will be 1 as placeholder)
    medicines.push({
      catalogId: 1,  // TODO Phase 5: derive catalogId from CSV name/category columns with dedup
      location: locationVal || null,
      expiryDate: expiryDateVal || null,
      openedDate: openedDateVal || null,
      pao: null, // CSV cannot represent complex PAO object — always null for imported rows
      quantity,
      quantityUnit: quantityUnitVal || null,
      notes: notesVal || null,
      manualStatus: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
  }

  return { medicines, skippedCount }
}
