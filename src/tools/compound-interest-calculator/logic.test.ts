import { describe, expect, it } from 'vitest'
import {
  FREQUENCIES,
  doublingYears,
  effectiveAnnualRate,
  grow,
  lumpSum,
  monthlyRateFrom,
  realValue,
  yearsToDouble,
} from './logic'

describe('effectiveAnnualRate', () => {
  it('is unchanged for annual compounding', () => {
    expect(effectiveAnnualRate(12, 1)).toBe(12)
  })

  it('rises with more frequent compounding', () => {
    const annual = effectiveAnnualRate(12, 1)
    const quarterly = effectiveAnnualRate(12, 4)
    const monthly = effectiveAnnualRate(12, 12)
    expect(quarterly).toBeGreaterThan(annual)
    expect(monthly).toBeGreaterThan(quarterly)
    expect(monthly).toBeCloseTo(12.68, 1)
  })

  it('is zero for a zero rate', () => {
    expect(effectiveAnnualRate(0, 12)).toBe(0)
  })
})

describe('monthlyRateFrom', () => {
  it('is a twelfth of the annual rate when compounding monthly', () => {
    expect(monthlyRateFrom(12, 12)).toBeCloseTo(0.01, 10)
  })

  it('agrees with the closed form over a year', () => {
    // 12% compounded monthly is 12.68% effective, not 12%.
    const rate = monthlyRateFrom(12, 12)
    expect(rate).toBeCloseTo(0.01, 10)
    expect(Math.pow(1 + rate, 12)).toBeCloseTo(1.1268, 4)
    expect(effectiveAnnualRate(12, 12)).toBeCloseTo(12.68, 2)
  })
})

describe('grow', () => {
  it('matches the closed form for a lump sum', () => {
    const result = grow(100_000, 10, 10, 1)
    expect(result.total).toBe(lumpSum(100_000, 10, 10, 1))
    expect(result.total).toBeCloseTo(259_374.25, 1)
  })

  it('separates interest from contributions', () => {
    const result = grow(100_000, 10, 10, 1)
    expect(result.interest).toBeCloseTo(result.total - 100_000, 1)
  })

  it('tracks a monthly deposit', () => {
    const plain = grow(100_000, 8, 10, 12)
    const withDeposit = grow(100_000, 8, 10, 12, 5000)
    expect(withDeposit.total).toBeGreaterThan(plain.total + 5000 * 120)
    expect(withDeposit.rows).toHaveLength(10)
  })

  it('reports the year-by-year balance', () => {
    const rows = grow(10_000, 10, 3, 1).rows
    expect(rows.map((row) => row.year)).toEqual([1, 2, 3])
    expect(rows[0].balance).toBeCloseTo(11_000, 0)
    expect(rows[2].balance).toBeGreaterThan(rows[1].balance)
  })

  it('reports interest per year, excluding deposits', () => {
    const rows = grow(10_000, 10, 3, 1, 1000).rows
    // Month-by-month at 1.1^(1/12) − 1 on a balance that grows by a ₹1,000
    // deposit each month, year one earns about ₹1,540.5 of interest — nowhere
    // near the ₹12,000 deposited, which must not be counted as interest.
    expect(rows[0].interest).toBeCloseTo(1540.5, 0)
  })

  it('sums the yearly interest to the total interest', () => {
    const result = grow(50_000, 9, 8, 12, 2000)
    const summed = result.rows.reduce((total, row) => total + row.interest, 0)
    expect(summed).toBeCloseTo(result.interest, 0)
  })

  it('handles a zero term', () => {
    const result = grow(5000, 10, 0)
    expect(result.total).toBe(5000)
    expect(result.rows).toEqual([])
  })

  it('handles a zero rate as simple addition of deposits', () => {
    const result = grow(0, 0, 2, 1, 1000)
    expect(result.total).toBe(24_000)
    expect(result.interest).toBe(0)
  })

  it('rejects a negative principal or a huge term', () => {
    expect(() => grow(-100, 10, 5)).toThrow(/negative/)
    expect(() => grow(100, 10, 200)).toThrow(/0 and 100 years/)
  })
})

describe('lumpSum', () => {
  it('compounds annually', () => {
    expect(lumpSum(1000, 10, 1)).toBe(1100)
    expect(lumpSum(1000, 10, 2)).toBe(1210)
  })

  it('compounds monthly', () => {
    expect(lumpSum(1000, 12, 1, 12)).toBeCloseTo(1126.83, 1)
  })
})

describe('doubling', () => {
  it('matches the exact figure to the rule of 72', () => {
    const doubling = doublingYears(10)
    expect(doubling.estimate).toBe(7.2)
    expect(doubling.exact).toBeCloseTo(7.27, 1)
  })

  it('returns infinity for a zero rate', () => {
    expect(doublingYears(0).exact).toBeNull()
    expect(yearsToDouble(0)).toBeNull()
  })

  it('shortens with more frequent compounding', () => {
    expect(yearsToDouble(10, 12)).toBeLessThan(yearsToDouble(10, 1) as number)
  })
})

describe('realValue', () => {
  it('discounts by inflation', () => {
    // ₹1,00,000 at 6% inflation is worth about ₹74,725 after five years.
    expect(realValue(100_000, 6, 5)).toBeCloseTo(74_725.82, 0)
  })

  it('is unchanged with no inflation', () => {
    expect(realValue(100_000, 0, 10)).toBe(100_000)
  })

  it('rejects negative inflation', () => {
    expect(() => realValue(100_000, -1, 5)).toThrow(/negative/)
  })
})

describe('FREQUENCIES', () => {
  it('lists ascending frequencies', () => {
    const values = FREQUENCIES.map((frequency) => frequency.value)
    expect([...values].sort((a, b) => a - b)).toEqual(values)
    expect(values).toEqual([1, 2, 4, 12, 365])
  })
})
