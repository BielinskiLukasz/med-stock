import { useNavigate } from 'react-router-dom'
import { db } from '@/lib/db'
import { MedicineForm, type MedicineFormData } from '@/components/MedicineForm'

export function MedicineNew() {
  const navigate = useNavigate()

  async function handleSubmit(data: MedicineFormData) {
    try {
      const now = new Date().toISOString()
      await db.medicines.add({
        name: data.name,
        expiryDate: data.expiryDate,
        category: data.category ?? null,
        location: data.location ?? null, // null = "Other" sentinel (D-17)
        openedDate: data.openedDate ?? null,
        pao:
          data.paoValue && data.paoUnit
            ? { value: data.paoValue, unit: data.paoUnit }
            : null,
        quantity: data.quantity ?? null,
        quantityUnit: data.quantityUnit ?? null,
        notes: data.notes ?? null,
        manualStatus: null,
        createdAt: now,
        updatedAt: now,
      })
      void navigate('/medicines')
    } catch (err) {
      // T-03-04: never expose raw Dexie errors to UI
      console.error('Failed to add medicine:', err)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold p-4">Add Medicine</h1>
      <MedicineForm onSubmit={handleSubmit} submitLabel="Add Medicine" />
    </div>
  )
}
