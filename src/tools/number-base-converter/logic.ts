/**
 * Number base conversion.
 *
 * Arbitrary precision via BigInt, so a 64-bit value converts exactly instead
 * of silently losing bits through float rounding. Fractional values are not
 * supported on purpose: repeating expansions would either truncate silently
 * or produce output that looks exact but isn't.
 */

export const MIN_BASE = 2
export const MAX_BASE = 36

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

/** The digits valid in a base, e.g. base 2 → "01", base 16 → "0-9a-f". */
export function digitSetFor(base: number): string {
  return DIGITS.slice(0, base)
}

/** Whether `value` is a syntactically valid integer in `base`. */
export function isValidInBase(value: string, base: number): boolean {
  if (base < MIN_BASE || base > MAX_BASE) return false
  const trimmed = value.trim().toLowerCase()
  if (trimmed === '' || trimmed === '-') return false
  const body = trimmed.startsWith('-') ? trimmed.slice(1) : trimmed
  const allowed = digitSetFor(base)
  for (const char of body) {
    if (!allowed.includes(char)) return false
  }
  return true
}

/** Parse an integer in the given base into a BigInt, or null when invalid. */
export function parseInBase(value: string, base: number): bigint | null {
  if (!isValidInBase(value, base)) return null
  const trimmed = value.trim().toLowerCase()
  const negative = trimmed.startsWith('-')
  const body = negative ? trimmed.slice(1) : trimmed
  let result = 0n
  const bigBase = BigInt(base)
  for (const char of body) {
    result = result * bigBase + BigInt(DIGITS.indexOf(char))
  }
  return negative ? -result : result
}

/** All the standard representations of one value, keyed for display. */
export function conversionsFor(value: string, base: number): { label: string; base: number; output: string }[] | null {
  const parsed = parseInBase(value, base)
  if (parsed === null) return null
  const negative = parsed < 0n
  const magnitude = negative ? -parsed : parsed
  const render = (target: number) => (negative ? '-' : '') + magnitude.toString(target)
  return [
    { label: 'Binary', base: 2, output: render(2) },
    { label: 'Octal', base: 8, output: render(8) },
    { label: 'Decimal', base: 10, output: render(10) },
    { label: 'Hexadecimal', base: 16, output: render(16).toUpperCase() },
    { label: 'Base 36', base: 36, output: render(36) },
  ]
}

/** Bit-level facts about the value, shown as context under the results. */
export function bitFactsFor(value: string, base: number): { label: string; value: string }[] | null {
  const parsed = parseInBase(value, base)
  if (parsed === null) return null
  const bits = parsed.toString(2).replace('-', '')
  return [
    { label: 'Significant bits', value: bits === '0' ? '1' : String(bits.length) },
    { label: 'Bytes (rounded up)', value: String(Math.max(1, Math.ceil(bits.length / 8))) },
  ]
}
