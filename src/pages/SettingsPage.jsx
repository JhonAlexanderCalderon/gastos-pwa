import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Copy, Plus, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { saveUser, saveRecurring, deleteRecurring, updateCouple } from '../firebase/firestore'
import { BottomNav } from '../components/BottomNav'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { Avatar } from '../components/ui/Avatar'
import { CURRENCIES, formatAmount, getCurrencySymbol } from '../utils/currency'
import { CATEGORIES, getCategoryById } from '../utils/categories'
import { sanitizeDecimal } from '../utils/number'

const RENTA_DEFAULT_FALLBACK = 650

function generateId() {
  return crypto.randomUUID()
}

export function SettingsPage() {
  const { appUser, couple, recurring, signOut } = useApp()
  const navigate = useNavigate()
  const [editName, setEditName] = useState(false)
  const [name, setName] = useState(appUser?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [newCategory, setNewCategory] = useState('renta')
  const newAmountRef = useRef(null)
  const [newLabel, setNewLabel] = useState('')
  const [newPayerId, setNewPayerId] = useState(appUser?.uid ?? '')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [rentaSaved, setRentaSaved] = useState(false)
  const [rentaFocused, setRentaFocused] = useState(false)
  const rentaDefaultRef = useRef(null)
  const [amountFocused, setAmountFocused] = useState(false)

  const currency = couple?.currency ?? appUser?.currency ?? 'AUD'
  const partnerId = couple?.user1Id === appUser?.uid ? couple?.user2Id : couple?.user1Id
  const partnerName = couple?.user1Id === appUser?.uid ? couple?.user2Name : couple?.user1Name
  const partnerPhoto = couple?.user1Id === appUser?.uid ? couple?.user2PhotoUrl : couple?.user1PhotoUrl

  async function handleSaveName() {
    if (!name.trim()) return
    setSaving(true)
    await saveUser({ uid: appUser.uid, name: name.trim() })
    setEditName(false)
    setSaving(false)
  }

  async function handleCurrencyChange(e) {
    const value = e.target.value
    await saveUser({ uid: appUser.uid, currency: value })
    // couple.currency is what's actually used to format amounts app-wide,
    // so it must be kept in sync too (not just the personal fallback).
    if (couple?.id) await updateCouple(couple.id, { currency: value })
  }

  async function handleRentaDefaultBlur(e) {
    const amount = parseFloat(e.target.value)
    if (!amount || amount <= 0 || amount === (couple?.rentaDefaultAmount ?? RENTA_DEFAULT_FALLBACK)) return
    await updateCouple(couple.id, { rentaDefaultAmount: amount })
    setRentaSaved(true)
    setTimeout(() => setRentaSaved(false), 1500)
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

  async function handleAddRecurring(e) {
    e.preventDefault()
    const amount = parseFloat(sanitizeDecimal(newAmountRef.current?.value ?? ''))
    if (!amount || amount <= 0 || !newPayerId) return
    const payerName = newPayerId === appUser.uid ? appUser.name : partnerName
    await saveRecurring(couple.id, {
      id: generateId(),
      category: newCategory,
      label: newLabel.trim(),
      amount,
      payerId: newPayerId,
      payerName,
      active: true,
      lastAppliedMonth: null,
      createdAt: new Date(),
    })
    if (newAmountRef.current) newAmountRef.current.value = ''
    setNewLabel('')
    setShowForm(false)
  }

  async function toggleActive(r) {
    await saveRecurring(couple.id, { id: r.id, active: !r.active })
  }

  async function handleDeleteRecurring(id) {
    await deleteRecurring(couple.id, id)
    setConfirmDeleteId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-5">
        <h1 className="text-xl font-bold text-gray-900">Ajustes</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Profile */}
        <Card className="p-5">
          <p className="text-xs text-gray-400 mb-3">Perfil</p>
          <div className="flex items-center gap-3 mb-4">
            <Avatar src={appUser?.photoUrl} name={appUser?.name} size={48} />
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
          <p className="text-xs text-gray-400 mb-2">{couple ? 'Moneda de la pareja' : 'Moneda'}</p>
          <select
            defaultValue={currency}
            onChange={handleCurrencyChange}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-amber-500"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </Card>

        {/* Renta default amount */}
        {couple && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-400">Valor por defecto de Renta</p>
              {rentaFocused && (
                <button
                  type="button"
                  onClick={() => rentaDefaultRef.current?.blur()}
                  className="text-xs font-semibold text-amber-700 bg-amber-100 rounded-lg px-2.5 py-1"
                >
                  Listo
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-3">Se precarga al agregar un gasto de Renta, para que solo tengas que guardar.</p>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">{getCurrencySymbol(currency)}</span>
              <input
                ref={rentaDefaultRef}
                type="text"
                inputMode="decimal"
                defaultValue={couple?.rentaDefaultAmount ?? RENTA_DEFAULT_FALLBACK}
                onChange={e => { e.target.value = sanitizeDecimal(e.target.value) }}
                onFocus={() => setRentaFocused(true)}
                onBlur={e => { setRentaFocused(false); handleRentaDefaultBlur(e) }}
                className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-amber-500"
              />
              {rentaSaved && <Check size={18} className="text-green-600 shrink-0" />}
            </div>
          </Card>
        )}

        {/* Scheduled expenses */}
        {couple && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-400">Gastos programados</p>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 rounded-lg px-2.5 py-1.5"
                >
                  <Plus size={14} /> Agregar
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-3">Se agregan automáticamente al comenzar cada mes.</p>

            {recurring.length > 0 && (
              <div className="flex flex-col gap-1 mb-3">
                {recurring.map(r => {
                  const cat = getCategoryById(r.category)
                  return (
                    <div key={r.id}>
                      {confirmDeleteId === r.id ? (
                        <div className="flex items-center justify-between px-2 py-2 bg-red-50 rounded-xl">
                          <p className="text-xs text-red-700">¿Eliminar "{cat.label}"?</p>
                          <div className="flex gap-2">
                            <button onClick={() => handleDeleteRecurring(r.id)} className="text-xs font-semibold text-red-700 bg-red-100 rounded-lg px-3 py-1">Sí</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg px-3 py-1">No</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 py-2">
                          <CategoryIcon category={cat} size={36} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{r.label || cat.label}</p>
                            <p className="text-xs text-gray-400">{r.payerName} · {formatAmount(r.amount, currency)}</p>
                          </div>
                          <button
                            onClick={() => toggleActive(r)}
                            className={`text-xs font-medium rounded-lg px-2 py-1 ${r.active ? 'text-green-700 bg-green-50' : 'text-gray-400 bg-gray-100'}`}
                          >
                            {r.active ? 'Activo' : 'Pausado'}
                          </button>
                          <button onClick={() => setConfirmDeleteId(r.id)} className="text-gray-300 hover:text-red-400 p-1">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {showForm && (
              <form onSubmit={handleAddRecurring} className="flex flex-col gap-3 pt-3 border-t border-gray-100">
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewCategory(cat.id)}
                      className={`flex flex-col items-center gap-1 p-1.5 rounded-xl ${newCategory === cat.id ? 'bg-amber-50 ring-2 ring-amber-400' : ''}`}
                    >
                      <CategoryIcon category={cat} size={30} />
                    </button>
                  ))}
                </div>
                <Input
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder={`Nombre (ej: ${getCategoryById(newCategory).label})`}
                  maxLength={40}
                />
                <div>
                  {amountFocused && (
                    <div className="flex justify-end mb-1">
                      <button
                        type="button"
                        onClick={() => newAmountRef.current?.blur()}
                        className="text-xs font-semibold text-amber-700 bg-amber-100 rounded-lg px-2.5 py-1"
                      >
                        Listo
                      </button>
                    </div>
                  )}
                  <Input
                    ref={newAmountRef}
                    type="text"
                    inputMode="decimal"
                    defaultValue=""
                    onChange={e => { e.target.value = sanitizeDecimal(e.target.value) }}
                    onFocus={() => setAmountFocused(true)}
                    onBlur={() => setAmountFocused(false)}
                    placeholder="Monto"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPayerId(appUser.uid)}
                    className={`flex-1 py-2.5 rounded-2xl text-sm font-medium ${newPayerId === appUser.uid ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    Yo pago
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPayerId(partnerId)}
                    disabled={!partnerId}
                    className={`flex-1 py-2.5 rounded-2xl text-sm font-medium disabled:opacity-40 ${newPayerId === partnerId ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {partnerName || 'Pareja'} paga
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Guardar</Button>
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
              </form>
            )}
          </Card>
        )}

        {/* Couple */}
        {couple && (
          <Card className="p-5">
            <p className="text-xs text-gray-400 mb-3">Pareja</p>
            <div className="flex items-center gap-3 mb-4">
              <Avatar src={partnerPhoto} name={partnerName} size={40} />
              <div>
                <p className="font-medium text-gray-900">{partnerName || 'Esperando pareja...'}</p>
                <p className="text-xs text-gray-400">Pareja vinculada</p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
              <div>
                <p className="text-xs text-gray-400">Código de invitación</p>
                <p className="font-bold tracking-widest text-gray-900">{couple.inviteCode}</p>
              </div>
              <button
                onClick={copyCode}
                className="flex items-center gap-1 text-sm font-medium text-amber-800 bg-amber-100 rounded-xl px-3 py-1.5"
              >
                {copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
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
