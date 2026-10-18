import { describe, expect, it } from 'vitest'
import {
  bitFactsFor,
  conversionsFor,
  digitSetFor,
  isValidInBase,
  parseInBase,
  MAX_BASE,
  MIN_BASE,
} from './logic'

describe('isValidInBase', () => {
  it('accepts digits within the base, case-insensitively', () => {
    expect(isValidInBase('1010', 2)).toBe(true)
    expect(isValidInBase('ff', 16)).toBe(true)
    expect(isValidInBase('FF', 16)).toBe(true)
    expect(isValidInBase('z', 36)).toBe(true)
  })

  it('rejects digits beyond the base', () => {
    expect(isValidInBase('2', 2)).toBe(false)
    expect(isValidInBase('g', 16)).toBe(false)
  })

  it('accepts a leading minus but not a bare one', () => {
    expect(isValidInBase('-ff', 16)).toBe(true)
    expect(isValidInBase('-', 16)).toBe(false)
  })

  it('rejects empty input and out-of-range bases', () => {
    expect(isValidInBase('', 10)).toBe(false)
    expect(isValidInBase('1', 1)).toBe(false)
    expect(isValidInBase('1', 37)).toBe(false)
    expect(isValidInBase('1', MIN_BASE - 1)).toBe(false)
    expect(isValidInBase('1', MAX_BASE + 1)).toBe(false)
  })
})

describe('parseInBase', () => {
  it('round-trips values through toString', () => {
    const cases: [string, number][] = [
      ['1010', 2],
      ['17', 8],
      ['123', 10],
      ['ff', 16],
      ['zz', 36],
    ]
    for (const [text, base] of cases) {
      const parsed = parseInBase(text, base)
      expect(parsed).not.toBeNull()
      expect(parsed!.toString(base)).toBe(text)
    }
  })

  it('keeps 64-bit precision exactly', () => {
    // 2^63 - 1 loses precision in a float; BigInt must not.
    const parsed = parseInBase('9223372036854775807', 10)
    expect(parsed).toBe(9223372036854775807n)
  })

  it('parses negatives and zero', () => {
    expect(parseInBase('-10', 16)).toBe(-16n)
    expect(parseInBase('0', 10)).toBe(0n)
  })

  it('returns null for invalid input', () => {
    expect(parseInBase('hello', 10)).toBeNull()
    expect(parseInBase('', 10)).toBeNull()
  })
})

describe('conversionsFor', () => {
  it('converts 255 across all bases', () => {
    const result = conversionsFor('255', 10)!
    const byLabel = Object.fromEntries(result.map((row) => [row.label, row.output]))
    expect(byLabel['Binary']).toBe('11111111')
    expect(byLabel['Octal']).toBe('377')
    expect(byLabel['Decimal']).toBe('255')
    expect(byLabel['Hexadecimal']).toBe('FF')
    expect(byLabel['Base 36']).toBe('73')
  })

  it('reads the input in the given base, not always base 10', () => {
    const result = conversionsFor('ff', 16)!
    expect(result.find((row) => row.label === 'Decimal')?.output).toBe('255')
  })

  it('keeps the sign on every output', () => {
    const result = conversionsFor('-5', 10)!
    for (const row of result) expect(row.output.startsWith('-')).toBe(true)
  })

  it('returns null when the input is invalid', () => {
    expect(conversionsFor('zz', 10)).toBeNull()
  })
})

describe('bitFactsFor', () => {
  it('counts significant bits and rounds up to bytes', () => {
    const facts = bitFactsFor('255', 10)!
    expect(facts.find((f) => f.label === 'Significant bits')?.value).toBe('8')
    expect(facts.find((f) => f.label === 'Bytes (rounded up)')?.value).toBe('1')
  })

  it('counts one bit for zero, not zero bits', () => {
    const facts = bitFactsFor('0', 10)!
    expect(facts.find((f) => f.label === 'Significant bits')?.value).toBe('1')
  })

  it('ignores the sign when counting bits', () => {
    const facts = bitFactsFor('-128', 10)!
    expect(facts.find((f) => f.label === 'Significant bits')?.value).toBe('8')
  })

  it('returns null for invalid input', () => {
    expect(bitFactsFor('x', 10)).toBeNull()
  })
})

describe('digitSetFor', () => {
  it('returns exactly the digits valid in each base', () => {
    expect(digitSetFor(2)).toBe('01')
    expect(digitSetFor(16)).toBe('0123456789abcdef')
    expect(digitSetFor(36)).toHaveLength(36)
  })
})
