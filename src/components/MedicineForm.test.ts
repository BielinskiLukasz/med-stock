import { describe, it, expect } from 'vitest'

// Import the schema and type — MedicineForm.tsx must export these
// This test file will fail (RED) until MedicineForm.tsx is created
import type { MedicineFormData } from './MedicineForm'

// We test the Zod schema validation logic by importing a separate schema export
// The schema itself is tested via type inference; runtime validation tested below
import { medicineSchema } from './MedicineForm'

describe('medicineSchema — required fields', () => {
  it('rejects empty name', () => {
    const result = medicineSchema.safeParse({ name: '', expiryDate: '2027-01-01' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path[0] === 'name')
      expect(nameError?.message).toBe('Name is required')
    }
  })

  it('rejects empty expiryDate', () => {
    const result = medicineSchema.safeParse({ name: 'Ibuprofen', expiryDate: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const dateError = result.error.issues.find((i) => i.path[0] === 'expiryDate')
      expect(dateError?.message).toBe('Expiry date is required')
    }
  })

  it('accepts valid minimal data', () => {
    const result = medicineSchema.safeParse({ name: 'Ibuprofen 400mg', expiryDate: '2027-06-30' })
    expect(result.success).toBe(true)
  })

  it('accepts all optional fields as null', () => {
    const result = medicineSchema.safeParse({
      name: 'Test',
      expiryDate: '2027-01-01',
      category: null,
      location: null,
      openedDate: null,
      paoValue: null,
      paoUnit: null,
      quantity: null,
      quantityUnit: null,
      notes: null,
    })
    expect(result.success).toBe(true)
  })

  it('D-17: location is nullable (never required to be a string)', () => {
    const result = medicineSchema.safeParse({ name: 'Test', expiryDate: '2027-01-01', location: null })
    expect(result.success).toBe(true)
    if (result.success) {
      // location: null is the "Other" sentinel — should be preserved
      expect(result.data.location).toBeNull()
    }
  })

  it('accepts location as a string', () => {
    const result = medicineSchema.safeParse({
      name: 'Test',
      expiryDate: '2027-01-01',
      location: 'Kitchen Drawer',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.location).toBe('Kitchen Drawer')
    }
  })

  it('accepts paoUnit as days/weeks/months', () => {
    for (const unit of ['days', 'weeks', 'months'] as const) {
      const result = medicineSchema.safeParse({
        name: 'Test',
        expiryDate: '2027-01-01',
        paoValue: 30,
        paoUnit: unit,
      })
      expect(result.success).toBe(true)
    }
  })

  it('type check: MedicineFormData has correct optional/nullable fields', () => {
    // Compile-time check — if this file compiles, the type is correct
    const sample: MedicineFormData = {
      name: 'Test Med',
      expiryDate: '2027-01-01',
      category: null,
      location: null,
      openedDate: null,
      paoValue: null,
      paoUnit: null,
      quantity: null,
      quantityUnit: null,
      notes: null,
    }
    expect(sample.name).toBe('Test Med')
  })
})
