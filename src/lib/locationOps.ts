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

// D-10: only active (non-soft-deleted) stock entries participate in reference counting.
// Never query db.medicines.where('deletedAt').equals(null) — null is not a valid
// IndexedDB key — filter in memory instead.
export async function countActiveLocationReferences(locationName: string): Promise<number> {
  return db.medicines
    .where('location')
    .equals(locationName)
    .filter(m => m.deletedAt === null)
    .count()
}

// D-09/D-10/D-11/D-12: replaces the old isDefault-guarded deleteLocation. Reassigns (or
// clears to null — never the string 'Other') all ACTIVE references before deleting the
// location row, atomically. No isDefault guard, no minimum-location floor.
export async function deleteLocationWithReassign(
  locationId: number,
  reassignTo: string | null
): Promise<void> {
  await db.transaction('rw', db.locations, db.medicines, async () => {
    const loc = await db.locations.get(locationId)
    if (!loc) throw new Error('Location not found')
    await db.medicines
      .where('location')
      .equals(loc.name)
      .filter(m => m.deletedAt === null)
      .modify({ location: reassignTo })
    await db.locations.delete(locationId)
  })
}

// D-05: hide/show toggle available on ALL locations, no isDefault branching.
export async function toggleLocationHidden(locationId: number, hidden: boolean): Promise<void> {
  await db.locations.update(locationId, { hidden })
}

// D-13 (Strategy A): renumbers every id in orderedIds to contiguous integers 1..N,
// matching the array's new position order. D-16: "Other" (null location) never appears
// in orderedIds — callers filter it out before calling this function.
export async function reorderLocations(orderedIds: number[]): Promise<void> {
  if (orderedIds.length <= 1) return
  await db.transaction('rw', db.locations, async () => {
    const updates = orderedIds.map((id, i) => ({ key: id, changes: { order: i + 1 } }))
    await db.locations.bulkUpdate(updates)
  })
}
