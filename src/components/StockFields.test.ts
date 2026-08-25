import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { stockSchema } from './StockFields'

const baseValid = {
  expiryDate: '2027-01-01',
}

describe('stockSchema — packCount field', () => {
  it('accepts packCount as a positive integer', () => {
    const result = stockSchema.safeParse({ ...baseValid, packCount: 2 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.packCount).toBe(2)
    }
  })

  it('persists packCount=null (empty field) as null, not 0 or undefined', () => {
    const result = stockSchema.safeParse({ ...baseValid, packCount: null })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.packCount).toBeNull()
    }
  })

  it('omitting packCount is valid (field is optional)', () => {
    const result = stockSchema.safeParse({ ...baseValid })
    expect(result.success).toBe(true)
  })

  it('rejects packCount=0 (must be positive)', () => {
    const result = stockSchema.safeParse({ ...baseValid, packCount: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects negative packCount', () => {
    const result = stockSchema.safeParse({ ...baseValid, packCount: -1 })
    expect(result.success).toBe(false)
  })

  it('pre-fill scenario: packCount=3 from stock prop is valid schema input', () => {
    const result = stockSchema.safeParse({ ...baseValid, packCount: 3 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.packCount).toBe(3)
    }
  })
})
