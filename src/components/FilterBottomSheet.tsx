import { useLiveQuery } from 'dexie-react-hooks'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useUIStore, useShallow } from '@/stores/uiStore'
import type { SortField, SortDirection } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'
import type { MedicineStatus } from '@/lib/expiry'
import { useLang, CATEGORY_KEYS } from '@/i18n'
import { CATEGORIES } from '@/types/medicine'

const ALL_STATUSES: MedicineStatus[] = [
  'Active',
  'Opened',
  'Expired',
  'ExceededOpenPeriod',
  'UsedUp',
  'Disposed',
  'Archived',
]

const statusKey: Record<MedicineStatus, string> = {
  Active: 'status.active',
  Opened: 'status.opened',
  Expired: 'status.expired',
  ExceededOpenPeriod: 'status.exceededOpenPeriod',
  UsedUp: 'status.usedUp',
  Disposed: 'status.disposed',
  Archived: 'status.archived',
}

export function FilterBottomSheet() {
  const { t } = useLang()

  const {
    filterSheetOpen,
    setFilterSheetOpen,
    clearAllFilters,
    setSort,
    sortField,
    sortDirection,
    toggleCategory,
    toggleLocation,
    toggleStatus,
  } = useUIStore()

  // Use useShallow to avoid re-renders when array reference changes (Pitfall 4 — Zustand v5)
  const selectedCategories = useUIStore(useShallow((s) => s.selectedCategories))
  const selectedLocations = useUIStore(useShallow((s) => s.selectedLocations))
  const selectedStatuses = useUIStore(useShallow((s) => s.selectedStatuses))

  const locations = useLiveQuery(() => db.locations.orderBy('name').toArray(), [])

  function handleSortField(field: SortField) {
    setSort(field, sortDirection)
  }

  function handleSortDirection(direction: SortDirection) {
    setSort(sortField, direction)
  }

  return (
    <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-xl px-4 pb-6">
        <SheetHeader>
          <SheetTitle>{t('filter.title')}</SheetTitle>
        </SheetHeader>

        {/* Status filter */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">{t('filter.byStatusLabel')}</h3>
          <div className="flex flex-wrap gap-2">
            {ALL_STATUSES.map((status) => {
              const isSelected = selectedStatuses.includes(status)
              return (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {isSelected && <span className="mr-1">&#10003;</span>}
                  {t(statusKey[status])}
                </button>
              )
            })}
          </div>
        </div>

        {/* Category filter */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">{t('filter.byCategoryLabel')}</h3>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategories.includes(category)
              return (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {isSelected && <span className="mr-1">&#10003;</span>}
                  {t(CATEGORY_KEYS[category] ?? 'categories.other')}
                </button>
              )
            })}
          </div>
        </div>

        {/* Location filter */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">{t('filter.byLocationLabel')}</h3>
          <div className="flex flex-wrap gap-2">
            {locations?.map((location) => {
              const isSelected = selectedLocations.includes(location.name)
              return (
                <button
                  key={location.id}
                  onClick={() => toggleLocation(location.name)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {isSelected && <span className="mr-1">&#10003;</span>}
                  {location.name}
                </button>
              )
            })}
            {locations?.length === 0 && (
              <p className="text-xs text-gray-500">No locations added yet.</p>
            )}
          </div>
        </div>

        {/* Sort section */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">{t('filter.sortBy')}</h3>
          <div className="flex gap-2 flex-wrap">
            {(['name', 'expiryDate', 'category'] as SortField[]).map((field) => (
              <button
                key={field}
                onClick={() => handleSortField(field)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  sortField === field
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                }`}
              >
                {field === 'name'
                  ? t('filter.byName')
                  : field === 'expiryDate'
                    ? t('filter.byExpiry')
                    : t('filter.byCategoryLabel')}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleSortDirection('asc')}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                sortDirection === 'asc'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              {t('filter.asc')}
            </button>
            <button
              onClick={() => handleSortDirection('desc')}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                sortDirection === 'desc'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              {t('filter.desc')}
            </button>
          </div>
        </div>

        {/* Clear all */}
        <div className="mt-6">
          <Button variant="outline" className="w-full" onClick={clearAllFilters}>
            {t('filter.clearAll')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
