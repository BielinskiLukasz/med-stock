import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { db } from '@/lib/db'
import type { Medicine, MedicineCatalog } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/SearchBar'
import { FilterBottomSheet } from '@/components/FilterBottomSheet'
import { FilterChips } from '@/components/FilterChips'
import { MedicineCardAggregate } from '@/components/MedicineCardAggregate'
import { useUIStore, useActiveFilterCount, useShallow } from '@/stores/uiStore'
import { computeCatalogAggregate } from '@/lib/aggregation'

export function MedicineList() {
  const [searchQuery, setSearchQuery] = useState('')

  // Subscribe to filter/sort state — use useShallow for arrays (Pitfall 4)
  const selectedCategories = useUIStore(useShallow((s) => s.selectedCategories))
  const selectedLocations = useUIStore(useShallow((s) => s.selectedLocations))
  const selectedStatuses = useUIStore(useShallow((s) => s.selectedStatuses))
  const { sortField, sortDirection, setFilterSheetOpen } = useUIStore()
  const filterCount = useActiveFilterCount()

  // STEP 1: Query catalogs (D-01: catalog-first join)
  const catalogs = useLiveQuery(() => db.medicine_catalog.toArray(), [])

  // STEP 2: Query active stock entries for all catalogs
  const activeStock = useLiveQuery(
    () => db.medicines
      .toCollection()
      .filter((m) => m.deletedAt === null)
      .toArray(),
    []
  )

  // STEP 3: In-memory join and aggregation (D-01: per-catalog nearest-expiry status + total quantity)
  interface CatalogWithStock {
    catalog: MedicineCatalog
    stockEntries: Medicine[]
    nearestExpiryStock: Medicine | null
    aggregateStatus: string
    totalQuantity: number
    locations: string[]
  }

  const filtered = useMemo(() => {
    if (!catalogs || !activeStock) return [] as CatalogWithStock[]

    const q = searchQuery.toLowerCase().trim()

    // Build catalog + aggregates
    return catalogs
      .map(catalog => {
        // Get all active stock entries for this catalog
        const stockForCatalog = activeStock.filter(s => s.catalogId === catalog.id)

        // Use shared aggregation function for status + totalQty (D-01)
        const { status: aggregateStatus, totalQty: totalQuantity } = computeCatalogAggregate(catalog, stockForCatalog)

        // Find nearest-expiry stock (needed for card display)
        const nearestExpiryStock = stockForCatalog.reduce<Medicine | null>((nearest, current) => {
          if (!current.expiryDate) return nearest
          if (!nearest?.expiryDate) return current
          return current.expiryDate < nearest.expiryDate ? current : nearest
        }, null)

        // Get unique locations
        const locations = [...new Set(stockForCatalog.map(s => s.location ?? 'Other'))]

        return {
          catalog,
          stockEntries: stockForCatalog,
          nearestExpiryStock,
          aggregateStatus,
          totalQuantity,
          locations,
        }
      })
      .filter(item => {
        // Filter by search query (catalog name)
        if (q && !item.catalog.name.toLowerCase().includes(q)) return false
        return item.stockEntries.length > 0 // only show catalogs with active stock
      })
      .filter(item => {
        // Filter by selected statuses
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(item.aggregateStatus)) return false
        return true
      })
      .filter(item => {
        // Filter by selected categories
        if (selectedCategories.length > 0 && !selectedCategories.includes(item.catalog.category ?? 'Other')) return false
        return true
      })
      .filter(item => {
        // Filter by selected locations (match-any semantics: catalog has stock in selected location)
        if (selectedLocations.length > 0) {
          const hasLocation = item.locations.some(loc => selectedLocations.includes(loc))
          if (!hasLocation) return false
        }
        return true
      })
      .sort((a, b) => {
        const dir = sortDirection === 'asc' ? 1 : -1

        let va: string | number = ''
        let vb: string | number = ''

        if (sortField === 'name') {
          va = a.catalog.name
          vb = b.catalog.name
        } else if (sortField === 'category') {
          va = a.catalog.category ?? 'Other'
          vb = b.catalog.category ?? 'Other'
        } else if (sortField === 'expiryDate') {
          va = a.nearestExpiryStock?.expiryDate ?? ''
          vb = b.nearestExpiryStock?.expiryDate ?? ''
        } else if (sortField === 'status') {
          va = a.aggregateStatus
          vb = b.aggregateStatus
        }

        return String(va).localeCompare(String(vb)) * dir
      })
  }, [catalogs, activeStock, searchQuery, selectedStatuses, selectedCategories, selectedLocations, sortField, sortDirection])

  if (catalogs === undefined || activeStock === undefined) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* D-20: SearchBar permanently visible at top — first element on Medicines screen */}
      <div className="px-4 pt-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search medicines by name…"
        />
      </div>

      {/* D-30: Dismissible filter chips above medicine list */}
      <FilterChips />

      {/* Page header with filter icon */}
      <div className="flex justify-between items-center px-4 py-3">
        <h1 className="text-xl font-semibold">Medicines</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterSheetOpen(true)}
            className="relative flex items-center gap-1 rounded-md p-2 text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="h-5 w-5" />
            {/* D-29: filter badge showing active filter count */}
            {filterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {filterCount}
              </span>
            )}
          </button>
          <Button asChild size="sm">
            <Link to="/medicines/new">Add</Link>
          </Button>
        </div>
      </div>

      {/* Empty state: no medicines at all (initial state) */}
      {(filtered ?? []).length === 0 && searchQuery === '' && filterCount === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-gray-500">
            No medicines yet. Tap + to add your first medicine.
          </p>
          <Button asChild>
            <Link to="/medicines/new">Add Medicine</Link>
          </Button>
        </div>
      ) : (filtered ?? []).length === 0 && searchQuery !== '' ? (
        /* Empty state: search returned no results */
        <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="text-gray-500">No medicines match your search.</p>
        </div>
      ) : (filtered ?? []).length === 0 ? (
        /* Empty state: filters returned no results */
        <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="text-gray-500">No medicines match your filters.</p>
        </div>
      ) : (
        /* D-01: Search results render catalog cards with aggregate data */
        <div className="px-4 space-y-3">
          {(filtered ?? []).map((item) => (
            <Link
              key={item.catalog.id}
              to={`/medicines/${item.catalog.id}`}
              className="block bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:border-gray-300 transition-colors"
            >
              <MedicineCardAggregate
                catalog={item.catalog}
                nearestExpiryStock={item.nearestExpiryStock}
                totalQuantity={item.totalQuantity}
                stockCount={item.stockEntries.length}
              />
            </Link>
          ))}
        </div>
      )}

      {/* D-29: FilterBottomSheet manages its own open state via Zustand */}
      <FilterBottomSheet />
    </div>
  )
}
