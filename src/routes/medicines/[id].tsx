import { useParams, useNavigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { softDeleteMedicine } from '@/lib/historyOps'
import { calculateStatus } from '@/lib/expiry'
import { StatusBadge } from '@/components/StatusBadge'
import { ChangeHistory } from '@/components/ChangeHistory'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function MedicineDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Load medicine live from Dexie
  const medicine = useLiveQuery(() => db.medicines.get(Number(id)), [id])

  // Soft-delete: moves medicine to Trash Bin (sets deletedAt) — record is preserved (D-25)
  async function handleDelete() {
    if (!medicine) return
    try {
      await softDeleteMedicine(medicine)
      void navigate('/medicines')
    } catch (err) {
      // T-03-04: never expose raw Dexie errors to UI
      console.error('Failed to delete medicine:', err)
    }
  }

  if (medicine === undefined) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  // T-03-02: invalid :id returns undefined from Dexie — show "not found" gracefully
  if (medicine === null) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Medicine not found.</p>
        <Button asChild className="mt-4">
          <Link to="/medicines">Back to list</Link>
        </Button>
      </div>
    )
  }

  // D-11: status computed at render time — NEVER stored in DB (D-12)
  const status = calculateStatus(medicine)

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 break-words">
            {medicine.name}
          </h1>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Field list */}
      <dl className="space-y-3">
        <div>
          <dt className="text-sm font-medium text-gray-500">Category</dt>
          <dd className="mt-0.5 text-sm text-gray-900">
            {medicine.category ?? 'None'}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Location</dt>
          {/* D-17: location null means 'Other' */}
          <dd className="mt-0.5 text-sm text-gray-900">
            {medicine.location ?? 'Other'}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Expiry Date</dt>
          <dd className="mt-0.5 text-sm text-gray-900">
            {medicine.expiryDate ?? 'Not set'}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Date Opened</dt>
          <dd className="mt-0.5 text-sm text-gray-900">
            {medicine.openedDate ?? 'Not opened'}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">
            Period After Opening (PAO)
          </dt>
          <dd className="mt-0.5 text-sm text-gray-900">
            {medicine.pao
              ? `${medicine.pao.value} ${medicine.pao.unit}`
              : 'Not set'}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Quantity</dt>
          <dd className="mt-0.5 text-sm text-gray-900">
            {medicine.quantity != null
              ? `${medicine.quantity}${medicine.quantityUnit ? ` ${medicine.quantityUnit}` : ''}`
              : 'Not set'}
          </dd>
        </div>
        {medicine.notes && (
          <div>
            <dt className="text-sm font-medium text-gray-500">Notes</dt>
            <dd className="mt-0.5 text-sm text-gray-900 whitespace-pre-wrap">
              {medicine.notes}
            </dd>
          </div>
        )}
      </dl>

      <ChangeHistory medicineId={medicine.id} />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button asChild className="flex-1">
          <Link to={`/medicines/${id}/edit`}>Edit</Link>
        </Button>

        {/* Soft-delete with confirmation dialog (prevents accidental deletion) */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="flex-1">
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete medicine?</AlertDialogTitle>
              <AlertDialogDescription>
                This will move <strong>{medicine.name}</strong> to the Trash
                Bin. You can restore it from Trash.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => void handleDelete()}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Back link */}
      <div className="pt-2">
        <Link to="/medicines" className="text-sm text-blue-600 hover:underline">
          ← Back to list
        </Link>
      </div>
    </div>
  )
}
