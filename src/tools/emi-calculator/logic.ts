import { round } from '@/lib/money'
export interface ScheduleRow {
  /** Payment number, starting at 1. */
  number: number
  payment: number
  interest: number
  principal: number
  /** Balance still outstanding after this payment. */
  balance: number
}

export interface LoanSummary {
  payment: number
  principal: number
  months: number
  totalInterest: number
  totalPaid: number
  /** True when the quoted rate is zero, so every payment is pure principal. */
  interestFree: boolean
}

export interface Prepayment {
  months: number
  totalInterest: number
  monthsSaved: number
  interestSaved: number
}

/** A fixed monthly instalment, rounded to two decimals as a lender would. */
export function monthlyPayment(principal: number, annualRatePercent: number, months: number): number {
  if (!Number.isFinite(principal) || principal <= 0) {
    throw new Error('The loan amount has to be a number above zero.')
  }
  if (!Number.isFinite(months) || months < 1) {
    throw new Error('The term has to be at least one month.')
  }
  const rate = monthlyRate(annualRatePercent)
  if (rate === 0) return round(principal / months)

  const factor = Math.pow(1 + rate, months)
  return round((principal * rate * factor) / (factor - 1))
}

/** Annual percentage rate expressed as a monthly decimal rate. */
export function monthlyRate(annualRatePercent: number): number {
  if (!Number.isFinite(annualRatePercent) || annualRatePercent < 0) {
    throw new Error('The interest rate cannot be negative.')
  }
  return annualRatePercent / 100 / 12
}

/**
 * The full amortisation schedule.
 *
 * The final payment is corrected for rounding, so the balance lands on exactly
 * zero rather than a stray few paise — which is what a real statement shows.
 */
export function schedule(principal: number, annualRatePercent: number, months: number): ScheduleRow[] {
  const rate = monthlyRate(annualRatePercent)
  const payment = monthlyPayment(principal, annualRatePercent, months)
  const rows: ScheduleRow[] = []

  let balance = principal
  for (let number = 1; number <= months; number += 1) {
    const interest = round(balance * rate)
    let principalPart = round(payment - interest)
    if (number === months) principalPart = round(balance)
    const actualPayment = round(principalPart + interest)

    balance = round(balance - principalPart)
    if (balance < 0.01 && balance > -0.01) balance = 0

    rows.push({ number, payment: actualPayment, interest, principal: principalPart, balance })

    if (balance <= 0) break
  }
  return rows
}

export function summarise(principal: number, annualRatePercent: number, months: number): LoanSummary {
  const rows = schedule(principal, annualRatePercent, months)
  const totalPaid = rows.reduce((total, row) => total + row.payment, 0)
  return {
    payment: monthlyPayment(principal, annualRatePercent, months),
    principal: round(principal),
    months: rows.length,
    totalInterest: round(totalPaid - principal),
    totalPaid: round(totalPaid),
    interestFree: monthlyRate(annualRatePercent) === 0,
  }
}

/**
 * What an extra monthly payment does.
 *
 * The schedule is re-run with the higher payment, so the answer reflects the
 * order interest is actually charged in rather than a shortcut formula.
 */
export function withExtraPayment(
  principal: number,
  annualRatePercent: number,
  months: number,
  extraPerMonth: number,
): Prepayment {
  const baseline = summarise(principal, annualRatePercent, months)
  if (!Number.isFinite(extraPerMonth) || extraPerMonth <= 0) {
    return {
      months: baseline.months,
      totalInterest: baseline.totalInterest,
      monthsSaved: 0,
      interestSaved: 0,
    }
  }

  const rate = monthlyRate(annualRatePercent)
  let balance = principal
  let totalInterest = 0
  let count = 0

  const guard = months * 2 + 1
  while (balance > 0.01 && count < guard) {
    const interest = round(balance * rate)
    const payment = round(baseline.payment + extraPerMonth)
    const principalPart = Math.min(payment - interest, balance)
    totalInterest += interest
    balance = round(balance - principalPart)
    count += 1
  }

  return {
    months: count,
    totalInterest: round(totalInterest),
    monthsSaved: Math.max(0, baseline.months - count),
    interestSaved: Math.max(0, round(baseline.totalInterest - totalInterest)),
  }
}

/** The share of every payment that is interest rather than principal. */
export function interestShare(summary: LoanSummary): number {
  if (summary.totalPaid <= 0) return 0
  return Math.round((summary.totalInterest / summary.totalPaid) * 1000) / 10
}

/** Common loan terms, offered as presets rather than invented defaults. */
export const TERM_PRESETS: Array<{ months: number; label: string }> = [
  { months: 12, label: '1 year' },
  { months: 24, label: '2 years' },
  { months: 36, label: '3 years' },
  { months: 60, label: '5 years' },
  { months: 84, label: '7 years' },
  { months: 120, label: '10 years' },
  { months: 180, label: '15 years' },
  { months: 240, label: '20 years' },
  { months: 300, label: '25 years' },
]

export { formatMoney, round } from '@/lib/money'
