import { createContext, useContext, useEffect, useState } from 'react'
import {
  GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '../firebase/config'
import {
  saveUser, getUser, watchUser, watchCouple, updateCouple,
  watchRecurring, applyRecurringExpense,
} from '../firebase/firestore'
import { monthKey } from '../utils/balance'
import { CURRENCIES } from '../utils/currency'

const Ctx = createContext(null)

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

  // Self-heal a stale currency (e.g. couples created before the currency
  // list was trimmed to AUD/COP). The Settings dropdown can't be trusted
  // to fix this on its own: a <select> whose stored value isn't one of
  // its options silently falls back to showing the first option without
  // ever firing onChange, so the user sees "AUD" and has no reason to
  // touch it while the stored value is still the stale one underneath.
  useEffect(() => {
    if (!couple?.id) return
    if (!CURRENCIES.some(c => c.code === couple.currency)) {
      updateCouple(couple.id, { currency: 'AUD' })
    }
  }, [couple])

  // Watch scheduled/recurring expense templates
  useEffect(() => {
    if (!couple?.id) { setRecurring([]); return }
    return watchRecurring(couple.id, setRecurring)
  }, [couple?.id])

  // Auto-apply active templates the first time the app is opened in a new
  // month (in practice, within the first few days for an app used daily).
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

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const { uid, displayName, email, photoURL } = result.user
    const existing = await getUser(uid)
    await saveUser({
      uid, name: displayName ?? '', email, photoUrl: photoURL ?? '',
      ...(existing ? {} : { coupleId: null, currency: 'AUD' }),
    })
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
      signInWithGoogle, signOut,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useApp() {
  return useContext(Ctx)
}
