import { describe, expect, it } from 'vitest'
import {
  binaryToText,
  convertCssUnit,
  CSS_UNITS,
  intToRoman,
  numberToWords,
  romanToInt,
  textToBinary,
  toPixels,
  type CssUnit,
} from './codecs'

describe('roman numerals', () => {
  it('converts the classics both ways', () => {
    expect(intToRoman(1994)).toBe('MCMXCIV')
    expect(intToRoman(2026)).toBe('MMXXVI')
    expect(romanToInt('MCMXCIV')).toBe(1994)
    expect(romanToInt('mmxxvi')).toBe(2026)
  })

  it('rejects zero, negatives, fractions and numbers beyond 3999', () => {
    for (const value of [0, -1, 4000, 3.5]) expect(intToRoman(value)).toBeNull()
  })

  it('rejects non-canonical forms instead of guessing', () => {
    expect(romanToInt('IIII')).toBeNull()
    expect(romanToInt('VX')).toBeNull()
    expect(romanToInt('ABC')).toBeNull()
    expect(romanToInt('')).toBeNull()
  })

  it('round-trips every value in range', () => {
    for (const value of [1, 4, 9, 40, 90, 400, 900, 3999, 2741]) {
      expect(romanToInt(intToRoman(value)!)).toBe(value)
    }
  })
})

describe('numberToWords', () => {
  it('handles zero, teens, hundreds and negatives', () => {
    expect(numberToWords(0)).toBe('zero')
    expect(numberToWords(7)).toBe('seven')
    expect(numberToWords(13)).toBe('thirteen')
    expect(numberToWords(42)).toBe('forty two')
    expect(numberToWords(-105)).toBe('minus one hundred five')
  })

  it('handles scales and skips empty chunks', () => {
    expect(numberToWords(1000)).toBe('one thousand')
    expect(numberToWords(1000000)).toBe('one million')
    expect(numberToWords(1000100)).toBe('one million one hundred')
    expect(numberToWords(1234567890)).toBe('one billion two hundred thirty four million five hundred sixty seven thousand eight hundred ninety')
  })

  it('rejects fractions and values beyond the supported range', () => {
    expect(numberToWords(1.5)).toBeNull()
    expect(numberToWords(1e15)).toBeNull()
    expect(numberToWords(-1e15)).toBeNull()
  })
})

describe('text / binary', () => {
  it('round-trips ASCII through UTF-8 bytes', () => {
    const binary = textToBinary('Hi!')
    expect(binary).toBe('01001000 01101001 00100001')
    expect(binaryToText(binary)).toEqual({ ok: true, text: 'Hi!' })
  })

  it('round-trips Unicode, proving it is UTF-8 and not char codes', () => {
    const binary = textToBinary('café 🚀')
    expect(binaryToText(binary)).toEqual({ ok: true, text: 'café 🚀' })
    expect(textToBinary('é')).toBe('11000011 10101001')
  })

  it('rejects malformed groups and invalid UTF-8', () => {
    expect(binaryToText('0101')).toMatchObject({ ok: false })
    expect(binaryToText('01001000 ZZ')).toMatchObject({ ok: false })
    expect(binaryToText('11000011')).toMatchObject({ ok: false }) // incomplete sequence
  })

  it('treats empty input as empty output', () => {
    expect(textToBinary('')).toBe('')
    expect(binaryToText('   ')).toEqual({ ok: true, text: '' })
  })
})

describe('CSS units', () => {
  it('converts between every supported unit', () => {
    for (const from of CSS_UNITS) {
      for (const to of CSS_UNITS) {
        const result = convertCssUnit(16, from as CssUnit, to as CssUnit)
        expect(result, `${from} -> ${to}`).not.toBeNull()
      }
    }
  })

  it('uses the standard 96 dpi and 16px root', () => {
    expect(convertCssUnit(1, 'in', 'px')).toBe(96)
    expect(convertCssUnit(72, 'pt', 'px')).toBeCloseTo(96, 8)
    expect(convertCssUnit(1, 'rem', 'px')).toBe(16)
    expect(toPixels(2, 'rem', 20)).toBe(40)
  })

  it('round-trips through pixels', () => {
    expect(convertCssUnit(convertCssUnit(37, 'px', 'cm')!, 'cm', 'px')).toBeCloseTo(37, 8)
  })

  it('rejects non-finite values and a bad root size', () => {
    expect(toPixels(Number.NaN, 'px')).toBeNull()
    expect(toPixels(1, 'rem', 0)).toBeNull()
    expect(convertCssUnit(1, 'px', 'px', Number.NaN)).toBeNull()
  })
})
