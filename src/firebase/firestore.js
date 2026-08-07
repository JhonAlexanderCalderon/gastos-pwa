import {
  collection, doc, getDoc, setDoc, updateDoc,
  query, where, orderBy, onSnapshot, addDoc,
  deleteDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

// ─── USERS ────────────────────────────────────────────────

export function saveUser(user) {
  return setDoc(doc(db, 'users', user.uid), user, { merge: true })
}

export function watchUser(uid, cb) {
  return onSnapshot(doc(db, 'users', uid), snap =>
    cb(snap.exists() ? snap.data() : null)
  )
}

export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

// ─── COUPLES ──────────────────────────────────────────────

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function createCouple({ user1Id, user1Name, currency }) {
  const ref = doc(collection(db, 'couples'))
  const couple = {
    id: ref.id,
    user1Id,
    user1Name,
    user2Id: '',
    user2Name: '',
    currency,
    inviteCode: generateCode(),
    createdAt: serverTimestamp(),
  }
  await setDoc(ref, couple)
  await setDoc(doc(db, 'users', user1Id), { coupleId: ref.id }, { merge: true })
  return couple
}

export async function joinCouple({ inviteCode, user2Id, user2Name }) {
  const q = query(
    collection(db, 'couples'),
    where('inviteCode', '==', inviteCode.toUpperCase()),
    where('user2Id', '==', '')
  )
  return new Promise((resolve, reject) => {
    const unsub = onSnapshot(q, async snap => {
      unsub()
      if (snap.empty) return resolve(null)
      const ref = snap.docs[0].ref
      await updateDoc(ref, { user2Id, user2Name })
      await setDoc(doc(db, 'users', user2Id), { coupleId: snap.docs[0].id }, { merge: true })
      const updated = await getDoc(ref)
      resolve({ id: updated.id, ...updated.data() })
    }, reject)
  })
}

export function watchCouple(coupleId, cb) {
  return onSnapshot(doc(db, 'couples', coupleId), snap =>
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  )
}

// ─── EXPENSES ─────────────────────────────────────────────

export async function addExpense(expense) {
  const ref = doc(db, 'couples', expense.coupleId, 'expenses', expense.id)
  return setDoc(ref, expense)
}

export async function deleteExpense(coupleId, expenseId) {
  return deleteDoc(doc(db, 'couples', coupleId, 'expenses', expenseId))
}

export function watchMonthExpenses(coupleId, month, cb) {
  const q = query(
    collection(db, 'couples', coupleId, 'expenses'),
    where('month', '==', month),
    orderBy('date', 'desc')
  )
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

// ─── SETTLEMENTS ──────────────────────────────────────────

export async function saveSettlement(coupleId, settlement) {
  return setDoc(
    doc(db, 'couples', coupleId, 'settlements', settlement.month),
    settlement
  )
}

export function watchSettlements(coupleId, cb) {
  const q = query(
    collection(db, 'couples', coupleId, 'settlements'),
    orderBy('closedAt', 'desc')
  )
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

export async function getSettlement(coupleId, month) {
  const snap = await getDoc(doc(db, 'couples', coupleId, 'settlements', month))
  return snap.exists() ? snap.data() : null
}
