import { describe, expect, it } from 'vitest'

import {
  CROP_ANCHORS,
  aspectRatio,
  aspectRatioLabel,
  cropForAspect,
  cropRect,
  describeRatio,
  dimensionsAfterRotation,
  fitWithin,
  gcd,
  longEdge,
  normaliseRotation,
  scaleToLongEdge,
  sizeChange,
  transformFor,
  type FitMode,
} from './image-geometry'

describe('fitWithin', () => {
  it('scales a landscape image down to fit a square bound', () => {
    expect(fitWithin({ width: 4000, height: 2000 }, { width: 1000, height: 1000 })).toEqual({
      width: 1000,
      height: 500,
    })
  })

  it('scales a portrait image down by height', () => {
    expect(fitWithin({ width: 800, height: 1600 }, { width: 1000, height: 1000 })).toEqual({
      width: 500,
      height: 1000,
    })
  })

  it('leaves a smaller image alone by default', () => {
    const source = { width: 100, height: 50 }
    expect(fitWithin(source, { width: 1000, height: 1000 })).toEqual(source)
  })

  it('enlarges when explicitly allowed', () => {
    expect(fitWithin({ width: 100, height: 50 }, { width: 1000, height: 1000 }, true)).toEqual({
      width: 1000,
      height: 500,
    })
  })

  it('never returns a zero dimension for a tiny source', () => {
    const result = fitWithin({ width: 1, height: 1000 }, { width: 1, height: 1 })
    expect(result.height).toBe(1)
  })

  it('returns zeros for a degenerate source', () => {
    expect(fitWithin({ width: 0, height: 0 }, { width: 100, height: 100 })).toEqual({
      width: 0,
      height: 0,
    })
  })
})

describe('cropForAspect', () => {
  const source = { width: 4000, height: 3000 }

  it('trims the sides of a wide image for a square target', () => {
    expect(cropForAspect(source, { width: 1000, height: 1000 }, 'cover')).toEqual({
      width: 3000,
      height: 3000,
    })
  })

  it('trims the top and bottom of a tall image for a square target', () => {
    expect(cropForAspect({ width: 2000, height: 4000 }, { width: 1000, height: 1000 }, 'cover')).toEqual(
      { width: 2000, height: 2000 },
    )
  })

  it('leaves an already-matching image untouched', () => {
    expect(cropForAspect({ width: 1000, height: 1000 }, { width: 500, height: 500 }, 'cover')).toEqual(
      { width: 1000, height: 1000 },
    )
  })

  it('fits rather than crops when the mode says so', () => {
    // The limiting axis is width: 4000 → 1000 is 0.25, so 3000 → 750.
    expect(cropForAspect(source, { width: 1000, height: 1000 }, 'contain')).toEqual({
      width: 1000,
      height: 750,
    })
  })

  it('keeps the whole frame for a stretch', () => {
    expect(cropForAspect(source, { width: 1000, height: 1000 }, 'fill')).toEqual(source)
  })

  it('trims for scale-down too, because the output must match the target', () => {
    expect(cropForAspect(source, { width: 1000, height: 1000 }, 'scale-down')).toEqual({
      width: 3000,
      height: 3000,
    })
  })
})

describe('cropRect', () => {
  it('centres by default', () => {
    expect(cropRect({ width: 1000, height: 800 }, { width: 600, height: 400 })).toEqual({
      x: 200,
      y: 200,
      width: 600,
      height: 400,
    })
  })

  it('honours each corner', () => {
    expect(cropRect({ width: 1000, height: 800 }, { width: 600, height: 400 }, 'top-left')).toEqual({
      x: 0,
      y: 0,
      width: 600,
      height: 400,
    })
    expect(cropRect({ width: 1000, height: 800 }, { width: 600, height: 400 }, 'bottom-right')).toEqual({
      x: 400,
      y: 400,
      width: 600,
      height: 400,
    })
  })

  it('honours the edges', () => {
    expect(cropRect({ width: 1000, height: 800 }, { width: 600, height: 400 }, 'left').x).toBe(0)
    expect(cropRect({ width: 1000, height: 800 }, { width: 600, height: 400 }, 'right').x).toBe(400)
    expect(cropRect({ width: 1000, height: 800 }, { width: 600, height: 400 }, 'top').y).toBe(0)
    expect(cropRect({ width: 1000, height: 800 }, { width: 600, height: 400 }, 'bottom').y).toBe(400)
  })

  it('clamps an oversized crop to the frame', () => {
    const rect = cropRect({ width: 100, height: 100 }, { width: 500, height: 50 })
    expect(rect).toEqual({ x: 0, y: 25, width: 100, height: 50 })
  })

  it('never lets a crop escape the frame, which would draw nothing', () => {
    const rect = cropRect({ width: 100, height: 100 }, { width: 101, height: 101 })
    expect(rect.x + rect.width).toBeLessThanOrEqual(100)
    expect(rect.y + rect.height).toBeLessThanOrEqual(100)
  })
})

