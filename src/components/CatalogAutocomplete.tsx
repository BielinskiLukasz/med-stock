import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { MedicineCatalog } from '@/lib/db'
import { Input } from '@/components/ui/input'

interface CatalogAutocompleteProps {
  onSelect: (catalog: MedicineCatalog) => void
  onCreateClick: (typedName: string) => void
}

export function CatalogAutocomplete({ onSelect, onCreateClick }: CatalogAutocompleteProps) {
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)

  // Load all catalogs on mount (D-07: show all on focus, no char delay)
  const allCatalogs = useLiveQuery(() => db.medicine_catalog.toArray(), [])

  const filtered = (allCatalogs ?? []).filter((cat) =>
    cat.name.toLowerCase().includes(searchText.toLowerCase())
  )

  // "Create [name]" appears when search has text but 0 matches (D-08)
  const shouldShowCreate = searchText.trim().length > 0 && filtered.length === 0

  function handleBlur() {
    // Delay so button onClick fires before dropdown closes
    setTimeout(() => setOpen(false), 150)
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Select or Create Medicine</h2>

      <div className="space-y-2 relative">
        <Input
          placeholder="Start typing a medicine name…"
          value={searchText}
          autoFocus
          autoComplete="off"
          onChange={(e) => setSearchText(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
          }}
        />

        {open && (
          <div className="absolute left-0 right-0 border rounded-md bg-white shadow-md z-10">
            {/* Existing catalog matches */}
            {filtered.length > 0 && (
              <div className="max-h-64 overflow-y-auto">
                {filtered.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault() // Prevent blur from firing before click
                      onSelect(cat)
                      setOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-sm"
                  >
                    <span className="font-medium">{cat.name}</span>
                    {cat.category && (
                      <span className="ml-2 text-gray-500 text-xs">{cat.category}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Empty state when focused but no text and no catalogs */}
            {!searchText && filtered.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-500">No medicines yet. Type a name to create one.</p>
            )}

            {/* "Create [name]" when no matches (D-08) */}
            {shouldShowCreate && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onCreateClick(searchText)
                  setOpen(false)
                }}
                className="w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors text-sm"
              >
                Create "{searchText}"
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
