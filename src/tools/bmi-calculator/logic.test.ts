import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_LEVELS,
  BMI_BANDS,
  assess,
  bandFor,
  bmi,
  bmrKatchMcArdle,
  bmrMifflin,
  calorieTargets,
  cmToFtIn,
  ftInToCm,
  healthyWeightRange,
  kgToLb,
  lbToKg,
  tdee,
  weightForBmi,
} from './logic'

describe('bmi', () => {
  it('computes the standard worked example', () => {
    // 70 kg at 1.75 m is 22.9.
    expect(bmi(70, 175)).toBeCloseTo(22.857, 3)
  })

  it('rejects non-positive input', () => {
    expect(() => bmi(0, 175)).toThrow(/Weight/)
    expect(() => bmi(70, 0)).toThrow(/Height/)
    expect(() => bmi(-70, 175)).toThrow(/Weight/)
  })
})

describe('bandFor', () => {
  it('places values on the band edges', () => {
    expect(bandFor(18.4).name).toBe('Underweight')
    expect(bandFor(18.5).name).toBe('Healthy weight')
    expect(bandFor(24.9).name).toBe('Healthy weight')
    expect(bandFor(25).name).toBe('Overweight')
    expect(bandFor(30).name).toBe('Obesity class I')
    expect(bandFor(40).name).toBe('Obesity class III')
    expect(bandFor(55).name).toBe('Obesity class III')
  })

  it('gives every band a name and advice', () => {
    expect(BMI_BANDS).toHaveLength(6)
    expect(BMI_BANDS.every((band) => band.name.length > 0 && band.advice.length > 0)).toBe(true)
  })

  it('leaves no gap between bands', () => {
    for (let index = 1; index < BMI_BANDS.length; index += 1) {
      expect(BMI_BANDS[index].lower).toBe(BMI_BANDS[index - 1].upper)
    }
  })
})

describe('assess', () => {
  it('reports a rounded value with the healthy range', () => {
    const result = assess(70, 175)
    expect(result.value).toBe(22.9)
    expect(result.band.name).toBe('Healthy weight')
    expect(result.healthyRange.low).toBeLessThan(result.healthyRange.high)
  })

  it('clamps the gauge position to 0–100', () => {
    expect(assess(40, 175).position).toBe(0)
    expect(assess(400, 175).position).toBe(100)
  })
})

describe('healthyWeightRange and weightForBmi', () => {
  it('computes the range for 1.75 m', () => {
    const range = healthyWeightRange(175)
    // 18.5 × 1.75² = 56.66, rounded to 56.7.
    expect(range.low).toBeCloseTo(56.7, 1)
    expect(range.high).toBeCloseTo(76.3, 1)
  })

  it('round-trips through weightForBmi', () => {
    expect(bmi(weightForBmi(18.5, 180), 180)).toBeCloseTo(18.5, 1)
    expect(bmi(weightForBmi(24.9, 180), 180)).toBeCloseTo(24.9, 1)
  })
})

describe('metabolic rates', () => {
  it('matches the published Mifflin–St Jeor example', () => {
    // 80 kg, 180 cm, 30 years, male: 10(80) + 6.25(180) − 5(30) + 5 = 1780.
    expect(bmrMifflin(80, 180, 30, 'male')).toBe(1780)
  })

  it('is 166 kcal lower for the same female profile', () => {
    expect(bmrMifflin(65, 165, 30, 'female')).toBe(1370)
  })

  it('rejects an unusable age', () => {
    expect(() => bmrMifflin(70, 175, 0, 'male')).toThrow(/Age/)
    expect(() => bmrMifflin(70, 175, 200, 'male')).toThrow(/Age/)
  })

  it('computes the Katch–McArdle rate from lean mass', () => {
    // 370 + 21.6 × 60 = 1666.
    expect(bmrKatchMcArdle(60)).toBe(1666)
  })

  it('rejects zero lean mass', () => {
    expect(() => bmrKatchMcArdle(0)).toThrow(/Lean mass/)
  })
})

describe('tdee and calorie targets', () => {
  it('multiplies BMR by the activity factor', () => {
    expect(tdee(1500, 1.2)).toBe(1800)
    expect(tdee(1500, 1.9)).toBe(2850)
  })

  it('lists five activity levels in ascending order', () => {
    expect(ACTIVITY_LEVELS).toHaveLength(5)
    const factors = ACTIVITY_LEVELS.map((level) => level.factor)
    expect([...factors].sort((a, b) => a - b)).toEqual(factors)
  })

  it('builds targets either side of maintenance', () => {
    const targets = calorieTargets(2000)
    expect(targets.map((target) => target.calories)).toEqual([2500, 2000, 1500, 1250])
  })

  it('derives weekly change from the 7,700 kcal-per-kg rule', () => {
    const loss = calorieTargets(2000).find((target) => target.id === 'loss')
    expect(loss?.weeklyChangeKg).toBe(-0.68)
  })

  it('reports no weekly change for maintenance', () => {
    const maintain = calorieTargets(2000).find((target) => target.id === 'maintain')
    expect(maintain?.weeklyChangeKg).toBe(0)
  })
})

describe('unit conversion', () => {
  it('converts pounds and kilograms both ways', () => {
    expect(lbToKg(154)).toBe(69.85)
    expect(kgToLb(70)).toBe(154.32)
    expect(lbToKg(kgToLb(80))).toBeCloseTo(80, 1)
  })

  it('converts feet and inches to centimetres', () => {
    expect(ftInToCm(5, 9)).toBe(175.3)
    expect(ftInToCm(5, 0)).toBe(152.4)
  })

  it('splits centimetres back into feet and inches', () => {
    // 182.9 cm is exactly 6 feet.
    expect(cmToFtIn(182.9)).toEqual({ feet: 6, inches: 0 })
    // 175.3 cm is 5 feet 9 inches to the nearest tenth.
    expect(cmToFtIn(175.3)).toEqual({ feet: 5, inches: 9 })
  })
})
