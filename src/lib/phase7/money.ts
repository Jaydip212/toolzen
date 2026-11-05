/**
 * Everyday money maths for the tip and split-bill calculators.
 *
 * All arithmetic happens in integer cents, so 0.1 + 0.2 never leaks into a
 * result and a split always sums back to the exact original total.
 */

export interface MoneyResult {
  billCents: number
  tipCents: number
  totalCents: number
  perPersonCents: number[]
}

function parseMoney(value: number): number | null {
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000) return null
  return Math.round(value * 100)
}

export function calculateTip(input: {
  bill: number
  tipPercent: number
  people: number
}): { ok: true; result: MoneyResult } | { ok: false; error: string } {
  const billCents = parseMoney(input.bill)
  if (billCents === null) return { ok: false, error: 'Enter a bill amount of zero or more.' }
  if (!Number.isFinite(input.tipPercent) || input.tipPercent < 0 || input.tipPercent > 100) {
    return { ok: false, error: 'The tip percentage must be between 0 and 100.' }
  }
  if (!Number.isInteger(input.people) || input.people < 1 || input.people > 1000) {
    return { ok: false, error: 'The number of people must be between 1 and 1000.' }
  }
  const tipCents = Math.round((billCents * input.tipPercent) / 100)
  const totalCents = billCents + tipCents
  return { ok: true, result: { billCents, tipCents, totalCents, perPersonCents: splitCents(totalCents, input.people) } }
}

/** Split cents into `people` shares whose sum is exactly `totalCents`. */
export function splitCents(totalCents: number, people: number): number[] {
  const base = Math.floor(totalCents / people)
  const extra = totalCents % people
  return Array.from({ length: people }, (_, index) => base + (index < extra ? 1 : 0))
}

export function calculateSplitBill(input: {
  total: number
  people: number
  tipPercent: number
}): { ok: true; result: MoneyResult } | { ok: false; error: string } {
  const base = parseMoney(input.total)
  if (base === null) return { ok: false, error: 'Enter a total of zero or more.' }
  if (!Number.isInteger(input.people) || input.people < 1 || input.people > 1000) {
    return { ok: false, error: 'The number of people must be between 1 and 1000.' }
  }
  if (!Number.isFinite(input.tipPercent) || input.tipPercent < 0 || input.tipPercent > 100) {
    return { ok: false, error: 'The tip percentage must be between 0 and 100.' }
  }
  const tipCents = Math.round((base * input.tipPercent) / 100)
  const totalCents = base + tipCents
  return { ok: true, result: { billCents: base, tipCents, totalCents, perPersonCents: splitCents(totalCents, input.people) } }
}

/** Format cents as a plain decimal string, e.g. 12345 -> "123.45". */
export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2)
}
