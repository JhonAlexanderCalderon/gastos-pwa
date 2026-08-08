import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Inbox } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { watchMonthExpenses, watchAllExpenses } from '../firebase/firestore'
import { BottomNav } from '../components/BottomNav'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { Avatar } from '../components/ui/Avatar'
import { getCategoryById, CATEGORIES } from '../utils/categories'
import { formatAmount } from '../utils/currency'
import { calcBalance, monthKey, monthLabel, prevMonth, nextMonth } from '../utils/balance'

const QUICK_ADD_IDS = ['aldi', 'coles', 'woolworths', 'gasolina', 'otro']

function BalanceCard({ status, diff, currency, onViewHistoric }) {
  const configs = {
    even:  { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Están al corriente' },
    owed:  { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Te deben' },
    owes:  { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Debes' },
  }
  const c = configs[status]
  return (
    <Card className={`p-5 ${c.bg}`}>
      <p className={`text-sm font-medium ${c.text} mb-1`}>{c.label}</p>
      {status !== 'even' && (
        <p className={`text-3xl font-bold ${c.text}`}>
          {formatAmount(Math.abs(diff), currency)}
        </p>
      )}
      {status === 'even' && (
        <p className={`text-2xl font-bold ${c.text}`}>✓</p>
      )}
      <button
        onClick={onViewHistoric}
        className={`flex items-center gap-1 text-xs font-medium mt-3 ${c.text}`}
      >
        Ver histórico completo <ChevronRight size={14} />
      </button>
    </Card>
  )
}

export function HomePage() {
  const { appUser, couple } = useApp()
  const navigate = useNavigate()
  const [month, setMonth] = useState(monthKey())
  const [expenses, setExpenses] = useState([])
  const [allExpenses, setAllExpenses] = useState([])

  useEffect(() => {
    if (!couple?.id) return
    return watchMonthExpenses(couple.id, month, setExpenses)
  }, [couple?.id, month])

  useEffect(() => {
    if (!couple?.id) return
    return watchAllExpenses(couple.id, setAllExpenses)
  }, [couple?.id])

  // The top balance card is the all-time consolidated balance (who owes
  // whom overall), independent of which month is selected below.
  const historicBalance = calcBalance(allExpenses, appUser?.uid)
  const balance = calcBalance(expenses, appUser?.uid)
  const currency = couple?.currency ?? appUser?.currency ?? 'AUD'
  const partnerName = couple?.user1Id === appUser?.uid ? couple?.user2Name : couple?.user1Name
  const partnerPhoto = couple?.user1Id === appUser?.uid ? couple?.user2PhotoUrl : couple?.user1PhotoUrl
  const isCurrentMonth = month === monthKey()
  const quickCategories = QUICK_ADD_IDS.map(id => CATEGORIES.find(c => c.id === id)).filter(Boolean)

  // Group recent expenses by date
  const recent = expenses.slice(0, 10)
  const grouped = recent.reduce((acc, e) => {
    const d = e.date?.toDate ? e.date.toDate() : new Date(e.date)
    const key = d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  const greeting = appUser?.name ? `Hola, ${appUser.name.split(' ')[0]}` : 'Hola'

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-5">
        <p className="text-gray-400 text-sm">{greeting}</p>
        <div className="flex items-center justify-between mt-1">
          <button onClick={() => setMonth(prevMonth(month))} className="text-amber-600 p-1">
            <ChevronLeft size={22} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 capitalize">{monthLabel(month)}</h2>
          <button
            onClick={() => setMonth(nextMonth(month))}
            disabled={isCurrentMonth}
            className="text-amber-600 p-1 disabled:opacity-30"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Balance */}
        <BalanceCard
          status={historicBalance.status}
          diff={historicBalance.diff}
          currency={currency}
          onViewHistoric={() => navigate('/historico')}
        />

        {/* Totals */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Avatar src={appUser?.photoUrl} name={appUser?.name} size={20} />
              <p className="text-xs text-gray-400">Tú pagaste</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{formatAmount(balance.myTotal, currency)}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Avatar src={partnerPhoto} name={partnerName} size={20} />
              <p className="text-xs text-gray-400">{partnerName || 'Pareja'} pagó</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{formatAmount(balance.partnerTotal, currency)}</p>
          </Card>
        </div>

        {/* Add expense */}
        <Button onClick={() => navigate('/add-expense')} className="w-full">
          <Plus size={18} /> Agregar gasto
        </Button>

        {/* Quick access shortcuts */}
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-2 px-1">Accesos rápidos</p>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {quickCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => navigate(`/add-expense?cat=${cat.id}`)}
                className="flex flex-col items-center gap-1 min-w-[64px]"
              >
                <CategoryIcon category={cat} size={48} />
                <span className="text-xs text-gray-600 text-center truncate w-full">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent expenses */}
        {Object.keys(grouped).length > 0 ? (
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2 px-1">Recientes</p>
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date} className="mb-3">
                <p className="text-xs text-gray-400 capitalize mb-1 px-1">{date}</p>
                <Card>
                  {items.map((e, i) => {
                    const cat = getCategoryById(e.category)
                    const isOwn = e.paidBy === appUser?.uid
                    return (
                      <div key={e.id} className={`flex items-center gap-3 px-4 py-3 ${i < items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <CategoryIcon category={cat} size={36} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {e.description || cat.label}
                          </p>
                          <p className="text-xs text-gray-400">{isOwn ? 'Tú' : e.paidByName}</p>
                        </div>
                        <p className={`text-sm font-semibold ${isOwn ? 'text-gray-900' : 'text-gray-400'}`}>
                          {formatAmount(e.amount, currency)}
                        </p>
                      </div>
                    )
                  })}
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Inbox size={40} className="mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm">No hay gastos este mes</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
