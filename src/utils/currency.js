export const CURRENCIES = [
  { code: 'AUD', label: 'AUD — Dólar australiano', locale: 'en-AU', symbol: 'A$' },
  { code: 'COP', label: 'COP — Peso colombiano',   locale: 'es-CO', symbol: '$'  },
]

export function formatAmount(amount, currencyCode = 'AUD') {
  const cur = CURRENCIES.find(c => c.code === currencyCode) ?? CURRENCIES[0]
  return new Intl.NumberFormat(cur.locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function getCurrencySymbol(currencyCode = 'AUD') {
  return CURRENCIES.find(c => c.code === currencyCode)?.symbol ?? '$'
}
