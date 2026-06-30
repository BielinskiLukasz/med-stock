import { useEffect } from 'react'
import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom'
import { RootLayout } from '@/routes/RootLayout'
import { MedicineList } from '@/routes/medicines/index'
import { MedicineNew } from '@/routes/medicines/new'
import { MedicineDetail } from '@/routes/medicines/[id]'
import { MedicineEdit } from '@/routes/medicines/[id].edit'
import { LocationsScreen } from '@/routes/locations/index'

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
    ],
  },
])

export default function App() {
  useEffect(() => {
    // PWA-02: request persistent storage on first launch (once only — empty deps)
    // Pitfall 6: check return value; don't assume granted
    if (navigator.storage?.persist) {
      navigator.storage.persist().then((granted) => {
        if (!granted) {
          console.warn('Persistent storage not granted — IndexedDB may be evicted on low storage')
        }
      }).catch((err: unknown) => {
        console.warn('navigator.storage.persist() failed:', err)
      })
    }
  }, [])

  return <RouterProvider router={router} />
}
