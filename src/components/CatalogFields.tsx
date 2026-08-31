import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { MedicineForm as MedicineFormEnum } from '@/lib/db'
import { CATEGORIES } from '@/types/medicine'
import { useLang, CATEGORY_KEYS, FORM_TYPE_KEYS } from '@/i18n'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const NULL_SENTINEL = '__NULL__'

export const catalogSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().nullable().optional(),
  form: z.enum([
    'Tablet', 'Capsule', 'Syrup', 'Cream', 'Drops', 'Spray',
    'Powder', 'Gel', 'Ointment', 'Patch', 'Inhaler', 'Suppository', 'Other',
  ]).nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type CatalogFormData = z.infer<typeof catalogSchema>

interface CatalogFieldsProps {
  form: UseFormReturn<CatalogFormData>
}

export function CatalogFields({ form }: CatalogFieldsProps) {
  const { t } = useLang()

  return (
    <>
      {/* 1. Name (required) */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form.name')} *</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Ibuprofen 400mg" autoComplete="off" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 2. Category (optional) */}
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form.category')}</FormLabel>
            <Select
              name={field.name}
              value={field.value ?? NULL_SENTINEL}
              onValueChange={(val) =>
                field.onChange(val === NULL_SENTINEL ? null : val)
              }
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('form.noCategory')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NULL_SENTINEL}>{t('form.noCategory')}</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {t(CATEGORY_KEYS[cat] ?? 'categories.other')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 3. Form/type (optional) */}
      <FormField
        control={form.control}
        name="form"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form.formType')}</FormLabel>
            <Select
              name={field.name}
              value={field.value ?? NULL_SENTINEL}
              onValueChange={(val) =>
                field.onChange(val === NULL_SENTINEL ? null : val)
              }
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('form.noType')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NULL_SENTINEL}>{t('form.noType')}</SelectItem>
                {Object.values(MedicineFormEnum).map((f) => (
                  <SelectItem key={f} value={f}>
                    {t(FORM_TYPE_KEYS[f] ?? 'formTypes.other')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 4. Notes (optional) */}
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form.notes')}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={t('form.notesPlaceholder')}
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value || null)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
