import type { Medicine, MedicineCatalog } from './db'
import { calculateStatus, type AutoStatus, type MedicineStatus } from './expiry'

/** Priority weights for worst-case reduction — higher value = worse health state */
const PRIORITY: Record<AutoStatus, number> = {
  Active: 1,
  Opened: 2,
  ExceededOpenPeriod: 3,
  Expired: 4,
}

/** Manual statuses are excluded from worst-case aggregate evaluation */
const MANUAL_STATUSES = new Set<MedicineStatus>(['UsedUp', 'Disposed', 'Archived'])

export function computeCatalogAggregate(
  _catalog: MedicineCatalog,
  activeStocks: Medicine[]
): { status: MedicineStatus; totalQty: number } {
  let worstStatus: AutoStatus = 'Active'

  for (const stock of activeStocks) {
    const s = calculateStatus(stock)
    if (MANUAL_STATUSES.has(s)) continue
    const autoS = s as AutoStatus
    if ((PRIORITY[autoS] ?? 0) > PRIORITY[worstStatus]) {
      worstStatus = autoS
    }
  }

  // null quantity treated as 0 (flagged assumption: D-ASUM-01)
  const totalQty = activeStocks.reduce((sum, stock) => sum + (stock.quantity ?? 0), 0)

  return { status: worstStatus, totalQty }
}
