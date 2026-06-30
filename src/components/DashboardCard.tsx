import { cn } from '@/lib/utils'

interface DashboardCardProps {
  label: string
  count: number
  colorClass?: string
  onTap?: () => void
  interactive?: boolean
}

export function DashboardCard({
  label,
  count,
  colorClass,
  onTap,
  interactive = true,
}: DashboardCardProps) {
  const isInteractive = interactive !== false && onTap !== undefined

  const baseClasses = 'w-full rounded-lg border p-4 text-left shadow-sm'
  const interactiveClasses = isInteractive
    ? 'transition-colors hover:border-gray-300 cursor-pointer'
    : ''

  if (isInteractive) {
    return (
      <button
        onClick={onTap}
        className={cn(baseClasses, interactiveClasses, colorClass)}
      >
        <p className="text-3xl font-bold">{count}</p>
        <p className="text-sm font-medium mt-1">{label}</p>
      </button>
    )
  }

  return (
    <div className={cn(baseClasses, colorClass)}>
      <p className="text-3xl font-bold">{count}</p>
      <p className="text-sm font-medium mt-1">{label}</p>
    </div>
  )
}
