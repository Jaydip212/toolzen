import { formatMoney, round } from '@/lib/money'
export type SupplyType = 'intra' | 'inter'

export interface GstBreakdown {
  /** The amount before tax. */
  net: number
  /** Total GST charged. */
  tax: number
  /** Net plus tax. */
  gross: number
  /** Central GST, charged at half the rate within a state. */
  cgst: number
  /** State GST, charged at half the rate within a state. */
  sgst: number
  /** Integrated GST, charged at the full rate between states. */
  igst: number
  rate: number
  supply: SupplyType
}

/** The GST rate slabs in force for goods, plus the common service rates. */
export const GST_RATES: number[] = [0, 0.25, 1.5, 3, 5, 7.5, 12, 18, 28]

export interface GstResult {
  net: number
  tax: number
  gross: number
  cgst: number
  sgst: number
  igst: number
  rate: number
  supply: SupplyType
}

function build(amount: number, tax: number, rate: number, supply: SupplyType): GstResult {
  const net = round(amount)
  const taxRounded = round(tax)
  return {
    net,
    tax: taxRounded,
    gross: round(net + taxRounded),
    cgst: supply === 'intra' ? round(taxRounded / 2) : 0,
    sgst: supply === 'intra' ? round(taxRounded / 2) : 0,
    igst: supply === 'inter' ? taxRounded : 0,
    rate,
    supply,
  }
}

export function requireAmount(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Enter an amount of zero or more.')
  }
  return value
}

export function requireRate(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error('The rate has to be between 0% and 100%.')
  }
  return value
}

/** Add GST to a net amount. */
export function addGst(net: number, ratePercent: number, supply: SupplyType = 'intra'): GstResult {
  const amount = requireAmount(net)
  const rate = requireRate(ratePercent)
  return build(amount, (amount * rate) / 100, rate, supply)
}

/**
 * Remove GST from a tax-inclusive amount.
 *
 * The tax is recovered as `gross − gross × 100/(100+rate)`, never as
 * `gross × rate/100` — which would overstate the tax on a gross figure.
 */
export function removeGst(gross: number, ratePercent: number, supply: SupplyType = 'intra'): GstResult {
  const amount = requireAmount(gross)
  const rate = requireRate(ratePercent)
  const net = rate === 100 ? 0 : (amount * 100) / (100 + rate)
  return build(net, amount - net, rate, supply)
}

/** Whether a supply between two states attracts IGST or CGST+SGST. */
export function describeSupply(supply: SupplyType): string {
  return supply === 'intra'
    ? 'Same state or union territory — CGST and SGST, half the rate each.'
    : 'Different states or a place of supply outside the state — IGST at the full rate.'
}

/** A one-line invoice summary, which is what most people actually want to paste. */
export function describeInvoice(result: GstResult): string {
  const label = result.supply === 'intra' ? 'CGST + SGST' : 'IGST'
  return `Taxable value ${formatMoney(result.net)} + ${label} ${formatMoney(result.tax)} @ ${result.rate}% = ${formatMoney(result.gross)}`
}

/** The rate that turns a known net and gross pair into a GST figure, rounded to the nearest tenth. */
export function rateFrom(net: number, gross: number): number | null {
  if (!Number.isFinite(net) || !Number.isFinite(gross) || net <= 0) return null
  const rate = ((gross - net) / net) * 100
  if (rate < 0 || rate > 100) return null
  return Math.round(rate * 10) / 10
}

export { formatMoney, round }
