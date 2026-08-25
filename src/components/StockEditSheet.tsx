import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import type { Medicine } from '@/lib/db'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { StockFields, stockSchema, type StockFormData } from '@/components/StockFields'

interface StockEditSheetProps {
  stock: Medicine
  onSave: (changes: Partial<Medicine>) => Promise<void>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StockEditSheet({ stock, onSave, open, onOpenChange }: StockEditSheetProps) {
  const form = useForm<StockFormData>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      expiryDate: stock.expiryDate ?? '',
      location: stock.location,
      openedDate: stock.openedDate,
      paoValue: stock.pao?.value ?? null,
      paoUnit: stock.pao?.unit ?? null,
      quantity: stock.quantity,
      packCount: stock.packCount,
      quantityUnit: stock.quantityUnit,
      notes: stock.notes,
    },
  })

  // Reset form with fresh stock data whenever the sheet opens
  useEffect(() => {
    if (open) {
      form.reset({
        expiryDate: stock.expiryDate ?? '',
        location: stock.location,
        openedDate: stock.openedDate,
        paoValue: stock.pao?.value ?? null,
        paoUnit: stock.pao?.unit ?? null,
        quantity: stock.quantity,
        packCount: stock.packCount,
        quantityUnit: stock.quantityUnit,
        notes: stock.notes,
      })
    }
  }, [open, stock, form])

  async function handleSubmit(data: StockFormData) {
    try {
      await onSave({
        expiryDate: data.expiryDate,
        location: data.location ?? null,
        openedDate: data.openedDate ?? null,
        pao:
          data.paoValue && data.paoUnit
            ? { value: data.paoValue, unit: data.paoUnit }
            : null,
        quantity: data.quantity ?? null,
        packCount: data.packCount ?? null,
        quantityUnit: data.quantityUnit ?? null,
        notes: data.notes ?? null,
      })
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to save stock entry:', err)
      toast.error('Failed to save. Please try again.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Edit Stock Entry</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <StockFields form={form} />
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
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Saving…' : 'Update stock'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
