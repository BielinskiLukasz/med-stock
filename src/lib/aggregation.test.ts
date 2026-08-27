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
    packCount: null,
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

  // Priority-ordering tests (G-05-4 — require priority-reduce implementation)

  it('priority: ExceededOpenPeriod wins over Opened and Active', () => {
    // Opened entry: has openedDate, future expiry, no PAO
    const openedEntry = makeStock({
      id: 1,
      quantity: 5,
      expiryDate: '2030-12-31',
      openedDate: '2026-01-01',
      pao: null,
    })
    // ExceededOpenPeriod entry: PAO window elapsed (opened 60 days ago, 1-day PAO)
    const exceededEntry = makeStock({
      id: 2,
      quantity: 5,
      expiryDate: null,
      openedDate: '2026-06-01',
      pao: { value: 1, unit: 'days' },
    })
    const result = computeCatalogAggregate(baseCatalog, [openedEntry, exceededEntry])
    expect(result.status).toBe('ExceededOpenPeriod')
  })

  it('priority: Expired wins over ExceededOpenPeriod', () => {
    // Expired entry: past expiryDate
    const expiredEntry = makeStock({
      id: 1,
      quantity: 5,
      expiryDate: '2020-01-01',
      openedDate: null,
      pao: null,
    })
    // ExceededOpenPeriod entry: PAO elapsed, no expiryDate
    const exceededEntry = makeStock({
      id: 2,
      quantity: 5,
      expiryDate: null,
      openedDate: '2026-06-01',
      pao: { value: 1, unit: 'days' },
    })
    const result = computeCatalogAggregate(baseCatalog, [expiredEntry, exceededEntry])
    expect(result.status).toBe('Expired')
  })

  it('manual status is excluded from aggregate; remaining AutoStatus entry wins', () => {
    // ManualStatus entry — should be skipped
    const manualEntry = makeStock({
      id: 1,
      quantity: 5,
      manualStatus: 'UsedUp',
      expiryDate: '2020-01-01', // past date, but manualStatus overrides
    })
    // Active entry: future expiry, not opened
    const activeEntry = makeStock({
      id: 2,
      quantity: 10,
      expiryDate: '2030-12-31',
      openedDate: null,
    })
    const result = computeCatalogAggregate(baseCatalog, [manualEntry, activeEntry])
    expect(result.status).toBe('Active')
  })

  it('PAO-only entry (no expiryDate) with elapsed PAO yields ExceededOpenPeriod in aggregate', () => {
    // PAO elapsed long ago — ExceededOpenPeriod
    const paoEntry = makeStock({
      id: 1,
      quantity: 8,
      expiryDate: null,
      openedDate: '2026-01-01',
      pao: { value: 1, unit: 'days' },
    })
    const result = computeCatalogAggregate(baseCatalog, [paoEntry])
    expect(result.status).toBe('ExceededOpenPeriod')
  })

  it('all-ManualStatus entries with no AutoStatus entries fall back to Active', () => {
    const disposed1 = makeStock({ id: 1, quantity: 3, manualStatus: 'Disposed' })
    const disposed2 = makeStock({ id: 2, quantity: 2, manualStatus: 'Disposed' })
    const result = computeCatalogAggregate(baseCatalog, [disposed1, disposed2])
    expect(result.status).toBe('Active')
    expect(result.totalQty).toBe(5)
  })

  // packCount tests (G-05-2 display fix)

  it('multiplies quantity by packCount when packCount is set (G-05-2)', () => {
    // packCount=2, quantity=30 → contributes 60; packCount=null, quantity=10 → contributes 10
    const multiBox = makeStock({ id: 1, quantity: 30, packCount: 2, expiryDate: '2030-12-31' })
    const singleUnit = makeStock({ id: 2, quantity: 10, packCount: null, expiryDate: '2030-12-31' })
    const result = computeCatalogAggregate(baseCatalog, [multiBox, singleUnit])
    expect(result.totalQty).toBe(70)
  })

  it('treats packCount=1 as equivalent to no packCount for totalQty', () => {
    const explicit1 = makeStock({ id: 1, quantity: 15, packCount: 1, expiryDate: '2030-12-31' })
    const implicit1 = makeStock({ id: 2, quantity: 15, packCount: null, expiryDate: '2030-12-31' })
    const result = computeCatalogAggregate(baseCatalog, [explicit1, implicit1])
    expect(result.totalQty).toBe(30)
  })
})
