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
import { useLang, LOCATION_KEYS, UNIT_KEYS } from '@/i18n'

export function TrashScreen() {
  const { t, lang } = useLang()
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
    return <div className="p-4">{t('common.loading')}</div>
  }

  if (deletedWithCatalogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <p className="text-gray-500">{t('trash.emptyBody')}</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-semibold p-4">{t('trash.title')}</h1>

      <div className="space-y-3 p-4">
        {deletedWithCatalogs.map(({ medicine, catalog }) => (
          <div
            key={medicine.id}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <p className="font-medium text-gray-900">
              {catalog?.name ?? t('trash.unknown')}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {medicine.packCount && medicine.packCount > 1
                ? `${medicine.packCount} ${t('units.boxes')} × ${medicine.quantity} ${t(UNIT_KEYS[medicine.quantityUnit ?? ''] ?? 'units.units')}`
                : `${medicine.quantity} ${t(UNIT_KEYS[medicine.quantityUnit ?? ''] ?? 'units.units')}`}{' '}
              {t('common.at')}{' '}
              {medicine.location !== null
                ? (LOCATION_KEYS[medicine.location] ? t(LOCATION_KEYS[medicine.location]) : medicine.location)
                : t('locationNames.other')}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {t('trash.deleted')}{' '}
              {medicine.deletedAt
                ? new Date(medicine.deletedAt).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB')
                : ''}
            </p>

            <div className="flex gap-2 mt-3 flex-wrap">
              {/* D-12: View link uses catalogId (not stock entry id) so detail screen resolves correctly */}
              <Button variant="outline" size="sm" asChild>
                <Link to={`/medicines/${medicine.catalogId}`}>{t('trash.view')}</Link>
              </Button>
              <Button
                size="sm"
                onClick={() => void handleRestore(medicine, catalog?.name ?? t('trash.unknown'))}
              >
                {t('trash.restore')}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    {t('trash.deletePermanently')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t('trash.deleteConfirmTitle')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('trash.deleteConfirmBody')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('trash.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => void handlePermanentDelete(medicine, catalog?.name ?? t('trash.unknown'))}
                    >
                      {t('trash.deletePermanently')}
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
