import { useState } from 'react'
import { exportToJSON } from '@/lib/dataOps'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useLang } from '@/i18n'

export function ExportSection() {
  const { t } = useLang()
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      await exportToJSON()
      toast.success(t('toasts.exported'))
    } catch (err) {
      console.error('Failed to export:', err)
      toast.error(t('toasts.exportFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Download your entire inventory as a JSON file. You can restore this backup on another
        device or share it with household members.
      </p>
      <Button
        variant="default"
        onClick={handleExport}
        disabled={loading}
        className="w-full sm:w-auto"
      >
        {loading ? t('data.exporting') : t('data.exportButton')}
      </Button>
    </div>
  )
}
