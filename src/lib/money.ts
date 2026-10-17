/**
 * Money formatting shared by the calculators.
 *
 * Indian-style grouping is used because these tools are rupee-first: the last
 * three digits are grouped, then pairs. A western `1,234,567` would be read as
 * a different number by anyone used to lakhs and crores.
 */

/** Round to a fixed number of decimals without trailing-zero noise or −0. */
export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  const rounded = Math.round(value * factor) / factor
  return rounded === 0 ? 0 : rounded
}

/** Group an integer string the Indian way: `12,34,567`. */
export function groupDigits(digits: string): string {
  if (digits.length <= 3) return digits
  const last3 = digits.slice(-3)
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',')
  return `${rest},${last3}`
}

/** Format an amount with a currency symbol, lakh grouping and real paise. */
export function formatMoney(value: number, currency = '₹'): string {
  if (!Number.isFinite(value)) return '—'
  const rounded = round(value, 2)
  const [whole, fraction] = Math.abs(rounded).toFixed(2).split('.')
  const sign = rounded < 0 ? '−' : ''
  const fractionPart = fraction === '00' ? '' : `.${fraction}`
  return `${sign}${currency}${groupDigits(whole)}${fractionPart}`
}

/** Format a percentage without a trailing `.00`. */
export function formatPercent(value: number, maxDecimals = 2): string {
  if (!Number.isFinite(value)) return '∞'
  const rounded = round(value, maxDecimals)
  return `${rounded.toLocaleString('en-US', { maximumFractionDigits: maxDecimals })}%`
}
