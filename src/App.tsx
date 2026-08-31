import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom'
import { LanguageProvider } from '@/i18n'
import { RootLayout } from '@/routes/RootLayout'
import { MedicineList } from '@/routes/medicines/index'
import { MedicineNew } from '@/routes/medicines/new'
import { MedicineDetail } from '@/routes/medicines/[id]'
import { MedicineEdit } from '@/routes/medicines/[id].edit'
import { LocationsScreen } from '@/routes/locations/index'
import { DashboardScreen } from '@/routes/dashboard/index'
import { TrashScreen } from '@/routes/trash/index'
import { DataScreen } from '@/routes/data/index'

// CRITICAL: router created OUTSIDE React tree — never inside a component or useState (Pitfall 4)
const router = createHashRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/medicines" replace /> },
      { path: 'medicines', element: <MedicineList /> },
      { path: 'medicines/new', element: <MedicineNew /> },
      { path: 'medicines/:id', element: <MedicineDetail /> },
      { path: 'medicines/:id/edit', element: <MedicineEdit /> },
      { path: 'locations', element: <LocationsScreen /> },
      { path: 'dashboard', element: <DashboardScreen /> },
      { path: 'trash', element: <TrashScreen /> },
      { path: 'data', element: <DataScreen /> },
    ],
  },
])

// PWA-02: request persistent storage once per page load — placed at module scope like the
// router above so React 18 StrictMode's double-invocation of effect hooks doesn't fire it twice.
// Pitfall 6: check return value; don't assume granted. Guard navigator.storage? for browsers
// that don't expose the Storage API (e.g. some older iOS Safari versions).
if (navigator.storage?.persist) {
  navigator.storage.persist().then((granted) => {
    if (!granted) {
      console.warn('Persistent storage not granted — IndexedDB may be evicted on low storage')
    }
  }).catch((err: unknown) => {
    console.warn('navigator.storage.persist() failed:', err)
  })
}

export default function App() {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  )
}
