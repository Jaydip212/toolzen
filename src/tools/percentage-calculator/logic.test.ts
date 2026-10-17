import { describe, expect, it } from 'vitest'
import { MODES, calculate, exampleFor, formatNumber, round } from './logic'

describe('round', () => {
  it('rounds to four decimals by default', () => {
    expect(round(1.23456789)).toBe(1.2346)
  })

  it('honours a custom precision', () => {
    expect(round(1.23456789, 2)).toBe(1.23)
  })

  it('leaves non-finite values alone instead of producing NaN', () => {
    expect(round(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
  })

  it('avoids negative zero leaking into the output', () => {
    expect(Object.is(round(-0.00001), 0)).toBe(true)
  })
})

describe('formatNumber', () => {
  it('groups thousands', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  it('trims trailing zeros', () => {
    expect(formatNumber(30)).toBe('30')
    expect(formatNumber(30.5)).toBe('30.5')
  })

  it('returns an em dash for non-finite input', () => {
    expect(formatNumber(Number.NaN)).toBe('—')
  })
})

describe('calculate — percent of', () => {
  it('computes 15% of 200', () => {
    const result = calculate('of', 15, 200)
    expect(result.value).toBe(30)
    expect(result.sentence).toBe('15% of 200 is 30.')
    expect(result.formula).toBe('(15 ÷ 100) × 200')
    expect(result.decreased).toBe(false)
  })

  it('handles a fractional percentage', () => {
    expect(calculate('of', 7.5, 80).value).toBe(6)
  })

  it('handles a zero percentage', () => {
    expect(calculate('of', 0, 500).value).toBe(0)
  })

  it('handles a negative base', () => {
    expect(calculate('of', 10, -50).value).toBe(-5)
  })
})

describe('calculate — is what percent', () => {
  it('computes 30 as a percentage of 200', () => {
    const result = calculate('is-what-percent', 30, 200)
    expect(result.value).toBe(15)
    expect(result.sentence).toBe('30 is 15% of 200.')
  })

  it('reports over 100% honestly', () => {
    expect(calculate('is-what-percent', 250, 200).value).toBe(125)
  })

  it('refuses to divide by zero', () => {
    expect(() => calculate('is-what-percent', 30, 0)).toThrow(/divide by zero/)
  })
})

describe('calculate — percentage change', () => {
  it('computes an increase', () => {
    const result = calculate('change', 200, 250)
    expect(result.value).toBe(25)
    expect(result.decreased).toBe(false)
    expect(result.sentence).toBe('Going from 200 to 250 is a 25% increase.')
  })

  it('computes a decrease and keeps the value signed', () => {
    const result = calculate('change', 250, 200)
    expect(result.value).toBe(-20)
    expect(result.decreased).toBe(true)
    expect(result.sentence).toContain('20% decrease')
  })

  it('reports no change as zero', () => {
    const result = calculate('change', 100, 100)
    expect(result.value).toBe(0)
    expect(result.decreased).toBe(false)
  })

  it('uses the magnitude of a negative start value', () => {
    const result = calculate('change', -200, -100)
    expect(result.value).toBe(50)
    expect(result.decreased).toBe(false)
  })

  it('refuses a zero starting value', () => {
    expect(() => calculate('change', 0, 50)).toThrow(/undefined/)
  })

  it('handles a change to zero', () => {
    expect(calculate('change', 200, 0).value).toBe(-100)
  })
})

describe('input validation', () => {
  it('rejects NaN', () => {
    expect(() => calculate('of', Number.NaN, 10)).toThrow('Enter two numbers.')
  })

  it('rejects Infinity', () => {
    expect(() => calculate('of', 10, Number.POSITIVE_INFINITY)).toThrow('Enter two numbers.')
  })
})

describe('MODES and exampleFor', () => {
  it('exposes three modes with labels', () => {
    expect(MODES).toHaveLength(3)
    expect(MODES.map((mode) => mode.value)).toEqual(['of', 'is-what-percent', 'change'])
    expect(MODES.every((mode) => mode.label.length > 0 && mode.first.length > 0)).toBe(true)
  })

  it('gives a worked example that calculates cleanly in every mode', () => {
    for (const mode of MODES) {
      const example = exampleFor(mode.value)
      expect(() => calculate(mode.value, example.a, example.b)).not.toThrow()
    }
  })
})
