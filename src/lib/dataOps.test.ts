import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'

// Import BackupSchema — this will fail until dataOps.ts is created (RED phase)
import { BackupSchema, inferCatalogEntriesFromLegacyMedicines, importFromJSON } from './dataOps'
import { db } from './db'

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

describe('inferCatalogEntriesFromLegacyMedicines', () => {
  // Case 1: empty input
  it('returns empty entries array and empty nameToId map for empty input', () => {
    const result = inferCatalogEntriesFromLegacyMedicines([])
    expect(result.entries).toEqual([])
    expect(result.nameToId.size).toBe(0)
  })

  // Case 2: single medicine, single lowercase word
  it('title-cases a single lowercase word name, preserves category, sets form null', () => {
    const result = inferCatalogEntriesFromLegacyMedicines([
      { id: 1, name: 'ibuprofen', category: 'Pain Relief' },
    ])
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].name).toBe('Ibuprofen')
    expect(result.entries[0].category).toBe('Pain Relief')
    expect(result.entries[0].form).toBeNull()
    expect(result.nameToId.get('ibuprofen')).toBe(result.entries[0].id)
  })

  // Case 3: two medicines with same normalized name (case+trim differ) dedup to one
  it('deduplicates two medicines that differ only by case and trailing whitespace', () => {
    const result = inferCatalogEntriesFromLegacyMedicines([
      { id: 1, name: 'Ibuprofen 400mg', category: 'Pain Relief' },
      { id: 2, name: 'ibuprofen 400mg ', category: 'Pain Relief' },
    ])
    expect(result.entries).toHaveLength(1)
    expect(result.nameToId.get('ibuprofen 400mg')).toBeDefined()
    expect(result.nameToId.size).toBe(1)
  })

  // Case 4: most-common category wins (2-vs-1 vote)
  it('selects most-common category across duplicate medicines', () => {
    const result = inferCatalogEntriesFromLegacyMedicines([
      { id: 1, name: 'aspirin', category: 'Pain' },
      { id: 2, name: 'aspirin', category: 'Pain' },
      { id: 3, name: 'aspirin', category: 'Allergy' },
    ])
    expect(result.entries[0].category).toBe('Pain')
  })

  // Case 5: category tie-break — lowest original medicine id wins
  it('breaks category tie by lowest original medicine id', () => {
    const result = inferCatalogEntriesFromLegacyMedicines([
      { id: 1, name: 'cetirizine', category: 'Allergy' },
      { id: 2, name: 'cetirizine', category: 'Cold' },
    ])
    expect(result.entries[0].category).toBe('Allergy')
  })

  // Case 6: multi-word name title-cased on every word
  it('title-cases every word in a multi-word name', () => {
    const result = inferCatalogEntriesFromLegacyMedicines([
      { id: 1, name: 'paracetamol extra strength', category: null },
    ])
    expect(result.entries[0].name).toBe('Paracetamol Extra Strength')
  })

  // Case 7: all entries have form: null regardless of input
  it('sets form to null on every returned catalog entry', () => {
    const result = inferCatalogEntriesFromLegacyMedicines([
      { id: 1, name: 'amoxicillin', category: 'Antibiotic' },
      { id: 2, name: 'cetirizine', category: 'Allergy' },
    ])
    expect(result.entries.every(e => e.form === null)).toBe(true)
  })

  // Case 8: nameToId key is lowercase trimmed version of name
  it('uses lowercase-trimmed name as the nameToId key', () => {
    const result = inferCatalogEntriesFromLegacyMedicines([
      { id: 1, name: '  Ibuprofen  ', category: null },
    ])
    expect(result.nameToId.has('ibuprofen')).toBe(true)
    expect(result.nameToId.has('  Ibuprofen  ')).toBe(false)
  })
})

// ─── importFromJSON integration tests ────────────────────────────────────────
// These tests exercise the full import pipeline with fake-indexeddb.

const clearAllTables = async () => {
  await Promise.all([
    db.medicines.clear(),
    db.medicine_catalog.clear(),
    db.locations.clear(),
    db.history.clear(),
  ])
}

describe('importFromJSON — new-format (schemaVersion present)', () => {
  beforeEach(clearAllTables)

  it('restores catalog and stock; returns isLegacyFormat: false, catalogCount: 1, medicineCount: 1', async () => {
    const rawJson: unknown = {
      schemaVersion: 2,
      medicine_catalog: [{
        id: 1,
        name: 'Ibuprofen',
        category: 'Pain',
        form: null,
        notes: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }],
      medicines: [{
        id: 1,
        catalogId: 1,
        location: null,
        expiryDate: '2027-01-01',
        openedDate: null,
        pao: null,
        quantity: 2,
        quantityUnit: 'tablets',
        packCount: null,
        notes: null,
        manualStatus: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        deletedAt: null,
      }],
      locations: [],
      history: [],
    }

    const result = await importFromJSON(rawJson)

    expect(result.isLegacyFormat).toBe(false)
    expect(result.catalogCount).toBe(1)
    expect(result.medicineCount).toBe(1)
    expect(await db.medicine_catalog.count()).toBe(1)
    expect(await db.medicines.count()).toBe(1)
  })
})

describe('importFromJSON — old-format (no schemaVersion)', () => {
  beforeEach(clearAllTables)

  it('infers catalog entries; returns isLegacyFormat: true, catalogCount: 1', async () => {
    const rawJson: unknown = {
      medicines: [{
        id: 1,
        name: 'Ibuprofen 400mg',
        category: 'Pain',
        location: null,
        expiryDate: '2027-01-01',
        openedDate: null,
        pao: null,
        quantity: 2,
        quantityUnit: 'tablets',
        packCount: null,
        notes: null,
        manualStatus: null,
        catalogId: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        deletedAt: null,
      }],
      locations: [],
      history: [],
    }

    const result = await importFromJSON(rawJson)

    expect(result.isLegacyFormat).toBe(true)
    expect(result.catalogCount).toBe(1)
    expect(result.medicineCount).toBe(1)
    expect(await db.medicine_catalog.count()).toBe(1)
    const stock = await db.medicines.toArray()
    expect(stock[0].catalogId).not.toBe(0)
  })
})

describe('importFromJSON — old-format deduplication', () => {
  beforeEach(clearAllTables)

  it('two medicines with same normalized name produce one catalog entry', async () => {
    const rawJson: unknown = {
      medicines: [
        {
          id: 1,
          name: 'ibuprofen 400mg',
          category: 'Pain',
          location: null,
          expiryDate: '2027-01-01',
          openedDate: null,
          pao: null,
          quantity: 1,
          quantityUnit: 'tablets',
          packCount: null,
          notes: null,
          manualStatus: null,
          catalogId: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          deletedAt: null,
        },
        {
          id: 2,
          name: 'Ibuprofen 400mg ',
          category: 'Pain',
          location: null,
          expiryDate: '2028-01-01',
          openedDate: null,
          pao: null,
          quantity: 3,
          quantityUnit: 'tablets',
          packCount: null,
          notes: null,
          manualStatus: null,
          catalogId: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          deletedAt: null,
        },
      ],
      locations: [],
      history: [],
    }

    const result = await importFromJSON(rawJson)

    expect(result.catalogCount).toBe(1)
    expect(result.medicineCount).toBe(2)
    const stock = await db.medicines.toArray()
    expect(stock[0].catalogId).toBe(stock[1].catalogId)
  })
})

describe('importFromJSON — invalid input', () => {
  beforeEach(clearAllTables)

  it('rejects empty object with Error("Invalid backup format")', async () => {
    await expect(importFromJSON({})).rejects.toThrow('Invalid backup format')
  })
})
