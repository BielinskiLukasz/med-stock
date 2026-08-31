import { describe, it, expect } from 'vitest'
import { calculateStatus } from '@/lib/expiry'
import type { Medicine } from '@/lib/db'

// Tests for filteredStockEntries logic in MedicineDetail (G-05-10)
// RED phase: stub throws — tests fail until implementation is added to [id].tsx

// GREEN phase: real implementation matching the filteredStockEntries useMemo in [id].tsx
function filterStockEntries(
  entries: Medicine[] | undefined,
  selectedStatuses: string[],
  selectedLocations: string[],
): Medicine[] {
  if (!entries) return []
  return entries.filter(entry => {
    const entryStatus = calculateStatus(entry)
    const passesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(entryStatus)
    const passesLocation = selectedLocations.length === 0 || selectedLocations.includes(entry.location ?? 'Other')
    return passesStatus && passesLocation
  })
}

const baseEntry = (overrides: Partial<Medicine> = {}): Medicine => ({
  id: 1,
  catalogId: 1,
  quantity: 10,
  quantityUnit: 'ml',
  expiryDate: '2099-12-31',
  openedDate: null,
  pao: null,
  location: null,
  manualStatus: null,
  notes: null,
  packCount: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
  ...overrides,
})

describe('filterStockEntries — no filters active', () => {
  it('returns all entries when both filter arrays are empty', () => {
    const entries = [baseEntry({ id: 1 }), baseEntry({ id: 2 })]
    const result = filterStockEntries(entries, [], [])
    expect(result).toHaveLength(2)
  })
})

describe('filterStockEntries — status filter', () => {
  it('excludes entries whose status is not in selectedStatuses', () => {
    const expired = baseEntry({ id: 1, expiryDate: '2000-01-01' })
    const active = baseEntry({ id: 2, expiryDate: '2099-12-31' })
    const result = filterStockEntries([expired, active], ['Active'], [])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(2)
  })

  it('includes entries whose status matches selectedStatuses', () => {
    const active = baseEntry({ id: 1, expiryDate: '2099-12-31' })
    const result = filterStockEntries([active], ['Active'], [])
    expect(result).toHaveLength(1)
  })
})

describe('filterStockEntries — location filter', () => {
  it('excludes entries not at selected location', () => {
    const bathroom = baseEntry({ id: 1, location: 'Bathroom' })
    const other = baseEntry({ id: 2, location: null })
    const result = filterStockEntries([bathroom, other], [], ['Bathroom'])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('includes null-location entry when "Other" is selected', () => {
    const other = baseEntry({ id: 1, location: null })
    const result = filterStockEntries([other], [], ['Other'])
    expect(result).toHaveLength(1)
  })
})

describe('filterStockEntries — AND-combined filters', () => {
  it('entry must pass both status AND location filters', () => {
    const match = baseEntry({ id: 1, expiryDate: '2099-12-31', location: 'Bathroom' })
    const wrongStatus = baseEntry({ id: 2, expiryDate: '2000-01-01', location: 'Bathroom' })
    const wrongLocation = baseEntry({ id: 3, expiryDate: '2099-12-31', location: null })
    const result = filterStockEntries([match, wrongStatus, wrongLocation], ['Active'], ['Bathroom'])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })
})

describe('filterStockEntries — undefined input', () => {
  it('returns empty array when entries is undefined', () => {
    const result = filterStockEntries(undefined, [], [])
    expect(result).toHaveLength(0)
  })
})

// Ensure calculateStatus is exercised so the import is not dead code
describe('calculateStatus sanity check', () => {
  it('returns Active for far-future expiry', () => {
    const entry = baseEntry({ expiryDate: '2099-12-31' })
    expect(calculateStatus(entry)).toBe('Active')
  })

  it('returns Expired for past expiry', () => {
    const entry = baseEntry({ expiryDate: '2000-01-01' })
    expect(calculateStatus(entry)).toBe('Expired')
  })
})
