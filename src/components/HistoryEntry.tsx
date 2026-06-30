import type { HistoryEntry as HistoryEntryType } from '@/lib/db'

function formatEntry(entry: HistoryEntryType): string {
  const ts = new Date(entry.timestamp).toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  if (entry.action === 'created') return `${ts} — Medicine added`
  if (entry.action === 'deleted') return `${ts} — Moved to Trash Bin`
  if (entry.action === 'restored') return `${ts} — Restored from Trash Bin`

  // 'updated'
  if (entry.changedFields.length === 1) {
    const { field, oldValue, newValue } = entry.changedFields[0]
    return `${ts} — ${field} changed from "${String(oldValue)}" to "${String(newValue)}"`
  }
  return `${ts} — ${entry.changedFields.length} fields updated`
}

export function HistoryEntry({ entry }: { entry: HistoryEntryType }) {
  return (
    <li className="text-sm text-gray-700 py-1 border-b border-gray-100 last:border-0">
      {formatEntry(entry)}
    </li>
  )
}
