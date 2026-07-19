import { MEDICINE_FIELDS, SKIP_VALUE } from '@/lib/csvOps'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface CSVColumnMapperProps {
  headers: string[]
  mapping: Record<string, string>
  onMappingChange: (newMapping: Record<string, string>) => void
  onPreview: () => void
  onCancel: () => void
}

export function CSVColumnMapper({
  headers,
  mapping,
  onMappingChange,
  onPreview,
  onCancel,
}: CSVColumnMapperProps) {
  const isNameMapped = Object.values(mapping).includes('name')

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select which columns in your spreadsheet map to medicine fields. Mark
        columns as &quot;Skip&quot; if they&apos;re not needed.
      </p>

      <div className="overflow-x-auto">
        <div className="space-y-2">
          {headers.map((header) => (
            <div key={header} className="flex items-center gap-3">
              <span className="text-sm font-medium w-1/2 shrink-0 truncate">
                {header}
              </span>
              <Select
                value={mapping[header] ?? ''}
                onValueChange={(val) =>
                  onMappingChange({ ...mapping, [header]: val })
                }
              >
                <SelectTrigger className="w-full h-8 text-sm">
                  <SelectValue placeholder="Map to field:" />
                </SelectTrigger>
                <SelectContent>
                  {MEDICINE_FIELDS.map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                  <SelectItem value={SKIP_VALUE}>(skip)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      {!isNameMapped && (
        <p className="text-xs text-destructive">
          Required field &apos;name&apos; must be mapped before preview is enabled
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="default" onClick={onPreview} disabled={!isNameMapped}>
          Preview
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
