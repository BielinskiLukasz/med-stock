import { describe, it, expect } from 'vitest'

// Import BackupSchema — this will fail until dataOps.ts is created (RED phase)
import { BackupSchema } from './dataOps'

describe('BackupSchema', () => {
  it('rejects empty object', () => {
    const result = BackupSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts valid empty arrays for all three tables', () => {
    const result = BackupSchema.safeParse({ medicines: [], locations: [], history: [] })
    expect(result.success).toBe(true)
  })

  it('rejects locations when type is wrong (string instead of array)', () => {
    const result = BackupSchema.safeParse({
      medicines: [],
      locations: 'wrong_type',
      history: [],
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid medicine entry with all required fields present, pao: null, manualStatus: null', () => {
    const result = BackupSchema.safeParse({
      medicines: [
        {
          id: 1,
          name: 'Ibuprofen 400mg',
          category: 'Pain Relief',
          location: 'Bathroom Cabinet',
          expiryDate: '2027-06-30',
          openedDate: null,
          pao: null,
          quantity: 2,
          quantityUnit: 'tablets',
          notes: null,
          manualStatus: null,
          createdAt: '2026-07-13T10:00:00.000Z',
          updatedAt: '2026-07-13T10:00:00.000Z',
          deletedAt: null,
        },
      ],
      locations: [],
      history: [],
    })
    expect(result.success).toBe(true)
  })

  it('rejects medicine where manualStatus is an invalid value', () => {
    const result = BackupSchema.safeParse({
      medicines: [
        {
          id: 1,
          name: 'Test',
          category: null,
          location: null,
          expiryDate: '2027-01-01',
          openedDate: null,
          pao: null,
          quantity: null,
          quantityUnit: null,
          notes: null,
          manualStatus: 'InvalidValue',
          createdAt: '2026-07-13T10:00:00.000Z',
          updatedAt: '2026-07-13T10:00:00.000Z',
          deletedAt: null,
        },
      ],
      locations: [],
      history: [],
    })
    expect(result.success).toBe(false)
  })

  it('accepts history entry where action is "created"', () => {
    const result = BackupSchema.safeParse({
      medicines: [],
      locations: [],
      history: [
        {
          id: 1,
          medicineId: 1,
          medicineName: 'Ibuprofen 400mg',
          action: 'created',
          changedFields: [],
          timestamp: '2026-07-13T10:00:00.000Z',
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects history entry where action is "unknownAction"', () => {
    const result = BackupSchema.safeParse({
      medicines: [],
      locations: [],
      history: [
        {
          id: 1,
          medicineId: 1,
          medicineName: 'Test',
          action: 'unknownAction',
          changedFields: [],
          timestamp: '2026-07-13T10:00:00.000Z',
        },
      ],
    })
    expect(result.success).toBe(false)
  })
})
