import { Link } from 'react-router-dom'
import type { Medicine } from '@/lib/db'
import { calculateStatus } from '@/lib/expiry'
import { StatusBadge } from '@/components/StatusBadge'

interface MedicineCardProps {
  medicine: Medicine
}

export function MedicineCard({ medicine }: MedicineCardProps) {
  // D-11: status computed at render time — never stored in DB (D-12)
  const status = calculateStatus(medicine)

  return (
    <Link
      to={`/medicines/${medicine.id}`}
      className="block bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:border-gray-300 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{medicine.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {medicine.location ?? 'Other'}
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
