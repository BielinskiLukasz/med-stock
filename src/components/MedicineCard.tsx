import { Link } from 'react-router-dom'
import type { Medicine } from '@/lib/db'
import { calculateStatus } from '@/lib/expiry'
import { StatusBadge } from '@/components/StatusBadge'

interface MedicineCardProps {
  catalogId: number
  catalogName: string
  medicine: Medicine
}

// D-11: MedicineCard displays a single stock entry within a catalog context
// Status is computed at render time — never stored in DB (D-12)
export function MedicineCard({ catalogId, catalogName, medicine }: MedicineCardProps) {
  const status = calculateStatus(medicine)

  return (
    <Link
      to={`/medicines/${catalogId}`}
      className="block bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:border-gray-300 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{catalogName}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {medicine.quantity} {medicine.quantityUnit || 'units'} at {medicine.location ?? 'Other'}
          </p>
          {medicine.expiryDate && (
            <p className="text-sm text-gray-500 mt-0.5">
              Expires: {medicine.expiryDate}
            </p>
          )}
        </div>
        <StatusBadge status={status} />
      </div>
    </Link>
  )
}
