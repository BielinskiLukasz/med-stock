import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { addCustomLocation, renameLocation, deleteLocation } from '@/lib/locationOps'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function LocationsScreen() {
  const locations = useLiveQuery(() => db.locations.orderBy('name').toArray(), [])

  const [showAddInput, setShowAddInput] = useState(false)
  const [addValue, setAddValue] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    try {
      await addCustomLocation(addValue)
      setAddValue('')
      setShowAddInput(false)
      setError(null)
    } catch (err) {
      console.error('Failed to add location:', err)
      setError('Failed to add location. Name must not be empty.')
    }
  }

  function startEdit(id: number, name: string) {
    setEditingId(id)
    setEditValue(name)
    setError(null)
  }

  async function handleRename(id: number) {
    try {
      await renameLocation(id, editValue)
      setEditingId(null)
      setEditValue('')
      setError(null)
    } catch (err) {
      console.error('Failed to rename location:', err)
      setError('Failed to rename location. Name must not be empty.')
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteLocation(id)
      setError(null)
    } catch (err) {
      console.error('Failed to delete location:', err)
      setError('Failed to delete location.')
    }
  }

  if (!locations) return <div className="p-4">Loading...</div>

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Locations</h1>

      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}

      {showAddInput ? (
        <div className="flex gap-2 mb-4">
          <Input
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            placeholder="Location name"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          />
          <Button onClick={handleAdd} size="sm">Add</Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowAddInput(false); setAddValue('') }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="mb-4"
          onClick={() => { setShowAddInput(true); setError(null) }}
        >
          Add location
        </Button>
      )}

      <div className="space-y-1">
        {locations.map((loc) => (
          <div key={loc.id} className="flex items-center justify-between py-2 border-b last:border-0">
            {editingId === loc.id ? (
              <div className="flex gap-2 flex-1">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRename(loc.id) }}
                />
                <Button size="sm" onClick={() => handleRename(loc.id)}>Save</Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditingId(null); setEditValue('') }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <span className="text-sm">{loc.name}</span>
                {!loc.isDefault && (
                  <div className="flex gap-2 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(loc.id, loc.name)}
                    >
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {loc.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            All medicines using this location will be moved to Other.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(loc.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
