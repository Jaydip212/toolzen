export interface SizeUnit {
  id: string
  label: string
  /** How many bytes one of this unit is. */
  bytes: number
  /** Decimal (1000) or binary (1024) family. */
  family: 'decimal' | 'binary'
}

export const SIZE_UNITS: SizeUnit[] = [
  { id: 'B', label: 'Byte', bytes: 1, family: 'decimal' },
  { id: 'KB', label: 'Kilobyte', bytes: 1000, family: 'decimal' },
  { id: 'MB', label: 'Megabyte', bytes: 1000 ** 2, family: 'decimal' },
  { id: 'GB', label: 'Gigabyte', bytes: 1000 ** 3, family: 'decimal' },
  { id: 'TB', label: 'Terabyte', bytes: 1000 ** 4, family: 'decimal' },
  { id: 'KiB', label: 'Kibibyte', bytes: 1024, family: 'binary' },
  { id: 'MiB', label: 'Mebibyte', bytes: 1024 ** 2, family: 'binary' },
  { id: 'GiB', label: 'Gibibyte', bytes: 1024 ** 3, family: 'binary' },
  { id: 'TiB', label: 'Tebibyte', bytes: 1024 ** 4, family: 'binary' },
]

export interface ConversionRow {
  unit: SizeUnit
  value: number
  /** Formatted with a sensible number of decimal places. */
  display: string
}

/** Find a unit by its id, case-insensitively. */
export function findUnit(id: string): SizeUnit | undefined {
  const wanted = id.trim().toUpperCase()
  return SIZE_UNITS.find((unit) => unit.id.toUpperCase() === wanted)
}

/**
 * Convert a value from one unit into every supported unit.
 *
 * Throws for a non-finite or negative value rather than returning nonsense.
 */
export function convertSize(value: number, from: string): ConversionRow[] {
  const unit = findUnit(from)
  if (!unit) throw new Error(`“${from}” is not a supported unit.`)
  if (!Number.isFinite(value)) throw new Error('Enter a finite number.')
  if (value < 0) throw new Error('Size cannot be negative.')

  const bytes = value * unit.bytes

  return SIZE_UNITS.map((target) => {
    const converted = bytes / target.bytes
    return { unit: target, value: converted, display: formatSizeValue(converted) }
  })
}

/**
 * Format a converted value.
 *
 * Small values keep up to six decimals so a conversion is not lost to
 * rounding; large values are grouped for readability.
 */
export function formatSizeValue(value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (value === 0) return '0'
  if (value >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (value >= 1) return value.toFixed(value % 1 === 0 ? 0 : 2)
  if (value >= 0.001) return value.toFixed(4)
  return value.toExponential(3)
}

/** The byte count behind a value and unit, for display. */
export function toBytes(value: number, from: string): number {
  const unit = findUnit(from)
  if (!unit) throw new Error(`“${from}” is not a supported unit.`)
  return value * unit.bytes
}

/** The ratio between the two families at the same nominal prefix. */
export const DECIMAL_BINARY_GAP = 1000 ** 3 / 1024 ** 3

/** Plain-English explanation of why a "500 GB" drive shows as ~465 GiB. */
export function explainGap(): string {
  return (
    'Drive makers use decimal units: 1 GB = 1,000,000,000 bytes. Operating systems often report binary ' +
    'units: 1 GiB = 1,073,741,824 bytes. The same disk is therefore about 7% smaller when counted in GiB, ' +
    'which is why a “500 GB” drive shows as roughly 465 GiB. Nothing is missing — only the unit changed.'
  )
}

/** A compact human summary, e.g. `1.5 MB (1,500,000 bytes)`. */
export function summarise(value: number, from: string): string {
  const unit = findUnit(from)
  if (!unit) return '—'
  const bytes = value * unit.bytes
  return `${formatSizeValue(value)} ${unit.id} (${Math.round(bytes).toLocaleString('en-US')} bytes)`
}
