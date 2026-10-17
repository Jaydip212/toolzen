import { describe, expect, it } from 'vitest'
import {
  TERM_PRESETS,
  formatMoney,
  interestShare,
  monthlyPayment,
  monthlyRate,
  schedule,
  summarise,
  withExtraPayment,
} from './logic'

describe('monthlyPayment', () => {
  it('matches the standard worked example', () => {
    // ₹10,00,000 at 8.5% for 20 years is about ₹8,678.
    const payment = monthlyPayment(1_000_000, 8.5, 240)
    expect(payment).toBeGreaterThan(8670)
    expect(payment).toBeLessThan(8690)
  })

  it('divides evenly when the rate is zero', () => {
    expect(monthlyPayment(120_000, 0, 12)).toBe(10_000)
  })

  it('is interest-only-ish at the very start of a long loan', () => {
    const payment = monthlyPayment(1_000_000, 12, 120)
    expect(payment).toBeGreaterThan(14_000)
  })

  it('rejects an unusable amount or term', () => {
    expect(() => monthlyPayment(0, 8, 120)).toThrow(/amount/)
    expect(() => monthlyPayment(1000, 8, 0)).toThrow(/term/)
    expect(() => monthlyPayment(-5, 8, 120)).toThrow(/amount/)
  })

  it('rejects a negative rate', () => {
    expect(() => monthlyPayment(1000, -1, 12)).toThrow(/negative/)
  })
})

describe('monthlyRate', () => {
  it('converts an annual rate', () => {
    expect(monthlyRate(12)).toBeCloseTo(0.01, 10)
    expect(monthlyRate(0)).toBe(0)
  })
})

describe('schedule', () => {
  it('returns one row per month and lands on zero', () => {
    const rows = schedule(100_000, 9, 12)
    expect(rows).toHaveLength(12)
    expect(rows[rows.length - 1].balance).toBe(0)
  })

  it('numbers rows from one', () => {
    expect(schedule(50_000, 8, 6)[0].number).toBe(1)
  })

  it('splits each payment into interest and principal', () => {
    const rows = schedule(100_000, 12, 12)
    for (const row of rows) {
      expect(row.interest + row.principal).toBeCloseTo(row.payment, 2)
    }
  })

  it('charges less interest each month as the balance falls', () => {
    const rows = schedule(500_000, 10, 120)
    expect(rows[0].interest).toBeGreaterThan(rows[1].interest)
    expect(rows[rows.length - 1].interest).toBeLessThan(rows[0].interest / 10)
  })

  it('pays only principal when the rate is zero', () => {
    const rows = schedule(12_000, 0, 12)
    expect(rows.every((row) => row.interest === 0)).toBe(true)
    expect(rows[0].payment).toBe(1000)
  })

  it('keeps the balance from going negative on the last row', () => {
    const rows = schedule(1_000_000, 11.25, 180)
    expect(rows[rows.length - 1].balance).toBe(0)
    expect(rows.some((row) => row.balance < 0)).toBe(false)
  })
})

describe('summarise', () => {
  it('adds up interest and total paid', () => {
    const summary = summarise(1_000_000, 8.5, 240)
    expect(summary.totalInterest).toBeGreaterThan(1_000_000)
    expect(summary.totalPaid).toBeCloseTo(summary.principal + summary.totalInterest, 1)
  })

  it('flags an interest-free loan', () => {
    expect(summarise(120_000, 0, 12).interestFree).toBe(true)
    expect(summarise(120_000, 5, 12).interestFree).toBe(false)
  })

  it('reports the interest share of every payment', () => {
    const summary = summarise(500_000, 10, 60)
    const share = interestShare(summary)
    expect(share).toBeGreaterThan(20)
    expect(share).toBeLessThan(40)
  })

  it('reports a zero share when there is nothing paid', () => {
    expect(interestShare({ payment: 0, principal: 0, months: 0, totalInterest: 0, totalPaid: 0, interestFree: true })).toBe(0)
  })
})

describe('withExtraPayment', () => {
  it('shortens the term and cuts interest', () => {
    const prepayment = withExtraPayment(1_000_000, 9, 240, 10_000)
    expect(prepayment.monthsSaved).toBeGreaterThan(50)
    expect(prepayment.interestSaved).toBeGreaterThan(100_000)
  })

  it('never saves more than the baseline', () => {
    const baseline = summarise(500_000, 8, 120)
    const prepayment = withExtraPayment(500_000, 8, 120, 2000)
    expect(prepayment.totalInterest).toBeLessThan(baseline.totalInterest)
    expect(prepayment.months).toBeLessThan(baseline.months)
  })

  it('does nothing for a zero extra', () => {
    const baseline = summarise(500_000, 8, 120)
    const prepayment = withExtraPayment(500_000, 8, 120, 0)
    expect(prepayment.monthsSaved).toBe(0)
    expect(prepayment.totalInterest).toBe(baseline.totalInterest)
  })

  it('clears the loan rather than looping forever on a huge extra', () => {
    const prepayment = withExtraPayment(100_000, 8, 120, 500_000)
    expect(prepayment.months).toBe(1)
  })
})

describe('formatMoney', () => {
  it('groups Indian-style and drops empty paise', () => {
    expect(formatMoney(1_234_567)).toBe('₹12,34,567')
    expect(formatMoney(1000)).toBe('₹1,000')
  })

  it('keeps paise when they matter', () => {
    expect(formatMoney(1234.5)).toBe('₹1,234.50')
  })

  it('marks a negative with a true minus sign', () => {
    expect(formatMoney(-500)).toBe('−₹500')
  })

  it('returns a dash for non-finite input', () => {
    expect(formatMoney(Number.NaN)).toBe('—')
  })
})

describe('TERM_PRESETS', () => {
  it('lists ascending terms', () => {
    const months = TERM_PRESETS.map((preset) => preset.months)
    expect([...months].sort((a, b) => a - b)).toEqual(months)
    expect(months).toContain(240)
  })
})
