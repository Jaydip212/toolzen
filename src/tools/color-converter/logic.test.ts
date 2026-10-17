import { describe, expect, it } from 'vitest'
import {
  adjustLightness,
  bestTextColor,
  contrastRatio,
  contrastVerdict,
  formatHsl,
  formatRgb,
  formatRgba,
  hexToRgb,
  hslToRgb,
  hsvToRgb,
  normalizeHue,
  parseColor,
  relativeLuminance,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  rgbToShortHex,
  type Rgb,
} from './logic'

/** Assert two colours match within a small rounding tolerance. */
function expectClose(actual: Rgb, expected: Rgb, tolerance = 2) {
  expect(Math.abs(actual.r - expected.r)).toBeLessThanOrEqual(tolerance)
  expect(Math.abs(actual.g - expected.g)).toBeLessThanOrEqual(tolerance)
  expect(Math.abs(actual.b - expected.b)).toBeLessThanOrEqual(tolerance)
}

describe('hexToRgb', () => {
  it('parses six-digit hex', () => {
    expect(hexToRgb('#ff8800')).toEqual({ r: 255, g: 136, b: 0 })
  })

  it('parses three-digit hex', () => {
    expect(hexToRgb('#f80')).toEqual({ r: 255, g: 136, b: 0 })
  })

  it('parses without a leading hash', () => {
    expect(hexToRgb('ff8800')).toEqual({ r: 255, g: 136, b: 0 })
  })

  it('ignores a trailing alpha pair', () => {
    expect(hexToRgb('#ff880080')).toEqual({ r: 255, g: 136, b: 0 })
  })

  it('ignores a trailing alpha nibble in short form', () => {
    expect(hexToRgb('#f808')).toEqual({ r: 255, g: 136, b: 0 })
  })

  it('returns null for invalid hex', () => {
    expect(hexToRgb('#xyz')).toBeNull()
    expect(hexToRgb('#12345')).toBeNull()
  })
})

describe('rgbToHex', () => {
  it('formats with two digits per channel', () => {
    expect(rgbToHex({ r: 0, g: 15, b: 255 })).toBe('#000fff')
  })

  it('rounds fractional channels', () => {
    expect(rgbToHex({ r: 254.6, g: 0.4, b: 128 })).toBe('#ff0080')
  })

  it('clamps out-of-range channels', () => {
    expect(rgbToHex({ r: 300, g: -20, b: 128 })).toBe('#ff0080')
  })
})

describe('rgbToShortHex', () => {
  it('shortens when every channel repeats', () => {
    expect(rgbToShortHex({ r: 255, g: 255, b: 255 })).toBe('#fff')
    expect(rgbToShortHex({ r: 17, g: 34, b: 51 })).toBe('#123')
  })

  it('keeps the long form when it cannot be shortened', () => {
    expect(rgbToShortHex({ r: 79, g: 70, b: 229 })).toBe('#4f46e5')
  })
})

describe('rgbToHsl', () => {
  it('converts the primaries', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 })
    expect(rgbToHsl({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, l: 50 })
    expect(rgbToHsl({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, l: 50 })
  })

  it('reports zero saturation for greys', () => {
    expect(rgbToHsl({ r: 128, g: 128, b: 128 })).toEqual({ h: 0, s: 0, l: 50 })
  })

  it('handles white and black', () => {
    expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 })
    expect(rgbToHsl({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, l: 0 })
  })

  it('converts a known brand colour', () => {
    expect(rgbToHsl({ r: 79, g: 70, b: 229 })).toEqual({ h: 243, s: 75, l: 59 })
  })
})

