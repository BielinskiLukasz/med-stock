import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { db } from '@/lib/db'
import { MedicineCard } from '@/components/MedicineCard'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/SearchBar'
import { FilterBottomSheet } from '@/components/FilterBottomSheet'
import { FilterChips } from '@/components/FilterChips'
import { useUIStore, useActiveFilterCount, useShallow } from '@/stores/uiStore'
import { calculateStatus } from '@/lib/expiry'
import type { Medicine } from '@/lib/db'

export function MedicineList() {
  const [searchQuery, setSearchQuery] = useState('')

  // Subscribe to filter/sort state — use useShallow for arrays (Pitfall 4)
  const selectedCategories = useUIStore(useShallow((s) => s.selectedCategories))
  const selectedLocations = useUIStore(useShallow((s) => s.selectedLocations))
  const selectedStatuses = useUIStore(useShallow((s) => s.selectedStatuses))
  const { sortField, sortDirection, setFilterSheetOpen } = useUIStore()
  const filterCount = useActiveFilterCount()

  // STEP 1: Dexie reactive query — re-runs when DB data changes OR searchQuery changes
  // D-41 amendment: do NOT use where('deletedAt').equals(null) — null is not a valid IndexedDB key (Pitfall 1)
  // D-11/Pitfall 3: do NOT call calculateStatus() inside the querier
  const medicines = useLiveQuery(
    () => {
      const q = searchQuery.toLowerCase().trim()
      return db.medicines
        .toCollection()
        .filter((m) => {
          if (m.deletedAt !== null) return false // active only (D-25)
          if (q && !m.name.toLowerCase().includes(q)) return false // D-21: substring match
          return true
        })
        .toArray()
    },
    [searchQuery], // re-run only when searchQuery changes; Zustand filter changes handled in useMemo
  )

  // STEP 2: In-memory post-filter for status/category/location (Pitfall 3 guard — calculateStatus at render time)
  const filtered = useMemo(() => {
    if (!medicines) return []
    const now = new Date()
    return medicines
      .filter((m) => {
        const status = calculateStatus(m, now)
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(status)) return false
        if (selectedCategories.length > 0 && !selectedCategories.includes(m.category ?? 'Other'))
          return false
        if (selectedLocations.length > 0 && !selectedLocations.includes(m.location ?? 'Other'))
          return false
        return true
      })
      .sort((a, b) => {
        const dir = sortDirection === 'asc' ? 1 : -1
        const va = String((a[sortField as keyof Medicine] as string | number | null) ?? '')
        const vb = String((b[sortField as keyof Medicine] as string | number | null) ?? '')
        return va.localeCompare(vb) * dir
      })
  }, [medicines, selectedStatuses, selectedCategories, selectedLocations, sortField, sortDirection])

  if (medicines === undefined) {
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
      {filtered.length === 0 && searchQuery === '' && filterCount === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-gray-500">
            No medicines yet. Tap + to add your first medicine.
          </p>
          <Button asChild>
            <Link to="/medicines/new">Add Medicine</Link>
          </Button>
        </div>
      ) : filtered.length === 0 && searchQuery !== '' ? (
        /* Empty state: search returned no results */
        <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="text-gray-500">No medicines match your search.</p>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state: filters returned no results */
        <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="text-gray-500">No medicines match your filters.</p>
        </div>
      ) : (
        /* D-22: Search results use existing MedicineCard component */
        <div className="px-4 space-y-3">
          {/* D-11: calculateStatus() computed inside MedicineCard at render time */}
          {filtered.map((med) => (
            <MedicineCard key={med.id} medicine={med} />
          ))}
        </div>
      )}

      {/* D-29: FilterBottomSheet manages its own open state via Zustand */}
      <FilterBottomSheet />
    </div>
  )
}
