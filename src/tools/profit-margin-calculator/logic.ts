import { round } from '@/lib/money'
export interface MarginResult {
  revenue: number
  cost: number
  profit: number
  /** Profit as a share of revenue. */
  marginPercent: number
  /** Profit as a share of cost. */
  markupPercent: number
  /** Cost as a share of revenue. */
  costSharePercent: number
}

export interface Breakeven {
  /** Whole units needed before the business stops losing money. */
  units: number
  /** Contribution per unit: price minus variable cost. */
  contribution: number
  revenueAtBreakeven: number
}

export function requirePositive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} has to be a number above zero.`)
  }
  return value
}

export function requireNonNegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} cannot be negative.`)
  }
  return value
}

/** Both margin and markup from revenue and cost — the pair people mix up. */
export function fromRevenueCost(revenue: number, cost: number): MarginResult {
  const sales = requirePositive(revenue, 'Revenue')
  const spend = requireNonNegative(cost, 'Cost')
  if (spend > sales) {
    throw new Error('Cost is above revenue, so there is no margin — this is a loss.')
  }
  const profit = sales - spend
  return {
    revenue: round(sales),
    cost: round(spend),
    profit: round(profit),
    marginPercent: round((profit / sales) * 100),
    markupPercent: spend === 0 ? Number.POSITIVE_INFINITY : round((profit / spend) * 100),
    costSharePercent: round((spend / sales) * 100),
  }
}

/** What the cost has to be to hit a target margin on a given revenue. */
export function fromMargin(revenue: number, marginPercent: number): MarginResult {
  const sales = requirePositive(revenue, 'Revenue')
  if (!Number.isFinite(marginPercent) || marginPercent < 0 || marginPercent >= 100) {
    throw new Error('Margin has to be between 0% and just under 100%.')
  }
  const profit = (sales * marginPercent) / 100
  const cost = sales - profit
  return {
    revenue: round(sales),
    cost: round(cost),
    profit: round(profit),
    marginPercent: round(marginPercent),
    markupPercent: cost === 0 ? Number.POSITIVE_INFINITY : round((profit / cost) * 100),
    costSharePercent: round((cost / sales) * 100),
  }
}

/** What the price has to be to hit a target markup on cost. */
export function fromMarkup(cost: number, markupPercent: number): MarginResult {
  const spend = requirePositive(cost, 'Cost')
  if (!Number.isFinite(markupPercent) || markupPercent < 0) {
    throw new Error('Markup cannot be negative.')
  }
  const revenue = spend + (spend * markupPercent) / 100
  const profit = revenue - spend
  return {
    revenue: round(revenue),
    cost: round(spend),
    profit: round(profit),
    marginPercent: round((profit / revenue) * 100),
    markupPercent: round(markupPercent),
    costSharePercent: round((spend / revenue) * 100),
  }
}

/** Profit per unit and the total across a run. */
export function fromUnits(
  unitPrice: number,
  unitCost: number,
  quantity: number,
): MarginResult & { quantity: number } {
  const price = requirePositive(unitPrice, 'Selling price')
  const cost = requireNonNegative(unitCost, 'Unit cost')
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('Quantity has to be above zero.')
  }
  if (cost >= price) {
    throw new Error('The unit cost is not below the selling price, so there is no profit to report.')
  }
  const result = fromRevenueCost(price * quantity, cost * quantity)
  // Fractional quantities are legitimate — 2.5 kg of stock is a real quantity —
  // so the figure is reported as given rather than floored to a whole unit.
  return { ...result, quantity: round(quantity, 2) }
}

/** Contribution per unit and the volume needed to cover fixed costs. */
export function breakeven(fixedCosts: number, unitPrice: number, unitCost: number): Breakeven {
  const fixed = requireNonNegative(fixedCosts, 'Fixed costs')
  const price = requirePositive(unitPrice, 'Selling price')
  const cost = requireNonNegative(unitCost, 'Unit cost')
  const contribution = price - cost
  if (contribution <= 0) {
    throw new Error('Each unit loses money, so fixed costs can never be covered.')
  }
  const units = fixed === 0 ? 0 : Math.ceil(fixed / contribution)
  return {
    units,
    contribution: round(contribution),
    revenueAtBreakeven: round(units * price),
  }
}

/** The one-sentence explanation that stops margin and markup being swapped. */
export const MARGIN_VS_MARKUP =
  'Margin is the profit as a share of the selling price. Markup is the profit as a share of the cost. A 50% markup is a 33.3% margin — the same money, a different denominator.'

/** Both figures for the same numbers, side by side. */
export function bothFor(price: number, cost: number): { marginPercent: number; markupPercent: number } {
  const value = requirePositive(price, 'Price')
  const spend = requireNonNegative(cost, 'Cost')
  if (spend >= value) return { marginPercent: 0, markupPercent: 0 }
  const profit = value - spend
  return {
    marginPercent: round((profit / value) * 100),
    markupPercent: spend === 0 ? Number.POSITIVE_INFINITY : round((profit / spend) * 100),
  }
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '∞'
  const rounded = Math.round(value * 100) / 100
  return `${rounded.toLocaleString('en-US', { maximumFractionDigits: 2 })}%`
}

export { formatMoney, round } from '@/lib/money'
