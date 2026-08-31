import { Link } from 'react-router-dom'
import type { Medicine } from '@/lib/db'
import { calculateStatus } from '@/lib/expiry'
import { StatusBadge } from '@/components/StatusBadge'
import { useLang, LOCATION_KEYS, UNIT_KEYS } from '@/i18n'
import { formatDate } from '@/lib/utils'

interface MedicineCardProps {
  catalogId: number
  catalogName: string
  medicine: Medicine
}

// D-11: MedicineCard displays a single stock entry within a catalog context
// Status is computed at render time — never stored in DB (D-12)
export function MedicineCard({ catalogId, catalogName, medicine }: MedicineCardProps) {
  const { lang, t } = useLang()
  const status = calculateStatus(medicine)

  // D-06/D-07: predefined location names are translated; user-created names display as stored
  const locationDisplay =
    medicine.location !== null
      ? (LOCATION_KEYS[medicine.location] ? t(LOCATION_KEYS[medicine.location]) : medicine.location)
      : t('locationNames.other')

  const unitDisplay = t(UNIT_KEYS[medicine.quantityUnit ?? ''] ?? 'units.units')

  return (
    <Link
      to={`/medicines/${catalogId}`}
      className="block bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:border-gray-300 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{catalogName}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {medicine.quantity} {unitDisplay} at {locationDisplay}
          </p>
          {medicine.expiryDate && (
            <p className="text-sm text-gray-500 mt-0.5">
              {t('dates.expires')}: {formatDate(medicine.expiryDate, lang)}
            </p>
          )}
        </div>
        <StatusBadge status={status} />
      </div>
    </Link>
  )
}
