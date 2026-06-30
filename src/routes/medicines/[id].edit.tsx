import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { updateMedicineWithHistory } from '@/lib/historyOps'
import { MedicineForm, type MedicineFormData } from '@/components/MedicineForm'

export function MedicineEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Load medicine live from Dexie — undefined while loading, undefined if not found
  const medicine = useLiveQuery(() => db.medicines.get(Number(id)), [id])

  async function handleSubmit(data: MedicineFormData) {
    if (!medicine) return
    try {
      const before = medicine
      await updateMedicineWithHistory(Number(id), before, {
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
      })
      void navigate(`/medicines/${id}`)
    } catch (err) {
      // T-03-04: never expose raw Dexie errors to UI
      console.error('Failed to update medicine:', err)
    }
  }

  if (medicine === undefined) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (medicine === null) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Medicine not found.</p>
      </div>
    )
  }

  // Map stored Medicine fields to MedicineFormData (split pao into paoValue + paoUnit)
  const defaultValues: Partial<MedicineFormData> = {
    name: medicine.name,
    expiryDate: medicine.expiryDate ?? '',
    category: medicine.category,
    location: medicine.location,
    openedDate: medicine.openedDate,
    paoValue: medicine.pao?.value ?? null,
    paoUnit: medicine.pao?.unit ?? null,
    quantity: medicine.quantity,
    quantityUnit: medicine.quantityUnit,
    notes: medicine.notes,
  }

  return (
    <div>
      <h1 className="text-xl font-semibold p-4">Edit Medicine</h1>
      <MedicineForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
    </div>
  )
}
