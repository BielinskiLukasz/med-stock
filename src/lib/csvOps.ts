import Papa from 'papaparse'
import type { Medicine } from './db'

// Valid medicine field names for CSV column mapping (D-52)
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

  // Find the CSV header that maps to the 'name' field
  const nameCsvHeader = Object.entries(columnMapping).find(
    ([, fieldName]) => fieldName === 'name'
  )?.[0]

  for (const row of rows) {
    // Resolve the name value from the mapped column
    const nameValue = nameCsvHeader ? (row[nameCsvHeader] ?? '').trim() : ''

    if (!nameValue) {
      skippedCount++
      continue
    }

    // Helper to get mapped field value (returns empty string if mapped to SKIP_VALUE or absent)
    const getMappedValue = (fieldName: string): string => {
      const csvHeader = Object.entries(columnMapping).find(
        ([, fn]) => fn === fieldName
      )?.[0]
      if (!csvHeader || columnMapping[csvHeader] === SKIP_VALUE) return ''
      return (row[csvHeader] ?? '').trim()
    }

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

    medicines.push({
      name: nameValue,
      category: categoryVal || null,
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
