import { useNavigate } from 'react-router-dom'
import { db } from '@/lib/db'
import { addMedicineHistory } from '@/lib/historyOps'
import { MedicineForm, type MedicineFormData } from '@/components/MedicineForm'

export function MedicineNew() {
  const navigate = useNavigate()

  async function handleSubmit(data: MedicineFormData) {
    try {
      const now = new Date().toISOString()

      // D-16/D-17: Phase 5 schema — name and category now belong to catalog, not stock
      // For this tracer, create a catalog entry if it doesn't exist
      let catalogId = 1
      const existingCatalog = await db.medicine_catalog
        .where('name')
        .equalsIgnoreCase(data.name)
        .first()

      if (existingCatalog) {
        catalogId = existingCatalog.id
      } else {
        // Create a new catalog entry
        catalogId = await db.medicine_catalog.add({
          name: data.name,
          category: data.category ?? null,
          form: null,
          notes: null,
          createdAt: now,
          updatedAt: now,
        })
      }

      // Add stock entry (medicine) with catalogId, but NO name/category
      const newId = await db.medicines.add({
        catalogId,
        expiryDate: data.expiryDate,
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
        deletedAt: null,
      })
      const newMedicine = await db.medicines.get(newId)
      const catalog = await db.medicine_catalog.get(catalogId)
      if (newMedicine && catalog) {
        // D-18: Pass catalog name explicitly to historyOps
        await addMedicineHistory(newMedicine, catalog.name, 'created')
      }
      void navigate(`/medicines/${catalogId}`)
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
