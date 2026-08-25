import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, ArrowRightLeft, Package } from 'lucide-react'
import { db } from '@/lib/db'
import type { Medicine } from '@/lib/db'
import { calculateStatus } from '@/lib/expiry'
import { addMedicineHistory, updateMedicineWithHistory } from '@/lib/historyOps'
import { editStockEntry, softDeleteStock, moveStock } from '@/lib/stockOps'
import { StatusBadge } from '@/components/StatusBadge'
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
} from '@/components/ui/alert-dialog'
import { CatalogEditSheet } from '@/components/CatalogEditSheet'
import { StockEditSheet } from '@/components/StockEditSheet'
import { MoveStockSheet } from '@/components/MoveStockSheet'
import { ChangeHistory } from '@/components/ChangeHistory'
import type { CatalogFormData } from '@/components/CatalogFields'

export function MedicineDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const catalogId = Number(id)

  // Sheet / dialog state
  const [catalogEditOpen, setCatalogEditOpen] = useState(false)
  const [stockEditOpen, setStockEditOpen] = useState(false)
  const [selectedStockForEdit, setSelectedStockForEdit] = useState<Medicine | null>(null)
  const [moveStockOpen, setMoveStockOpen] = useState(false)
  const [selectedStockForMove, setSelectedStockForMove] = useState<Medicine | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [selectedStockForDelete, setSelectedStockForDelete] = useState<Medicine | null>(null)

  // D-11: Load catalog by catalogId (not stock entry ID)
  const catalog = useLiveQuery(() => db.medicine_catalog.get(catalogId), [id])

  // D-11: Load active stock entries for this catalog
  const stockEntries = useLiveQuery(
    () => db.medicines
      .where('catalogId')
      .equals(catalogId)
      .filter(m => m.deletedAt === null)
      .toArray(),
    [id]
  )

  // D-02: Find stock entry with nearest-expiry date
  const nearestExpiryStock = useMemo(() => {
    if (!stockEntries || stockEntries.length === 0) return null
    return stockEntries.reduce((nearest, current) => {
      if (!current.expiryDate) return nearest
      if (!nearest.expiryDate) return current
      return current.expiryDate < nearest.expiryDate ? current : nearest
    })
  }, [stockEntries])

  // Handlers

  async function handleCatalogEditSave(data: CatalogFormData) {
    if (!catalog) return
    await db.medicine_catalog.update(catalog.id, {
      name: data.name,
      category: data.category ?? null,
      form: data.form ?? null,
      notes: data.notes ?? null,
      updatedAt: new Date().toISOString(),
    })
    toast.success('Catalog updated')
  }

  async function handleStockEditSave(changes: Partial<Medicine>) {
    if (!selectedStockForEdit || !catalog) return
    await editStockEntry(selectedStockForEdit.id, selectedStockForEdit, changes, catalog.name)
    toast.success('Stock updated')
  }

  async function handleDeleteConfirm() {
    if (!selectedStockForDelete || !catalog) return
    try {
      await softDeleteStock(selectedStockForDelete.id, selectedStockForDelete, catalog.name)
      setDeleteConfirmOpen(false)
      setSelectedStockForDelete(null)
      void navigate('/medicines')
    } catch (err) {
      console.error('Failed to delete stock entry:', err)
      toast.error('Failed to delete. Please try again.')
    }
  }

  async function handleMoveSubmit(quantityToMove: number, targetLocation: string | null) {
    if (!selectedStockForMove || !catalog) return
    await moveStock(selectedStockForMove.id, quantityToMove, targetLocation, selectedStockForMove, catalog.name)
    toast.success('Stock moved')
  }

  // "Open box": split atomically (D-15).
  // Pack-level path (packCount > 1): open one box from a multi-box entry.
  //   New entry gets the per-box quantity and packCount=1; original loses one box.
  // Unit-level path (packCount null or 1): existing behaviour — new entry gets quantity=1.
  async function handleOpenBoxClick(stock: Medicine) {
    if (!catalog) return
    try {
      const today = new Date().toISOString().split('T')[0]
      const now = new Date().toISOString()
      await db.transaction('rw', db.medicines, db.history, async () => {
        if (stock.packCount && stock.packCount > 1) {
          // Pack-level split: open one box from a multi-box entry
          const newId = await db.medicines.add({
            catalogId: stock.catalogId,
            quantity: stock.quantity,
            quantityUnit: stock.quantityUnit,
            expiryDate: stock.expiryDate,
            openedDate: today,
            pao: stock.pao,
            location: stock.location,
            manualStatus: null,
            notes: stock.notes,
            packCount: 1,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
          })
          const newStock = await db.medicines.get(newId)
          if (newStock) await addMedicineHistory(newStock, catalog.name, 'created')
          await updateMedicineWithHistory(
            stock.id,
            stock,
            { packCount: stock.packCount - 1, updatedAt: now },
            catalog.name
          )
        } else {
          // Unit-level split: decrement quantity by 1, new entry gets quantity=1
          const newId = await db.medicines.add({
            catalogId: stock.catalogId,
            quantity: 1,
            quantityUnit: stock.quantityUnit,
            expiryDate: stock.expiryDate,
            openedDate: today,
            pao: stock.pao,
            location: stock.location,
            manualStatus: null,
            notes: stock.notes,
            packCount: null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
          })
          const newStock = await db.medicines.get(newId)
          if (newStock) await addMedicineHistory(newStock, catalog.name, 'created')
          await updateMedicineWithHistory(
            stock.id,
            stock,
            { quantity: (stock.quantity ?? 0) - 1, updatedAt: now },
            catalog.name
          )
        }
      })
      toast.success('Box opened')
    } catch (err) {
      console.error('Failed to open box:', err)
      toast.error('Failed to open box. Please try again.')
    }
  }

  // Loading states
  if (catalog === undefined || stockEntries === undefined) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  // Not found
  if (catalog === null) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Catalog not found.</p>
        <Button asChild className="mt-4">
          <Link to="/medicines">Back to list</Link>
        </Button>
      </div>
    )
  }

  // D-02: status from nearest-expiry stock at render time — NEVER stored in DB (D-12)
  const status = nearestExpiryStock ? calculateStatus(nearestExpiryStock) : 'Active'

  return (
    <div className="p-4 space-y-6">
      {/* Catalog Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 break-words">
            {catalog.name}
          </h1>
          {catalog.category && (
            <p className="text-sm text-gray-500 mt-1">{catalog.category}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <StatusBadge status={status} />
          <button
            type="button"
            onClick={() => setCatalogEditOpen(true)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Edit catalog"
          >
            <Pencil className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Stock Entries List */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500">Stock Entries</h2>
        {stockEntries.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No stock</p>
        ) : (
          <div className="space-y-3">
            {stockEntries.map(stock => {
              const stockStatus = calculateStatus(stock)
              return (
                <div key={stock.id} className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">
                          {stock.packCount && stock.packCount > 0
                            ? `${stock.packCount} ${stock.packCount === 1 ? 'box' : 'boxes'} × ${stock.quantity} ${stock.quantityUnit || 'units'}`
                            : `${stock.quantity} ${stock.quantityUnit || 'units'}`}
                        </p>
                        <span className="text-xs text-gray-500">
                          {stock.location ?? 'Other'}
                        </span>
                      </div>
                      {stock.expiryDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          Expires: {stock.expiryDate}
                        </p>
                      )}
                      {stock.openedDate && (
                        <p className="text-xs text-gray-500">
                          Opened: {stock.openedDate}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusBadge status={stockStatus} />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStockForEdit(stock)
                          setStockEditOpen(true)
                        }}
                        className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                        aria-label="Edit stock entry"
                      >
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Stock action row */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {((stock.quantity ?? 0) > 1 || (stock.packCount ?? 0) > 1) && !stock.openedDate && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => void handleOpenBoxClick(stock)}
                      >
                        <Package className="h-3 w-3 mr-1" />
                        Open box
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => {
                        setSelectedStockForMove(stock)
                        setMoveStockOpen(true)
                      }}
                    >
                      <ArrowRightLeft className="h-3 w-3 mr-1" />
                      Move/Split
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setSelectedStockForDelete(stock)
                        setDeleteConfirmOpen(true)
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                  <ChangeHistory medicineId={stock.id} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Catalog Notes */}
      {catalog.notes && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-500">Notes</h2>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{catalog.notes}</p>
        </div>
      )}

      {/* Back link */}
      <div className="pt-2">
        <Link to="/medicines" className="text-sm text-blue-600 hover:underline">
          ← Back to list
        </Link>
      </div>

      {/* Catalog Edit Sheet */}
      <CatalogEditSheet
        catalog={catalog}
        onSave={handleCatalogEditSave}
        open={catalogEditOpen}
        onOpenChange={setCatalogEditOpen}
      />

      {/* Stock Edit Sheet */}
      {selectedStockForEdit && (
        <StockEditSheet
          stock={selectedStockForEdit}
          onSave={handleStockEditSave}
          open={stockEditOpen}
          onOpenChange={(open) => {
            setStockEditOpen(open)
            if (!open) setSelectedStockForEdit(null)
          }}
        />
      )}

      {/* Move/Split Sheet */}
      {selectedStockForMove && (
        <MoveStockSheet
          stock={selectedStockForMove}
          onMove={handleMoveSubmit}
          open={moveStockOpen}
          onOpenChange={(open) => {
            setMoveStockOpen(open)
            if (!open) setSelectedStockForMove(null)
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete stock entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the entry to Trash. You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedStockForDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDeleteConfirm()}
            >
              Move to Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
