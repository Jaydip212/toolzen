export type PercentageMode = 'of' | 'is-what-percent' | 'change'

export interface PercentageResult {
  /** The headline number, already rounded for display. */
  value: number
  /** A sentence explaining what was calculated. */
  sentence: string
  /** The formula, so the working is visible. */
  formula: string
  /** True when the result went down, for the change mode. */
  decreased: boolean
}

/** Round to a sensible number of decimals without trailing zeros. */
export function round(value: number, decimals = 4): number {
  if (!Number.isFinite(value)) return value
  const factor = 10 ** decimals
  const rounded = Math.round(value * factor) / factor
  // Normalise negative zero, which formats as "-0" and looks like a bug.
  return rounded === 0 ? 0 : rounded
}

/** Format a number for display, grouping thousands. */
export function formatNumber(value: number, maxDecimals = 4): string {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString('en-US', { maximumFractionDigits: maxDecimals })
}

/**
 * Calculate a percentage in one of three ways.
 *
 * Throws for division by zero rather than returning Infinity, because
 * "Infinity percent" is never the answer the user wanted.
 */
export function calculate(mode: PercentageMode, a: number, b: number): PercentageResult {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error('Enter two numbers.')
  }

  if (mode === 'of') {
    const value = (a / 100) * b
    return {
      value: round(value),
      sentence: `${formatNumber(a)}% of ${formatNumber(b)} is ${formatNumber(round(value))}.`,
      formula: `(${formatNumber(a)} ÷ 100) × ${formatNumber(b)}`,
      decreased: false,
    }
  }

  if (mode === 'is-what-percent') {
    if (b === 0) throw new Error('The second number cannot be zero — you cannot divide by zero.')
    const value = (a / b) * 100
    return {
      value: round(value),
      sentence: `${formatNumber(a)} is ${formatNumber(round(value))}% of ${formatNumber(b)}.`,
      formula: `(${formatNumber(a)} ÷ ${formatNumber(b)}) × 100`,
      decreased: false,
    }
  }

  if (a === 0) {
    throw new Error('The starting value cannot be zero — a percentage change from zero is undefined.')
  }
  const value = ((b - a) / Math.abs(a)) * 100
  const decreased = b < a
  const direction = decreased ? 'decrease' : 'increase'
  return {
    value: round(value),
    sentence: `Going from ${formatNumber(a)} to ${formatNumber(b)} is a ${formatNumber(Math.abs(round(value)))}% ${direction}.`,
    formula: `((${formatNumber(b)} − ${formatNumber(a)}) ÷ ${formatNumber(Math.abs(a))}) × 100`,
    decreased,
  }
}

/** What each mode asks, for the UI. */
export const MODES: Array<{ value: PercentageMode; label: string; first: string; second: string }> = [
  { value: 'of', label: 'X% of Y', first: 'Percentage', second: 'Of value' },
  { value: 'is-what-percent', label: 'X is what % of Y', first: 'Value', second: 'Total' },
  { value: 'change', label: 'Change from X to Y', first: 'From', second: 'To' },
]

/** A worked example for the selected mode, so the form is never blank. */
export function exampleFor(mode: PercentageMode): { a: number; b: number } {
  if (mode === 'of') return { a: 15, b: 200 }
  if (mode === 'is-what-percent') return { a: 30, b: 200 }
  return { a: 200, b: 250 }
}
