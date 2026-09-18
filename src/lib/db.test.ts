import 'fake-indexeddb/auto'
import { Dexie } from 'dexie'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'
import { addCustomLocation, renameLocation, deleteLocation } from './locationOps'

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
})

describe('deleteLocation', () => {
  it('deletes a custom location and sets affected medicines.location to null', async () => {
    const locId = await db.locations.add({ name: 'Living Room', isDefault: false, hidden: false, order: 1 })
    const med1Id = await db.medicines.add({
      catalogId: 1,
      location: 'Living Room',
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
      location: 'Living Room',
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
    await db.medicines.add({
      catalogId: 1,
      location: 'Kitchen',
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

    await deleteLocation(locId)

    expect(await db.locations.get(locId)).toBeUndefined()
    expect((await db.medicines.get(med1Id))?.location).toBeNull()
    expect((await db.medicines.get(med2Id))?.location).toBeNull()
    const medC = await db.medicines.where('location').equals('Kitchen').first()
    expect(medC?.location).toBe('Kitchen')
  })

  it('throws when trying to delete a default location', async () => {
    const locId = await db.locations.add({ name: 'Predefined', isDefault: true, hidden: false, order: 1 })
    await expect(deleteLocation(locId)).rejects.toThrow('Cannot delete default location')
    expect(await db.locations.get(locId)).toBeDefined()
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
