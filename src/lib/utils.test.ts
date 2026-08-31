import { describe, expect, it } from 'vitest'
import { formatDate } from './utils'

describe('formatDate', () => {
  it('returns YYYY-MM-DD unchanged for EN', () => {
    expect(formatDate('2026-12-31', 'en')).toBe('2026-12-31')
  })

  it('formats date as DD.MM.YYYY for PL', () => {
    expect(formatDate('2026-01-05', 'pl')).toBe('05.01.2026')
  })

  it('formats date as DD.MM.YYYY for PL with december', () => {
    expect(formatDate('2026-12-31', 'pl')).toBe('31.12.2026')
  })

  it('returns non-empty string for null in EN', () => {
    const result = formatDate(null, 'en')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns non-empty string for null in PL', () => {
    const result = formatDate(null, 'pl')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns non-empty string for undefined in EN', () => {
    const result = formatDate(undefined, 'en')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('preserves leading zeros in DD.MM.YYYY for PL', () => {
    expect(formatDate('2026-01-01', 'pl')).toBe('01.01.2026')
  })
})
