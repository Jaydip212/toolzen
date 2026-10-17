import { describe, expect, it } from 'vitest'

import {
  averageColour,
  contrastRatio,
  countDistinctColours,
  describeColour,
  extractPalette,
  hueNameOf,
  hslToRgb,
  nearestNamedColour,
  parseColour,
  parseHex,
  parseRgbString,
  readableTextOn,
  rgbToHsl,
  toHex,
  toHexUpper,
  toHslString,
  toRgbString,
  wcagLevel,
} from './colour'

/** Build an RGBA buffer from `[r,g,b,a]` quads. */
function rgbaBuffer(pixels: Array<[number, number, number, number]>): Uint8Array {
  const out = new Uint8Array(pixels.length * 4)
  pixels.forEach((pixel, index) => {
    out[index * 4] = pixel[0]
    out[index * 4 + 1] = pixel[1]
    out[index * 4 + 2] = pixel[2]
    out[index * 4 + 3] = pixel[3]
  })
  return out
}

describe('parseHex', () => {
  it('reads the three-digit shorthand', () => {
    expect(parseHex('#f00')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('expands each shorthand digit rather than padding with zeros', () => {
    // #abc must be aabbcc, not a0b0c0.
    expect(parseHex('#abc')).toEqual({ r: 170, g: 187, b: 204 })
  })

  it('reads the six-digit form with or without the hash', () => {
    expect(parseHex('#ff8000')).toEqual({ r: 255, g: 128, b: 0 })
    expect(parseHex('ff8000')).toEqual({ r: 255, g: 128, b: 0 })
  })

  it('accepts the eight-digit form and ignores its alpha', () => {
    expect(parseHex('#11223344')).toEqual({ r: 17, g: 34, b: 51 })
  })

  it('rejects malformed input instead of coercing it', () => {
    expect(parseHex('')).toBeNull()
    expect(parseHex('#12')).toBeNull()
    expect(parseHex('#xyzxyz')).toBeNull()
    expect(parseHex('#12345')).toBeNull()
    expect(parseHex('#1234567')).toBeNull()
  })
})

describe('parseRgbString', () => {
  it('reads both comma and space separated forms', () => {
    expect(parseRgbString('rgb(255, 0, 128)')).toEqual({ r: 255, g: 0, b: 128 })
    expect(parseRgbString('rgba(255, 0, 128, 0.5)')).toEqual({ r: 255, g: 0, b: 128 })
    expect(parseRgbString('rgb(255 0 128)')).toEqual({ r: 255, g: 0, b: 128 })
  })

  it('accepts fractional channels and rounds them to whole bytes', () => {
    expect(parseRgbString('rgba(1.5, 2.5, 3.5, 1)')).toEqual({ r: 2, g: 3, b: 4 })
  })

  it('returns null for anything else', () => {
    expect(parseRgbString('hsl(0, 100%, 50%)')).toBeNull()
    expect(parseRgbString('not a colour')).toBeNull()
  })
})

describe('parseColour', () => {
  it('tries hex then rgb', () => {
    expect(parseColour('#0f0')).toEqual({ r: 0, g: 255, b: 0 })
    expect(parseColour('rgb(0, 255, 0)')).toEqual({ r: 0, g: 255, b: 0 })
  })

  it('returns null for an empty box so a caller can keep the last good value', () => {
    expect(parseColour('   ')).toBeNull()
  })
})

describe('formatting', () => {
  it('always emits six digits with a leading hash', () => {
    expect(toHex({ r: 0, g: 0, b: 0 })).toBe('#000000')
    expect(toHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff')
    expect(toHexUpper({ r: 171, g: 205, b: 239 })).toBe('#ABCDEF')
  })

  it('clamps out-of-range channels rather than wrapping them', () => {
    // 256 must not become 0.
    expect(toHex({ r: 256, g: -20, b: 128 })).toBe('#ff0080')
  })

  it('emits a CSS hsl string with the hue folded into range', () => {
    expect(toHslString({ h: 480, s: 50, l: 50 })).toBe('hsl(120, 50%, 50%)')
    expect(toHslString({ h: -30, s: 50, l: 50 })).toBe('hsl(330, 50%, 50%)')
  })

  it('emits a CSS rgb string', () => {
    expect(toRgbString({ r: 10, g: 20, b: 30 })).toBe('rgb(10, 20, 30)')
  })
})

describe('rgbToHsl', () => {
  it('handles the primaries', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 })
    expect(rgbToHsl({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, l: 50 })
    expect(rgbToHsl({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, l: 50 })
  })

  it('reports a neutral grey as zero saturation, not a hue', () => {
    expect(rgbToHsl({ r: 128, g: 128, b: 128 })).toEqual({ h: 0, s: 0, l: 50 })
  })

  it('picks the shorter direction around the wheel', () => {
    // 255,0,23 is 5.4° below red, i.e. 354.6° once hue is made unsigned.
    expect(rgbToHsl({ r: 255, g: 0, b: 23 }).h).toBe(355)
  })
})

describe('hslToRgb', () => {
  it('round-trips the primaries', () => {
    for (const hex of ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff']) {
      const rgb = parseHex(hex)
      expect(rgb).not.toBeNull()
      if (!rgb) continue
      expect(toHex(hslToRgb(rgbToHsl(rgb)))).toBe(hex)
    }
  })

  it('folds a hue outside 0–359 back into range', () => {
    expect(hslToRgb({ h: 360, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 })
    expect(hslToRgb({ h: -120, s: 100, l: 50 })).toEqual({ r: 0, g: 0, b: 255 })
  })

  it('clamps a silly lightness to black or white', () => {
    expect(hslToRgb({ h: 200, s: 50, l: -50 })).toEqual({ r: 0, g: 0, b: 0 })
    expect(hslToRgb({ h: 200, s: 50, l: 500 })).toEqual({ r: 255, g: 255, b: 255 })
  })
})

describe('contrast and WCAG', () => {
  it('gives black on white the maximum ratio', () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(21, 5)
  })

  it('gives identical colours the minimum ratio', () => {
    expect(contrastRatio({ r: 90, g: 90, b: 90 }, { r: 90, g: 90, b: 90 })).toBeCloseTo(1, 5)
  })

  it('is symmetric', () => {
    const a = { r: 12, g: 34, b: 56 }
    const b = { r: 200, g: 210, b: 220 }
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10)
  })

  it('grades the boundaries honestly', () => {
    // Chosen to sit either side of a threshold rather than exactly on it.
    expect(wcagLevel({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBe('AAA')
    // Red on white is 4:1, so it passes for large text only — a genuine
    // failure for body copy, which is what the tool should say.
    expect(wcagLevel({ r: 255, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBe('AA Large')
    expect(wcagLevel({ r: 255, g: 255, b: 0 }, { r: 255, g: 255, b: 255 })).toBe('Fail')
  })

  it('picks the readable of black or white', () => {
    expect(toHex(readableTextOn({ r: 255, g: 255, b: 255 }))).toBe('#000000')
    expect(toHex(readableTextOn({ r: 20, g: 20, b: 40 }))).toBe('#ffffff')
  })
})

describe('hueNameOf', () => {
  it('names each bucket', () => {
    expect(hueNameOf(0)).toBe('red')
    expect(hueNameOf(30)).toBe('orange')
    expect(hueNameOf(60)).toBe('yellow')
    expect(hueNameOf(120)).toBe('green')
    expect(hueNameOf(240)).toBe('blue')
    expect(hueNameOf(300)).toBe('magenta')
  })

  it('wraps at both ends', () => {
    expect(hueNameOf(350)).toBe('red')
    expect(hueNameOf(360)).toBe('red')
    expect(hueNameOf(-10)).toBe('red')
  })
})

describe('nearestNamedColour', () => {
  it('matches the primaries', () => {
    expect(nearestNamedColour({ r: 255, g: 0, b: 0 })).toBe('red')
    expect(nearestNamedColour({ r: 0, g: 0, b: 255 })).toBe('blue')
    expect(nearestNamedColour({ r: 255, g: 165, b: 0 })).toBe('orange')
  })

  it('does not call dark grey maroon', () => {
    // Plain RGB distance gets this wrong; redmean does not.
    expect(nearestNamedColour({ r: 40, g: 40, b: 40 })).toBe('black')
  })
})

describe('averageColour', () => {
  it('averages an RGBA buffer', () => {
    const buffer = rgbaBuffer([
      [0, 0, 0, 255],
      [255, 255, 255, 255],
    ])
    expect(averageColour(buffer)).toEqual({ r: 128, g: 128, b: 128 })
  })

  it('returns black for an empty buffer rather than dividing by zero', () => {
    expect(averageColour(new Uint8Array())).toEqual({ r: 0, g: 0, b: 0 })
  })
})

describe('extractPalette', () => {
  it('returns the dominant colour first', () => {
    const pixels: Array<[number, number, number, number]> = [
      [10, 10, 10, 255],
      [10, 10, 10, 255],
      [10, 10, 10, 255],
      [240, 30, 30, 255],
    ]
    const palette = extractPalette(rgbaBuffer(pixels))
    expect(palette[0].hex).toBe('#0a0a0a')
    expect(palette[0].count).toBe(3)
    expect(palette[0].share).toBeCloseTo(75, 0)
  })

  it('merges near-identical colours into one bucket', () => {
    // Two greens 10 apart with a tolerance of 16 must not both appear.
    const pixels: Array<[number, number, number, number]> = [
      [60, 160, 80, 255],
      [68, 168, 88, 255],
      [250, 250, 250, 255],
    ]
    const palette = extractPalette(rgbaBuffer(pixels), { tolerance: 16 })
    expect(palette).toHaveLength(2)
    // The running mean of the two greens is (64, 164, 84).
    expect(palette[0].hex).toBe('#40a454')
    expect(palette[0].count).toBe(2)
  })

  it('skips transparent pixels', () => {
    const pixels: Array<[number, number, number, number]> = [
      [255, 0, 0, 0],
      [255, 0, 0, 0],
      [0, 0, 255, 255],
    ]
    const palette = extractPalette(rgbaBuffer(pixels))
    expect(palette).toHaveLength(1)
    expect(palette[0].hex).toBe('#0000ff')
    expect(palette[0].share).toBe(100)
  })

  it('honours a stricter alpha threshold', () => {
    const pixels: Array<[number, number, number, number]> = [
      [255, 0, 0, 40],
      [0, 0, 255, 255],
    ]
    // With a threshold of 64 the faint red is ignored entirely.
    expect(extractPalette(rgbaBuffer(pixels), { alphaThreshold: 64 })).toHaveLength(1)
    // With a threshold of 16 it is counted.
    expect(extractPalette(rgbaBuffer(pixels), { alphaThreshold: 16 })).toHaveLength(2)
  })

  it('caps the number of swatches', () => {
    const pixels: Array<[number, number, number, number]> = []
    for (let i = 0; i < 40; i += 1) pixels.push([i * 6, 0, 0, 255])
    expect(extractPalette(rgbaBuffer(pixels), { maxColours: 5 })).toHaveLength(5)
  })

  it('returns nothing for a fully transparent buffer', () => {
    const pixels: Array<[number, number, number, number]> = [
      [255, 0, 0, 0],
      [0, 0, 255, 0],
    ]
    expect(extractPalette(rgbaBuffer(pixels))).toEqual([])
  })

  it('reads a three-channel buffer too', () => {
    const rgbOnly = new Uint8Array([255, 0, 0, 0, 255, 0])
    const palette = extractPalette(rgbOnly)
    expect(palette.map((swatch) => swatch.hex)).toEqual(['#ff0000', '#00ff00'])
  })
})

describe('describeColour', () => {
  it('names neutrals without inventing a hue', () => {
    expect(describeColour({ r: 128, g: 128, b: 128 })).toBe('grey')
    expect(describeColour({ r: 250, g: 250, b: 250 })).toBe('a nearly white grey')
  })

  it('describes saturated colours with their lightness', () => {
    expect(describeColour({ r: 200, g: 30, b: 30 })).toBe('a vivid red')
    // 70% lightness reads as light, not as "electric".
    expect(describeColour({ r: 255, g: 100, b: 100 })).toBe('a light red')
    expect(describeColour({ r: 30, g: 30, b: 200 })).toBe('a vivid blue')
  })
})

describe('countDistinctColours', () => {
  it('counts unique triples', () => {
    const pixels: Array<[number, number, number, number]> = [
      [1, 2, 3, 255],
      [1, 2, 3, 255],
      [4, 5, 6, 255],
    ]
    expect(countDistinctColours(rgbaBuffer(pixels))).toBe(2)
  })

  it('ignores fully transparent pixels', () => {
    const pixels: Array<[number, number, number, number]> = [
      [1, 2, 3, 0],
      [4, 5, 6, 0],
      [7, 8, 9, 255],
    ]
    expect(countDistinctColours(rgbaBuffer(pixels))).toBe(1)
  })

  it('stops counting once the cap is reached', () => {
    const pixels: Array<[number, number, number, number]> = []
    for (let i = 0; i < 20; i += 1) pixels.push([i, 0, 0, 255])
    expect(countDistinctColours(rgbaBuffer(pixels), 5)).toBe(5)
  })
})
