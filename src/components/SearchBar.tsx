import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useLang } from '@/i18n'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({
  value,
  onChange,
  placeholder,
}: SearchBarProps) {
  const { t } = useLang()
  const resolvedPlaceholder = placeholder ?? t('medicines.searchPlaceholder')
  return (
    <div className="relative flex items-center">
      <Input
        id="medicine-search"
        name="medicine-search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={resolvedPlaceholder}
        className="pr-8"
        autoComplete="off"
      />
      {value.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 h-6 w-6 p-0"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          ×
        </Button>
      )}
    </div>
  )
}
