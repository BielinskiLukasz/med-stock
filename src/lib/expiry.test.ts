import { describe, it, expect } from 'vitest'
import { calculateStatus } from './expiry'
import type { Medicine } from './db'

// Minimal Medicine factory — only fields relevant to calculateStatus
function makeMed(overrides: Partial<Medicine> = {}): Medicine {
  return {
    id: 1,
    name: 'Test Medicine',
    category: null,
    location: null,
    expiryDate: '2030-12-31',
    openedDate: null,
    pao: null,
    quantity: null,
    quantityUnit: null,
    notes: null,
    manualStatus: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('calculateStatus', () => {
  // Active: expiry in future, not opened
  it('returns Active when expiry is in the future and medicine has not been opened', () => {
    const med = makeMed({ expiryDate: '2030-12-31', openedDate: null, pao: null })
    const now = new Date('2026-06-30')
    expect(calculateStatus(med, now)).toBe('Active')
  })

  // Opened: opened, PAO not elapsed, expiry not passed
  it('returns Opened when openedDate is set and PAO window has not elapsed', () => {
    const med = makeMed({
      expiryDate: '2030-12-31',
      openedDate: '2026-06-01',
      pao: { value: 30, unit: 'days' },
    })
    const now = new Date('2026-06-15')
    expect(calculateStatus(med, now)).toBe('Opened')
  })

  // Expired by expiry date
  it('returns Expired when now is past expiryDate', () => {
    const med = makeMed({ expiryDate: '2020-01-01', openedDate: null, pao: null })
    const now = new Date('2026-06-30')
    expect(calculateStatus(med, now)).toBe('Expired')
  })

  // Expired by PAO window
  it('returns Expired when now is past openedDate + PAO window', () => {
    const med = makeMed({
      expiryDate: '2030-12-31',
      openedDate: '2026-06-01',
      pao: { value: 30, unit: 'days' },
    })
    const now = new Date('2026-07-15')
    expect(calculateStatus(med, now)).toBe('Expired')
  })

  // Whichever-first: expiry fires before PAO
  it('returns Expired when expiry fires before PAO end', () => {
    const med = makeMed({
      expiryDate: '2026-07-01',    // expires sooner
      openedDate: '2026-06-01',
      pao: { value: 90, unit: 'days' }, // paoEnd = 2026-09-01
    })
    const now = new Date('2026-07-15')
    expect(calculateStatus(med, now)).toBe('Expired')
  })

  // D-13: manual override — manualStatus wins even if dates are fine
  it('D-13: returns manualStatus Archived when manualStatus is set (dates are valid)', () => {
    const med = makeMed({
      expiryDate: '2030-12-31',
      manualStatus: 'Archived',
    })
    const now = new Date('2026-06-30')
    expect(calculateStatus(med, now)).toBe('Archived')
  })

  // D-13: manual override — manualStatus wins even if dates are expired
  it('D-13: returns manualStatus Used Up when manualStatus is set (dates are expired)', () => {
    const med = makeMed({
      expiryDate: '2020-01-01',
      manualStatus: 'Used Up',
    })
    const now = new Date('2026-06-30')
    expect(calculateStatus(med, now)).toBe('Used Up')
  })

  // D-14: null expiry + PAO, within window
  it('D-14: returns Opened when expiryDate is null, PAO is set, and within PAO window', () => {
    const med = makeMed({
      expiryDate: null,
      openedDate: '2026-06-01',
      pao: { value: 30, unit: 'days' },
    })
    const now = new Date('2026-06-15')
    expect(calculateStatus(med, now)).toBe('Opened')
  })

  // D-14: null expiry + PAO, past window
  it('D-14: returns Expired when expiryDate is null, PAO is set, and past PAO window', () => {
    const med = makeMed({
      expiryDate: null,
      openedDate: '2026-06-01',
      pao: { value: 30, unit: 'days' },
    })
    const now = new Date('2026-07-15')
    expect(calculateStatus(med, now)).toBe('Expired')
  })

  // D-15: opened + no PAO, expiry future
  it('D-15: returns Opened when openedDate is set, pao is null, and expiry is in the future', () => {
    const med = makeMed({
      expiryDate: '2026-12-31',
      openedDate: '2026-06-01',
      pao: null,
    })
    const now = new Date('2026-06-30')
    expect(calculateStatus(med, now)).toBe('Opened')
  })

  // D-15: opened + no PAO, expiry past
  it('D-15: returns Expired when openedDate is set, pao is null, and expiry is past', () => {
    const med = makeMed({
      expiryDate: '2020-01-01',
      openedDate: '2019-06-01',
      pao: null,
    })
    const now = new Date('2026-06-30')
    expect(calculateStatus(med, now)).toBe('Expired')
  })
})
