import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { watchAllExpenses } from '../firebase/firestore'
import { Card } from '../components/ui/Card'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { CATEGORIES } from '../utils/categories'
import { formatAmount } from '../utils/currency'
import { calcBalance } from '../utils/balance'
import { monthlyAverageTotal, monthlyAverageByCategory } from '../utils/stats'

export function HistoricPage() {
  const { appUser, couple } = useApp()
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState([])

  useEffect(() => {
    if (!couple?.id) return
    return watchAllExpenses(couple.id, setExpenses)
  }, [couple?.id])

  const currency = couple?.currency ?? appUser?.currency ?? 'AUD'
  const partnerName = couple?.user1Id === appUser?.uid ? couple?.user2Name : couple?.user1Name
  const balance = calcBalance(expenses, appUser?.uid)
  const avgTotal = monthlyAverageTotal(expenses)
  const avgByCategory = monthlyAverageByCategory(expenses)

  const ranked = CATEGORIES
    .map(cat => ({ ...cat, avg: avgByCategory[cat.id] ?? 0 }))
    .filter(c => c.avg > 0)
    .sort((a, b) => b.avg - a.avg)
  const topAvg = ranked[0]?.avg ?? 0

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-5 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Histórico</h1>
      </div>

      <div className="px-4 py-5 flex flex-col gap-4">
        {expenses.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">Aún no hay gastos registrados.</p>
          </div>
        ) : (
          <>
            {/* Overall historic balance */}
            <Card className="p-5">
              <p className="text-xs text-gray-400 mb-3">Balance histórico total</p>
              <div className="flex justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-400">Tú pagaste</p>
                  <p className="text-lg font-bold text-gray-900">{formatAmount(balance.myTotal, currency)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{partnerName || 'Pareja'} pagó</p>
                  <p className="text-lg font-bold text-gray-900">{formatAmount(balance.partnerTotal, currency)}</p>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                {balance.status === 'even' ? (
                  <p className="text-sm font-semibold text-green-700">Están al corriente</p>
                ) : (
                  <p className={`text-sm font-semibold ${balance.status === 'owes' ? 'text-orange-600' : 'text-green-600'}`}>
                    {balance.status === 'owes' ? 'Debes' : 'Te deben'} {formatAmount(Math.abs(balance.diff), currency)}
                  </p>
                )}
              </div>
            </Card>

            {/* Monthly average */}
            <Card className="p-5">
              <p className="text-xs text-gray-400 mb-1">Promedio de gasto mensual</p>
              <p className="text-2xl font-bold text-gray-900">{formatAmount(avgTotal, currency)}</p>
            </Card>

            {/* Ranking by category */}
            {ranked.length > 0 && (
              <Card className="p-5">
                <p className="text-xs text-gray-400 mb-3">En qué gastas más (promedio mensual)</p>
                <div className="flex flex-col gap-3">
                  {ranked.map(cat => {
                    const pct = topAvg > 0 ? (cat.avg / topAvg) * 100 : 0
                    return (
                      <div key={cat.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <CategoryIcon category={cat} size={28} />
                            <span className="text-sm text-gray-700">{cat.label}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{formatAmount(cat.avg, currency)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
