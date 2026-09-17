import type { HistoryEntry as HistoryEntryType } from '@/lib/db'
import { useLang, HISTORY_FIELD_KEYS } from '@/i18n'
import type { Lang } from '@/i18n'

function displayValue(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function formatEntry(
  entry: HistoryEntryType,
  t: (key: string) => string,
  lang: Lang,
): string {
  const locale = lang === 'pl' ? 'pl-PL' : 'en-GB'
  const ts = new Date(entry.timestamp).toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  if (entry.action === 'created') return `${ts} — ${t('history.added')}`
  if (entry.action === 'deleted') return `${ts} — ${t('history.deleted')}`
  if (entry.action === 'restored') return `${ts} — ${t('history.restored')}`

  // 'updated'
  if (entry.changedFields.length === 1) {
    const { field, oldValue, newValue } = entry.changedFields[0]
    const label = t(HISTORY_FIELD_KEYS[field] ?? field)
    return `${ts} — ${label} ${t('history.fieldChanged')}: "${displayValue(oldValue)}" → "${displayValue(newValue)}"`
  }
  return `${ts} — ${entry.changedFields.length} ${t('history.fieldsUpdated')}`
}

export function HistoryEntry({ entry }: { entry: HistoryEntryType }) {
  const { t, lang } = useLang()
  return (
    <li className="text-sm text-gray-700 py-1 border-b border-gray-100 last:border-0">
      {formatEntry(entry, t, lang)}
    </li>
  )
}
