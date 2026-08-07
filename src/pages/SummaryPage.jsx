import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { watchMonthExpenses, saveSettlement, getSettlement, watchSettlements } from '../firebase/firestore'
import { BottomNav } from '../components/BottomNav'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { getCategoryById, CATEGORIES } from '../utils/categories'
import { formatAmount } from '../utils/currency'
import { calcBalance, monthKey, monthLabel, prevMonth, nextMonth } from '../utils/balance'

export function SummaryPage() {
  const { appUser, couple } = useApp()
  const [month, setMonth] = useState(monthKey())
  const [expenses, setExpenses] = useState([])
  const [settlement, setSettlement] = useState(undefined)
  const [settlements, setSettlements] = useState([])
  const [closing, setClosing] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const currency = couple?.currency ?? appUser?.currency ?? 'MXN'
  const isCurrentMonth = month === monthKey()

  useEffect(() => {
    if (!couple?.id) return
    return watchMonthExpenses(couple.id, month, setExpenses)
  }, [couple?.id, month])

  useEffect(() => {
    if (!couple?.id) return
    getSettlement(couple.id, month).then(setSettlement)
  }, [couple?.id, month])

  useEffect(() => {
    if (!couple?.id) return
    return watchSettlements(couple.id, s => setSettlements(s.slice(0, 5)))
  }, [couple?.id])

  const balance = calcBalance(expenses, appUser?.uid)

  // Category breakdown
  const byCategory = CATEGORIES.map(cat => {
    const total = expenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0)
    return { ...cat, total }
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  async function handleClose() {
    setClosing(true)
    const { myTotal, partnerTotal, total, diff } = balance
    const partnerName = couple.user1Id === appUser.uid ? couple.user2Name : couple.user1Name
    const partnerId   = couple.user1Id === appUser.uid ? couple.user2Id   : couple.user1Id
    const settlement = {
      month,
      whoOwesId:   diff < 0 ? appUser.uid : partnerId,
      whoOwesName: diff < 0 ? appUser.name : partnerName,
      owedToId:    diff < 0 ? partnerId : appUser.uid,
      owedToName:  diff < 0 ? partnerName : appUser.name,
      amount: Math.abs(diff),
      closedAt: new Date(),
      totalExpenses: total,
      user1Total: couple.user1Id === appUser.uid ? myTotal : partnerTotal,
      user2Total: couple.user1Id === appUser.uid ? partnerTotal : myTotal,
    }
    await saveSettlement(couple.id, settlement)
    setSettlement(settlement)
    setConfirm(false)
    setClosing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-violet-700 text-white px-5 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setMonth(prevMonth(month))} className="text-violet-200 text-xl p-1">‹</button>
          <h2 className="text-lg font-semibold capitalize">{monthLabel(month)}</h2>
          <button
            onClick={() => setMonth(nextMonth(month))}
            disabled={isCurrentMonth}
            className="text-violet-200 text-xl p-1 disabled:opacity-30"
          >›</button>
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
            <div className="flex justify-between">
              <p className="text-sm text-gray-500">Total del mes</p>
              <p className="text-sm font-semibold text-gray-900">{formatAmount(balance.total, currency)}</p>
            </div>
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
                        <span className="text-base">{cat.icon}</span>
                        <span className="text-sm text-gray-700">{cat.label}</span>
                      </div>
                      <div className="text-right">
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

        {/* Close month */}
        {settlement === null && isCurrentMonth && expenses.length > 0 && !confirm && (
          <Button onClick={() => setConfirm(true)} variant="secondary" className="w-full">
            Cerrar mes
          </Button>
        )}

        {confirm && (
          <Card className="p-5 bg-violet-50">
            <p className="text-sm font-semibold text-violet-900 mb-1">¿Cerrar {monthLabel(month)}?</p>
            <p className="text-xs text-violet-700 mb-4">
              {balance.status === 'even'
                ? 'Están al corriente, no hay deuda.'
                : balance.status === 'owes'
                ? `Debes ${formatAmount(Math.abs(balance.diff), currency)}`
                : `Te deben ${formatAmount(Math.abs(balance.diff), currency)}`
              }
            </p>
            <div className="flex gap-3">
              <Button onClick={handleClose} disabled={closing} className="flex-1">
                {closing ? '...' : 'Confirmar'}
              </Button>
              <Button onClick={() => setConfirm(false)} variant="ghost" className="flex-1">
                Cancelar
              </Button>
            </div>
          </Card>
        )}

        {settlement && (
          <Card className="p-4 bg-green-50">
            <p className="text-xs text-green-700 font-semibold">✓ Mes cerrado</p>
            {settlement.amount > 0.01 && (
              <p className="text-sm text-green-800 mt-1">
                {settlement.whoOwesName} debía {formatAmount(settlement.amount, currency)} a {settlement.owedToName}
              </p>
            )}
          </Card>
        )}

        {/* Past settlements */}
        {settlements.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2 px-1">Meses cerrados</p>
            <Card>
              {settlements.map((s, i) => (
                <div key={s.id} className={`flex items-center justify-between px-4 py-3 ${i < settlements.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{monthLabel(s.month)}</p>
                    <p className="text-xs text-gray-400">{formatAmount(s.totalExpenses, currency)} total</p>
                  </div>
                  {s.amount > 0.01 ? (
                    <p className="text-xs text-gray-500 text-right">
                      {s.whoOwesName}<br/>debía {formatAmount(s.amount, currency)}
                    </p>
                  ) : (
                    <p className="text-xs text-green-600">Al corriente</p>
                  )}
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
