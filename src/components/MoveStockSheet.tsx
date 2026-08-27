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
  onMove: (quantityToMove: number, targetLocation: string | null, packCountToMove?: number) => Promise<void>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MoveStockSheet({ stock, onMove, open, onOpenChange }: MoveStockSheetProps) {
  // Box mode: when packCount > 1 all boxes are identical unopened units — operate at box level
  const useBoxes = (stock.packCount ?? 0) > 1
  const maxBoxes = stock.packCount ?? 0
  const maxQty = stock.quantity ?? 0
  const unitsPerBox = useBoxes && maxBoxes > 0 ? Math.round(maxQty / maxBoxes) : 0

  const [boxes, setBoxes] = useState(1)
  const [quantity, setQuantity] = useState(1)
  const [targetLocation, setTargetLocation] = useState<string | null>(stock.location)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setTargetLocation(stock.location)
      setBoxes(1)
      setQuantity(1)
    }
  }, [open, stock])

  const locations = useLiveQuery(() => db.locations.orderBy('name').toArray(), [])

  const isBoxesValid = boxes >= 1 && boxes <= maxBoxes
  const isUnitsValid = quantity >= 1 && quantity <= maxQty
  const isValid = useBoxes ? isBoxesValid : isUnitsValid

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    try {
      setIsSubmitting(true)
      if (useBoxes) {
        await onMove(boxes * unitsPerBox, targetLocation, boxes)
      } else {
        await onMove(quantity, targetLocation)
      }
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
            {useBoxes ? (
              <>
                <label htmlFor="move-boxes" className="text-sm font-medium">
                  Boxes to move (max {maxBoxes})
                </label>
                <Input
                  id="move-boxes"
                  type="number"
                  min={1}
                  max={maxBoxes}
                  value={boxes}
                  onChange={(e) => setBoxes(Number(e.target.value))}
                />
                <p className="text-xs text-gray-500">
                  = {boxes * unitsPerBox} {stock.quantityUnit || 'units'} ({unitsPerBox} per box)
                </p>
                {boxes < 1 && (
                  <p className="text-sm text-red-500">Must be at least 1 box</p>
                )}
                {boxes > maxBoxes && (
                  <p className="text-sm text-red-500">Cannot exceed {maxBoxes} boxes</p>
                )}
              </>
            ) : (
              <>
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
                {quantity < 1 && (
                  <p className="text-sm text-red-500">Quantity must be at least 1</p>
                )}
                {quantity > maxQty && (
                  <p className="text-sm text-red-500">Cannot exceed {maxQty}</p>
                )}
              </>
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
                {locations
                  ?.filter(loc => loc.name !== 'Other')
                  .map((loc) => (
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
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting
                ? 'Moving…'
                : useBoxes
                  ? `Move ${boxes} ${boxes !== 1 ? 'boxes' : 'box'}`
                  : `Move ${quantity} unit${quantity !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