describe('anchors and modes', () => {
  it('offers every anchor with a label', () => {
    expect(CROP_ANCHORS).toHaveLength(9)
    for (const anchor of CROP_ANCHORS) {
      expect(anchor.label.length).toBeGreaterThan(0)
    }
  })
})

describe('aspectRatio', () => {
  it('reports a rounded decimal', () => {
    expect(aspectRatio({ width: 1920, height: 1080 })).toBeCloseTo(1.778, 3)
    expect(aspectRatio({ width: 100, height: 100 })).toBe(1)
  })

  it('is zero for a zero-height frame', () => {
    expect(aspectRatio({ width: 100, height: 0 })).toBe(0)
  })
})

describe('aspectRatioLabel', () => {
  it('reduces clean ratios to W:H', () => {
    expect(aspectRatioLabel({ width: 1920, height: 1080 })).toBe('16:9')
    expect(aspectRatioLabel({ width: 1000, height: 1000 })).toBe('1:1')
  })

  it('falls back to a decimal when the reduction would be unreadable', () => {
    // 1893:1000 is truthful but useless; a decimal at least reads at a glance.
    expect(aspectRatioLabel({ width: 1893, height: 1000 })).toBe('1.893:1')
  })

  it('returns a dash for an empty frame', () => {
    expect(aspectRatioLabel({ width: 0, height: 0 })).toBe('—')
  })
})

describe('gcd', () => {
  it('finds the common divisor', () => {
    expect(gcd(1920, 1080)).toBe(120)
    expect(gcd(17, 5)).toBe(1)
  })

  it('never returns zero, which would divide by zero downstream', () => {
    expect(gcd(0, 0)).toBe(1)
  })
})

describe('describeRatio', () => {
  it('names the three shapes', () => {
    expect(describeRatio({ width: 100, height: 100 })).toBe('square')
    expect(describeRatio({ width: 200, height: 100 })).toContain('wider than tall')
    expect(describeRatio({ width: 100, height: 200 })).toContain('taller than long')
  })
})

describe('longEdge and scaleToLongEdge', () => {
  it('reports the larger dimension', () => {
    expect(longEdge({ width: 3000, height: 4000 })).toBe(4000)
  })

  it('keeps the aspect ratio when scaling to a long edge', () => {
    expect(scaleToLongEdge({ width: 4000, height: 3000 }, 1600)).toEqual({ width: 1600, height: 1200 })
  })

  it('works on a portrait too', () => {
    expect(scaleToLongEdge({ width: 3000, height: 4000 }, 800)).toEqual({ width: 600, height: 800 })
  })

  it('returns zeros for a zero target', () => {
    expect(scaleToLongEdge({ width: 100, height: 100 }, 0)).toEqual({ width: 0, height: 0 })
  })
})

describe('sizeChange', () => {
  it('reports no change for an identical size', () => {
    expect(sizeChange({ width: 100, height: 100 }, { width: 100, height: 100 })).toBe('same pixel count')
  })

  it('reports a halving of pixels, not of the side length', () => {
    expect(sizeChange({ width: 100, height: 100 }, { width: 50, height: 50 })).toBe('-75% pixels')
  })

  it('is a dash when either frame is empty', () => {
    expect(sizeChange({ width: 0, height: 0 }, { width: 10, height: 10 })).toBe('—')
  })
})

describe('rotation', () => {
  it('folds every angle into a quarter turn', () => {
    expect(normaliseRotation(0)).toBe(0)
    expect(normaliseRotation(90)).toBe(90)
    expect(normaliseRotation(180)).toBe(180)
    expect(normaliseRotation(270)).toBe(270)
    expect(normaliseRotation(360)).toBe(0)
    expect(normaliseRotation(-90)).toBe(270)
    expect(normaliseRotation(450)).toBe(90)
  })

  it('swaps the axes only for quarter and three-quarter turns', () => {
    const source = { width: 400, height: 200 }
    expect(dimensionsAfterRotation(source, 90)).toEqual({ width: 200, height: 400 })
    expect(dimensionsAfterRotation(source, 180)).toEqual({ width: 400, height: 200 })
    expect(dimensionsAfterRotation(source, 270)).toEqual({ width: 200, height: 400 })
  })

  it('matches the fit modes it is asked for', () => {
    expect(cropForAspect({ width: 400, height: 200 }, { width: 400, height: 200 }, 'contain' as FitMode)).toEqual(
      { width: 400, height: 200 },
    )
  })
})

describe('transformFor', () => {
  it('is none when nothing is asked for', () => {
    expect(transformFor(0, false, false)).toBe('none')
  })

  it('combines a rotation with the flips', () => {
    expect(transformFor(90, true, false)).toBe('rotate(90deg) scaleX(-1)')
    expect(transformFor(0, false, true)).toBe('scaleY(-1)')
    expect(transformFor(180, true, true)).toBe('rotate(180deg) scaleX(-1) scaleY(-1)')
  })
})
