// Re-exports from the DB types module
export type { Medicine, Location, PAO, ManualStatus } from '@/lib/db'

// MedicineStatus is defined here as Plan 02 will create src/lib/expiry.ts.
// TODO: After Plan 02, replace these with: export type { MedicineStatus, AutoStatus } from '@/lib/expiry'
export type AutoStatus = 'Active' | 'Opened' | 'Expired'
export type MedicineStatus = AutoStatus | 'Used Up' | 'Disposed' | 'Archived'

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
