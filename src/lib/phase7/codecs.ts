/**
 * Small deterministic codecs, shared by several Phase 7 tools.
 *
 * Every function here is pure and dependency-free, so the same logic can be
 * unit-tested in Node and used by the browser UI without divergence.
 */

// --- Roman numerals ---------------------------------------------------------
// The classical system has no standard representation for 0, negatives or
// numbers above 3999 (repeated overline notation is not universally supported).

const ROMAN_TABLE: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
]

export function intToRoman(value: number): string | null {
  if (!Number.isInteger(value) || value < 1 || value > 3999) return null
  let remaining = value
  let result = ''
  for (const [amount, numeral] of ROMAN_TABLE) {
    while (remaining >= amount) {
      result += numeral
      remaining -= amount
    }
  }
  return result
}

export function romanToInt(value: string): number | null {
  const text = value.trim().toUpperCase()
  if (text === '' || !/^[IVXLCDM]+$/.test(text)) return null
  const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
  let total = 0
  for (let index = 0; index < text.length; index += 1) {
    const current = values[text[index]!]!
    const next = values[text[index + 1]!] ?? 0
    total += current < next ? -current : current
  }
  // Reject "IIII", "VX" and other non-canonical forms by round-tripping.
  return intToRoman(total) === text ? total : null
}

// --- Number to words --------------------------------------------------------

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
const SCALES = ['', 'thousand', 'million', 'billion', 'trillion']

function threeDigitsToWords(value: number): string {
  const parts: string[] = []
  if (value >= 100) {
    parts.push(`${ONES[Math.floor(value / 100)]} hundred`)
    value %= 100
  }
  if (value >= 20) {
    parts.push(TENS[Math.floor(value / 10)]!)
    if (value % 10 !== 0) parts.push(ONES[value % 10]!)
  } else if (value > 0) {
    parts.push(ONES[value]!)
  }
  return parts.join(' ')
}

/** English words for an integer, up to 999,999,999,999,999. */
export function numberToWords(value: number): string | null {
  if (!Number.isInteger(value) || Math.abs(value) >= 1e15) return null
  if (value === 0) return 'zero'
  const prefix = value < 0 ? 'minus ' : ''
  let remaining = Math.abs(value)
  const chunks: string[] = []
  let scale = 0
  while (remaining > 0) {
    const chunk = remaining % 1000
    if (chunk !== 0) {
      const words = threeDigitsToWords(chunk)
      chunks.unshift(SCALES[scale] ? `${words} ${SCALES[scale]}` : words)
    }
    remaining = Math.floor(remaining / 1000)
    scale += 1
  }
  return prefix + chunks.join(' ')
}

// --- Text / binary (UTF-8) --------------------------------------------------

/** UTF-8 bytes of a string, rendered as space-separated 8-bit groups. */
export function textToBinary(text: string): string {
  const bytes = new TextEncoder().encode(text)
  return Array.from(bytes, (byte) => byte.toString(2).padStart(8, '0')).join(' ')
}

/** Decode space-separated 8-bit groups back into UTF-8 text. */
export function binaryToText(binary: string): { ok: true; text: string } | { ok: false; error: string } {
  const groups = binary.trim().split(/[\s,]+/).filter((group) => group !== '')
  if (groups.length === 0) return { ok: true, text: '' }
  if (groups.some((group) => !/^[01]{8}$/.test(group))) {
    return { ok: false, error: 'Every group must be exactly eight 0/1 digits, separated by spaces.' }
  }
  try {
    const bytes = Uint8Array.from(groups.map((group) => parseInt(group, 2)))
    // fatal: true makes invalid UTF-8 an error rather than replacement chars.
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    return { ok: true, text }
  } catch {
    return { ok: false, error: 'Those bytes are not valid UTF-8 text.' }
  }
}

// --- CSS length units -------------------------------------------------------

export type CssUnit = 'px' | 'rem' | 'em' | 'pt' | 'in' | 'cm' | 'mm'

export const CSS_UNITS: CssUnit[] = ['px', 'rem', 'em', 'pt', 'in', 'cm', 'mm']

/** Convert a CSS length to pixels. rem/em use the root font size (default 16). */
export function toPixels(value: number, from: CssUnit, baseFontSize = 16): number | null {
  if (!Number.isFinite(value) || !Number.isFinite(baseFontSize) || baseFontSize <= 0) return null
  switch (from) {
    case 'px': return value
    case 'rem':
    case 'em': return value * baseFontSize
    case 'pt': return (value * 96) / 72
    case 'in': return value * 96
    case 'cm': return (value * 96) / 2.54
    case 'mm': return (value * 96) / 25.4
  }
}

/** Convert between any two CSS length units. */
export function convertCssUnit(
  value: number,
  from: CssUnit,
  to: CssUnit,
  baseFontSize = 16,
): number | null {
  const pixels = toPixels(value, from, baseFontSize)
  if (pixels === null) return null
  switch (to) {
    case 'px': return pixels
    case 'rem':
    case 'em': return pixels / baseFontSize
    case 'pt': return (pixels * 72) / 96
    case 'in': return pixels / 96
    case 'cm': return (pixels * 2.54) / 96
    case 'mm': return (pixels * 25.4) / 96
  }
}
