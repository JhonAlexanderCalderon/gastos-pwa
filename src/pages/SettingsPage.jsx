import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { saveUser } from '../firebase/firestore'
import { BottomNav } from '../components/BottomNav'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { CURRENCIES } from '../utils/currency'

export function SettingsPage() {
  const { appUser, couple, signOut } = useApp()
  const navigate = useNavigate()
  const [editName, setEditName] = useState(false)
  const [name, setName] = useState(appUser?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const partnerName = couple?.user1Id === appUser?.uid ? couple?.user2Name : couple?.user1Name

  async function handleSaveName() {
    if (!name.trim()) return
    setSaving(true)
    await saveUser({ uid: appUser.uid, name: name.trim() })
    setEditName(false)
    setSaving(false)
  }

  async function handleCurrencyChange(e) {
    await saveUser({ uid: appUser.uid, currency: e.target.value })
  }

  function copyCode() {
    navigator.clipboard.writeText(couple?.inviteCode ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-violet-700 text-white px-5 pt-12 pb-6">
        <h1 className="text-xl font-bold">Ajustes</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Profile */}
        <Card className="p-5">
          <p className="text-xs text-gray-400 mb-3">Perfil</p>
          <div className="flex items-center gap-3 mb-4">
            {appUser?.photoUrl ? (
              <img src={appUser.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-lg">
                {appUser?.name?.[0] ?? '?'}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{appUser?.name}</p>
              <p className="text-xs text-gray-400">{appUser?.email}</p>
            </div>
          </div>

          {editName ? (
            <div className="flex flex-col gap-2">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre"
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveName} disabled={saving} className="flex-1">
                  {saving ? '...' : 'Guardar'}
                </Button>
                <Button onClick={() => setEditName(false)} variant="ghost" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setEditName(true)} variant="secondary" className="w-full">
              Editar nombre
            </Button>
          )}
        </Card>

        {/* Currency */}
        <Card className="p-5">
          <p className="text-xs text-gray-400 mb-2">Moneda</p>
          <select
            defaultValue={appUser?.currency ?? 'MXN'}
            onChange={handleCurrencyChange}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-500"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </Card>

        {/* Couple */}
        {couple && (
          <Card className="p-5">
            <p className="text-xs text-gray-400 mb-3">Pareja</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                {partnerName?.[0] ?? '?'}
              </div>
              <div>
                <p className="font-medium text-gray-900">{partnerName || 'Esperando pareja...'}</p>
                <p className="text-xs text-gray-400">Pareja vinculada</p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
              <div>
                <p className="text-xs text-gray-400">Código de invitación</p>
                <p className="font-bold tracking-widest text-violet-700">{couple.inviteCode}</p>
              </div>
              <button
                onClick={copyCode}
                className="text-sm font-medium text-violet-700 bg-violet-100 rounded-xl px-3 py-1.5"
              >
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          </Card>
        )}

        {/* Sign out */}
        <Button onClick={handleSignOut} variant="danger" className="w-full">
          Cerrar sesión
        </Button>
      </div>

      <BottomNav />
    </div>
  )
}
