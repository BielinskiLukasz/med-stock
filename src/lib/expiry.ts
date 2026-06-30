import type { Medicine, PAO } from './db'

/** Statuses derived automatically from dates */
export type AutoStatus = 'Active' | 'Opened' | 'Expired'

/** Statuses set manually by the user (stored in DB, take precedence over auto-calculation) */
export type ManualStatus = 'Used Up' | 'Disposed' | 'Archived'

/** Union of all possible medicine statuses */
export type MedicineStatus = AutoStatus | ManualStatus

/**
 * Add a PAO (period-after-opening) duration to a Date, returning a new Date.
 * Does not mutate the input date.
 */
function addPAO(opened: Date, pao: PAO): Date {
  const result = new Date(opened)
  switch (pao.unit) {
    case 'days':
      result.setDate(result.getDate() + pao.value)
      break
    case 'weeks':
      result.setDate(result.getDate() + pao.value * 7)
      break
    case 'months':
      result.setMonth(result.getMonth() + pao.value)
      break
  }
  return result
}

/**
 * Calculate the current status of a medicine.
 *
 * Decision tree (D-11 through D-15):
 * 1. D-13: manual override — if manualStatus is non-null, return it immediately
 * 2. Derive expiry, opened, and paoEnd dates
 * 3. D-14: no expiry date but PAO set — status is Opened/Expired based on PAO alone
 * 4. D-15: opened but no PAO — status is Opened/Expired based on expiry date alone
 * 5. Standard path: check expiry, then PAO, then opened flag, default Active
 *
 * @param med    The Medicine record from the database
 * @param now    Reference date for calculation (defaults to current time)
 * @returns      The derived or manual MedicineStatus
 */
export function calculateStatus(med: Medicine, now: Date = new Date()): MedicineStatus {
  // D-13: Manual override always wins
  if (med.manualStatus !== null) {
    return med.manualStatus as ManualStatus
  }

  // Derive Date objects from stored strings (null-safe)
  const expiry = med.expiryDate ? new Date(med.expiryDate) : null
  const opened = med.openedDate ? new Date(med.openedDate) : null
  const paoEnd = opened && med.pao ? addPAO(opened, med.pao) : null

  // D-14: No expiry date but PAO is set — use PAO window only
  if (!expiry && paoEnd) {
    return now <= paoEnd ? 'Opened' : 'Expired'
  }

  // D-15: Opened but no PAO — skip PAO check, use expiry date only
  if (expiry && opened && !med.pao) {
    return now > expiry ? 'Expired' : 'Opened'
  }

  // Standard path
  if (expiry && now > expiry) return 'Expired'
  if (paoEnd && now > paoEnd) return 'Expired'
  if (opened) return 'Opened'
  return 'Active'
}
