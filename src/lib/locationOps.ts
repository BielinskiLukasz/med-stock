import { db } from './db'

export async function addCustomLocation(name: string): Promise<number> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Location name cannot be empty')
  // order: 999 sentinel — real order assignment on add (max existing + 1) is deferred to
  // Plan 08-02 alongside the case-insensitive collision check (D-03).
  return db.locations.add({ name: trimmed, isDefault: false, hidden: false, order: 999 })
}

export async function renameLocation(locationId: number, newName: string): Promise<void> {
  const trimmed = newName.trim()
  if (!trimmed) throw new Error('Location name cannot be empty')
  await db.transaction('rw', db.locations, db.medicines, async () => {
    const loc = await db.locations.get(locationId)
    if (!loc) throw new Error('Location not found')
    await db.medicines.where('location').equals(loc.name).modify({ location: trimmed })
    await db.locations.update(locationId, { name: trimmed })
  })
}

export async function deleteLocation(locationId: number): Promise<void> {
  await db.transaction('rw', db.locations, db.medicines, async () => {
    const loc = await db.locations.get(locationId)
    if (!loc) throw new Error('Location not found')
    if (loc.isDefault) throw new Error('Cannot delete default location')
    await db.medicines.where('location').equals(loc.name).modify({ location: null })
    await db.locations.delete(locationId)
  })
}
