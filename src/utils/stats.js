function distinctMonthCount(expenses) {
  return new Set(expenses.map(e => e.month)).size || 1
}

export function monthlyAverageTotal(expenses) {
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  return total / distinctMonthCount(expenses)
}

// { [categoryId]: averagePerMonth }, only for categories with any spend.
export function monthlyAverageByCategory(expenses) {
  const months = distinctMonthCount(expenses)
  const totals = {}
  for (const e of expenses) {
    totals[e.category] = (totals[e.category] ?? 0) + e.amount
  }
  const averages = {}
  for (const [category, total] of Object.entries(totals)) {
    averages[category] = total / months
  }
  return averages
}
