import { db } from './db'

export async function addCustomLocation(name: string): Promise<number> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Location name cannot be empty')
  // D-03: reject a case-insensitive, trimmed collision with any other existing location.
  const collision = await db.locations
    .toCollection()
    .filter(loc => loc.name.toLowerCase() === trimmed.toLowerCase())
    .first()
  if (collision) throw new Error('Location name already exists')
  // Pitfall 3: assign the next order value after the current maximum so a new location
  // never collides with an existing order and never sorts unpredictably.
  // 'order' is intentionally unindexed (matches the non-indexed precedent for packCount
  // in v5) — orderBy() requires an index and throws SchemaError, so sort in memory instead.
  const sorted = await db.locations.toCollection().sortBy('order')
  const maxOrder = sorted.length > 0 ? sorted[sorted.length - 1] : undefined
  const nextOrder = (maxOrder?.order ?? 0) + 1
  return db.locations.add({ name: trimmed, isDefault: false, hidden: false, order: nextOrder })
}

export async function renameLocation(locationId: number, newName: string): Promise<void> {
  const trimmed = newName.trim()
  if (!trimmed) throw new Error('Location name cannot be empty')
  // D-03: reject a case-insensitive, trimmed collision with any OTHER existing location.
  // Renaming to one's own current name (any case) is not a collision.
  const collision = await db.locations
    .toCollection()
    .filter(loc => loc.id !== locationId && loc.name.toLowerCase() === trimmed.toLowerCase())
    .first()
  if (collision) throw new Error('Location name already exists')
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
