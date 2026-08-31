import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Lang } from '@/i18n'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a YYYY-MM-DD date string for display in the active language.
 *
 * EN: returns the stored string as-is.
 * PL: reorders to DD.MM.YYYY via string split — no Intl.DateTimeFormat (D-11).
 * null / undefined: returns the hardcoded no-expiry label for the given lang.
 */
export function formatDate(dateString: string | null | undefined, lang: Lang): string {
  if (!dateString) {
    return lang === 'pl' ? 'Bez daty ważności' : 'No expiry'
  }
  if (lang === 'pl') {
    const [y, m, d] = dateString.split('-')
    return `${d}.${m}.${y}`
  }
  return dateString
}
