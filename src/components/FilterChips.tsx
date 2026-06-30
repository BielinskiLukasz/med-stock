import { useUIStore, useShallow } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'

export function FilterChips() {
  // Use useShallow to avoid re-renders when array reference changes (Pitfall 4 — Zustand v5)
  const selectedCategories = useUIStore(useShallow((s) => s.selectedCategories))
  const selectedLocations = useUIStore(useShallow((s) => s.selectedLocations))
  const selectedStatuses = useUIStore(useShallow((s) => s.selectedStatuses))
  const { toggleCategory, toggleLocation, toggleStatus } = useUIStore()

  const all = [
    ...selectedCategories.map((v) => ({
      label: `Category: ${v}`,
      remove: () => toggleCategory(v),
    })),
    ...selectedLocations.map((v) => ({
      label: `Location: ${v}`,
      remove: () => toggleLocation(v),
    })),
    ...selectedStatuses.map((v) => ({
      label: `Status: ${v}`,
      remove: () => toggleStatus(v),
    })),
  ]

  if (all.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {all.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
        >
          {chip.label}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 ml-1"
            onClick={chip.remove}
            aria-label={`Remove ${chip.label}`}
          >
            ×
          </Button>
        </span>
      ))}
    </div>
  )
}
