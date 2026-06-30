import type { MedicineStatus } from '@/lib/expiry'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<MedicineStatus, string> = {
  Active: 'bg-green-100 text-green-800',
  Opened: 'bg-blue-100 text-blue-800',
  Expired: 'bg-red-100 text-red-800',
  'Used Up': 'bg-gray-100 text-gray-600',
  Disposed: 'bg-gray-100 text-gray-600',
  Archived: 'bg-yellow-100 text-yellow-800',
}

export function StatusBadge({ status }: { status: MedicineStatus }) {
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded-full text-xs font-medium',
        STATUS_STYLES[status],
      )}
    >
      {status}
    </span>
  )
}
