// Re-exports from the DB types module
export type { Medicine, Location, PAO, ManualStatus } from '@/lib/db'

// After Plan 02, MedicineStatus/AutoStatus come from @/lib/expiry
export type { MedicineStatus, AutoStatus } from '@/lib/expiry'

// Predefined categories (D-10)
export const CATEGORIES = [
  'Pain & Fever',
  'Antibiotics',
  'Allergy',
  'Digestive',
  'Vitamins & Supplements',
  'Skin & Topical',
  'Eye & Ear',
  'Cold & Flu',
  'Heart & Circulation',
  'Other',
] as const

// Quantity units (D-09)
export const QUANTITY_UNITS = [
  'tablets',
  'capsules',
  'ml',
  'g',
  'pcs',
  'patches',
  'drops',
  'doses',
] as const
