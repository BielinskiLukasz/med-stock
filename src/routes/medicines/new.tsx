import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import { db } from '@/lib/db'
import type { MedicineCatalog } from '@/lib/db'
import { addStockEntry } from '@/lib/stockOps'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { CatalogAutocomplete } from '@/components/CatalogAutocomplete'
import { CatalogFields, catalogSchema, type CatalogFormData } from '@/components/CatalogFields'
import { StockFields, stockSchema, type StockFormData } from '@/components/StockFields'

type Step = 'search' | 'create-catalog' | 'stock-form'

export function MedicineNew() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('search')
  const [selectedCatalog, setSelectedCatalog] = useState<MedicineCatalog | null>(null)

  const catalogForm = useForm<CatalogFormData>({
    resolver: zodResolver(catalogSchema),
    defaultValues: { name: '', category: null, form: null, notes: null },
  })

  const stockForm = useForm<StockFormData>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      expiryDate: '',
      location: null,
      openedDate: null,
      paoValue: null,
      paoUnit: null,
      quantity: null,
      packCount: null,
      quantityUnit: null,
      notes: null,
    },
  })

  function handleCatalogSelect(catalog: MedicineCatalog) {
    setSelectedCatalog(catalog)
    setStep('stock-form')
  }

  function handleCreateCatalogClick(typedName: string) {
    catalogForm.reset({ name: typedName, category: null, form: null, notes: null })
    setStep('create-catalog')
  }

  async function handleCatalogCreate(data: CatalogFormData) {
    try {
      const now = new Date().toISOString()
      const newId = await db.medicine_catalog.add({
        name: data.name,
        category: data.category ?? null,
        form: data.form ?? null,
        notes: data.notes ?? null,
        createdAt: now,
        updatedAt: now,
      })
      const newCatalog = await db.medicine_catalog.get(newId)
      if (newCatalog) {
        setSelectedCatalog(newCatalog)
        setStep('stock-form')
      } else {
        toast.error('Failed to load new catalog. Please try again.')
      }
    } catch (err) {
      console.error('Failed to create catalog:', err)
      toast.error('Failed to create medicine. Please try again.')
    }
  }

  async function handleStockSubmit(data: StockFormData) {
    if (!selectedCatalog) return
    try {
      await addStockEntry(
        selectedCatalog.id,
        {
          expiryDate: data.expiryDate,
          location: data.location ?? null,
          openedDate: data.openedDate ?? null,
          pao:
            data.paoValue && data.paoUnit
              ? { value: data.paoValue, unit: data.paoUnit }
              : null,
          quantity: data.quantity ?? null,
          quantityUnit: data.quantityUnit ?? null,
          packCount: data.packCount ?? null,
          notes: data.notes ?? null,
          manualStatus: null,
        },
        selectedCatalog.name
      )
      void navigate(`/medicines/${selectedCatalog.id}`)
    } catch (err) {
      console.error('Failed to add stock:', err)
      toast.error('Failed to save. Please try again.')
    }
  }

  function handleBackToSearch() {
    setStep('search')
    catalogForm.reset()
    stockForm.reset()
  }

  function handleCancel() {
    void navigate('/medicines')
  }

  return (
    <div className="pb-4">
      {/* Step 1: Catalog search */}
      {step === 'search' && (
        <div>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h1 className="text-xl font-semibold">Add Medicine</h1>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
          <CatalogAutocomplete
            onSelect={handleCatalogSelect}
            onCreateClick={handleCreateCatalogClick}
          />
        </div>
      )}

      {/* Step 2: Create catalog */}
      {step === 'create-catalog' && (
        <div>
          <div className="flex items-center gap-1 px-4 pt-4 pb-2">
            <button
              type="button"
              onClick={handleBackToSearch}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Back to search"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold flex-1">Create Medicine</h1>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
          <Form {...catalogForm}>
            <form
              onSubmit={catalogForm.handleSubmit(handleCatalogCreate)}
              className="space-y-4 p-4"
            >
              <CatalogFields form={catalogForm} />
              <Button
                type="submit"
                className="w-full"
                disabled={catalogForm.formState.isSubmitting}
              >
                {catalogForm.formState.isSubmitting ? 'Creating…' : 'Next: Add Stock'}
              </Button>
            </form>
          </Form>
        </div>
      )}

      {/* Step 3: Add stock entry */}
      {step === 'stock-form' && selectedCatalog && (
        <div>
          <div className="flex items-center gap-1 px-4 pt-4 pb-2">
            <button
              type="button"
              onClick={handleBackToSearch}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Back to search"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold truncate">{selectedCatalog.name}</h1>
              {selectedCatalog.category && (
                <p className="text-sm text-gray-500">{selectedCatalog.category}</p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
          <Form {...stockForm}>
            <form
              onSubmit={stockForm.handleSubmit(handleStockSubmit)}
              className="space-y-4 p-4"
            >
              <StockFields form={stockForm} />
              <Button
                type="submit"
                className="w-full"
                disabled={stockForm.formState.isSubmitting}
              >
                {stockForm.formState.isSubmitting ? 'Saving…' : 'Add Stock'}
              </Button>
            </form>
          </Form>
        </div>
      )}
    </div>
  )
}
