import { describe, expect, it } from 'vitest'
import { formatMoney, formatPercent, groupDigits, round } from './money'

describe('round', () => {
  it('rounds to two decimals by default', () => {
    expect(round(1.23456789)).toBe(1.23)
  })

  it('honours a custom precision', () => {
    expect(round(1.23456789, 4)).toBe(1.2346)
  })

  it('normalises negative zero', () => {
    expect(Object.is(round(-0.001), 0)).toBe(true)
  })
})

describe('groupDigits', () => {
  it('leaves three digits alone', () => {
    expect(groupDigits('123')).toBe('123')
  })

  it('groups the first four digits', () => {
    expect(groupDigits('1000')).toBe('1,000')
    expect(groupDigits('12345')).toBe('12,345')
  })

  it('uses lakh grouping beyond five digits', () => {
    expect(groupDigits('1234567')).toBe('12,34,567')
    expect(groupDigits('123456789')).toBe('12,34,56,789')
  })
})

describe('formatMoney', () => {
  it('formats rupees with lakh grouping', () => {
    expect(formatMoney(1_234_567)).toBe('₹12,34,567')
    expect(formatMoney(1000)).toBe('₹1,000')
    expect(formatMoney(100)).toBe('₹100')
  })

  it('keeps paise when they matter and drops them when they do not', () => {
    expect(formatMoney(1234.5)).toBe('₹1,234.50')
    expect(formatMoney(1234)).toBe('₹1,234')
  })

  it('uses a true minus sign for negatives', () => {
    expect(formatMoney(-500)).toBe('−₹500')
  })

  it('returns a dash for non-finite input', () => {
    expect(formatMoney(Number.NaN)).toBe('—')
    expect(formatMoney(Number.POSITIVE_INFINITY)).toBe('—')
  })

  it('accepts another currency symbol', () => {
    expect(formatMoney(500, '$')).toBe('$500')
  })
})

describe('formatPercent', () => {
  it('trims trailing zeros', () => {
    expect(formatPercent(33.3)).toBe('33.3%')
    expect(formatPercent(33)).toBe('33%')
  })

  it('reports an infinite markup as an infinity sign', () => {
    expect(formatPercent(Number.POSITIVE_INFINITY)).toBe('∞')
  })
})
