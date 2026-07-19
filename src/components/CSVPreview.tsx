import { SKIP_VALUE } from '@/lib/csvOps'
import { Button } from '@/components/ui/button'

interface CSVPreviewProps {
  rows: Record<string, string>[]
  mapping: Record<string, string>
  onCommit: () => void
  onBack: () => void
  onCancel: () => void
  loading: boolean
}

export function CSVPreview({
  rows,
  mapping,
  onCommit,
  onBack,
  onCancel,
  loading,
}: CSVPreviewProps) {
  // Array of [csvHeader, fieldName] pairs, excluding skipped columns
  const mappedFields = Object.entries(mapping).filter(
    ([, fieldName]) => fieldName !== SKIP_VALUE && fieldName !== ''
  )

  const previewRows = rows.slice(0, 5)
  const totalCount = rows.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Preview (first 5 rows)</p>
        <span className="text-xs text-muted-foreground">{totalCount} rows</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {mappedFields.map(([, fieldName]) => (
                <th
                  key={fieldName}
                  className="text-left font-medium pb-2 pr-4 whitespace-nowrap"
                >
                  {fieldName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {mappedFields.map(([csvHeader, fieldName]) => (
                  <td
                    key={fieldName}
                    className="pb-1 pr-4 whitespace-nowrap text-muted-foreground"
                  >
                    {row[csvHeader] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="default" onClick={onCommit} disabled={loading}>
          {loading ? 'Importing...' : `Import ${totalCount} medicines`}
        </Button>
        <Button variant="outline" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
