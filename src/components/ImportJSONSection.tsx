import { useState, useRef } from 'react'
import { importFromJSON, BackupSchema } from '@/lib/dataOps'
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
import { useLang } from '@/i18n'

export function ImportJSONSection() {
  const { t } = useLang()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingRaw, setPendingRaw] = useState<unknown | null>(null)
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
        toast.error(t('toasts.importFailed'))
        return
      }

      // Zod schema validation before showing the dialog (D-50); passes for both old and new format
      const schemaCheck = BackupSchema.safeParse(parsed)
      if (!schemaCheck.success) {
        toast.error(t('toasts.importFailed'))
        return
      }

      // Fetch actual counts from DB for the confirmation dialog (D-48)
      const [mCount, lCount] = await Promise.all([
        db.medicines.count(),
        db.locations.count(),
      ])

      setPendingRaw(parsed)
      setMedicineCount(mCount)
      setLocationCount(lCount)
      setDialogOpen(true)
    } catch (err) {
      console.error('Failed to read file:', err)
      toast.error(t('toasts.importFailed'))
    }
  }

  async function handleConfirmImport() {
    if (!pendingRaw) return

    setLoading(true)
    try {
      await importFromJSON(pendingRaw)
      toast.success(t('toasts.imported'))
      setPendingRaw(null)
    } catch (err) {
      console.error('Failed to import:', err)
      toast.error(t('toasts.importFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t('data.importJSONDescription')}</p>
      <Button
        variant="default"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="w-full sm:w-auto"
      >
        {t('data.importJSONButton')}
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
            <AlertDialogTitle>{t('data.importConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('data.importConfirmBodyPre')}{medicineCount}{t('data.importConfirmBodyMid')}{locationCount}{t('data.importConfirmBodyPost')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>{t('data.importConfirmAction')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
