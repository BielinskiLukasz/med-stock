import 'fake-indexeddb/auto'
import { Dexie } from 'dexie'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'
import {
  addCustomLocation,
  renameLocation,
  countActiveLocationReferences,
  deleteLocationWithReassign,
} from './locationOps'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('addCustomLocation', () => {
  it('adds a non-default location and returns its id', async () => {
    const id = await addCustomLocation('Medicine Cabinet')
    expect(typeof id).toBe('number')
    const loc = await db.locations.get(id)
    expect(loc?.name).toBe('Medicine Cabinet')
    expect(loc?.isDefault).toBe(false)
  })

  it('throws if name is empty string', async () => {
    await expect(addCustomLocation('')).rejects.toThrow()
  })

  it('throws if name is whitespace only', async () => {
    await expect(addCustomLocation('   ')).rejects.toThrow()
  })

  // D-03: case-insensitive collision check
  it('rejects a name that collides case-insensitively with an existing location', async () => {
    await addCustomLocation('Pantry')
    await expect(addCustomLocation('pantry')).rejects.toThrow('Location name already exists')
    const all = await db.locations.toCollection().toArray()
    expect(all.filter(l => l.name.toLowerCase() === 'pantry')).toHaveLength(1)
  })

  // D-04: trim only, no title-casing
  it('stores the name trimmed but otherwise verbatim (no title-casing)', async () => {
    const id = await addCustomLocation('  Fridge  ')
    const loc = await db.locations.get(id)
    expect(loc?.name).toBe('Fridge')
  })

  // Pitfall 3: order assignment on add
  it('assigns order = max(existing order) + 1', async () => {
    await db.locations.clear()
    await db.locations.add({ name: 'A', isDefault: false, hidden: false, order: 5 })
    const id = await addCustomLocation('B')
    const loc = await db.locations.get(id)
    expect(loc?.order).toBe(6)
  })

  it('assigns order = 1 on an empty locations table', async () => {
    await db.locations.clear()
    const id = await addCustomLocation('First')
    const loc = await db.locations.get(id)
    expect(loc?.order).toBe(1)
  })
})

// Shared fixture factory for medicine rows referencing a location — reduces
// per-test boilerplate across countActiveLocationReferences/deleteLocationWithReassign.
function makeMedicine(overrides: Partial<{
  location: string | null
  deletedAt: string | null
}> = {}) {
  return {
    catalogId: 1,
    location: overrides.location ?? null,
    expiryDate: '2030-01-01',
    openedDate: null,
    pao: null,
    quantity: null,
    quantityUnit: null,
    packCount: null,
    notes: null,
    manualStatus: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: overrides.deletedAt ?? null,
  }
}

describe('countActiveLocationReferences', () => {
  it('counts only active (non-soft-deleted) medicines referencing the location', async () => {
    await db.medicines.add(makeMedicine({ location: 'Kitchen Drawer' }))
    await db.medicines.add(makeMedicine({ location: 'Kitchen Drawer' }))
    await db.medicines.add(makeMedicine({ location: 'Kitchen Drawer', deletedAt: '2026-01-01T00:00:00.000Z' }))
    await db.medicines.add(makeMedicine({ location: 'Other Place' }))

    const count = await countActiveLocationReferences('Kitchen Drawer')
    expect(count).toBe(2)
  })

  it('returns 0 when no medicines reference the location', async () => {
    const count = await countActiveLocationReferences('Nonexistent Location')
    expect(count).toBe(0)
  })
})

