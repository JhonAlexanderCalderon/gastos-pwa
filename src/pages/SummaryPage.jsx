import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Triangle, Minus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { watchMonthExpenses, watchAllExpenses } from '../firebase/firestore'
import { BottomNav } from '../components/BottomNav'
import { Card } from '../components/ui/Card'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { CATEGORIES, CANASTA_FAMILIAR_IDS, CANASTA_FAMILIAR_CATEGORY } from '../utils/categories'
import { formatAmount } from '../utils/currency'
import { calcBalance, monthKey, monthLabel, prevMonth, nextMonth } from '../utils/balance'
import { monthlyAverageTotal, monthlyAverageByCategory } from '../utils/stats'

// Stock-market-style trend marker: triangle up = above the historical
// monthly average (spending more, shown in red), triangle down = below
// (spending less, shown in green). A dash means it's basically on par.
function Trend({ current, average, size = 14 }) {
  if (!average || average <= 0) return null
  const diffPct = (current - average) / average
  if (Math.abs(diffPct) < 0.02) return <Minus size={size} className="text-gray-300 shrink-0" />
  const above = diffPct > 0
  return (
    <Triangle
      size={size}
      className={`shrink-0 ${above ? 'text-red-500' : 'text-green-500'}`}
      fill="currentColor"
      strokeWidth={0}
      style={above ? undefined : { transform: 'rotate(180deg)' }}
    />
  )
}

export function SummaryPage() {
  const { appUser, couple } = useApp()
  const [month, setMonth] = useState(monthKey())
  const [expenses, setExpenses] = useState([])
  const [allExpenses, setAllExpenses] = useState([])

  const currency = couple?.currency ?? appUser?.currency ?? 'AUD'
  const isCurrentMonth = month === monthKey()

  useEffect(() => {
    if (!couple?.id) return
    return watchMonthExpenses(couple.id, month, setExpenses)
  }, [couple?.id, month])

  useEffect(() => {
    if (!couple?.id) return
    return watchAllExpenses(couple.id, setAllExpenses)
  }, [couple?.id])

  const balance = calcBalance(expenses, appUser?.uid)
  const avgTotal = monthlyAverageTotal(allExpenses)
  const avgByCategory = monthlyAverageByCategory(allExpenses)

  // Category breakdown
  const byCategory = CATEGORIES.map(cat => {
    const total = expenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0)
    return { ...cat, total }
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  // Same breakdown, but with the grocery/household categories folded into
  // a single "Canasta familiar" row for a quick frequent-spend overview.
  const canastaTotal = expenses
    .filter(e => CANASTA_FAMILIAR_IDS.includes(e.category))
    .reduce((s, e) => s + e.amount, 0)
  const canastaAvg = CANASTA_FAMILIAR_IDS.reduce((s, id) => s + (avgByCategory[id] ?? 0), 0)
  const grouped = [
    ...CATEGORIES
      .filter(c => !CANASTA_FAMILIAR_IDS.includes(c.id))
      .map(cat => ({
        ...cat,
        total: expenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
        avg: avgByCategory[cat.id],
      })),
    { ...CANASTA_FAMILIAR_CATEGORY, total: canastaTotal, avg: canastaAvg },
  ].filter(c => c.total > 0).sort((a, b) => b.total - a.total)

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
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Balance summary */}
        <Card className="p-5">
          <p className="text-xs text-gray-400 mb-3">Resumen del mes</p>
          <div className="flex justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400">Tú pagaste</p>
              <p className="text-lg font-bold text-gray-900">{formatAmount(balance.myTotal, currency)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">
                {couple?.user1Id === appUser?.uid ? couple?.user2Name : couple?.user1Name} pagó
              </p>
              <p className="text-lg font-bold text-gray-900">{formatAmount(balance.partnerTotal, currency)}</p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">Total del mes</p>
              <div className="flex items-center gap-1.5">
                <Trend current={balance.total} average={avgTotal} />
                <p className="text-sm font-semibold text-gray-900">{formatAmount(balance.total, currency)}</p>
              </div>
            </div>
            {avgTotal > 0 && (
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-400">Promedio histórico</p>
                <p className="text-xs text-gray-400">{formatAmount(avgTotal, currency)}</p>
              </div>
            )}
            {balance.status !== 'even' && (
              <div className="flex justify-between mt-1">
                <p className="text-sm text-gray-500">
                  {balance.status === 'owes' ? 'Debes' : 'Te deben'}
                </p>
                <p className={`text-sm font-semibold ${balance.status === 'owes' ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatAmount(Math.abs(balance.diff), currency)}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Category breakdown */}
        {byCategory.length > 0 && (
          <Card className="p-5">
            <p className="text-xs text-gray-400 mb-3">Por categoría</p>
            <div className="flex flex-col gap-3">
              {byCategory.map(cat => {
                const pct = balance.total > 0 ? (cat.total / balance.total) * 100 : 0
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={cat} size={26} />
                        <span className="text-sm text-gray-700">{cat.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Trend current={cat.total} average={avgByCategory[cat.id]} size={12} />
                        <span className="text-sm font-medium text-gray-900">{formatAmount(cat.total, currency)}</span>
                        <span className="text-xs text-gray-400 ml-1">{pct.toFixed(0)}%</span>
                      </div>
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

        {/* Grouped overview (groceries collapsed into one row) */}
        {grouped.length > 0 && (
          <Card className="p-5">
            <p className="text-xs text-gray-400 mb-3">Gastos generales agrupados</p>
            <div className="flex flex-col gap-3">
              {grouped.map(cat => {
                const pct = balance.total > 0 ? (cat.total / balance.total) * 100 : 0
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={cat} size={26} />
                        <span className="text-sm text-gray-700">{cat.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Trend current={cat.total} average={cat.avg} size={12} />
                        <span className="text-sm font-medium text-gray-900">{formatAmount(cat.total, currency)}</span>
                        <span className="text-xs text-gray-400 ml-1">{pct.toFixed(0)}%</span>
                      </div>
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
      </div>

      <BottomNav />
    </div>
  )
}
