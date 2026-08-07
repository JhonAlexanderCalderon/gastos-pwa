// Returns { myTotal, partnerTotal, total, diff, status }
// diff > 0: partner owes me | diff < 0: I owe partner | diff ≈ 0: even
export function calcBalance(expenses, myUid) {
  let myTotal = 0
  let partnerTotal = 0
  for (const e of expenses) {
    if (e.paidBy === myUid) myTotal += e.amount
    else partnerTotal += e.amount
  }
  const total = myTotal + partnerTotal
  const fair = total / 2
  const diff = myTotal - fair
  const status = Math.abs(diff) < 0.01 ? 'even' : diff > 0 ? 'owed' : 'owes'
  return { myTotal, partnerTotal, total, diff, status }
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(key) {
  const [y, m] = key.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('es', { month: 'long', year: 'numeric' })
}

export function prevMonth(key) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return monthKey(d)
}

export function nextMonth(key) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m, 1)
  return monthKey(d)
}
