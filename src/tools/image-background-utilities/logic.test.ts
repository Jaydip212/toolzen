import { describe, expect, it } from 'vitest'

import {
  JOBS,
  NOT_BACKGROUND_REMOVAL,
  describeJob,
  outlineWidth,
  planPad,
  warnsAboutFormat,
} from './logic'

describe('the honesty statement', () => {
  it('says up front that backgrounds are not removed', () => {
    expect(NOT_BACKGROUND_REMOVAL).toContain('does not remove backgrounds')
    expect(NOT_BACKGROUND_REMOVAL).toContain('segmentation model')
  })

  it('offers only jobs it can actually do', () => {
    expect(JOBS).toHaveLength(4)
    expect(JOBS.some((job) => /remov/i.test(job.label))).toBe(false)
  })

  it('gives every job a real description', () => {
    for (const job of JOBS) {
      expect(job.description.length).toBeGreaterThan(20)
    }
  })
})

describe('planPad', () => {
  const IMAGE = { width: 2000, height: 1000 }

  it('pads the shorter side, so a percentage means the same thing everywhere', () => {
    const plan = planPad(IMAGE, 10)
    // 10% of 1000 is 100px on each side, all round.
    expect(plan.width).toBe(2200)
    expect(plan.height).toBe(1200)
    expect(plan.offsetX).toBe(100)
    expect(plan.offsetY).toBe(100)
    expect(plan.percentGrown).toBe(20)
  })

  it('pads a tall image by its width, not its height', () => {
    const plan = planPad({ width: 800, height: 1600 }, 10)
    expect(plan.width).toBe(960)
    expect(plan.height).toBe(1600 + 160)
  })

  it('clamps a zero percentage to no padding', () => {
    const plan = planPad(IMAGE, 0)
    expect(plan.width).toBe(2000)
    expect(plan.height).toBe(1000)
  })

  it('clamps a wild percentage to 200 percent, on every side', () => {
    const plan = planPad(IMAGE, 500)
    // 200% of the 1000px short side is 2000px of padding each side.
    expect(plan.width).toBe(2000 + 2000 * 2)
    expect(plan.height).toBe(1000 + 2000 * 2)
  })
})

describe('outlineWidth', () => {
  it('is a percentage of the shorter side', () => {
    expect(outlineWidth({ width: 2000, height: 1000 }, 2)).toBe(20)
  })

  it('never eats more than a quarter of the image', () => {
    // 50% would be 500px of a 1000px side, which would swallow the picture.
    expect(outlineWidth({ width: 2000, height: 1000 }, 50)).toBe(250)
  })

  it('is at least one pixel', () => {
    expect(outlineWidth({ width: 100, height: 100 }, 0)).toBe(1)
  })
})

describe('describeJob', () => {
  const IMAGE = { width: 2000, height: 1000 }

  it('prints the arithmetic for a padding border', () => {
    expect(describeJob('pad', IMAGE, 10)).toContain('100-pixel border')
    expect(describeJob('pad', IMAGE, 10)).toContain('2200 × 1200')
  })

  it('says the backdrop job does not crop', () => {
    expect(describeJob('extend-canvas', IMAGE, 10)).toContain('nothing is cropped')
  })

  it('says the outline does not change the output size', () => {
    expect(describeJob('outline', IMAGE, 2)).toContain('unchanged at 2000 × 1000')
  })

  it('tells the user the transparent canvas must be saved as PNG', () => {
    expect(describeJob('solid-backdrop', IMAGE, 0)).toContain('PNG')
  })
})

describe('warnsAboutFormat', () => {
  it('says nothing for a format with alpha', () => {
    expect(warnsAboutFormat('png')).toBeNull()
    expect(warnsAboutFormat('webp')).toBeNull()
  })

  it('warns that JPEG fills transparency with black', () => {
    expect(warnsAboutFormat('jpeg')).toContain('filled with black')
  })
})
