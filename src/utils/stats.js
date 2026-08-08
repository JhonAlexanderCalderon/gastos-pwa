// Average days/weeks per calendar month (365.25 / 12), used to derive a
// weekly figure from the monthly average without needing a separate
// "week" grouping key on each expense.
const WEEKS_PER_MONTH = 30.4375 / 7

function distinctMonthCount(expenses) {
  return new Set(expenses.map(e => e.month)).size || 1
}

export function monthlyAverageTotal(expenses) {
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  return total / distinctMonthCount(expenses)
}

export function weeklyAverageTotal(expenses) {
  return monthlyAverageTotal(expenses) / WEEKS_PER_MONTH
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
