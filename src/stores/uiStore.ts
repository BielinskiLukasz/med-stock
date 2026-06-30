import { create } from 'zustand'
import { shallow } from 'zustand/shallow'
import { useShallow } from 'zustand/react/shallow'

export type SortField = 'name' | 'expiryDate' | 'category'
export type SortDirection = 'asc' | 'desc'

interface UIState {
  // --- Existing (Phase 1) ---
  locationDialogOpen: boolean
  setLocationDialogOpen: (open: boolean) => void

  // --- New: filter/sort state (D-31) ---
  selectedCategories: string[]
  selectedLocations: string[]
  selectedStatuses: string[]
  sortField: SortField
  sortDirection: SortDirection
  filterSheetOpen: boolean

  toggleCategory: (value: string) => void
  toggleLocation: (value: string) => void
  toggleStatus: (value: string) => void
  setSort: (field: SortField, direction: SortDirection) => void
  clearAllFilters: () => void
  setFilterSheetOpen: (open: boolean) => void
}

// CRITICAL: Zustand v5 requires curried form create<T>()(...) for TypeScript (Pitfall 7)
export const useUIStore = create<UIState>()((set) => ({
  locationDialogOpen: false,
  setLocationDialogOpen: (open) => set({ locationDialogOpen: open }),

  selectedCategories: [],
  selectedLocations: [],
  selectedStatuses: [],
  sortField: 'name',
  sortDirection: 'asc',
  filterSheetOpen: false,

  toggleCategory: (value) =>
    set((s) => ({
      selectedCategories: s.selectedCategories.includes(value)
        ? s.selectedCategories.filter((v) => v !== value)
        : [...s.selectedCategories, value],
    })),
  toggleLocation: (value) =>
    set((s) => ({
      selectedLocations: s.selectedLocations.includes(value)
        ? s.selectedLocations.filter((v) => v !== value)
        : [...s.selectedLocations, value],
    })),
  toggleStatus: (value) =>
    set((s) => ({
      selectedStatuses: s.selectedStatuses.includes(value)
        ? s.selectedStatuses.filter((v) => v !== value)
        : [...s.selectedStatuses, value],
    })),
  setSort: (field, direction) => set({ sortField: field, sortDirection: direction }),
  clearAllFilters: () =>
    set({ selectedCategories: [], selectedLocations: [], selectedStatuses: [] }),
  setFilterSheetOpen: (open) => set({ filterSheetOpen: open }),
}))

// Derived selector — badge count for filter icon (D-29)
export const useActiveFilterCount = () =>
  useUIStore(
    (s) =>
      s.selectedCategories.length +
      s.selectedLocations.length +
      s.selectedStatuses.length,
  )

// Re-export shallow and useShallow for consumers of array state
// Note: In Zustand v5, use useShallow(selector) wrapper instead of useStore(selector, shallow)
// Pattern: useUIStore(useShallow(s => s.selectedCategories))
export { shallow, useShallow }
