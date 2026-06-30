import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { db } from '@/lib/db'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const newMedicineSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
})

type NewMedicineFormData = z.infer<typeof newMedicineSchema>

export function MedicineNew() {
  const navigate = useNavigate()

  const form = useForm<NewMedicineFormData>({
    resolver: zodResolver(newMedicineSchema),
    defaultValues: {
      name: '',
      expiryDate: '',
    },
  })

  async function onSubmit(data: NewMedicineFormData) {
    try {
      const now = new Date().toISOString()
      await db.medicines.add({
        name: data.name,
        expiryDate: data.expiryDate,
        category: null,
        location: null,     // null = "Other" sentinel (D-17)
        openedDate: null,
        pao: null,
        quantity: null,
        quantityUnit: null,
        notes: null,
        manualStatus: null,
        createdAt: now,
        updatedAt: now,
      })
      void navigate('/medicines')
    } catch (err) {
      // T-01-02 / ASVS V7: never expose raw Dexie errors to UI
      console.error('Failed to add medicine:', err)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold p-4">Add Medicine</h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 p-4"
        >
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
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            Add Medicine
          </Button>
        </form>
      </Form>
    </div>
  )
}
