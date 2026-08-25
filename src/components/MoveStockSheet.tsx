import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import type { Medicine } from '@/lib/db'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const NULL_SENTINEL = '__NULL__'

interface MoveStockSheetProps {
  stock: Medicine
  onMove: (quantityToMove: number, targetLocation: string | null) => Promise<void>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MoveStockSheet({ stock, onMove, open, onOpenChange }: MoveStockSheetProps) {
  const [quantity, setQuantity] = useState(1)
  const [targetLocation, setTargetLocation] = useState<string | null>(stock.location)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Re-sync state whenever the sheet opens or the stock prop changes (G-05-7)
  useEffect(() => {
    if (open) {
      setTargetLocation(stock.location)
      setQuantity(1)
    }
  }, [open, stock])

  const locations = useLiveQuery(() => db.locations.orderBy('name').toArray(), [])
  const maxQty = stock.quantity ?? 0
  const isQuantityValid = quantity >= 1 && quantity <= maxQty

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isQuantityValid) return
    try {
      setIsSubmitting(true)
      await onMove(quantity, targetLocation)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to move stock:', err)
      toast.error('Failed to move stock. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Move / Split Stock</SheetTitle>
        </SheetHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="move-qty" className="text-sm font-medium">
              Quantity to move (max {maxQty})
            </label>
            <Input
              id="move-qty"
              type="number"
              min={1}
              max={maxQty}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
            {quantity > maxQty && (
              <p className="text-sm text-red-500">Cannot exceed {maxQty}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="target-location" className="text-sm font-medium">
              Target location
            </label>
            <Select
              value={targetLocation ?? NULL_SENTINEL}
              onValueChange={(val) => setTargetLocation(val === NULL_SENTINEL ? null : val)}
            >
              <SelectTrigger id="target-location">
                <SelectValue placeholder="No location (Other)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NULL_SENTINEL}>No location (Other)</SelectItem>
                {locations?.map((loc) => (
                  <SelectItem key={loc.id} value={loc.name}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !isQuantityValid}
            >
              {isSubmitting
                ? 'Moving…'
                : `Move ${quantity} unit${quantity !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
