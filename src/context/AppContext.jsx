import { createContext, useContext, useEffect, useState } from 'react'
import {
  GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '../firebase/config'
import {
  saveUser, watchUser, watchCouple, updateCouple,
  watchRecurring, applyRecurringExpense, addExpense,
} from '../firebase/firestore'
import { monthKey } from '../utils/balance'

const Ctx = createContext(null)

function generateId() {
  return crypto.randomUUID()
}

export function AppProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined) // undefined = loading
  const [appUser, setAppUser] = useState(null)
  const [couple, setCouple] = useState(null)
  const [recurring, setRecurring] = useState([])

  // Auth state
  useEffect(() => {
    return onAuthStateChanged(auth, async fbUser => {
      setFirebaseUser(fbUser ?? null)
      if (!fbUser) { setAppUser(null); setCouple(null) }
    })
  }, [])

  // Watch appUser doc
  useEffect(() => {
    if (!firebaseUser) return
    return watchUser(firebaseUser.uid, u => setAppUser(u))
  }, [firebaseUser])

  // Watch couple doc
  useEffect(() => {
    if (!appUser?.coupleId) { setCouple(null); return }
    return watchCouple(appUser.coupleId, c => setCouple(c))
  }, [appUser?.coupleId])

  // Keep the denormalized photo on the couple doc in sync with the Google
  // profile photo (users/{uid} isn't readable by the partner, so their
  // avatar has to live on the shared couple doc instead).
  useEffect(() => {
    if (!couple?.id || !appUser?.photoUrl) return
    const mySlot = couple.user1Id === appUser.uid ? 'user1PhotoUrl' : 'user2PhotoUrl'
    if (couple[mySlot] !== appUser.photoUrl) {
      updateCouple(couple.id, { [mySlot]: appUser.photoUrl })
    }
  }, [couple, appUser?.uid, appUser?.photoUrl])

  // Watch scheduled/recurring expense templates
  useEffect(() => {
    if (!couple?.id) { setRecurring([]); return }
    return watchRecurring(couple.id, setRecurring)
  }, [couple?.id])

  // Auto-apply active templates on/after day 1 of the month.
  // Idempotent (deterministic expense id), so this safely self-stabilizes
  // even if it re-runs or fires on both partners' devices at once.
  useEffect(() => {
    if (!couple?.id) return
    const month = monthKey()
    for (const r of recurring) {
      if (r.active && r.lastAppliedMonth !== month) {
        applyRecurringExpense({ ...r, coupleId: couple.id }, month)
      }
    }
  }, [couple?.id, recurring])

  async function payRecurringNow(r) {
    const d = new Date()
    await addExpense({
      id: generateId(),
      coupleId: couple.id,
      paidBy: r.payerId,
      paidByName: r.payerName,
      amount: r.amount,
      category: r.category,
      description: r.label || '',
      date: d,
      month: monthKey(d),
      createdAt: new Date(),
      recurringId: r.id,
    })
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const { uid, displayName, email, photoURL } = result.user
    await saveUser({ uid, name: displayName ?? '', email, photoUrl: photoURL ?? '', coupleId: null, currency: 'AUD' })
  }

  async function signOut() {
    await fbSignOut(auth)
    setAppUser(null)
    setCouple(null)
  }

  const loading = firebaseUser === undefined

  return (
    <Ctx.Provider value={{
      firebaseUser, appUser, couple, loading, recurring,
      signInWithGoogle, signOut, payRecurringNow,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useApp() {
  return useContext(Ctx)
}
