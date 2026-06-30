import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function BottomTabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex h-16 z-50">
      <NavLink
        to="/medicines"
        className={({ isActive }) =>
          cn(
            'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
            isActive
              ? 'text-primary border-t-2 border-primary'
              : 'text-gray-500 hover:text-gray-700',
          )
        }
      >
        <span>Medicines</span>
      </NavLink>
      <NavLink
        to="/locations"
        className={({ isActive }) =>
          cn(
            'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
            isActive
              ? 'text-primary border-t-2 border-primary'
              : 'text-gray-500 hover:text-gray-700',
          )
        }
      >
        <span>Locations</span>
      </NavLink>
    </nav>
  )
}
