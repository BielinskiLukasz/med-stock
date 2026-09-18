import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Eye, EyeOff } from 'lucide-react'
import { db } from '@/lib/db'
import {
  addCustomLocation,
  renameLocation,
  toggleLocationHidden,
  countActiveLocationReferences,
  deleteLocationWithReassign,
} from '@/lib/locationOps'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

// Sentinel value for the reassign-target Select's "clear to Other" option — a Radix
// Select item cannot use an empty-string or null value, so this string stands in for
// `location: null` and is translated back to null before calling deleteLocationWithReassign.
const REASSIGN_OTHER = '__OTHER__'

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

  // Delete-with-reassign dialog state (D-09/D-11). `reassignTo === undefined` means
  // "nothing chosen yet" (blocks the confirm button); `null` explicitly means "Other".
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [activeRefCount, setActiveRefCount] = useState(0)
  // `undefined` = nothing chosen yet (blocks confirm); REASSIGN_OTHER = explicit "Other"
  // (Select's controlled `value` prop cannot be `null`, so `null` is never stored here).
  const [reassignTo, setReassignTo] = useState<string | undefined>(undefined)

  async function handleAdd() {
    try {
      await addCustomLocation(addValue)
      setAddValue('')
      setShowAddInput(false)
      setError(null)
    } catch (err) {
      console.error('Failed to add location:', err)
      if (err instanceof Error && err.message === 'Location name already exists') {
        setError(t('locations.errorDuplicate'))
      } else {
        setError(t('locations.errorAdd'))
      }
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
      if (err instanceof Error && err.message === 'Location name already exists') {
        setError(t('locations.errorDuplicate'))
      } else {
        setError(t('locations.errorRename'))
      }
    }
  }

  async function handleToggleHidden(id: number, currentlyHidden: boolean) {
    try {
      await toggleLocationHidden(id, !currentlyHidden)
      setError(null)
    } catch (err) {
      console.error('Failed to toggle location visibility:', err)
      setError(t('locations.errorDelete'))
    }
  }

  async function handleDeleteDialogOpenChange(loc: { id: number; name: string }, open: boolean) {
    if (open) {
      const count = await countActiveLocationReferences(loc.name)
      setActiveRefCount(count)
      setReassignTo(undefined)
      setDeleteTargetId(loc.id)
    } else {
      setDeleteTargetId(null)
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteLocationWithReassign(id, null)
      setError(null)
    } catch (err) {
      console.error('Failed to delete location:', err)
      setError(t('locations.errorDelete'))
    }
  }

  async function handleReassignDelete(id: number) {
    try {
      await deleteLocationWithReassign(id, reassignTo === REASSIGN_OTHER ? null : reassignTo ?? null)
      setDeleteTargetId(null)
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
            maxLength={60}
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

      {locations.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm font-medium">{t('locations.emptyHeading')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('locations.emptyBody')}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {locations.map((loc) => {
            const displayName = LOCATION_KEYS[loc.name] ? t(LOCATION_KEYS[loc.name]) : loc.name
            return (
              <div
                key={loc.id}
                className={`flex items-center justify-between py-2 border-b last:border-0 ${loc.hidden ? 'opacity-60' : ''}`}
              >
                {editingId === loc.id ? (
                  <div className="flex gap-2 flex-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      maxLength={60}
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
                    <span className="text-sm truncate" title={displayName}>
                      {displayName}
                    </span>
                    {loc.hidden && (
                      <span className="text-xs text-muted-foreground ml-2">{t('locations.hidden')}</span>
                    )}
                    <div className="flex gap-2 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={t(loc.hidden ? 'aria.showLocation' : 'aria.hideLocation')}
                        onClick={() => handleToggleHidden(loc.id, loc.hidden)}
                      >
                        {loc.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(loc.id, loc.name)}
                      >
                        {t('locations.edit')}
                      </Button>
                      <AlertDialog
                        open={deleteTargetId === loc.id}
                        onOpenChange={(open) => handleDeleteDialogOpenChange(loc, open)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            {t('form.delete')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          {activeRefCount === 0 ? (
                            <>
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
                            </>
                          ) : (
                            <>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('locations.deleteReassignTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('locations.deleteReassignBody').replace('{n}', String(activeRefCount))}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="py-2">
                                <Label>{t('locations.reassignLabel')}</Label>
                                <Select
                                  value={reassignTo}
                                  onValueChange={(value) => setReassignTo(value)}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {locations
                                      .filter((l) => l.id !== loc.id && !l.hidden)
                                      .map((l) => (
                                        <SelectItem key={l.id} value={l.name}>
                                          {LOCATION_KEYS[l.name] ? t(LOCATION_KEYS[l.name]) : l.name}
                                        </SelectItem>
                                      ))}
                                    <SelectItem value={REASSIGN_OTHER}>
                                      {t('locations.reassignOther')}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
                                <Button
                                  variant="destructive"
                                  disabled={reassignTo === undefined}
                                  onClick={() => handleReassignDelete(loc.id)}
                                >
                                  {t('locations.confirmReassignDelete')}
                                </Button>
                              </AlertDialogFooter>
                            </>
                          )}
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
