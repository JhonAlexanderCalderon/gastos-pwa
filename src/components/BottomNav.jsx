import { useNavigate, useLocation } from 'react-router-dom'

const items = [
  { path: '/home',         icon: '🏠', label: 'Inicio'   },
  { path: '/history',      icon: '📋', label: 'Historial' },
  { path: '/summary',      icon: '📊', label: 'Resumen'   },
  { path: '/settings',     icon: '⚙️',  label: 'Ajustes'  },
]

export function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex safe-bottom">
      {items.map(item => {
        const active = pathname.startsWith(item.path)
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition-colors ${active ? 'text-violet-700' : 'text-gray-400'}`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
