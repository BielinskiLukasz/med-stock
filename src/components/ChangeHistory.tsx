import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { HistoryEntry } from '@/components/HistoryEntry'

export function ChangeHistory({ medicineId }: { medicineId: number }) {
  const [expanded, setExpanded] = useState(false)

  const history = useLiveQuery(
    () =>
      db.history
        .where('medicineId')
        .equals(medicineId)
        .sortBy('timestamp'),
    [medicineId],
  )

  // Load silently — return null while loading
  if (history === undefined) return null

  return (
    <section className="mt-6">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 w-full text-left py-2"
      >
        <span>Change History</span>
        <span className="text-gray-500">({history.length})</span>
        <span className="ml-auto">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        history.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">No history yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-100">
            {history.map(entry => (
              <HistoryEntry key={entry.id} entry={entry} />
            ))}
          </ul>
        )
      )}
    </section>
  )
}
