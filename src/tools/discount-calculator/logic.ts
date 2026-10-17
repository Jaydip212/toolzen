import { round } from '@/lib/money'
export interface DiscountResult {
  original: number
  saved: number
  final: number
  /** The discount as a share of the original price. */
  percent: number
}

export interface StackStep {
  /** Discount applied at this step. */
  percent: number
  /** Price after this discount. */
  price: number
  /** Money taken off at this step. */
  saved: number
}

export interface StackResult {
  original: number
  final: number
  saved: number
  /** The single percentage that would give the same final price. */
  effectivePercent: number
  /** What a flat addition of the same percentages would have given, for contrast. */
  naiveFinal: number
  steps: StackStep[]
}

export function requirePrice(value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new Error('The price has to be zero or more.')
  return value
}

export function requirePercent(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error('A discount has to be between 0% and 100%.')
  }
  return value
}

/** A single percentage off. */
export function applyPercent(price: number, percent: number): DiscountResult {
  const original = requirePrice(price)
  const rate = requirePercent(percent)
  const saved = round((original * rate) / 100)
  return {
    original: round(original),
    saved,
    final: round(original - saved),
    percent: rate,
  }
}

/**
 * Several discounts applied one after another.
 *
 * This is the whole point of the tool: 20% then 10% is 28% off, not 30% off,
 * because the second discount applies to the already-reduced price. The flat
 * total is returned too so the difference is visible rather than assumed.
 */
export function applyStacked(price: number, percents: number[]): StackResult {
  const original = requirePrice(price)
  const cleaned = percents.filter((value) => Number.isFinite(value) && value > 0)
  for (const value of percents) requirePercent(value)

  let current = original
  const steps: StackStep[] = []
  for (const percent of cleaned) {
    const saved = round((current * percent) / 100)
    current = round(current - saved)
    steps.push({ percent, price: current, saved })
  }

  const saved = round(original - current)
  const flat = cleaned.reduce((total, percent) => total + percent, 0)
  const naiveFinal = round(original - (original * flat) / 100)

  return {
    original: round(original),
    final: current,
    saved,
    effectivePercent: original === 0 ? 0 : Math.round((saved / original) * 1000) / 10,
    naiveFinal,
    steps,
  }
}

/** The original price that a discounted price came from. */
export function originalPrice(final: number, percent: number): DiscountResult {
  const paid = requirePrice(final)
  const rate = requirePercent(percent)
  if (rate >= 100) throw new Error('A 100% discount leaves nothing to reverse.')
  const original = round(paid / (1 - rate / 100))
  return {
    original,
    saved: round(original - paid),
    final: round(paid),
    percent: rate,
  }
}

export interface Offer {
  label: string
  price: number
  size: number
  unit: string
}

export interface OfferResult {
  offer: Offer
  pricePerUnit: number
  /** Difference against the cheapest, as a percentage; 0 for the winner. */
  premiumPercent: number
}

export interface Comparison {
  rows: OfferResult[]
  best: OfferResult | null
  /** True when two offers cost exactly the same per unit. */
  tied: boolean
}

/**
 * Which pack size is genuinely cheapest.
 *
 * Returns null rather than a guess when any size is missing or zero, because a
 * per-unit price cannot be worked out without a usable size.
 */
export function compareUnits(offers: Offer[]): Comparison {
  const priced: OfferResult[] = []

  for (const offer of offers) {
    const price = Number(offer.price)
    const size = Number(offer.size)
    if (!Number.isFinite(price) || price < 0) continue
    if (!Number.isFinite(size) || size <= 0) continue
    priced.push({ offer, pricePerUnit: price / size, premiumPercent: 0 })
  }

  if (priced.length === 0) return { rows: [], best: null, tied: false }

  const cheapest = Math.min(...priced.map((row) => row.pricePerUnit))
  for (const row of priced) {
    row.pricePerUnit = round(row.pricePerUnit, 4)
    row.premiumPercent =
      cheapest === 0 ? 0 : Math.round(((row.pricePerUnit - cheapest) / cheapest) * 1000) / 10
  }

  const winners = priced.filter((row) => row.premiumPercent === 0)
  return {
    rows: priced,
    best: priced.reduce((lowest, row) => (row.pricePerUnit < lowest.pricePerUnit ? row : lowest), priced[0]),
    tied: winners.length > 1,
  }
}

/** A price with tax added, which is what a shelf price usually already includes. */
export function withTax(price: number, percent: number): { tax: number; total: number } {
  const base = requirePrice(price)
  const rate = requirePercent(percent)
  const tax = round((base * rate) / 100)
  return { tax, total: round(base + tax) }
}

/** The saving as a share of the original, useful when only money is known. */
export function savedPercent(original: number, final: number): number {
  const from = requirePrice(original)
  if (from === 0) return 0
  return Math.round(((from - final) / from) * 1000) / 10
}

export { formatMoney, round } from '@/lib/money'
