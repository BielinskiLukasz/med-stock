import type { Medicine, MedicineCatalog } from './db'
import { calculateStatus, type MedicineStatus } from './expiry'

export function computeCatalogAggregate(
  _catalog: MedicineCatalog,
  activeStocks: Medicine[]
): { status: MedicineStatus; totalQty: number } {
  // Find stock entry with soonest non-null expiryDate (lexicographic comparison works for YYYY-MM-DD)
  const nearestExpiryStock = activeStocks.reduce<Medicine | null>(
    (nearest, current) => {
      if (!current.expiryDate) return nearest
      if (!nearest?.expiryDate) return current
      return current.expiryDate < nearest.expiryDate ? current : nearest
    },
    null
  )

  const status = nearestExpiryStock ? calculateStatus(nearestExpiryStock) : 'Active'

  // null quantity treated as 0 (flagged assumption: D-ASUM-01)
  const totalQty = activeStocks.reduce((sum, stock) => sum + (stock.quantity ?? 0), 0)

  return { status, totalQty }
}
