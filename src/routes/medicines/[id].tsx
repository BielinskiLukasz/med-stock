import { useParams, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { db } from '@/lib/db'
import { calculateStatus } from '@/lib/expiry'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'

export function MedicineDetail() {
  const { id } = useParams<{ id: string }>()
  const catalogId = Number(id)

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

  // Loading states
  if (catalog === undefined || stockEntries === undefined) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  // Not found states
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

  // D-02: status computed from nearest-expiry stock at render time — NEVER stored in DB (D-12)
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
        <StatusBadge status={status} />
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
                          {stock.quantity} {stock.quantityUnit || 'units'}
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
                    <StatusBadge status={stockStatus} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Catalog Details */}
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
    </div>
  )
}
