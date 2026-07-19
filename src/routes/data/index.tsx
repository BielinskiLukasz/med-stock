import { ExportSection } from '@/components/ExportSection'
import { ImportJSONSection } from '@/components/ImportJSONSection'
import { ImportCSVSection } from '@/components/ImportCSVSection'
import { SyncInstructions } from '@/components/SyncInstructions'

export function DataScreen() {
  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      {/* Section 1: Export backup */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-base font-medium mb-2">Export backup</h3>
        <ExportSection />
      </div>

      {/* Section 2: Import backup */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-base font-medium mb-2">Import backup</h3>
        <ImportJSONSection />
        <hr className="my-4 border-gray-100" />
        <ImportCSVSection />
      </div>

      {/* Section 3: Sync with household */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-base font-medium mb-2">Sync with household</h3>
        <SyncInstructions />
      </div>
    </div>
  )
}
