import { describe, it, expect } from 'vitest'

// Import mergeCSVRowsToMedicines — this will fail until csvOps.ts is created (RED phase)
import { mergeCSVRowsToMedicines } from './csvOps'

describe('mergeCSVRowsToMedicines', () => {
  it('maps expiryDate column to medicine expiryDate field', () => {
    const rows = [{ Name: 'Ibuprofen', Expiry: '2027-01-01' }]
    const mapping = { Name: 'location', Expiry: 'expiryDate' }
    const result = mergeCSVRowsToMedicines(rows, mapping)
    expect(result.medicines).toHaveLength(1)
    expect(result.medicines[0].expiryDate).toBe('2027-01-01')
    expect(result.skippedCount).toBe(0)
  })

  it('includes all rows regardless of name column value (name is a catalog field, not stock)', () => {
    const rows = [{ Name: '', Expiry: '2027-01-01' }]
    const mapping = { Expiry: 'expiryDate' }
    const result = mergeCSVRowsToMedicines(rows, mapping)
    expect(result.medicines).toHaveLength(1)
    expect(result.skippedCount).toBe(0)
  })

  it('parses quantity string "42" to number 42', () => {
    const rows = [{ Name: 'Aspirin', Qty: '42' }]
    const mapping = { Qty: 'quantity' }
    const result = mergeCSVRowsToMedicines(rows, mapping)
    expect(result.medicines).toHaveLength(1)
    expect(result.medicines[0].quantity).toBe(42)
    expect(result.skippedCount).toBe(0)
  })

  it('sets quantity to null for non-numeric string "abc" but does not skip the row', () => {
    const rows = [{ Name: 'Aspirin', Qty: 'abc' }]
    const mapping = { Qty: 'quantity' }
    const result = mergeCSVRowsToMedicines(rows, mapping)
    expect(result.medicines).toHaveLength(1)
    expect(result.medicines[0].quantity).toBeNull()
    expect(result.skippedCount).toBe(0)
  })

  it('sets location to null when column is mapped to "(skip)"', () => {
    const rows = [{ Name: 'Aspirin', Col: 'some value' }]
    const mapping = { Col: '(skip)' }
    const result = mergeCSVRowsToMedicines(rows, mapping)
    expect(result.medicines).toHaveLength(1)
    expect(result.medicines[0].location).toBeNull()
    expect(result.skippedCount).toBe(0)
  })

  it('returns medicines.length: 3 and skippedCount: 0 for 3 rows', () => {
    const rows = [
      { Expiry: '2027-01-01' },
      { Expiry: '2027-02-01' },
      { Expiry: '2027-03-01' },
    ]
    const mapping = { Expiry: 'expiryDate' }
    const result = mergeCSVRowsToMedicines(rows, mapping)
    expect(result.medicines).toHaveLength(3)
    expect(result.skippedCount).toBe(0)
  })
})
