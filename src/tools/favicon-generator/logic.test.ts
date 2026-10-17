import { describe, expect, it } from 'vitest'

import { ICON_SPECS, fitInSquare, linkTags, manifestJson, sourceVerdict } from './logic'

describe('ICON_SPECS', () => {
  it('covers the sizes a real site needs', () => {
    const sizes = ICON_SPECS.map((spec) => spec.size)
    expect(sizes).toContain(16)
    expect(sizes).toContain(32)
    expect(sizes).toContain(180)
    expect(sizes).toContain(192)
    expect(sizes).toContain(512)
  })

  it('gives every icon a purpose and a filename', () => {
    for (const spec of ICON_SPECS) {
      expect(spec.purpose.length).toBeGreaterThan(0)
      expect(spec.filename).toMatch(/\.png$/)
    }
  })

  it('does not claim to produce a .ico', () => {
    expect(ICON_SPECS.some((spec) => spec.filename.endsWith('.ico'))).toBe(false)
  })
})

describe('sourceVerdict', () => {
  it('accepts a 512 source for everything', () => {
    const verdict = sourceVerdict({ width: 512, height: 512 })
    expect(verdict.ok).toBe(true)
    expect(verdict.note).toContain('upscaled')
  })

  it('warns that a mid source will make a soft 512 icon', () => {
    const verdict = sourceVerdict({ width: 300, height: 300 })
    expect(verdict.ok).toBe(true)
    expect(verdict.note).toContain('soft')
    expect(verdict.note).toContain('512×512')
  })

  it('refuses a source too small for the Apple icon', () => {
    const verdict = sourceVerdict({ width: 100, height: 100 })
    expect(verdict.ok).toBe(false)
    expect(verdict.note).toContain('180')
  })

  it('judges by the shorter side, not just the width', () => {
    // A 3000×100 source has plenty of width but no usable height.
    expect(sourceVerdict({ width: 3000, height: 100 }).ok).toBe(false)
  })
})

describe('fitInSquare', () => {
  it('fills a square source', () => {
    expect(fitInSquare({ width: 512, height: 512 }, 32)).toEqual({
      drawWidth: 32,
      drawHeight: 32,
      offsetX: 0,
      offsetY: 0,
    })
  })

  it('letterboxes a non-square source instead of stretching it', () => {
    // 1000×500 into 100 needs 100×50, centred vertically.
    const fit = fitInSquare({ width: 1000, height: 500 }, 100)
    expect(fit.drawWidth).toBe(100)
    expect(fit.drawHeight).toBe(50)
    expect(fit.offsetX).toBe(0)
    expect(fit.offsetY).toBe(25)
  })

  it('never produces a draw size of zero', () => {
    const fit = fitInSquare({ width: 1, height: 1000 }, 32)
    expect(fit.drawWidth).toBeGreaterThan(0)
    expect(fit.offsetX).toBeGreaterThanOrEqual(0)
  })
})

describe('linkTags', () => {
  it('points at the sizes the tool actually generates', () => {
    const html = linkTags('/assets/')
    for (const spec of ICON_SPECS.filter((entry) => entry.size === 16 || entry.size === 32 || entry.size === 180)) {
      expect(html).toContain(spec.filename)
    }
    expect(html).toContain('rel="manifest"')
    expect(html).toContain('/assets/')
  })
})

describe('manifestJson', () => {
  it('lists the two Android icons and stays valid JSON', () => {
    const parsed = JSON.parse(manifestJson('My Site')) as {
      name: string
      icons: Array<{ sizes: string }>
    }
    expect(parsed.name).toBe('My Site')
    expect(parsed.icons).toHaveLength(2)
    expect(parsed.icons.map((icon) => icon.sizes)).toEqual(['192x192', '512x512'])
  })
})
