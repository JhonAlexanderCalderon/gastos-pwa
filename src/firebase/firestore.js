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

export async function createCouple({ user1Id, user1Name, user1PhotoUrl, currency }) {
  const ref = doc(collection(db, 'couples'))
  const couple = {
    id: ref.id,
    user1Id,
    user1Name,
    user1PhotoUrl: user1PhotoUrl ?? '',
    user2Id: '',
    user2Name: '',
    user2PhotoUrl: '',
    currency,
    inviteCode: generateCode(),
    createdAt: serverTimestamp(),
  }
  await setDoc(ref, couple)
  await setDoc(doc(db, 'users', user1Id), { coupleId: ref.id }, { merge: true })
  return couple
}

export async function joinCouple({ inviteCode, user2Id, user2Name, user2PhotoUrl }) {
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
      await updateDoc(ref, { user2Id, user2Name, user2PhotoUrl: user2PhotoUrl ?? '' })
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

// Partial update of the shared couple doc (currency, rentaDefaultAmount, etc).
// users/{uid} security rules only allow reading your own doc, so anything
// the partner needs to see (photo, name, currency...) is denormalized here.
export function updateCouple(coupleId, fields) {
  return updateDoc(doc(db, 'couples', coupleId), fields)
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

// ─── RECURRING (gastos programados) ──────────────────────

export function saveRecurring(coupleId, recurring) {
  const ref = doc(db, 'couples', coupleId, 'recurring', recurring.id)
  return setDoc(ref, recurring, { merge: true })
}

export function deleteRecurring(coupleId, recurringId) {
  return deleteDoc(doc(db, 'couples', coupleId, 'recurring', recurringId))
}

export function watchRecurring(coupleId, cb) {
  return onSnapshot(collection(db, 'couples', coupleId, 'recurring'), snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

// Idempotent: deterministic expense id means re-running for the same
// recurring+month never creates a duplicate, even if both partners'
// clients trigger the auto-apply at the same time.
export async function applyRecurringExpense(recurring, month) {
  const expenseRef = doc(db, 'couples', recurring.coupleId, 'expenses', `recurring_${recurring.id}_${month}`)
  await setDoc(expenseRef, {
    id: expenseRef.id,
    coupleId: recurring.coupleId,
    paidBy: recurring.payerId,
    paidByName: recurring.payerName,
    amount: recurring.amount,
    category: recurring.category,
    description: recurring.label || '',
    date: new Date(),
    month,
    createdAt: serverTimestamp(),
    recurringId: recurring.id,
  })
  await setDoc(
    doc(db, 'couples', recurring.coupleId, 'recurring', recurring.id),
    { lastAppliedMonth: month },
    { merge: true }
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
