/**
 * Unit conversion with plain factor tables — deterministic and exact to the
 * limits of decimal arithmetic. Temperature is the one affine exception and
 * is handled by its own pair of functions rather than a factor.
 */

export interface UnitCategory {
  id: string
  label: string
  /** Every unit expressed as a multiple of the category's base unit. */
  units: { id: string; label: string; factor: number }[]
}

export const CATEGORIES: UnitCategory[] = [
  {
    id: 'length',
    label: 'Length',
    units: [
      { id: 'mm', label: 'Millimetre', factor: 0.001 },
      { id: 'cm', label: 'Centimetre', factor: 0.01 },
      { id: 'm', label: 'Metre', factor: 1 },
      { id: 'km', label: 'Kilometre', factor: 1000 },
      { id: 'in', label: 'Inch', factor: 0.0254 },
      { id: 'ft', label: 'Foot', factor: 0.3048 },
      { id: 'mi', label: 'Mile', factor: 1609.344 },
    ],
  },
  {
    id: 'mass',
    label: 'Weight',
    units: [
      { id: 'g', label: 'Gram', factor: 1 },
      { id: 'kg', label: 'Kilogram', factor: 1000 },
      { id: 't', label: 'Tonne', factor: 1_000_000 },
      { id: 'oz', label: 'Ounce', factor: 28.349523125 },
      { id: 'lb', label: 'Pound', factor: 453.59237 },
    ],
  },
  {
    id: 'data',
    label: 'Data size',
    units: [
      { id: 'b', label: 'Byte', factor: 1 },
      { id: 'kb', label: 'Kilobyte (1000 B)', factor: 1e3 },
      { id: 'kib', label: 'Kibibyte (1024 B)', factor: 1024 },
      { id: 'mb', label: 'Megabyte (1000² B)', factor: 1e6 },
      { id: 'mib', label: 'Mebibyte (1024² B)', factor: 1024 ** 2 },
      { id: 'gb', label: 'Gigabyte (1000³ B)', factor: 1e9 },
      { id: 'gib', label: 'Gibibyte (1024³ B)', factor: 1024 ** 3 },
    ],
  },
]

const TEMPERATURE_UNITS = [
  { id: 'c', label: 'Celsius' },
  { id: 'f', label: 'Fahrenheit' },
  { id: 'k', label: 'Kelvin' },
]

/** Convert between temperature units, the one affine family. */
export function convertTemperature(value: number, from: string, to: string): number {
  if (from === to) return value
  // Everything routes through Celsius.
  const celsius = from === 'c' ? value : from === 'f' ? ((value - 32) * 5) / 9 : value - 273.15
  if (to === 'c') return celsius
  if (to === 'f') return (celsius * 9) / 5 + 32
  return celsius + 273.15
}

export function isTemperatureCategory(id: string): boolean {
  return id === 'temperature'
}

export function temperatureUnits() {
  return TEMPERATURE_UNITS
}

/**
 * Convert a value between two units of one category. Returns null for
 * unknown units so the UI can report the problem instead of guessing.
 */
export function convert(
  categoryId: string,
  value: number,
  from: string,
  to: string,
): number | null {
  if (isTemperatureCategory(categoryId)) return convertTemperature(value, from, to)
  const category = CATEGORIES.find((c) => c.id === categoryId)
  if (!category) return null
  const fromUnit = category.units.find((u) => u.id === from)
  const toUnit = category.units.find((u) => u.id === to)
  if (!fromUnit || !toUnit) return null
  return (value * fromUnit.factor) / toUnit.factor
}

/** Round for display without pretending to more precision than exists. */
export function formatValue(value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (value === 0) return '0'
  const abs = Math.abs(value)
  if (abs >= 1e15 || abs < 1e-9) return value.toExponential(6)
  const rounded = Number(value.toPrecision(10))
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 10 })
}

/** Physical limits the interface should flag rather than silently accept. */
export function temperatureWarning(value: number, from: string): string | null {
  const celsius = from === 'c' ? value : from === 'f' ? ((value - 32) * 5) / 9 : value - 273.15
  if (celsius < -273.15) return 'That is below absolute zero, which no physical system can reach.'
  return null
}
