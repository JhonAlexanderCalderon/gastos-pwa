import { createContext, useContext, useEffect, useState } from 'react'
import {
  GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '../firebase/config'
import { saveUser, watchUser, watchCouple } from '../firebase/firestore'

const Ctx = createContext(null)

export function AppProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined) // undefined = loading
  const [appUser, setAppUser] = useState(null)
  const [couple, setCouple] = useState(null)

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

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const { uid, displayName, email, photoURL } = result.user
    await saveUser({ uid, name: displayName ?? '', email, photoUrl: photoURL ?? '', coupleId: null, currency: 'MXN' })
  }

  async function signOut() {
    await fbSignOut(auth)
    setAppUser(null)
    setCouple(null)
  }

  const loading = firebaseUser === undefined

  return (
    <Ctx.Provider value={{ firebaseUser, appUser, couple, loading, signInWithGoogle, signOut }}>
      {children}
    </Ctx.Provider>
  )
}

export function useApp() {
  return useContext(Ctx)
}
