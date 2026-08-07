import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { addExpense } from '../firebase/firestore'
import { CATEGORIES } from '../utils/categories'
import { getCurrencySymbol } from '../utils/currency'
import { monthKey } from '../utils/balance'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

function generateId() {
  return crypto.randomUUID()
}

export function AddExpensePage() {
  const { appUser, couple } = useApp()
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('mercado')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const currency = couple?.currency ?? appUser?.currency ?? 'MXN'
  const symbol = getCurrencySymbol(currency)

  async function handleSubmit(e) {
    e.preventDefault()
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) return
    setLoading(true)
    const d = new Date(date + 'T12:00:00')
    await addExpense({
      id: generateId(),
      coupleId: couple.id,
      paidBy: appUser.uid,
      paidByName: appUser.name,
      amount: parsed,
      category,
      description: description.trim(),
      date: d,
      month: monthKey(d),
      createdAt: new Date(),
    })
    navigate('/home')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-violet-700 text-white px-5 pt-12 pb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-violet-200 text-xl">‹</button>
        <h1 className="text-lg font-semibold">Agregar gasto</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 flex flex-col gap-5">
        {/* Amount */}
        <div className="flex flex-col items-center bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-400 mb-2">¿Cuánto gastaste?</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-gray-400">{symbol}</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-5xl font-bold text-gray-900 bg-transparent outline-none w-48 text-center"
              required
              autoFocus
            />
          </div>
        </div>

        {/* Categories */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Categoría</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-2xl text-xs transition-all ${
                  category === cat.id
                    ? 'bg-violet-700 text-white'
                    : 'bg-white text-gray-500 border border-gray-100'
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="truncate w-full text-center">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <Input
          label="Descripción (opcional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Ej: Supermercado semanal"
          maxLength={80}
        />

        {/* Date */}
        <Input
          label="Fecha"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />

        <Button type="submit" disabled={loading || !amount} className="w-full mt-2">
          {loading ? 'Guardando...' : 'Guardar gasto'}
        </Button>
      </form>
    </div>
  )
}
