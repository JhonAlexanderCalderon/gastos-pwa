import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, UtensilsCrossed, Wrench } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { addExpense } from '../firebase/firestore'
import { CATEGORY_GROUPS, getCategoryById } from '../utils/categories'
import { getCurrencySymbol } from '../utils/currency'
import { monthKey } from '../utils/balance'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { CategoryIcon } from '../components/ui/CategoryIcon'

function generateId() {
  return crypto.randomUUID()
}

export function AddExpensePage() {
  const { appUser, couple } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const catParam = searchParams.get('cat')
  const initialCategory = catParam ? getCategoryById(catParam).id : 'aldi'
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(initialCategory)
  const [subtype, setSubtype] = useState('comida')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const currency = couple?.currency ?? appUser?.currency ?? 'AUD'
  const symbol = getCurrencySymbol(currency)

  // Categories with a configured preset (currently just Renta) prefill the
  // amount so the whole flow is "pick category, hit save". Deliberately
  // keyed only on `category` — if it also watched `amount` it would
  // re-stomp the field every time the user cleared it to type a new value.
  useEffect(() => {
    if (getCategoryById(category).hasPreset && !amount) {
      setAmount(String(couple?.rentaDefaultAmount ?? 650))
    }
  }, [category])

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
      subtype: category === 'ocio' ? subtype : null,
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
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-5 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Agregar gasto</h1>
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
        <div className="flex flex-col gap-4">
          {CATEGORY_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-sm font-medium text-gray-700 mb-2">{group.label}</p>
              <div className="grid grid-cols-5 gap-2">
                {group.ids.map(id => {
                  const cat = getCategoryById(id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center gap-1 p-1.5 rounded-2xl text-xs transition-all ${
                        category === cat.id ? 'bg-amber-50 ring-2 ring-amber-400' : ''
                      }`}
                    >
                      <CategoryIcon category={cat} size={44} />
                      <span className="truncate w-full text-center text-gray-600">{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Ocio subtype */}
        {category === 'ocio' && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">¿Comida o servicio?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSubtype('comida')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium ${subtype === 'comida' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
              >
                <UtensilsCrossed size={16} /> Comida
              </button>
              <button
                type="button"
                onClick={() => setSubtype('servicio')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium ${subtype === 'servicio' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
              >
                <Wrench size={16} /> Servicio
              </button>
            </div>
          </div>
        )}

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
