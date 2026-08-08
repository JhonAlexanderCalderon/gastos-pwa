// Keeps only digits and a single decimal point. Used instead of relying on
// <input type="number">, which has a known Chrome-on-Android bug where
// dismissing the keyboard right after typing can append a stray extra digit.
export function sanitizeDecimal(raw) {
  let value = raw.replace(/[^0-9.]/g, '')
  const firstDot = value.indexOf('.')
  if (firstDot !== -1) {
    value = value.slice(0, firstDot + 1) + value.slice(firstDot + 1).replace(/\./g, '')
  }
  return value
}
