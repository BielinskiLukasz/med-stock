import type { Medicine, MedicineCatalog } from '@/lib/db'
import type { MedicineStatus } from '@/lib/expiry'
import { StatusBadge } from '@/components/StatusBadge'

interface MedicineCardAggregateProps {
  catalog: MedicineCatalog
  nearestExpiryStock: Medicine | null
  totalQuantity: number
  stockCount: number
  aggregateStatus: MedicineStatus
}

export function MedicineCardAggregate({
  catalog,
  nearestExpiryStock,
  totalQuantity,
  stockCount,
  aggregateStatus,
}: MedicineCardAggregateProps) {
  const status = aggregateStatus
  const quantityUnit = nearestExpiryStock?.quantityUnit ?? 'units'

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{catalog.name}</h3>
        {catalog.category && (
          <p className="text-sm text-gray-500 mt-0.5">{catalog.category}</p>
        )}
        <p className="text-sm text-gray-500 mt-0.5">
          {totalQuantity} {quantityUnit}
          {stockCount > 1 && ` across ${stockCount} locations`}
        </p>
      </div>
      <StatusBadge status={status} />
    </div>
  )
}
