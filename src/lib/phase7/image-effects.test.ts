import { describe, expect, it } from 'vitest'
import {
  applyBrightness,
  applyContrast,
  applyEffect,
  applyGrayscale,
  applyInvert,
  IMAGE_EFFECTS,
  MAX_IMAGE_PIXELS,
} from './image-effects'

/** One red pixel, one transparent blue pixel. */
function sample(): Uint8ClampedArray {
  return new Uint8ClampedArray([200, 100, 50, 255, 0, 0, 255, 128])
}

describe('grayscale', () => {
  it('uses luminance weights, not a flat average', () => {
    const result = applyGrayscale(sample())
    const expected = Math.round(0.299 * 200 + 0.587 * 100 + 0.114 * 50)
    expect(result[0]).toBe(expected)
    expect(result[1]).toBe(expected)
    expect(result[2]).toBe(expected)
  })

  it('preserves alpha and leaves the input untouched', () => {
    const input = sample()
    const result = applyGrayscale(input)
    expect(result[3]).toBe(255)
    expect(result[7]).toBe(128)
    expect(input[0]).toBe(200)
  })
})

describe('invert', () => {
  it('inverts colour channels but never alpha', () => {
    const result = applyInvert(sample())
    expect([result[0], result[1], result[2]]).toEqual([55, 155, 205])
    expect(result[3]).toBe(255)
  })
})

describe('brightness', () => {
  it('adds light and clamps at 255', () => {
    const result = applyBrightness(sample(), 100)
    expect(result[0]).toBe(255)
    expect(result[3]).toBe(255)
  })

  it('darkens towards zero and never goes negative', () => {
    const result = applyBrightness(sample(), -100)
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(0)
  })

  it('clamps the amount to the documented range', () => {
    expect(applyBrightness(sample(), 1000)[0]).toBe(applyBrightness(sample(), 100)[0])
  })
})

describe('contrast', () => {
  it('leaves mid-grey channels near their value at zero', () => {
    const mid = new Uint8ClampedArray([128, 128, 128, 255])
    expect(applyContrast(mid, 0)[0]).toBe(128)
  })

  it('pushes bright channels brighter and dark channels darker', () => {
    const result = applyContrast(sample(), 50)
    expect(result[0]).toBeGreaterThan(200)
    expect(result[2]).toBeLessThan(50)
  })

  it('clamps the amount', () => {
    expect(applyContrast(sample(), -1000)[0]).toBe(applyContrast(sample(), -100)[0])
  })
})

describe('applyEffect', () => {
  it('dispatches all four documented effects', () => {
    for (const effect of IMAGE_EFFECTS) {
      const result = applyEffect(effect.id, sample(), 25)
      expect(result).toHaveLength(8)
    }
  })

  it('rejects malformed pixel data instead of silently producing garbage', () => {
    expect(() => applyEffect('grayscale', new Uint8ClampedArray([1, 2, 3]))).toThrow()
  })

  it('documents a conservative pixel ceiling', () => {
    expect(MAX_IMAGE_PIXELS).toBe(12_000_000)
  })
})
