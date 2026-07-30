import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { db } from '@/lib/db'
import { restoreMedicine, permanentDeleteMedicine } from '@/lib/historyOps'
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
import type { Medicine } from '@/lib/db'

export function TrashScreen() {
  const deletedMedicines = useLiveQuery(
    () =>
      db.medicines
        .toCollection()
        .filter(m => m.deletedAt !== null)
        .toArray(),
    [],
  )

  const catalogs = useLiveQuery(() => db.medicine_catalog.toArray(), [])

  // Map medicines to their catalog data
  const deletedWithCatalogs = useMemo(() => {
    if (!deletedMedicines || !catalogs) return []
    return deletedMedicines.map(med => {
      const catalog = catalogs.find(c => c.id === med.catalogId)
      return { medicine: med, catalog }
    })
  }, [deletedMedicines, catalogs])

  async function handleRestore(medicine: Medicine, catalogName: string) {
    try {
      await restoreMedicine(medicine, catalogName)
    } catch (err) {
      console.error('Failed to restore medicine:', err)
    }
  }

  async function handlePermanentDelete(medicine: Medicine, catalogName: string) {
    try {
      await permanentDeleteMedicine(medicine, catalogName)
    } catch (err) {
      console.error('Failed to permanently delete medicine:', err)
    }
  }

  if (deletedMedicines === undefined || catalogs === undefined) {
    return <div className="p-4">Loading...</div>
  }

  if (deletedWithCatalogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <p className="text-gray-500">Trash is empty.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-semibold p-4">Trash</h1>

      <div className="space-y-3 p-4">
        {deletedWithCatalogs.map(({ medicine, catalog }) => (
          <div
            key={medicine.id}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <p className="font-medium text-gray-900">
              {catalog?.name ?? 'Unknown Medicine'}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {medicine.quantity} {medicine.quantityUnit || 'units'} at {medicine.location ?? 'Other'}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Deleted{' '}
              {medicine.deletedAt
                ? new Date(medicine.deletedAt).toLocaleDateString('en-GB')
                : ''}
            </p>

            <div className="flex gap-2 mt-3 flex-wrap">
              {/* D-12: View link uses catalogId (not stock entry id) so detail screen resolves correctly */}
              <Button variant="outline" size="sm" asChild>
                <Link to={`/medicines/${medicine.catalogId}`}>View</Link>
              </Button>
              <Button
                size="sm"
                onClick={() => void handleRestore(medicine, catalog?.name ?? 'Unknown')}
              >
                Restore
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Delete Permanently
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete medicine permanently?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This cannot be undone, but history will be preserved.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => void handlePermanentDelete(medicine, catalog?.name ?? 'Unknown')}
                    >
                      Delete Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
