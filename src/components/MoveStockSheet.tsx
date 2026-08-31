import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import type { Medicine } from '@/lib/db'
import { db } from '@/lib/db'
import { useLang, LOCATION_KEYS } from '@/i18n'
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
  const { t } = useLang()
  // Box mode: when packCount > 1 all boxes are identical unopened units — operate at box level
  const useBoxes = (stock.packCount ?? 0) > 1
  const maxBoxes = stock.packCount ?? 0
  const maxQty = stock.quantity ?? 0
  // quantity is per-box (same model as Open Box) — no division needed
  const unitsPerBox = maxQty

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
        await onMove(unitsPerBox, targetLocation, boxes)
      } else {
        await onMove(quantity, targetLocation)
      }
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to move stock:', err)
      toast.error(t('toasts.moveFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>{t('form.moveStock')}</SheetTitle>
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
                  = {unitsPerBox} {stock.quantityUnit || 'units'} per box
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
              {t('form.targetLocation')}
            </label>
            <Select
              value={targetLocation ?? NULL_SENTINEL}
              onValueChange={(val) => setTargetLocation(val === NULL_SENTINEL ? null : val)}
            >
              <SelectTrigger id="target-location">
                <SelectValue placeholder={t('form.noLocation')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NULL_SENTINEL}>{t('form.noLocation')}</SelectItem>
                {locations
                  ?.filter(loc => loc.name !== 'Other')
                  .map((loc) => (
                    <SelectItem key={loc.id} value={loc.name}>
                      {t(LOCATION_KEYS[loc.name] ?? loc.name)}
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
              {t('form.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? 'Moving…' : t('form.save')}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
