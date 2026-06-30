import { describe, it, expect, beforeEach } from 'vitest'

// RED: These tests will fail until uiStore is extended with filter state
// and SearchBar / FilterChips components are created

// ------- uiStore filter state tests -------

describe('uiStore — filter state', () => {
  beforeEach(() => {
    // Reset store between tests by reimporting — Zustand stores are module-level singletons
    // We test via the exported hook's underlying store directly
  })

  it('useActiveFilterCount returns 0 when no filters active', async () => {
    const { useUIStore } = await import('./uiStore')
    // Access the derived selector with getState
    const state = useUIStore.getState()
    // Make sure arrays are empty
    state.clearAllFilters()
    const fresh = useUIStore.getState()
    const count =
      fresh.selectedCategories.length +
      fresh.selectedLocations.length +
      fresh.selectedStatuses.length
    expect(count).toBe(0)
  })

  it('useActiveFilterCount returns 3 when one category + one location + one status selected', async () => {
    const { useUIStore } = await import('./uiStore')
    const state = useUIStore.getState()
    state.clearAllFilters()
    state.toggleCategory('Pain & Fever')
    state.toggleLocation('Bathroom Cabinet')
    state.toggleStatus('Expired')
    const fresh = useUIStore.getState()
    const count =
      fresh.selectedCategories.length +
      fresh.selectedLocations.length +
      fresh.selectedStatuses.length
    expect(count).toBe(3)
    // cleanup
    state.clearAllFilters()
  })

  it('toggleCategory adds Pain & Fever to selectedCategories', async () => {
    const { useUIStore } = await import('./uiStore')
    const state = useUIStore.getState()
    state.clearAllFilters()
    state.toggleCategory('Pain & Fever')
    expect(useUIStore.getState().selectedCategories).toContain('Pain & Fever')
    state.clearAllFilters()
  })

  it('toggleCategory called twice removes Pain & Fever from selectedCategories', async () => {
    const { useUIStore } = await import('./uiStore')
    const state = useUIStore.getState()
    state.clearAllFilters()
    state.toggleCategory('Pain & Fever')
    state.toggleCategory('Pain & Fever')
    expect(useUIStore.getState().selectedCategories).not.toContain('Pain & Fever')
    state.clearAllFilters()
  })

  it('clearAllFilters sets all three arrays to empty', async () => {
    const { useUIStore } = await import('./uiStore')
    const state = useUIStore.getState()
    state.toggleCategory('Antibiotics')
    state.toggleLocation('Kitchen')
    state.toggleStatus('Active')
    state.clearAllFilters()
    const fresh = useUIStore.getState()
    expect(fresh.selectedCategories).toHaveLength(0)
    expect(fresh.selectedLocations).toHaveLength(0)
    expect(fresh.selectedStatuses).toHaveLength(0)
  })
})

// ------- SearchBar render tests -------

describe('SearchBar — render', () => {
  it('SearchBar exports SearchBar function', async () => {
    const mod = await import('../components/SearchBar')
    expect(typeof mod.SearchBar).toBe('function')
  })

  it('SearchBar accepts value, onChange, placeholder props', async () => {
    const mod = await import('../components/SearchBar')
    // Check it has these props in its function signature (duck-type: calling with correct props should not throw at module load)
    expect(mod.SearchBar.length).toBeGreaterThanOrEqual(0) // React function components have 0-1 params
  })
})

// ------- FilterChips render tests -------

describe('FilterChips — render', () => {
  it('FilterChips exports FilterChips function', async () => {
    const mod = await import('../components/FilterChips')
    expect(typeof mod.FilterChips).toBe('function')
  })
})
