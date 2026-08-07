import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { saveUser } from '../firebase/firestore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { CURRENCIES } from '../utils/currency'

export function OnboardingPage() {
  const { firebaseUser } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState(firebaseUser?.displayName ?? '')
  const [currency, setCurrency] = useState('AUD')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await saveUser({ uid: firebaseUser.uid, name: name.trim(), currency })
    navigate('/couple-setup')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl">
            👋
          </div>
          <h1 className="text-2xl font-bold text-gray-900">¡Hola!</h1>
          <p className="text-gray-500 text-sm mt-1">Cuéntanos un poco sobre ti</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="¿Cómo te llamas?"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tu nombre"
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Moneda</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>

          <Button type="submit" disabled={loading || !name.trim()} className="w-full mt-2">
            {loading ? 'Guardando...' : 'Continuar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
