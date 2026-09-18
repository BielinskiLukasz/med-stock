import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { addCustomLocation, renameLocation, deleteLocationWithReassign } from '@/lib/locationOps'
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
import { useLang, LOCATION_KEYS } from '@/i18n'

export function LocationsScreen() {
  const { t } = useLang()
  // 'order' is intentionally not an indexed field (matches the non-indexed precedent
  // for packCount in v5) — orderBy() requires an index and throws SchemaError on a
  // non-indexed keyPath, so sort via toCollection().sortBy() instead (Rule 1 fix).
  const locations = useLiveQuery(() => db.locations.toCollection().sortBy('order'), [])

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
      setError(t('locations.errorAdd'))
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
      setError(t('locations.errorRename'))
    }
  }

  async function handleDelete(id: number) {
    try {
      // Plan 08-04 replaces this with the full reassign-or-clear picker (D-09); until
      // then, this screen keeps the pre-existing "clear to null" behavior and stays
      // isDefault-guarded above (deleteLocationWithReassign itself has no such guard).
      await deleteLocationWithReassign(id, null)
      setError(null)
    } catch (err) {
      console.error('Failed to delete location:', err)
      setError(t('locations.errorDelete'))
    }
  }

  if (!locations) return <div className="p-4">{t('common.loading')}</div>

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">{t('locations.title')}</h1>

      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}

      {showAddInput ? (
        <div className="flex gap-2 mb-4">
          <Input
            id="new-location-name"
            name="new-location-name"
            autoComplete="off"
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            placeholder={t('locations.namePlaceholder')}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          />
          <Button onClick={handleAdd} size="sm">{t('locations.add')}</Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowAddInput(false); setAddValue('') }}
          >
            {t('form.cancel')}
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="mb-4"
          onClick={() => { setShowAddInput(true); setError(null) }}
        >
          {t('form.addLocation')}
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
                <Button size="sm" onClick={() => handleRename(loc.id)}>{t('form.save')}</Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditingId(null); setEditValue('') }}
                >
                  {t('form.cancel')}
                </Button>
              </div>
            ) : (
              <>
                {/* D-07: predefined names shown translated, user-created names shown as stored */}
                <span className="text-sm">
                  {LOCATION_KEYS[loc.name] ? t(LOCATION_KEYS[loc.name]) : loc.name}
                </span>
                <div className="flex gap-2 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(loc.id, loc.name)}
                  >
                    {t('locations.edit')}
                  </Button>
                  {/* Plan 08-04 replaces this delete block with the reassign-or-clear flow
                      and removes the isDefault guard permanently — deliberate incremental step. */}
                  {!loc.isDefault && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          {t('form.delete')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('locations.deleteConfirmTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('locations.deleteConfirmBody')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(loc.id)}>
                            {t('form.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