describe('deleteLocationWithReassign', () => {
  it('reassigns active references to the target location, leaves soft-deleted ones untouched, and deletes the location row', async () => {
    const locId = await db.locations.add({ name: 'Living Room', isDefault: false, hidden: false, order: 1 })
    const med1Id = await db.medicines.add(makeMedicine({ location: 'Living Room' }))
    const med2Id = await db.medicines.add(makeMedicine({ location: 'Living Room' }))
    const trashedId = await db.medicines.add(
      makeMedicine({ location: 'Living Room', deletedAt: '2026-01-01T00:00:00.000Z' })
    )
    const otherId = await db.medicines.add(makeMedicine({ location: 'Kitchen' }))

    await deleteLocationWithReassign(locId, 'Bathroom Cabinet')

    expect(await db.locations.get(locId)).toBeUndefined()
    expect((await db.medicines.get(med1Id))?.location).toBe('Bathroom Cabinet')
    expect((await db.medicines.get(med2Id))?.location).toBe('Bathroom Cabinet')
    expect((await db.medicines.get(trashedId))?.location).toBe('Living Room')
    expect((await db.medicines.get(otherId))?.location).toBe('Kitchen')
  })

  it('clears active references to null ("Other") when reassignTo is null, never the string "Other"', async () => {
    const locId = await db.locations.add({ name: 'Living Room', isDefault: false, hidden: false, order: 1 })
    const medId = await db.medicines.add(makeMedicine({ location: 'Living Room' }))

    await deleteLocationWithReassign(locId, null)

    const med = await db.medicines.get(medId)
    expect(med?.location).toBeNull()
    expect(med?.location).not.toBe('Other')
  })

  it('deletes a location with zero active references successfully, no special-case throw', async () => {
    const locId = await db.locations.add({ name: 'Unused Shelf', isDefault: false, hidden: false, order: 1 })
    await expect(deleteLocationWithReassign(locId, null)).resolves.not.toThrow()
    expect(await db.locations.get(locId)).toBeUndefined()
  })

  it('throws "Location not found" on a second call with the same (already-deleted) id', async () => {
    const locId = await db.locations.add({ name: 'Pantry', isDefault: false, hidden: false, order: 1 })
    await deleteLocationWithReassign(locId, null)
    await expect(deleteLocationWithReassign(locId, null)).rejects.toThrow('Location not found')
  })

  it('deletes the last remaining location with no minimum-floor check', async () => {
    await db.locations.clear()
    const locId = await db.locations.add({ name: 'Only Location', isDefault: false, hidden: false, order: 1 })
    await deleteLocationWithReassign(locId, null)
    expect(await db.locations.count()).toBe(0)
  })

  it('works identically on an isDefault:true location (no isDefault guard)', async () => {
    const locId = await db.locations.add({ name: 'Predefined', isDefault: true, hidden: false, order: 1 })
    await expect(deleteLocationWithReassign(locId, null)).resolves.not.toThrow()
    expect(await db.locations.get(locId)).toBeUndefined()
  })
})

