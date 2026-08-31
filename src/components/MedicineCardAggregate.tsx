import type { Medicine, MedicineCatalog } from '@/lib/db'
import type { MedicineStatus } from '@/lib/expiry'
import { StatusBadge } from '@/components/StatusBadge'
import { useLang, CATEGORY_KEYS, UNIT_KEYS } from '@/i18n'

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
  const { t } = useLang()
  const status = aggregateStatus
  const quantityUnit = nearestExpiryStock?.quantityUnit ?? ''

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{catalog.name}</h3>
        {catalog.category && (
          <p className="text-sm text-gray-500 mt-0.5">
            {t(CATEGORY_KEYS[catalog.category] ?? 'categories.other')}
          </p>
        )}
        <p className="text-sm text-gray-500 mt-0.5">
          {totalQuantity} {t(UNIT_KEYS[quantityUnit] ?? 'units.units')}
          {stockCount > 1 && ` ${t('common.across')} ${stockCount} ${t('common.locations')}`}
        </p>
      </div>
      <StatusBadge status={status} />
    </div>
  )
}
