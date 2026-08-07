import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link2, Heart } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { createCouple, joinCouple } from '../firebase/firestore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { CURRENCIES } from '../utils/currency'

export function CoupleSetupPage() {
  const { appUser } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState('create')
  const [currency, setCurrency] = useState(appUser?.currency ?? 'AUD')
  const [code, setCode] = useState('')
  const [createdCouple, setCreatedCouple] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e) {
    e.preventDefault()
    setLoading(true)
    const c = await createCouple({ user1Id: appUser.uid, user1Name: appUser.name, user1PhotoUrl: appUser.photoUrl, currency })
    setCreatedCouple(c)
    setLoading(false)
  }

  async function handleJoin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const c = await joinCouple({ inviteCode: code, user2Id: appUser.uid, user2Name: appUser.name, user2PhotoUrl: appUser.photoUrl })
    setLoading(false)
    if (!c) return setError('Código no válido. Verifica con tu pareja.')
    navigate('/home')
  }

  if (createdCouple) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center">
            <Link2 size={26} color="#B45309" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Grupo creado!</h2>
          <p className="text-gray-500 text-sm mb-6">Comparte este código con tu pareja</p>
          <Card className="p-6 mb-6">
            <p className="text-4xl font-bold tracking-widest text-gray-900 mb-2">
              {createdCouple.inviteCode}
            </p>
            <p className="text-xs text-gray-400">Código de invitación</p>
          </Card>
          <Button onClick={() => navigate('/home')} className="w-full">
            Ir al inicio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center">
            <Heart size={24} color="#B45309" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Vincular pareja</h1>
        </div>

        <div className="flex rounded-2xl bg-gray-100 p-1 mb-6">
          {['create', 'join'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              {t === 'create' ? 'Crear grupo' : 'Unirme'}
            </button>
          ))}
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Moneda del grupo</label>
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
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creando...' : 'Crear grupo'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <Input
              label="Código de invitación"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              error={error}
            />
            <Button type="submit" disabled={loading || code.length < 6} className="w-full">
              {loading ? 'Buscando...' : 'Unirme'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
