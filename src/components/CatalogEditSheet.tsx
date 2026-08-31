import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import type { MedicineCatalog } from '@/lib/db'
import { useLang } from '@/i18n'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { CatalogFields, catalogSchema, type CatalogFormData } from '@/components/CatalogFields'

interface CatalogEditSheetProps {
  catalog: MedicineCatalog
  onSave: (data: CatalogFormData) => Promise<void>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CatalogEditSheet({ catalog, onSave, open, onOpenChange }: CatalogEditSheetProps) {
  const { t } = useLang()
  const form = useForm<CatalogFormData>({
    resolver: zodResolver(catalogSchema),
    defaultValues: {
      name: catalog.name,
      category: catalog.category,
      form: catalog.form,
      notes: catalog.notes,
    },
  })

  // Reset form with fresh catalog data whenever the sheet opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: catalog.name,
        category: catalog.category,
        form: catalog.form,
        notes: catalog.notes,
      })
    }
  }, [open, catalog, form])

  async function handleSubmit(data: CatalogFormData) {
    try {
      await onSave(data)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to save catalog:', err)
      toast.error(t('toasts.saveFailed'))
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>{t('form.editMedicine')}</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <CatalogFields form={form} />
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
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Saving…' : t('form.saveChanges')}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
