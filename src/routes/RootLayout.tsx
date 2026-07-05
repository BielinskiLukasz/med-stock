import { Outlet } from 'react-router-dom'
import { BottomTabBar } from '@/components/BottomTabBar'

export function RootLayout() {
  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-y-auto pb-16">
        {/* pb-16: padding-bottom to avoid content hiding behind bottom tab bar */}
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  )
}
