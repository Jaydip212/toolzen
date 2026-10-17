import { describe, expect, it } from 'vitest'

import { CROP_RATIOS, centredAspect, planCrop, selectionLabel } from './logic'

const SOURCE = { width: 1000, height: 500 }

describe('planCrop', () => {
  it('turns a percentage selection into pixels', () => {
    const plan = planCrop(SOURCE, { left: 25, top: 0, right: 75, bottom: 100 })
    expect(plan.width).toBe(500)
    expect(plan.height).toBe(500)
    expect(plan.clamped).toBe(false)
    expect(plan.sentence).toContain('keeps 50% of the area')
  })

  it('reports the offset it will draw from', () => {
    const plan = planCrop(SOURCE, { left: 10, top: 20, right: 30, bottom: 40 })
    expect(plan.x).toBe(100)
    expect(plan.y).toBe(100)
    expect(plan.sentence).toContain('(100, 100)')
  })

  it('clamps a selection that escapes the image', () => {
    const plan = planCrop(SOURCE, { left: -10, top: -20, right: 150, bottom: 200 })
    expect(plan.clamped).toBe(true)
    expect(plan.width).toBe(1000)
    expect(plan.height).toBe(500)
    expect(plan.sentence).toContain('trimmed')
    // ...and that the trim landed on the whole frame, so nothing would change.
    expect(plan.sentence).toContain('changes nothing')
  })

  it('refuses an inverted or empty selection instead of drawing a blank', () => {
    expect(planCrop(SOURCE, { left: 80, top: 0, right: 20, bottom: 100 }).sentence).toContain('one corner outwards')
    expect(planCrop(SOURCE, { left: 50, top: 50, right: 50, bottom: 50 }).width).toBe(0)
  })

  it('refuses a selection that rounds to nothing', () => {
    // 0.01% of a 1000px image is 0.1px, which rounds to 0.
    const plan = planCrop(SOURCE, { left: 0, top: 0, right: 0.01, bottom: 100 })
    expect(plan.width).toBe(0)
    expect(plan.sentence).toContain('thinner than a pixel')
  })

  it('notices a no-op that covers everything', () => {
    const plan = planCrop(SOURCE, { left: 0, top: 0, right: 100, bottom: 100 })
    expect(plan.clamped).toBe(false)
    expect(plan.sentence).toContain('covers the whole image')
    expect(plan.sentence).toContain('changes nothing')
  })

  it('handles an unreadable source', () => {
    expect(planCrop({ width: 0, height: 0 }, { left: 0, top: 0, right: 10, bottom: 10 }).sentence).toContain(
      'Drag a box',
    )
  })
})

describe('centredAspect', () => {
  it('trims the sides for a square on a wide image', () => {
    // 1000×500 to 1:1 needs a 500×500 crop: half the width, full height.
    const selection = centredAspect({ width: 1000, height: 500 }, 1)
    expect(selection.left).toBeCloseTo(25, 5)
    expect(selection.right).toBeCloseTo(75, 5)
    expect(selection.top).toBe(0)
    expect(selection.bottom).toBe(100)
  })

  it('trims the top and bottom for a square on a tall image', () => {
    const selection = centredAspect({ width: 500, height: 1000 }, 1)
    expect(selection.top).toBeCloseTo(25, 5)
    expect(selection.bottom).toBeCloseTo(75, 5)
    expect(selection.left).toBe(0)
    expect(selection.right).toBe(100)
  })

  it('leaves an already-matching image alone', () => {
    const selection = centredAspect({ width: 1600, height: 900 }, 16 / 9)
    expect(selection.top).toBe(0)
    expect(selection.left).toBe(0)
    expect(selection.right).toBe(100)
    expect(selection.bottom).toBe(100)
  })
})

describe('ratios and labels', () => {
  it('offers a free-form option and a set of common ones', () => {
    expect(CROP_RATIOS[0].ratio).toBeNull()
    expect(CROP_RATIOS.map((entry) => entry.label)).toContain('Square')
    for (const entry of CROP_RATIOS.slice(1)) {
      expect(entry.ratio).toBeGreaterThan(0)
    }
  })

  it('labels the selection with absolute percentages', () => {
    expect(selectionLabel({ left: 10, top: 0, right: 40, bottom: 100 })).toBe('30% × 100%')
  })
})
