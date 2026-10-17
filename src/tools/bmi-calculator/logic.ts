export type Sex = 'male' | 'female'

export interface BmiBands {
  /** Inclusive lower bound. */
  lower: number
  /** Exclusive upper bound, or null for the open-ended top band. */
  upper: number | null
  name: string
  advice: string
}

/** WHO body-mass-index bands for adults. */
export const BMI_BANDS: BmiBands[] = [
  {
    lower: 0,
    upper: 18.5,
    name: 'Underweight',
    advice: 'Below the range most guidelines treat as healthy. A clinician can say whether that matters for you.',
  },
  {
    lower: 18.5,
    upper: 25,
    name: 'Healthy weight',
    advice: 'Inside the range most guidelines treat as healthy for adults.',
  },
  {
    lower: 25,
    upper: 30,
    name: 'Overweight',
    advice: 'Above the healthy range. This is a screening measure, not a diagnosis.',
  },
  {
    lower: 30,
    upper: 35,
    name: 'Obesity class I',
    advice: 'A clinician would usually look at waist circumference and other measures alongside this.',
  },
  {
    lower: 35,
    upper: 40,
    name: 'Obesity class II',
    advice: 'A clinician would usually look at waist circumference and other measures alongside this.',
  },
  {
    lower: 40,
    upper: null,
    name: 'Obesity class III',
    advice: 'A clinician would usually look at waist circumference and other measures alongside this.',
  },
]

export interface BmiResult {
  value: number
  band: BmiBands
  /** Where the value sits between 15 and 40, as a 0–100 percentage, for the gauge. */
  position: number
  /** Kilogram range that would put this height in the healthy band. */
  healthyRange: { low: number; high: number }
}

export function requirePositive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} has to be a number above zero.`)
  }
  return value
}

/** Body mass index from kilograms and centimetres. */
export function bmi(weightKg: number, heightCm: number): number {
  requirePositive(weightKg, 'Weight')
  requirePositive(heightCm, 'Height')
  const metres = heightCm / 100
  return weightKg / (metres * metres)
}

/** The band a BMI value falls into. */
export function bandFor(value: number): BmiBands {
  return BMI_BANDS.find((band) => value >= band.lower && (band.upper === null || value < band.upper)) ?? BMI_BANDS[0]
}

export function assess(weightKg: number, heightCm: number): BmiResult {
  const value = bmi(weightKg, heightCm)
  const clamped = Math.min(Math.max(value, 15), 40)
  return {
    value: Math.round(value * 10) / 10,
    band: bandFor(value),
    position: Math.round(((clamped - 15) / (40 - 15)) * 100),
    healthyRange: healthyWeightRange(heightCm),
  }
}

/** The healthy weight range for a height, in kilograms. */
export function healthyWeightRange(heightCm: number): { low: number; high: number } {
  const metres = requirePositive(heightCm, 'Height') / 100
  return {
    low: round(18.5 * metres * metres, 1),
    high: round(24.9 * metres * metres, 1),
  }
}

/** The weight that would produce this BMI at this height. */
export function weightForBmi(value: number, heightCm: number): number {
  const metres = requirePositive(heightCm, 'Height') / 100
  return round(value * metres * metres, 1)
}

/** Mifflin–St Jeor resting metabolic rate, in kcal per day. */
export function bmrMifflin(weightKg: number, heightCm: number, ageYears: number, sex: Sex): number {
  requirePositive(weightKg, 'Weight')
  requirePositive(heightCm, 'Height')
  if (!Number.isFinite(ageYears) || ageYears <= 0 || ageYears > 120) {
    throw new Error('Age has to be between 1 and 120.')
  }
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears
  return Math.round(sex === 'male' ? base + 5 : base - 161)
}

/** Katch–McArdle resting metabolic rate, which uses lean mass instead of sex and age. */
export function bmrKatchMcArdle(leanMassKg: number): number {
  requirePositive(leanMassKg, 'Lean mass')
  return Math.round(370 + 21.6 * leanMassKg)
}

export interface ActivityLevel {
  id: string
  label: string
  factor: number
}

/** Standard PAL multipliers. The factor is multiplied by BMR to get maintenance calories. */
export const ACTIVITY_LEVELS: ActivityLevel[] = [
  { id: 'sedentary', label: 'Sedentary — desk job, little exercise', factor: 1.2 },
  { id: 'light', label: 'Light — light exercise 1–3 days a week', factor: 1.375 },
  { id: 'moderate', label: 'Moderate — exercise 3–5 days a week', factor: 1.55 },
  { id: 'active', label: 'Active — hard exercise 6–7 days a week', factor: 1.725 },
  { id: 'athlete', label: 'Athlete — physical job or twice-daily training', factor: 1.9 },
]

/** Total daily energy expenditure: BMR multiplied by the activity factor. */
export function tdee(bmr: number, factor: number): number {
  if (!Number.isFinite(bmr) || bmr <= 0) throw new Error('Basal metabolic rate has to be above zero.')
  return Math.round(bmr * factor)
}

export interface CalorieTarget {
  id: string
  label: string
  calories: number
  /** Expected weekly change in kilograms at a 7,700 kcal-per-kg rule of thumb. */
  weeklyChangeKg: number
}

/**
 * Daily targets either side of maintenance.
 *
 * The weekly change uses the long-standing 7,700 kcal per kilogram approximation,
 * which is an average and not a promise — real weight change is noisy week to week.
 */
export function calorieTargets(maintenance: number): CalorieTarget[] {
  const spec: Array<{ id: string; label: string; delta: number }> = [
    { id: 'gain', label: 'Gain weight', delta: 500 },
    { id: 'maintain', label: 'Maintain', delta: 0 },
    { id: 'mild-loss', label: 'Mild loss (−0.45 kg/week)', delta: -500 },
    { id: 'loss', label: 'Loss (−0.7 kg/week)', delta: -750 },
  ]

  return spec.map(({ id, label, delta }) => ({
    id,
    label,
    calories: maintenance + delta,
    weeklyChangeKg: Math.round(((delta * 7) / 7700) * 100) / 100,
  }))
}

/**
 * A lower BMI threshold applies to adults of Black African, African-Caribbean,
 * South Asian, Chinese and other Asian descent, per UK NICE guidance. Being told
 * this is more useful than being handed a single universal cut-off.
 */
export const ETHNICITY_ADJUSTMENT_NOTE =
  'UK NICE guidance sets lower thresholds for adults of Black African, African-Caribbean, South Asian, Chinese and other Asian descent: 23 for overweight and 27.5 for obesity. Check with a clinician which band applies to you.'

export function lbToKg(pounds: number): number {
  return round(pounds * 0.45359237, 2)
}

export function kgToLb(kilograms: number): number {
  return round(kilograms / 0.45359237, 2)
}

/** Feet and inches to centimetres. */
export function ftInToCm(feet: number, inches: number): number {
  return round((feet * 12 + inches) * 2.54, 1)
}

export function cmToFtIn(centimetres: number): { feet: number; inches: number } {
  const totalInches = centimetres / 2.54
  const feet = Math.floor(totalInches / 12)
  return { feet, inches: Math.round((totalInches - feet * 12) * 10) / 10 }
}

export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  const rounded = Math.round(value * factor) / factor
  return rounded === 0 ? 0 : rounded
}