describe('hslToRgb', () => {
  it('converts the primaries', () => {
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 })
    expect(hslToRgb({ h: 120, s: 100, l: 50 })).toEqual({ r: 0, g: 255, b: 0 })
    expect(hslToRgb({ h: 240, s: 100, l: 50 })).toEqual({ r: 0, g: 0, b: 255 })
  })

  it('returns grey when saturation is zero', () => {
    expect(hslToRgb({ h: 200, s: 0, l: 50 })).toEqual({ r: 128, g: 128, b: 128 })
  })

  it('handles the extremes of lightness', () => {
    expect(hslToRgb({ h: 90, s: 100, l: 100 })).toEqual({ r: 255, g: 255, b: 255 })
    expect(hslToRgb({ h: 90, s: 100, l: 0 })).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('wraps hues outside 0–360', () => {
    expect(hslToRgb({ h: 480, s: 100, l: 50 })).toEqual(hslToRgb({ h: 120, s: 100, l: 50 }))
    expect(hslToRgb({ h: -120, s: 100, l: 50 })).toEqual(hslToRgb({ h: 240, s: 100, l: 50 }))
  })

  it('clamps out-of-range saturation and lightness', () => {
    expect(hslToRgb({ h: 0, s: 500, l: 50 })).toEqual({ r: 255, g: 0, b: 0 })
    expect(hslToRgb({ h: 0, s: -50, l: 50 })).toEqual({ r: 128, g: 128, b: 128 })
  })
})

describe('HSL round trip', () => {
  const samples: Rgb[] = [
    { r: 79, g: 70, b: 229 },
    { r: 255, g: 0, b: 0 },
    { r: 12, g: 200, b: 90 },
    { r: 1, g: 2, b: 3 },
    { r: 250, g: 249, b: 248 },
    { r: 0, g: 0, b: 0 },
    { r: 255, g: 255, b: 255 },
  ]

  it('survives RGB → HSL → RGB', () => {
    for (const sample of samples) {
      expectClose(hslToRgb(rgbToHsl(sample)), sample)
    }
  })
})

