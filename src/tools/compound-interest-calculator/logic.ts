import { round } from '@/lib/money'
export interface YearRow {
  year: number
  /** Balance at the end of the year. */
  balance: number
  /** Interest earned during the year. */
  interest: number
  /** Everything put in, deposits included. */
  contributed: number
}

export interface CompoundResult {
  principal: number
  interest: number
  total: number
  /** The annual rate that would give the same growth with one compounding per year. */
  effectiveAnnualRate: number
  rows: YearRow[]
}

export const FREQUENCIES: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Annually' },
  { value: 2, label: 'Half-yearly' },
  { value: 4, label: 'Quarterly' },
  { value: 12, label: 'Monthly' },
  { value: 365, label: 'Daily' },
]

export function requirePrincipal(value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new Error('The starting amount cannot be negative.')
  return value
}

export function requireYears(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error('The term has to be between 0 and 100 years.')
  }
  return value
}

/** Annual rate as a monthly decimal, whatever the compounding frequency. */
export function monthlyRateFrom(annualPercent: number, compoundsPerYear: number): number {
  const annual = annualPercent / 100
  const perPeriod = Math.pow(1 + annual / compoundsPerYear, compoundsPerYear)
  return Math.pow(perPeriod, 1 / 12) - 1
}

/** The rate a single annual compounding would need to match the quoted rate. */
export function effectiveAnnualRate(annualPercent: number, compoundsPerYear: number): number {
  if (annualPercent === 0 || compoundsPerYear === 1) return round(annualPercent, 4)
  const perPeriod = 1 + annualPercent / 100 / compoundsPerYear
  return round((Math.pow(perPeriod, compoundsPerYear) - 1) * 100, 4)
}

/**
 * Compound growth on a lump sum, with an optional deposit every month.
 *
 * Deposits are applied at the end of each month, which is the conservative
 * assumption — a deposit at the start of the month earns a little more, and the
 * tool does not claim otherwise.
 */
export function grow(
  principal: number,
  annualPercent: number,
  years: number,
  compoundsPerYear = 1,
  monthlyDeposit = 0,
): CompoundResult {
  const start = requirePrincipal(principal)
  const term = requireYears(years)
  const deposit = Number.isFinite(monthlyDeposit) && monthlyDeposit > 0 ? monthlyDeposit : 0
  const months = Math.round(term * 12)

  if (months === 0 && deposit === 0) {
    return {
      principal: round(start),
      interest: 0,
      total: round(start),
      effectiveAnnualRate: effectiveAnnualRate(annualPercent, compoundsPerYear),
      rows: [],
    }
  }

  const rate = monthlyRateFrom(annualPercent, compoundsPerYear)
  const rows: YearRow[] = []
  let balance = start
  let contributed = start
  let interestThisYear = 0

  for (let month = 1; month <= months; month += 1) {
    const earned = balance * rate
    balance += earned + deposit
    contributed += deposit
    interestThisYear += earned
    if (month % 12 === 0) {
      rows.push({
        year: month / 12,
        balance: round(balance),
        interest: round(interestThisYear),
        contributed: round(contributed),
      })
      interestThisYear = 0
    }
  }

  return {
    principal: round(start),
    interest: round(balance - contributed),
    total: round(balance),
    effectiveAnnualRate: effectiveAnnualRate(annualPercent, compoundsPerYear),
    rows,
  }
}

/** Closed-form lump-sum compounding, used to cross-check the month-by-month run. */
export function lumpSum(
  principal: number,
  annualPercent: number,
  years: number,
  compoundsPerYear = 1,
): number {
  const perPeriod = 1 + annualPercent / 100 / compoundsPerYear
  return round(principal * Math.pow(perPeriod, compoundsPerYear * years))
}

/** Years to double at a given rate, or null when growth is impossible. */
export function yearsToDouble(annualPercent: number, compoundsPerYear = 1): number | null {
  if (annualPercent <= 0) return null
  const perPeriod = 1 + annualPercent / 100 / compoundsPerYear
  return round(Math.log(2) / (compoundsPerYear * Math.log(perPeriod)), 2)
}

/** The rule-of-72 shortcut, with the exact figure beside it. */
export function doublingYears(annualPercent: number, compoundsPerYear = 1): { estimate: number; exact: number | null } {
  if (annualPercent <= 0) return { estimate: Number.POSITIVE_INFINITY, exact: null }
  return {
    estimate: round(72 / annualPercent, 1),
    exact: yearsToDouble(annualPercent, compoundsPerYear),
  }
}

/** What today's amount is worth after inflation eats into it. */
export function realValue(amount: number, inflationPercent: number, years: number): number {
  const start = requirePrincipal(amount)
  if (!Number.isFinite(inflationPercent) || inflationPercent < 0) {
    throw new Error('Inflation cannot be negative.')
  }
  return round(start / Math.pow(1 + inflationPercent / 100, requireYears(years)))
}

export { formatMoney, round } from '@/lib/money'
