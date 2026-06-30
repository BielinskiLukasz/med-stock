import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '@/lib/db'
import { MedicineCard } from '@/components/MedicineCard'
import { Button } from '@/components/ui/button'

export function MedicineList() {
  // useLiveQuery: re-renders whenever IndexedDB changes
  // INV-04: filter out soft-deleted items (manualStatus === 'Disposed')
  const medicines = useLiveQuery(
    () =>
      db.medicines
        .where('manualStatus')
        .notEqual('Disposed')
        .sortBy('name'),
    [],
  )

  if (medicines === undefined) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (medicines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <p className="text-gray-500">No medicines yet. Add your first one.</p>
        <Button asChild>
          <Link to="/medicines/new">Add Medicine</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Medicines</h1>
        <Button asChild size="sm">
          <Link to="/medicines/new">Add</Link>
        </Button>
      </div>
      {medicines.map((med) => (
        <MedicineCard
          key={med.id}
          medicine={med}
          status="Active" // Plan 03 wires calculateStatus from @/lib/expiry
        />
      ))}
    </div>
  )
}
