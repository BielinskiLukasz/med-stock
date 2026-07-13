import { useState } from 'react'
import { exportToJSON } from '@/lib/dataOps'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function ExportSection() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      await exportToJSON()
      toast.success('Exported: ' + new Date().toISOString().slice(0, 10))
    } catch (err) {
      toast.error('Failed to export: ' + (err instanceof Error ? err.message : String(err)))
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
        {loading ? 'Exporting...' : 'Export Backup'}
      </Button>
    </div>
  )
}
