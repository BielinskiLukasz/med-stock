import { useState } from 'react'
import { toast } from 'sonner'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { QUANTITY_UNITS } from '@/types/medicine'
import {
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

const NULL_SENTINEL = '__NULL__'

export const stockSchema = z.object({
  expiryDate: z.string().min(1, 'Expiry date is required'),
  location: z.string().nullable().optional(),
  openedDate: z.string().nullable().optional(),
  paoValue: z.number().positive().nullable().optional(),
  paoUnit: z.enum(['days', 'weeks', 'months']).nullable().optional(),
  quantity: z.number().positive().nullable().optional(),
  packCount: z.number().positive().nullable().optional(),
  quantityUnit: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type StockFormData = z.infer<typeof stockSchema>

interface StockFieldsProps {
  form: UseFormReturn<StockFormData>
}

export function StockFields({ form }: StockFieldsProps) {
  const [showQuickAddLocation, setShowQuickAddLocation] = useState(false)
  const [newLocationInput, setNewLocationInput] = useState('')
  const [showCustomQuantityUnit, setShowCustomQuantityUnit] = useState(false)

  const locations = useLiveQuery(
    () => db.locations.orderBy('name').toArray(),
    [],
  )

  async function handleAddLocation() {
    const trimmed = newLocationInput.trim()
    if (!trimmed) return
    try {
      await db.locations.add({ name: trimmed, isDefault: false })
      form.setValue('location', trimmed)
      setNewLocationInput('')
      setShowQuickAddLocation(false)
    } catch (err) {
      console.error('Failed to add location:', err)
      toast.error('Failed to add location. Please try again.')
    }
  }

  return (
    <>
      {/* 1. Expiry Date (required) */}
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

      {/* 2. Location (optional, live from Dexie, with inline quick-add) */}
      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Location</FormLabel>
            <Select
              name={field.name}
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
                {locations
                  ?.filter(loc => loc.name !== 'Other')
                  .map((loc) => (
                    <SelectItem key={loc.id} value={loc.name}>
                      {loc.name}
                    </SelectItem>
                  ))}
                <SelectItem value="__ADD_NEW__">
                  Add new location...
                </SelectItem>
              </SelectContent>
            </Select>
            {showQuickAddLocation && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="New location name"
                  autoComplete="off"
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

      {/* 3. Opened Date (optional) */}
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
                onChange={(e) => field.onChange(e.target.value || null)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 4. Period After Opening (PAO): paoValue + paoUnit */}
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
                  name={field.name}
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

      {/* 5. Quantity + quantityUnit */}
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
                  name={field.name}
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
                    onChange={(e) => field.onChange(e.target.value || null)}
                    className="mt-2"
                  />
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* 6. Number of boxes (packCount, optional) */}
      <FormField
        control={form.control}
        name="packCount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Number of boxes</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="e.g. 2"
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

      {/* 7. Notes (optional) */}
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
