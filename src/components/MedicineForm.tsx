import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { CATEGORIES, QUANTITY_UNITS } from '@/types/medicine'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Zod schema — all optional fields are nullable; location uses null as 'Other' sentinel (D-17)
export const medicineSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  category: z.string().nullable().optional(),
  location: z.string().nullable().optional(), // null = "Other" (D-17); NEVER default 'Other'
  openedDate: z.string().nullable().optional(),
  paoValue: z.number().positive().nullable().optional(),
  paoUnit: z.enum(['days', 'weeks', 'months']).nullable().optional(),
  quantity: z.number().positive().nullable().optional(),
  quantityUnit: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type MedicineFormData = z.infer<typeof medicineSchema>

interface MedicineFormProps {
  defaultValues?: Partial<MedicineFormData>
  onSubmit: (data: MedicineFormData) => Promise<void>
  submitLabel?: string
}

// Sentinel value used in Select for "no selection" (maps to null in form state)
const NULL_SENTINEL = '__NULL__'

export function MedicineForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Save',
}: MedicineFormProps) {
  const [showQuickAddLocation, setShowQuickAddLocation] = useState(false)
  const [newLocationInput, setNewLocationInput] = useState('')
  const [showCustomQuantityUnit, setShowCustomQuantityUnit] = useState(false)

  // Load locations live from Dexie — updates immediately when Plan 04 adds/renames (D-19)
  const locations = useLiveQuery(
    () => db.locations.orderBy('name').toArray(),
    [],
  )

  const form = useForm<MedicineFormData>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: '',
      expiryDate: '',
      category: null,
      location: null,
      openedDate: null,
      paoValue: null,
      paoUnit: null,
      quantity: null,
      quantityUnit: null,
      notes: null,
      ...defaultValues,
    },
  })

  // Add a new location inline (D-16)
  async function handleAddLocation() {
    const trimmed = newLocationInput.trim()
    if (!trimmed) return
    try {
      await db.locations.add({ name: trimmed, isDefault: false })
      form.setValue('location', trimmed)
      setNewLocationInput('')
      setShowQuickAddLocation(false)
    } catch (err) {
      // Duplicate or DB error — log only, do not expose raw error
      console.error('Failed to add location:', err)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
        {/* 1. Name (required) */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Ibuprofen 400mg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 2. Expiry Date (required) */}
        <FormField
          control={form.control}
          name="expiryDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiry Date *</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 3. Category (optional) */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                value={field.value ?? NULL_SENTINEL}
                onValueChange={(val) =>
                  field.onChange(val === NULL_SENTINEL ? null : val)
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="No category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NULL_SENTINEL}>No category</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 4. Location (optional, live from Dexie, with inline quick-add per D-16) */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <Select
                value={field.value ?? NULL_SENTINEL}
                onValueChange={(val) => {
                  if (val === '__ADD_NEW__') {
                    setShowQuickAddLocation(true)
                    return
                  }
                  field.onChange(val === NULL_SENTINEL ? null : val)
                  setShowQuickAddLocation(false)
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="No location (Other)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NULL_SENTINEL}>
                    No location (Other)
                  </SelectItem>
                  {locations?.map((loc) => (
                    <SelectItem key={loc.id} value={loc.name}>
                      {loc.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="__ADD_NEW__">
                    Add new location...
                  </SelectItem>
                </SelectContent>
              </Select>
              {/* Inline quick-add input (D-16) */}
              {showQuickAddLocation && (
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="New location name"
                    value={newLocationInput}
                    onChange={(e) => setNewLocationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void handleAddLocation()
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleAddLocation()}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowQuickAddLocation(false)
                      setNewLocationInput('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 5. Opened Date (optional) */}
        <FormField
          control={form.control}
          name="openedDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date Opened</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value || null)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 6. Period After Opening: paoValue + paoUnit (both optional, D-08) */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Period After Opening (PAO)</p>
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="paoValue"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 12"
                      min={1}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const val = e.target.value
                        field.onChange(val === '' ? null : Number(val))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paoUnit"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <Select
                    value={field.value ?? NULL_SENTINEL}
                    onValueChange={(val) =>
                      field.onChange(
                        val === NULL_SENTINEL
                          ? null
                          : (val as 'days' | 'weeks' | 'months'),
                      )
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NULL_SENTINEL}>Unit</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* 7. Quantity + quantityUnit (optional, D-09) */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Quantity</p>
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 20"
                      min={1}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const val = e.target.value
                        field.onChange(val === '' ? null : Number(val))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantityUnit"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <Select
                    value={field.value ?? NULL_SENTINEL}
                    onValueChange={(val) => {
                      if (val === '__CUSTOM__') {
                        setShowCustomQuantityUnit(true)
                        return
                      }
                      field.onChange(val === NULL_SENTINEL ? null : val)
                      setShowCustomQuantityUnit(false)
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NULL_SENTINEL}>Unit</SelectItem>
                      {QUANTITY_UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                      <SelectItem value="__CUSTOM__">Other...</SelectItem>
                    </SelectContent>
                  </Select>
                  {showCustomQuantityUnit && (
                    <Input
                      placeholder="Custom unit"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value || null)
                      }
                      className="mt-2"
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* 8. Notes (optional) */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional information..."
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value || null)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 9. Submit */}
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </form>
    </Form>
  )
}
