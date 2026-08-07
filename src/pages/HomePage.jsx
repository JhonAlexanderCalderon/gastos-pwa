import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { watchMonthExpenses } from '../firebase/firestore'
import { BottomNav } from '../components/BottomNav'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { getCategoryById } from '../utils/categories'
import { formatAmount } from '../utils/currency'
import { calcBalance, monthKey, monthLabel, prevMonth, nextMonth } from '../utils/balance'

function BalanceCard({ status, diff, currency }) {
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
    </Card>
  )
}

export function HomePage() {
  const { appUser, couple } = useApp()
  const navigate = useNavigate()
  const [month, setMonth] = useState(monthKey())
  const [expenses, setExpenses] = useState([])

  useEffect(() => {
    if (!couple?.id) return
    return watchMonthExpenses(couple.id, month, setExpenses)
  }, [couple?.id, month])

  const balance = calcBalance(expenses, appUser?.uid)
  const currency = couple?.currency ?? appUser?.currency ?? 'MXN'
  const partnerName = couple?.user1Id === appUser?.uid ? couple?.user2Name : couple?.user1Name
  const isCurrentMonth = month === monthKey()

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
      <div className="bg-violet-700 text-white px-5 pt-12 pb-6">
        <p className="text-violet-200 text-sm">{greeting}</p>
        <div className="flex items-center justify-between mt-1">
          <button onClick={() => setMonth(prevMonth(month))} className="text-violet-200 text-xl p-1">‹</button>
          <h2 className="text-lg font-semibold capitalize">{monthLabel(month)}</h2>
          <button
            onClick={() => setMonth(nextMonth(month))}
            disabled={isCurrentMonth}
            className="text-violet-200 text-xl p-1 disabled:opacity-30"
          >›</button>
        </div>
      </div>

      <div className="px-4 -mt-4 flex flex-col gap-4">
        {/* Balance */}
        <BalanceCard status={balance.status} diff={balance.diff} currency={currency} />

        {/* Totals */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-xs text-gray-400 mb-1">Tú pagaste</p>
            <p className="text-lg font-bold text-gray-900">{formatAmount(balance.myTotal, currency)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-400 mb-1">{partnerName || 'Pareja'} pagó</p>
            <p className="text-lg font-bold text-gray-900">{formatAmount(balance.partnerTotal, currency)}</p>
          </Card>
        </div>

        {/* Add expense */}
        <Button onClick={() => navigate('/add-expense')} className="w-full">
          + Agregar gasto
        </Button>

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
                        <span className="text-xl w-8 text-center">{cat.icon}</span>
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
            <p className="text-4xl mb-2">📭</p>
            <p className="text-sm">No hay gastos este mes</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
