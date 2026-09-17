import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'

import { mergeCSVRowsToMedicines, commitCSVImport } from './csvOps'
import { db } from '@/lib/db'

describe('mergeCSVRowsToMedicines', () => {
  it('maps expiryDate column to medicine expiryDate field', () => {
    const rows = [{ Name: 'Ibuprofen', Expiry: '2027-01-01' }]
    const mapping = { Name: 'name', Expiry: 'expiryDate' }
    const result = mergeCSVRowsToMedicines(rows, mapping)
    expect(result.medicines).toHaveLength(1)
    expect(result.medicines[0].expiryDate).toBe('2027-01-01')
    expect(result.skippedCount).toBe(0)
  })

  it('skips a row when the mapped name column has an empty cell', () => {
    const rows = [{ Name: '', Expiry: '2027-01-01' }]
    const mapping = { Name: 'name', Expiry: 'expiryDate' }
    const result = mergeCSVRowsToMedicines(rows, mapping)
    expect(result.medicines).toHaveLength(0)
    expect(result.skippedCount).toBe(1)
  })

  it('skips a row when no column is mapped to name at all', () => {
    const rows = [{ Name: 'Ibuprofen', Expiry: '2027-01-01' }]
    const mapping = { Expiry: 'expiryDate' }
    const result = mergeCSVRowsToMedicines(rows, mapping)
    expect(result.medicines).toHaveLength(0)
    expect(result.skippedCount).toBe(1)
  })

  it('parses quantity string "42" to number 42', () => {
    const rows = [{ Name: 'Aspirin', Qty: '42' }]
    const mapping = { Name: 'name', Qty: 'quantity' }
    const result = mergeCSVRowsToMedicines(rows, mapping)
    expect(result.medicines).toHaveLength(1)
    expect(result.medicines[0].quantity).toBe(42)
    expect(result.skippedCount).toBe(0)
  })

  it('sets quantity to null for non-numeric string "abc" but does not skip the row', () => {
    const rows = [{ Name: 'Aspirin', Qty: 'abc' }]
    const mapping = { Name: 'name', Qty: 'quantity' }
    const result = mergeCSVRowsToMedicines(rows, mapping)
    expect(result.medicines).toHaveLength(1)
    expect(result.medicines[0].quantity).toBeNull()
    expect(result.skippedCount).toBe(0)
  })

  it('sets location to null when column is mapped to "(skip)"', () => {
    const rows = [{ Name: 'Aspirin', Col: 'some value' }]
    const mapping = { Name: 'name', Col: '(skip)' }
    const result = mergeCSVRowsToMedicines(rows, mapping)
    expect(result.medicines).toHaveLength(1)
    expect(result.medicines[0].location).toBeNull()
    expect(result.skippedCount).toBe(0)
  })

  it('returns medicines.length: 3 and skippedCount: 0 for 3 rows', () => {
    const rows = [
      { Name: 'Aspirin', Expiry: '2027-01-01' },
      { Name: 'Ibuprofen', Expiry: '2027-02-01' },
      { Name: 'Paracetamol', Expiry: '2027-03-01' },
    ]
    const mapping = { Name: 'name', Expiry: 'expiryDate' }
    const result = mergeCSVRowsToMedicines(rows, mapping)
    expect(result.medicines).toHaveLength(3)
    expect(result.skippedCount).toBe(0)
  })

  it('extracts name and category onto the returned entry from their mapped columns', () => {
    const rows = [{ Name: 'Aspirin', Cat: 'Pain & Fever' }]
    const mapping = { Name: 'name', Cat: 'category' }
    const result = mergeCSVRowsToMedicines(rows, mapping)
    expect(result.medicines).toHaveLength(1)
    expect(result.medicines[0].name).toBe('Aspirin')
    expect(result.medicines[0].category).toBe('Pain & Fever')
  })

  it('sets category to null when no column is mapped to it', () => {
    const rows = [{ Name: 'Aspirin' }]
    const mapping = { Name: 'name' }
    const result = mergeCSVRowsToMedicines(rows, mapping)
    expect(result.medicines).toHaveLength(1)
    expect(result.medicines[0].category).toBeNull()
  })
})

describe('commitCSVImport', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('creates exactly one medicine_catalog row and one medicines row for a brand-new name', async () => {
    const rows = [{ Name: 'Ibuprofen', Cat: 'Pain & Fever' }]
    const mapping = { Name: 'name', Cat: 'category' }
    const { medicines } = mergeCSVRowsToMedicines(rows, mapping)

    const { importedCount } = await commitCSVImport(medicines)

    expect(importedCount).toBe(1)
    const catalogRows = await db.medicine_catalog.toArray()
    expect(catalogRows).toHaveLength(1)
    expect(catalogRows[0].name).toBe('Ibuprofen')
    expect(catalogRows[0].category).toBe('Pain & Fever')

    const stockRows = await db.medicines.toArray()
    expect(stockRows).toHaveLength(1)
    expect(stockRows[0].catalogId).toBe(catalogRows[0].id)
  })

  it('reuses a pre-existing catalog entry via case-insensitive match', async () => {
    const now = new Date().toISOString()
    const seededId = await db.medicine_catalog.add({
      name: 'Ibuprofen',
      category: 'Pain & Fever',
      form: null,
      notes: null,
      createdAt: now,
      updatedAt: now,
    })

    const rows = [{ Name: 'ibuprofen' }]
    const mapping = { Name: 'name' }
    const { medicines } = mergeCSVRowsToMedicines(rows, mapping)

    await commitCSVImport(medicines)

    const catalogRows = await db.medicine_catalog.toArray()
    expect(catalogRows).toHaveLength(1)

    const stockRows = await db.medicines.toArray()
    expect(stockRows).toHaveLength(1)
    expect(stockRows[0].catalogId).toBe(seededId)
  })

  it('dedups two same-batch rows with the same name in different casing to one catalog entry', async () => {
    const rows = [{ Name: 'Aspirin' }, { Name: 'ASPIRIN' }]
    const mapping = { Name: 'name' }
    const { medicines } = mergeCSVRowsToMedicines(rows, mapping)

    await commitCSVImport(medicines)

    const catalogRows = await db.medicine_catalog.toArray()
    expect(catalogRows).toHaveLength(1)

    const stockRows = await db.medicines.toArray()
    expect(stockRows).toHaveLength(2)
    expect(stockRows[0].catalogId).toBe(catalogRows[0].id)
    expect(stockRows[1].catalogId).toBe(catalogRows[0].id)
  })
})
