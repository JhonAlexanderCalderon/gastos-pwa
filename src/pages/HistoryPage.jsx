import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Inbox, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { watchMonthExpenses, deleteExpense } from '../firebase/firestore'
import { BottomNav } from '../components/BottomNav'
import { Card } from '../components/ui/Card'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { getCategoryById } from '../utils/categories'
import { formatAmount } from '../utils/currency'
import { monthKey, monthLabel, prevMonth, nextMonth } from '../utils/balance'

const SUBTYPE_LABEL = { comida: 'Comida', servicio: 'Servicio' }

export function HistoryPage() {
  const { appUser, couple } = useApp()
  const [month, setMonth] = useState(monthKey())
  const [expenses, setExpenses] = useState([])
  const [deleting, setDeleting] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const currency = couple?.currency ?? appUser?.currency ?? 'AUD'
  const isCurrentMonth = month === monthKey()

  useEffect(() => {
    if (!couple?.id) return
    return watchMonthExpenses(couple.id, month, setExpenses)
  }, [couple?.id, month])

  async function handleDelete(id) {
    setDeleting(id)
    await deleteExpense(couple.id, id)
    setConfirmId(null)
    setDeleting(null)
  }

  // Group by date
  const grouped = expenses.reduce((acc, e) => {
    const d = e.date?.toDate ? e.date.toDate() : new Date(e.date)
    const key = d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-5">
        <div className="flex items-center justify-between">
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
        <p className="text-center text-gray-400 text-sm mt-1">
          {expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'} · {formatAmount(expenses.reduce((s, e) => s + e.amount, 0), currency)}
        </p>
      </div>

      <div className="px-4 py-4">
        {Object.keys(grouped).length > 0 ? (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="mb-4">
              <p className="text-xs text-gray-400 capitalize mb-2 px-1">{date}</p>
              <Card>
                {items.map((e, i) => {
                  const cat = getCategoryById(e.category)
                  const isOwn = e.paidBy === appUser?.uid
                  return (
                    <div key={e.id}>
                      {confirmId === e.id && (
                        <div className="flex items-center justify-between px-4 py-2 bg-red-50">
                          <p className="text-sm text-red-700">¿Eliminar este gasto?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(e.id)}
                              disabled={deleting === e.id}
                              className="text-xs font-semibold text-red-700 bg-red-100 rounded-lg px-3 py-1"
                            >
                              {deleting === e.id ? '...' : 'Sí'}
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg px-3 py-1"
                            >
                              No
                            </button>
                          </div>
                        </div>
                      )}
                      <div className={`flex items-center gap-3 px-4 py-3 ${i < items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <CategoryIcon category={cat} size={36} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {e.description || cat.label}
                          </p>
                          <p className="text-xs text-gray-400">
                            {isOwn ? 'Tú' : e.paidByName}
                            {e.subtype && SUBTYPE_LABEL[e.subtype] ? ` · ${SUBTYPE_LABEL[e.subtype]}` : ''}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatAmount(e.amount, currency)}
                        </p>
                        {isOwn && (
                          <button
                            onClick={() => setConfirmId(confirmId === e.id ? null : e.id)}
                            className="text-gray-300 hover:text-red-400 ml-1"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </Card>
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Inbox size={40} className="mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm">No hay gastos este mes</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
