import 'fake-indexeddb/auto'
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
    const locId = await db.locations.add({ name: 'Living Room', isDefault: false })
    const med1Id = await db.medicines.add({
      name: 'Med A',
      category: null,
      location: 'Living Room',
      expiryDate: '2030-01-01',
      openedDate: null,
      pao: null,
      quantity: null,
      quantityUnit: null,
      notes: null,
      manualStatus: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    const med2Id = await db.medicines.add({
      name: 'Med B',
      category: null,
      location: 'Living Room',
      expiryDate: '2030-01-01',
      openedDate: null,
      pao: null,
      quantity: null,
      quantityUnit: null,
      notes: null,
      manualStatus: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    await db.medicines.add({
      name: 'Med C',
      category: null,
      location: 'Kitchen',
      expiryDate: '2030-01-01',
      openedDate: null,
      pao: null,
      quantity: null,
      quantityUnit: null,
      notes: null,
      manualStatus: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    await deleteLocation(locId)

    expect(await db.locations.get(locId)).toBeUndefined()
    expect((await db.medicines.get(med1Id))?.location).toBeNull()
    expect((await db.medicines.get(med2Id))?.location).toBeNull()
    const medC = await db.medicines.where('location').equals('Kitchen').first()
    expect(medC?.location).toBe('Kitchen')
  })

  it('throws when trying to delete a default location', async () => {
    const locId = await db.locations.add({ name: 'Predefined', isDefault: true })
    await expect(deleteLocation(locId)).rejects.toThrow('Cannot delete default location')
    expect(await db.locations.get(locId)).toBeDefined()
  })
})

describe('renameLocation', () => {
  it('renames a custom location and updates all medicines referencing the old name', async () => {
    const locId = await db.locations.add({ name: 'Bed Room', isDefault: false })
    const med1Id = await db.medicines.add({
      name: 'Med A',
      category: null,
      location: 'Bed Room',
      expiryDate: '2030-01-01',
      openedDate: null,
      pao: null,
      quantity: null,
      quantityUnit: null,
      notes: null,
      manualStatus: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    const med2Id = await db.medicines.add({
      name: 'Med B',
      category: null,
      location: 'Bed Room',
      expiryDate: '2030-01-01',
      openedDate: null,
      pao: null,
      quantity: null,
      quantityUnit: null,
      notes: null,
      manualStatus: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    await renameLocation(locId, 'Bedroom')

    const updated = await db.locations.get(locId)
    expect(updated?.name).toBe('Bedroom')
    expect((await db.medicines.get(med1Id))?.location).toBe('Bedroom')
    expect((await db.medicines.get(med2Id))?.location).toBe('Bedroom')
  })

  it('throws when trying to rename a default location', async () => {
    const locId = await db.locations.add({ name: 'Predefined', isDefault: true })
    await expect(renameLocation(locId, 'New Name')).rejects.toThrow('Cannot rename default location')
    expect((await db.locations.get(locId))?.name).toBe('Predefined')
  })

  it('throws if newName is empty', async () => {
    const locId = await db.locations.add({ name: 'Custom', isDefault: false })
    await expect(renameLocation(locId, '')).rejects.toThrow()
  })
})
