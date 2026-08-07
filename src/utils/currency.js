export const CURRENCIES = [
  { code: 'MXN', label: 'MXN — Peso mexicano',    locale: 'es-MX', symbol: '$'  },
  { code: 'USD', label: 'USD — Dólar americano',   locale: 'en-US', symbol: '$'  },
  { code: 'EUR', label: 'EUR — Euro',              locale: 'es-ES', symbol: '€'  },
  { code: 'COP', label: 'COP — Peso colombiano',   locale: 'es-CO', symbol: '$'  },
  { code: 'ARS', label: 'ARS — Peso argentino',    locale: 'es-AR', symbol: '$'  },
  { code: 'CLP', label: 'CLP — Peso chileno',      locale: 'es-CL', symbol: '$'  },
  { code: 'PEN', label: 'PEN — Sol peruano',       locale: 'es-PE', symbol: 'S/' },
  { code: 'BRL', label: 'BRL — Real brasileño',    locale: 'pt-BR', symbol: 'R$' },
  { code: 'GBP', label: 'GBP — Libra esterlina',   locale: 'en-GB', symbol: '£'  },
  { code: 'CAD', label: 'CAD — Dólar canadiense',  locale: 'en-CA', symbol: '$'  },
]

export function formatAmount(amount, currencyCode = 'MXN') {
  const cur = CURRENCIES.find(c => c.code === currencyCode) ?? CURRENCIES[0]
  return new Intl.NumberFormat(cur.locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function getCurrencySymbol(currencyCode = 'MXN') {
  return CURRENCIES.find(c => c.code === currencyCode)?.symbol ?? '$'
}
