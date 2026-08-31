import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useLang } from '@/i18n'

// D-42: 5 tabs: Medicines | Dashboard | Trash | Locations | Data
// D-09: Language toggle as 6th element (flag emoji button)
export function BottomTabBar() {
  const { lang, setLang, t } = useLang()

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
        <span>{t('nav.medicines')}</span>
      </NavLink>
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          cn(
            'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
            isActive
              ? 'text-primary border-t-2 border-primary'
              : 'text-gray-500 hover:text-gray-700',
          )
        }
      >
        <span>{t('nav.dashboard')}</span>
      </NavLink>
      <NavLink
        to="/trash"
        className={({ isActive }) =>
          cn(
            'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
            isActive
              ? 'text-primary border-t-2 border-primary'
              : 'text-gray-500 hover:text-gray-700',
          )
        }
      >
        <span>{t('nav.trash')}</span>
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
        <span>{t('nav.locations')}</span>
      </NavLink>
      <NavLink
        to="/data"
        className={({ isActive }) =>
          cn(
            'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
            isActive
              ? 'text-primary border-t-2 border-primary'
              : 'text-gray-500 hover:text-gray-700',
          )
        }
      >
        <span>{t('nav.data')}</span>
      </NavLink>
      <button
        onClick={() => setLang(lang === 'en' ? 'pl' : 'en')}
        aria-label={lang === 'en' ? 'Switch to Polish' : 'Switch to English'}
        className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px]"
      >
        <span>{lang === 'en' ? '🇬🇧' : '🇵🇱'}</span>
      </button>
    </nav>
  )
}
