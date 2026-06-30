import { create } from 'zustand'

interface UIState {
  locationDialogOpen: boolean
  setLocationDialogOpen: (open: boolean) => void
}

// CRITICAL: Zustand v5 requires curried form create<T>()(...) for TypeScript (Pitfall 7)
export const useUIStore = create<UIState>()((set) => ({
  locationDialogOpen: false,
  setLocationDialogOpen: (open) => set({ locationDialogOpen: open }),
}))
