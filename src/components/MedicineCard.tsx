import type { Medicine } from '@/lib/db'
import { StatusBadge } from '@/components/StatusBadge'

interface MedicineCardProps {
  medicine: Medicine
  status: string // Plan 03 will wire calculateStatus; using string here for skeleton
}

export function MedicineCard({ medicine, status }: MedicineCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
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
        <StatusBadge status={status as 'Active' | 'Opened' | 'Expired' | 'Used Up' | 'Disposed' | 'Archived'} />
      </div>
    </div>
  )
}