describe('rgbToHsv and hsvToRgb', () => {
  it('converts the primaries', () => {
    expect(rgbToHsv({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, v: 100 })
    expect(rgbToHsv({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, v: 100 })
    expect(rgbToHsv({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, v: 100 })
  })

  it('reports zero value for black', () => {
    expect(rgbToHsv({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, v: 0 })
  })

  it('round trips HSV', () => {
    const samples: Rgb[] = [
      { r: 79, g: 70, b: 229 },
      { r: 12, g: 200, b: 90 },
      { r: 200, g: 30, b: 60 },
    ]
    for (const sample of samples) {
      expectClose(hsvToRgb(rgbToHsv(sample)), sample)
    }
  })
})

describe('parseColor', () => {
  it('parses hex', () => {
    expect(parseColor('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('parses rgb()', () => {
    expect(parseColor('rgb(79, 70, 229)')).toEqual({ r: 79, g: 70, b: 229 })
  })

  it('parses rgb() percentages', () => {
    expect(parseColor('rgb(100%, 0%, 0%)')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('parses rgba() and ignores the alpha', () => {
    expect(parseColor('rgba(79, 70, 229, 0.5)')).toEqual({ r: 79, g: 70, b: 229 })
  })

  it('parses hsl()', () => {
    expect(parseColor('hsl(0, 100%, 50%)')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('parses named colours', () => {
    expect(parseColor('tomato')).toEqual({ r: 255, g: 99, b: 71 })
    expect(parseColor('WHITE')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('is tolerant of surrounding whitespace', () => {
    expect(parseColor('  #ff0000  ')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('returns null for empty or unknown input', () => {
    expect(parseColor('')).toBeNull()
    expect(parseColor('not-a-colour')).toBeNull()
    expect(parseColor('rgb(1,2)')).toBeNull()
  })
})

describe('formatters', () => {
  it('formats rgb()', () => {
    expect(formatRgb({ r: 79, g: 70, b: 229 })).toBe('rgb(79, 70, 229)')
  })

  it('formats rgba() with trimmed alpha', () => {
    expect(formatRgba({ r: 79, g: 70, b: 229 }, 0.5)).toBe('rgba(79, 70, 229, 0.5)')
  })

  it('clamps alpha', () => {
    expect(formatRgba({ r: 0, g: 0, b: 0 }, 5)).toBe('rgba(0, 0, 0, 1)')
  })

  it('formats hsl()', () => {
    expect(formatHsl({ h: 243, s: 75, l: 59 })).toBe('hsl(243, 75%, 59%)')
  })
})

describe('normalizeHue', () => {
  it('wraps negative and large hues', () => {
    expect(normalizeHue(-90)).toBe(270)
    expect(normalizeHue(450)).toBe(90)
  })

  it('returns zero for non-finite input', () => {
    expect(normalizeHue(Number.NaN)).toBe(0)
    expect(normalizeHue(Number.POSITIVE_INFINITY)).toBe(0)
  })
})

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0)
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5)
  })

  it('weights green most heavily', () => {
    const green = relativeLuminance({ r: 0, g: 255, b: 0 })
    const red = relativeLuminance({ r: 255, g: 0, b: 0 })
    const blue = relativeLuminance({ r: 0, g: 0, b: 255 })
    expect(green).toBeGreaterThan(red)
    expect(red).toBeGreaterThan(blue)
  })
})

describe('contrastRatio', () => {
  it('gives 21:1 for black on white', () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(21, 1)
  })

  it('is symmetric', () => {
    const a = { r: 79, g: 70, b: 229 }
    const b = { r: 255, g: 255, b: 255 }
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10)
  })

  it('gives 1:1 for a colour against itself', () => {
    expect(contrastRatio({ r: 100, g: 150, b: 200 }, { r: 100, g: 150, b: 200 })).toBeCloseTo(1, 10)
  })

  it('matches the published value for mid grey on white', () => {
    expect(contrastRatio({ r: 128, g: 128, b: 128 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(3.95, 1)
  })
})

describe('bestTextColor', () => {
  it('picks black on a light background', () => {
    expect(bestTextColor({ r: 255, g: 255, b: 255 })).toBe('#000000')
  })

  it('picks white on a dark background', () => {
    expect(bestTextColor({ r: 0, g: 0, b: 0 })).toBe('#ffffff')
    expect(bestTextColor({ r: 79, g: 70, b: 229 })).toBe('#ffffff')
  })
})

describe('contrastVerdict', () => {
  it('passes everything at 21:1', () => {
    expect(contrastVerdict(21)).toEqual({ aa: true, aaLarge: true, aaa: true, aaaLarge: true })
  })

  it('fails AA for normal text below 4.5:1', () => {
    expect(contrastVerdict(4.4)).toEqual({
      aa: false,
      aaLarge: true,
      aaa: false,
      aaaLarge: false,
    })
  })

  it('passes AA large but not AA at 3:1', () => {
    expect(contrastVerdict(3)).toEqual({
      aa: false,
      aaLarge: true,
      aaa: false,
      aaaLarge: false,
    })
  })

  it('passes AAA at 7:1', () => {
    expect(contrastVerdict(7).aaa).toBe(true)
  })
})

describe('adjustLightness', () => {
  it('lightens without changing the hue', () => {
    const lighter = adjustLightness({ r: 79, g: 70, b: 229 }, 20)
    expect(rgbToHsl(lighter).h).toBe(243)
    expect(rgbToHsl(lighter).l).toBeGreaterThan(59)
  })

  it('darkens without changing the hue', () => {
    const darker = adjustLightness({ r: 79, g: 70, b: 229 }, -20)
    expect(rgbToHsl(darker).h).toBe(243)
    expect(rgbToHsl(darker).l).toBeLessThan(59)
  })

  it('clamps at the extremes', () => {
    expect(adjustLightness({ r: 255, g: 255, b: 255 }, 50)).toEqual({ r: 255, g: 255, b: 255 })
    expect(adjustLightness({ r: 0, g: 0, b: 0 }, -50)).toEqual({ r: 0, g: 0, b: 0 })
  })
})
