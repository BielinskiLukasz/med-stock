import { describe, it, expect } from 'vitest'

// Import mergeCSVRowsToMedicines — this will fail until csvOps.ts is created (RED phase)
import { mergeCSVRowsToMedicines } from './csvOps'

describe('mergeCSVRowsToMedicines', () => {
  it('maps name and expiryDate columns to medicine fields', () => {
    const rows = [{ Name: 'Ibuprofen', Expiry: '2027-01-01' }]
    const mapping = { Name: 'name', Expiry: 'expiryDate' }
    const result = mergeCSVRowsToMedicines(rows, mapping)
    expect(result.medicines).toHaveLength(1)
    expect(result.medicines[0].name).toBe('Ibuprofen')
    expect(result.medicines[0].expiryDate).toBe('2027-01-01')
    expect(result.skippedCount).toBe(0)
  })

  it('skips rows where the mapped name column value is empty string', () => {
    const rows = [{ Name: '', Expiry: '2027-01-01' }]
    const mapping = { Name: 'name', Expiry: 'expiryDate' }
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

  it('returns null for all fields when columns are mapped to "(skip)" except name', () => {
    const rows = [{ Name: 'Aspirin', Col: 'some value' }]
    const mapping = { Name: 'name', Col: '(skip)' }
    const result = mergeCSVRowsToMedicines(rows, mapping)
    expect(result.medicines).toHaveLength(1)
    expect(result.medicines[0].name).toBe('Aspirin')
    expect(result.medicines[0].category).toBeNull()
    expect(result.skippedCount).toBe(0)
  })

  it('returns medicines.length: 2 and skippedCount: 1 when 3 rows with 1 empty name', () => {
    const rows = [
      { Name: 'Ibuprofen', Expiry: '2027-01-01' },
      { Name: '', Expiry: '2027-02-01' },
      { Name: 'Aspirin', Expiry: '2027-03-01' },
    ]
    const mapping = { Name: 'name', Expiry: 'expiryDate' }
    const result = mergeCSVRowsToMedicines(rows, mapping)
    expect(result.medicines).toHaveLength(2)
    expect(result.skippedCount).toBe(1)
  })
})
