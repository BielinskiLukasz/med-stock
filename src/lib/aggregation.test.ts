import { describe, it, expect } from 'vitest'
import { computeCatalogAggregate } from './aggregation'
import type { Medicine, MedicineCatalog } from './db'

const baseCatalog: MedicineCatalog = {
  id: 1,
  name: 'Ibuprofen',
  category: 'Painkiller',
  form: null,
  notes: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function makeStock(overrides: Partial<Medicine> = {}): Medicine {
  return {
    id: 1,
    catalogId: 1,
    location: null,
    expiryDate: '2030-12-31',
    openedDate: null,
    pao: null,
    quantity: 10,
    quantityUnit: 'tablets',
    notes: null,
    manualStatus: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    deletedAt: null,
    ...overrides,
  }
}

describe('computeCatalogAggregate', () => {
  it('returns status=Active and totalQty=0 for empty catalog (no stock entries)', () => {
    const result = computeCatalogAggregate(baseCatalog, [])
    expect(result.status).toBe('Active')
    expect(result.totalQty).toBe(0)
  })

  it('returns status from single stock entry and its quantity', () => {
    const stock = makeStock({ id: 1, quantity: 20, expiryDate: '2025-01-01' })
    const result = computeCatalogAggregate(baseCatalog, [stock])
    // Past date → Expired
    expect(result.status).toBe('Expired')
    expect(result.totalQty).toBe(20)
  })

  it('selects nearest-expiry stock for status and sums all quantities', () => {
    const nearest = makeStock({ id: 1, quantity: 10, expiryDate: '2025-12-31' })
    const further = makeStock({ id: 2, quantity: 5, expiryDate: '2030-06-30' })
    const result = computeCatalogAggregate(baseCatalog, [nearest, further])
    // '2025-12-31' is earliest and in the past → Expired
    expect(result.status).toBe('Expired')
    expect(result.totalQty).toBe(15)
  })

  it('skips null expiryDate when finding nearest expiry', () => {
    const noExpiry = makeStock({ id: 1, quantity: 10, expiryDate: null })
    const withExpiry = makeStock({ id: 2, quantity: 5, expiryDate: '2025-12-31' })
    const result = computeCatalogAggregate(baseCatalog, [noExpiry, withExpiry])
    // Only withExpiry has date; '2025-12-31' is past → Expired
    expect(result.status).toBe('Expired')
    expect(result.totalQty).toBe(15)
  })

  it('treats null quantity as 0 in total sum', () => {
    const nullQty = makeStock({ id: 1, quantity: null, expiryDate: '2025-12-31' })
    const withQty = makeStock({ id: 2, quantity: 5, expiryDate: '2025-12-31' })
    const result = computeCatalogAggregate(baseCatalog, [nullQty, withQty])
    expect(result.totalQty).toBe(5)
  })

  it('returns status=Active when all stocks have null expiryDate', () => {
    const s1 = makeStock({ id: 1, quantity: 10, expiryDate: null })
    const s2 = makeStock({ id: 2, quantity: 5, expiryDate: null })
    const result = computeCatalogAggregate(baseCatalog, [s1, s2])
    expect(result.status).toBe('Active')
    expect(result.totalQty).toBe(15)
  })
})
