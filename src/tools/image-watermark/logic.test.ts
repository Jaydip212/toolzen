import { describe, expect, it } from 'vitest'

import {
  POSITIONS,
  placeWatermark,
  opacityWarning,
  scaleFromPercent,
  fitsAt,
} from './logic'

const IMAGE = { width: 2000, height: 1000 }
const MARK = { width: 400, height: 100 }

describe('POSITIONS', () => {
  it('offers five anchored spots plus a tiling option', () => {
    expect(POSITIONS).toHaveLength(6)
    expect(POSITIONS.map((entry) => entry.value)).toContain('tiled')
  })
})

describe('placeWatermark', () => {
  it('puts the bottom-right mark at the inset corner', () => {
    const [placement] = placeWatermark(IMAGE, MARK, 'bottom-right', 1)
    // The margin is 3% of the shorter side, which is 30px here.
    expect(placement.x).toBe(2000 - 400 - 30)
    expect(placement.y).toBe(1000 - 100 - 30)
  })

  it('mirrors to the other corners', () => {
    expect(placeWatermark(IMAGE, MARK, 'bottom-left', 1)[0].x).toBe(30)
    expect(placeWatermark(IMAGE, MARK, 'top-right', 1)[0].y).toBe(30)
    expect(placeWatermark(IMAGE, MARK, 'top-left', 1)[0]).toMatchObject({ x: 30, y: 30 })
  })

  it('centres and flags the overlap', () => {
    const [placement] = placeWatermark(IMAGE, MARK, 'center', 1)
    expect(placement.x).toBe(800)
    expect(placement.y).toBe(450)
    expect(placement.overSubject).toBe(true)
  })

  it('scales the mark itself, not just its offset', () => {
    const [placement] = placeWatermark(IMAGE, MARK, 'top-left', 0.5)
    expect(placement.width).toBe(200)
    expect(placement.height).toBe(50)
  })

  it('keeps a big mark inside the frame rather than pushing it off', () => {
    // A mark wider than the image would otherwise get a negative x.
    const [placement] = placeWatermark({ width: 300, height: 300 }, { width: 900, height: 900 }, 'bottom-right', 1)
    expect(placement.x).toBeGreaterThanOrEqual(0)
    expect(placement.y).toBeGreaterThanOrEqual(0)
  })

  it('tiles with a gap of half the mark size', () => {
    const tiles = placeWatermark({ width: 1200, height: 800 }, MARK, 'tiled', 1)
    expect(tiles.length).toBeGreaterThan(1)
    // Only the first tile starts at the origin; the rest step across.
    expect(tiles[0]).toMatchObject({ x: 0, y: 0, overSubject: true })
    expect(tiles[1].x).toBe(400 + 200)
    // The rows are pitched by the mark's own height plus the same gap.
    expect(tiles[3]?.y).toBe(100 + 50)
  })

  it('falls back to a corner when the mark cannot be tiled at all', () => {
    // A mark taller than the image leaves no room for a single repeat.
    const tiles = placeWatermark({ width: 100, height: 100 }, { width: 500, height: 500 }, 'tiled', 1)
    expect(tiles).toHaveLength(1)
    expect(tiles[0].overSubject).toBe(false)
  })
})

describe('opacityWarning', () => {
  it('says nothing in the useful range', () => {
    expect(opacityWarning(0.35)).toBeNull()
    expect(opacityWarning(0.2)).toBeNull()
    expect(opacityWarning(0.5)).toBeNull()
  })

  it('warns that a solid watermark defeats the point', () => {
    expect(opacityWarning(1)).toContain('covers the picture')
    expect(opacityWarning(0.95)).toContain('covers the picture')
  })

  it('warns that a faint one may vanish', () => {
    expect(opacityWarning(0.02)).toContain('invisible')
    expect(opacityWarning(0.05)).toContain('20–40%')
  })

  it('treats the boundary values as the safe case', () => {
    expect(opacityWarning(0.7)).toBeNull()
    expect(opacityWarning(0.74)).toBeNull()
    expect(opacityWarning(0.08)).toBeNull()
    // One notch past the ceiling and the warning fires.
    expect(opacityWarning(0.76)).not.toBeNull()
  })
})

describe('scaleFromPercent', () => {
  it('turns a percentage of the image width into a scale factor', () => {
    expect(scaleFromPercent(20, 400, 2000)).toBeCloseTo(1, 5)
    expect(scaleFromPercent(10, 400, 2000)).toBeCloseTo(0.5, 5)
  })

  it('clamps so a nonsense percentage cannot vanish or explode', () => {
    expect(scaleFromPercent(0, 400, 2000)).toBe(0.02)
    expect(scaleFromPercent(1000, 400, 2000)).toBe(4)
  })

  it('does not divide by zero on a missing mark', () => {
    expect(scaleFromPercent(10, 0, 2000)).toBe(0.1)
    expect(scaleFromPercent(10, 400, 0)).toBe(0.1)
  })
})

describe('fitsAt', () => {
  it('reports a mark bigger than the image', () => {
    expect(fitsAt(IMAGE, MARK)).toBe(true)
    expect(fitsAt({ width: 100, height: 100 }, MARK)).toBe(false)
  })
})