describe('renameLocation', () => {
  it('renames a custom location and updates all medicines referencing the old name', async () => {
    const locId = await db.locations.add({ name: 'Bed Room', isDefault: false, hidden: false, order: 1 })
    const med1Id = await db.medicines.add({
      catalogId: 1,
      location: 'Bed Room',
      expiryDate: '2030-01-01',
      openedDate: null,
      pao: null,
      quantity: null,
      quantityUnit: null,
      packCount: null,
      notes: null,
      manualStatus: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    })
    const med2Id = await db.medicines.add({
      catalogId: 1,
      location: 'Bed Room',
      expiryDate: '2030-01-01',
      openedDate: null,
      pao: null,
      quantity: null,
      quantityUnit: null,
      packCount: null,
      notes: null,
      manualStatus: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    })

    await renameLocation(locId, 'Bedroom')

    const updated = await db.locations.get(locId)
    expect(updated?.name).toBe('Bedroom')
    expect((await db.medicines.get(med1Id))?.location).toBe('Bedroom')
    expect((await db.medicines.get(med2Id))?.location).toBe('Bedroom')
  })

  // D-01: isDefault no longer blocks rename — predefined locations become renamable
  // exactly like custom ones, and referencing medicines get bulk-updated in the same
  // transaction (Behavior 3 of Plan 08-01).
  it('renames a predefined (isDefault) location and updates referencing medicines', async () => {
    const locId = await db.locations.add({ name: 'Predefined', isDefault: true, hidden: false, order: 1 })
    const medId = await db.medicines.add({
      catalogId: 1,
      location: 'Predefined',
      expiryDate: '2030-01-01',
      openedDate: null,
      pao: null,
      quantity: null,
      quantityUnit: null,
      packCount: null,
      notes: null,
      manualStatus: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    })

    await renameLocation(locId, 'Renamed Predefined')

    const updated = await db.locations.get(locId)
    expect(updated?.name).toBe('Renamed Predefined')
    expect(updated?.isDefault).toBe(true)
    expect((await db.medicines.get(medId))?.location).toBe('Renamed Predefined')
  })

  it('throws if newName is empty', async () => {
    const locId = await db.locations.add({ name: 'Custom', isDefault: false, hidden: false, order: 1 })
    await expect(renameLocation(locId, '')).rejects.toThrow()
  })

  // D-03: case-insensitive collision check on rename
  it('rejects a rename that collides case-insensitively with a different existing location', async () => {
    await db.locations.add({ name: 'Bathroom Cabinet', isDefault: false, hidden: false, order: 1 })
    const locId = await db.locations.add({ name: 'Kitchen', isDefault: false, hidden: false, order: 2 })
    await expect(renameLocation(locId, 'bathroom cabinet')).rejects.toThrow('Location name already exists')
    const updated = await db.locations.get(locId)
    expect(updated?.name).toBe('Kitchen')
  })

  it('allows renaming a location to its own current name (case-insensitive self-match is not a collision)', async () => {
    const locId = await db.locations.add({ name: 'Pantry', isDefault: false, hidden: false, order: 1 })
    await expect(renameLocation(locId, 'Pantry')).resolves.not.toThrow()
    await expect(renameLocation(locId, 'pantry')).resolves.not.toThrow()
    const updated = await db.locations.get(locId)
    expect(updated?.name).toBe('pantry')
  })
})

describe('db.version(6) migration', () => {
  it('seeds fresh installs with hidden=false and sequential order 1..7 (Bathroom Cabinet..Travel Kit)', async () => {
    const locs = await db.locations.toCollection().sortBy('order')
    expect(locs).toHaveLength(7)
    expect(locs.every(l => l.hidden === false)).toBe(true)
    expect(locs.map(l => l.order)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(locs.map(l => l.name)).toEqual([
      'Bathroom Cabinet',
      'Bedroom Cabinet',
      'Kitchen Drawer',
      'Living Room Cabinet',
      'Medicine Box',
      'Refrigerator',
      'Travel Kit',
    ])
  })

  it('upgrades an existing pre-v6 database in place: every row gets hidden=false and a unique, contiguous order matching alphabetical name order', async () => {
    // Simulate a pre-v6 database: close/delete the app's db, then create a raw Dexie
    // instance bound only through the v5 shape, populate it with locations that have
    // no hidden/order fields, then reopen the real `db` (bound through v6) so the
    // versionchange upgrade runs against genuinely pre-existing data.
    db.close()
    await db.delete()

    const rawDb = new Dexie('MedStockDB')
    rawDb.version(5).stores({
      medicines: '++id, catalogId, location, expiryDate, manualStatus',
      medicine_catalog: '++id, name',
      locations: '++id, name, isDefault',
      history: '++id, medicineId, timestamp',
    })
    await rawDb.open()
    await rawDb.table('locations').bulkAdd([
      { name: 'Zebra Drawer', isDefault: false },
      { name: 'Apple Cabinet', isDefault: false },
      { name: 'Medicine Box', isDefault: true },
    ])
    rawDb.close()

    await db.open()

    const locs = await db.locations.toCollection().sortBy('order')
    expect(locs).toHaveLength(3)
    expect(locs.every(l => l.hidden === false)).toBe(true)
    expect(locs.map(l => l.order)).toEqual([1, 2, 3])
    // Alphabetical by name: Apple Cabinet, Medicine Box, Zebra Drawer
    expect(locs.map(l => l.name)).toEqual(['Apple Cabinet', 'Medicine Box', 'Zebra Drawer'])
  })
})
