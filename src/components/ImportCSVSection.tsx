import { useState, useRef } from 'react'
import type Papa from 'papaparse'
import { parseCSVFile, mergeCSVRowsToMedicines, SKIP_VALUE } from '@/lib/csvOps'
import { db } from '@/lib/db'
import { CSVColumnMapper } from '@/components/CSVColumnMapper'
import { CSVPreview } from '@/components/CSVPreview'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useLang } from '@/i18n'

type CSVStep = 'idle' | 'mapping' | 'preview' | 'committing'

export function ImportCSVSection() {
  const { t } = useLang()
  const [step, setStep] = useState<CSVStep>('idle')
  const [parseResult, setParseResult] = useState<Papa.ParseResult<Record<string, string>> | null>(null)
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset input for re-selection of same file
    event.target.value = ''

    try {
      const result = await parseCSVFile(file)

      if (result.errors.length > 0 && result.data.length === 0) {
        toast.error(t('toasts.importFailed'))
        return
      }

      setParseResult(result)

      // Build initial mapping: all columns default to SKIP_VALUE
      const headers =
        result.meta.fields ?? Object.keys(result.data[0] ?? {})
      const initialMapping: Record<string, string> = {}
      headers.forEach((h) => {
        initialMapping[h] = SKIP_VALUE
      })
      setColumnMapping(initialMapping)

      setStep('mapping')
    } catch (err) {
      console.error('Failed to parse CSV:', err)
      toast.error(t('toasts.importFailed'))
    }
  }

  async function handleCommit() {
    if (!parseResult) return

    // CR-05: validate that the placeholder catalogId=1 exists before import.
    // CSV import currently assigns all medicines to catalogId=1. If that catalog
    // does not exist (e.g., first catalog was deleted and auto-increment is at 2+),
    // the import would create broken foreign keys. Fail early with a clear message.
    const targetCatalog = await db.medicine_catalog.get(1)
    if (!targetCatalog) {
      toast.error(
        'CSV import requires at least one medicine catalog. Please add a medicine first, then retry the import.'
      )
      return
    }

    setStep('committing')

    try {
      const { medicines, skippedCount } = mergeCSVRowsToMedicines(
        parseResult.data,
        columnMapping
      )

      // APPEND only — do NOT clear the table (D-53 vs D-47 asymmetry)
      await db.medicines.bulkAdd(medicines)

      if (skippedCount > 0) {
        toast.warning(t('toasts.importPartial'))
      } else {
        toast.success(t('toasts.imported'))
      }

      setStep('idle')
      setParseResult(null)
      setColumnMapping({})
    } catch (err) {
      console.error('Failed to commit CSV import:', err)
      toast.error(t('toasts.importFailed'))
      // Return to preview so user can retry
      setStep('preview')
    }
  }

  function handleCancel() {
    setStep('idle')
    setParseResult(null)
    setColumnMapping({})
  }

  // Detect headers from parse result
  const headers = parseResult
    ? (parseResult.meta.fields ?? Object.keys(parseResult.data[0] ?? {}))
    : []

  if (step === 'idle') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Bulk import medicines from a CSV spreadsheet. Map your spreadsheet
          columns to medicine fields, preview the data, and commit.
        </p>
        <Button
          variant="default"
          onClick={() => fileInputRef.current?.click()}
          className="w-full sm:w-auto"
        >
          {t('data.importCSVSpreadsheet')}
        </Button>
        {/* iOS Safari fallback: use <input type="file">, not File System Access API */}
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    )
  }

  if (step === 'mapping') {
    return (
      <CSVColumnMapper
        headers={headers}
        mapping={columnMapping}
        onMappingChange={setColumnMapping}
        onPreview={() => setStep('preview')}
        onCancel={handleCancel}
      />
    )
  }

  if (step === 'preview') {
    return (
      <CSVPreview
        rows={parseResult?.data ?? []}
        mapping={columnMapping}
        onCommit={handleCommit}
        onBack={() => setStep('mapping')}
        onCancel={handleCancel}
        loading={false}
      />
    )
  }

  // step === 'committing': reuse CSVPreview with loading=true
  return (
    <CSVPreview
      rows={parseResult?.data ?? []}
      mapping={columnMapping}
      onCommit={handleCommit}
      onBack={() => setStep('mapping')}
      onCancel={handleCancel}
      loading={true}
    />
  )
}
