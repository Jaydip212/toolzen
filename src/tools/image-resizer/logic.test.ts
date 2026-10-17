import { describe, expect, it } from 'vitest'

import { planResize, upscaleWarning } from './logic'

const SOURCE = { width: 4000, height: 3000 }

describe('exact mode', () => {
  it('uses the numbers given', () => {
    const plan = planResize(SOURCE, 'exact', { width: 800, height: 600 })
    expect(plan.width).toBe(800)
    expect(plan.height).toBe(600)
    expect(plan.keptAspect).toBe(true)
  })

  it('says plainly when the shape changes', () => {
    const plan = planResize(SOURCE, 'exact', { width: 800, height: 800 })
    expect(plan.keptAspect).toBe(false)
    expect(plan.sentence).toContain('shape changes')
    expect(plan.sentence).toContain('4:3')
  })

  it('refuses a zero or missing dimension rather than drawing a blank canvas', () => {
    expect(planResize(SOURCE, 'exact', { width: 0, height: 600 }).width).toBe(0)
    expect(planResize(SOURCE, 'exact', { width: 800 }).sentence).toContain('above zero')
  })

  it('notices a no-op', () => {
    expect(planResize(SOURCE, 'exact', SOURCE).sentence).toContain('nothing would change')
  })
})

describe('percent mode', () => {
  it('scales both sides', () => {
    const plan = planResize(SOURCE, 'percent', { percent: 25 })
    expect(plan.width).toBe(1000)
    expect(plan.height).toBe(750)
    expect(plan.keptAspect).toBe(true)
  })

  it('says what the percentage produced', () => {
    expect(planResize(SOURCE, 'percent', { percent: 50 }).sentence).toContain('2000 × 1500')
  })

  it('refuses a zero percent', () => {
    expect(planResize(SOURCE, 'percent', { percent: 0 }).sentence).toContain('below zero')
  })
})

describe('long-edge mode', () => {
  it('scales the other side from the ratio', () => {
    const plan = planResize(SOURCE, 'long-edge', { longEdge: 1600 })
    expect(plan.width).toBe(1600)
    expect(plan.height).toBe(1200)
  })

  it('works on a portrait too', () => {
    const plan = planResize({ width: 3000, height: 4000 }, 'long-edge', { longEdge: 800 })
    expect(plan.width).toBe(600)
    expect(plan.height).toBe(800)
  })

  it('reports the derived side in the sentence', () => {
    expect(planResize(SOURCE, 'long-edge', { longEdge: 1600 }).sentence).toContain('1200')
  })

  it('notices a no-op', () => {
    expect(planResize(SOURCE, 'long-edge', { longEdge: 4000 }).sentence).toContain('nothing would change')
  })

  it('needs a number', () => {
    expect(planResize(SOURCE, 'long-edge', {}).sentence).toContain('longest side')
  })
})

describe('preset mode', () => {
  it('fits inside the box, never stretching past it', () => {
    const plan = planResize(SOURCE, 'preset', { preset: { width: 1280, height: 720 } })
    expect(plan.width).toBe(960)
    expect(plan.height).toBe(720)
    expect(plan.keptAspect).toBe(true)
  })

  it('says so when it fills the box exactly', () => {
    const plan = planResize({ width: 1600, height: 900 }, 'preset', { preset: { width: 1280, height: 720 } })
    expect(plan.sentence).toContain('exactly')
  })

  it('reports an unreadable source', () => {
    expect(planResize({ width: 0, height: 0 }, 'preset', { preset: { width: 100, height: 100 } }).sentence).toContain(
      'no readable size',
    )
  })
})

describe('upscaleWarning', () => {
  it('says nothing when shrinking', () => {
    expect(upscaleWarning(SOURCE, planResize(SOURCE, 'exact', { width: 800, height: 600 }))).toBeNull()
  })

  it('explains that a bigger file adds no detail', () => {
    const warning = upscaleWarning({ width: 100, height: 100 }, planResize({ width: 100, height: 100 }, 'exact', { width: 400, height: 400 }))
    expect(warning).toContain('cannot add detail')
    expect(warning).toContain('4.0×')
  })

  it('says nothing for an unusable plan', () => {
    expect(upscaleWarning(SOURCE, planResize(SOURCE, 'exact', { width: 0, height: 0 }))).toBeNull()
  })
})
