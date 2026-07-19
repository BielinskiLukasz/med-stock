import { useState, useRef } from 'react'
import { importFromJSON, BackupSchema } from '@/lib/dataOps'
import type { BackupData } from '@/lib/dataOps'
import { db } from '@/lib/db'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function ImportJSONSection() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingData, setPendingData] = useState<BackupData | null>(null)
  const [medicineCount, setMedicineCount] = useState(0)
  const [locationCount, setLocationCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset input so the same file can be selected again later
    event.target.value = ''

    try {
      const text = await file.text()

      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        toast.error('Failed to import: Invalid JSON file')
        return
      }

      // Zod schema validation before touching the DB (D-50)
      const result = BackupSchema.safeParse(parsed)
      if (!result.success) {
        toast.error('Failed to import: Schema validation failed')
        return
      }

      // Fetch actual counts from DB for the confirmation dialog (D-48)
      const [mCount, lCount] = await Promise.all([
        db.medicines.count(),
        db.locations.count(),
      ])

      setPendingData(result.data)
      setMedicineCount(mCount)
      setLocationCount(lCount)
      setDialogOpen(true)
    } catch (err) {
      toast.error('Failed to import: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  async function handleConfirmImport() {
    if (!pendingData) return

    setLoading(true)
    try {
      const result = await importFromJSON(pendingData)
      // D-49: exact success toast copy
      toast.success(
        'Imported: ' + result.medicineCount + ' medicines, ' + result.locationCount + ' locations'
      )
      setPendingData(null)
    } catch (err) {
      toast.error('Failed to import: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Restore your inventory from a backup file. This will replace all medicines, locations,
        and history with the contents of the backup.
      </p>
      <Button
        variant="default"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="w-full sm:w-auto"
      >
        Import Backup
      </Button>
      {/* iOS Safari requires <input type="file">; File System Access API is not supported */}
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Controlled AlertDialog — opened programmatically after validation passes (D-48) */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import backup?</AlertDialogTitle>
            <AlertDialogDescription>
              {'This will replace all ' +
                medicineCount +
                ' medicines, ' +
                locationCount +
                ' locations, and full change history. This cannot be undone. Import anyway?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>Import</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
