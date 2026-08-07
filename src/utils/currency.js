export const CURRENCIES = [
  { code: 'AUD', label: 'AUD — Dólar australiano', locale: 'en-AU', symbol: 'A$' },
  { code: 'COP', label: 'COP — Peso colombiano',   locale: 'es-CO', symbol: '$'  },
]

export function formatAmount(amount, currencyCode = 'AUD') {
  // Falls back to the first known currency (AUD) for stale/unsupported
  // codes (e.g. MXN, left over from before the currency list was trimmed).
  // Must use cur.code below, not the raw currencyCode — passing an
  // unsupported code straight to Intl.NumberFormat renders its ISO code
  // as literal text ("MXN 1,234.00") instead of actually falling back.
  const cur = CURRENCIES.find(c => c.code === currencyCode) ?? CURRENCIES[0]
  return new Intl.NumberFormat(cur.locale, {
    style: 'currency',
    currency: cur.code,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function getCurrencySymbol(currencyCode = 'AUD') {
  return (CURRENCIES.find(c => c.code === currencyCode) ?? CURRENCIES[0]).symbol
}
