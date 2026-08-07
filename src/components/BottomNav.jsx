import { useNavigate, useLocation } from 'react-router-dom'
import { House, ListChecks, PieChart, Settings } from 'lucide-react'

const items = [
  { path: '/home',     icon: House,      label: 'Inicio'    },
  { path: '/history',  icon: ListChecks, label: 'Historial' },
  { path: '/summary',  icon: PieChart,   label: 'Resumen'   },
  { path: '/settings', icon: Settings,   label: 'Ajustes'   },
]

export function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex safe-bottom">
      {items.map(item => {
        const active = pathname.startsWith(item.path)
        const Icon = item.icon
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition-colors ${active ? 'text-amber-600' : 'text-gray-400'}`}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 2} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
