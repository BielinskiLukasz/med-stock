import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search medicines by name…',
}: SearchBarProps) {
  return (
    <div className="relative flex items-center">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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
