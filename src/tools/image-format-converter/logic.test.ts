import { describe, expect, it } from 'vitest'

import {
  COMPARISONS,
  CONVERTIBLE,
  capabilityNote,
  comparisonFor,
  comparisonsFor,
  encodingSupport,
  formatVerdict,
  hasHeaderSize,
  isLossless,
  qualityNote,
  suggestedQuality,
} from './logic'

describe('the comparison table', () => {
  it('only compares the formats it can actually write', () => {
    expect(CONVERTIBLE).toEqual(['png', 'jpeg', 'webp'])
    expect(COMPARISONS.png).not.toBeNull()
    expect(COMPARISONS.gif).toBeNull()
  })

  it('gives every offered comparison an advantage, a tradeoff and a use', () => {
    for (const comparison of comparisonsFor('png')) {
      expect(comparison.advantage.length).toBeGreaterThan(0)
      expect(comparison.tradeoff.length).toBeGreaterThan(0)
      expect(comparison.bestFor.length).toBeGreaterThan(0)
    }
  })

  it('never offers to convert a format to itself', () => {
    const targets = comparisonsFor('png').map((entry) => entry.format)
    expect(targets).toEqual(['jpeg', 'webp'])
    expect(comparisonsFor('jpeg').map((entry) => entry.format)).toEqual(['png', 'webp'])
    expect(comparisonsFor('webp').map((entry) => entry.format)).toEqual(['png', 'jpeg'])
  })

  it('offers a target for a GIF, but only a lossy or still one', () => {
    // A GIF is a legitimate source — the tool just takes its first frame and
    // says so, rather than refusing or claiming to keep the animation.
    expect(comparisonsFor('gif').map((entry) => entry.format)).toEqual(['png', 'jpeg', 'webp'])
    expect(capabilityNote('gif', 'png')).toContain('Only the first frame')
  })

  it('offers nothing for a format with no table entry', () => {
    expect(comparisonFor('ico')).toBeNull()
    expect(comparisonFor('bmp')).toBeNull()
  })

  it('states the real trade-offs, not marketing', () => {
    const png = comparisonFor('png')
    expect(png?.tradeoff).toContain('largest')
    expect(comparisonFor('jpeg')?.tradeoff).toContain('transparency')
    expect(comparisonFor('webp')?.tradeoff).toContain('Older software')
  })
})

describe('suggestedQuality', () => {
  it('gives WebP a lower number than JPEG, because it needs one', () => {
    expect(suggestedQuality('webp')).toBeLessThan(suggestedQuality('jpeg'))
  })

  it('suggests a high number for JPEG', () => {
    expect(suggestedQuality('jpeg')).toBe(85)
    expect(suggestedQuality('webp')).toBe(82)
  })
})

describe('isLossless', () => {
  it('is true for PNG and false for the lossy pair', () => {
    expect(isLossless('png')).toBe(true)
    expect(isLossless('jpeg')).toBe(false)
    expect(isLossless('webp')).toBe(false)
  })
})

describe('qualityNote', () => {
  it('says the dial does nothing for a lossless target', () => {
    const note = qualityNote('png', 60)
    expect(note.headline).toContain('no quality dial')
    expect(note.headline).toContain('no effect')
    expect(note.suggested).toBe(100)
  })

  it('describes the cost at each quality band', () => {
    expect(qualityNote('jpeg', 95).headline).toContain('almost nothing')
    expect(qualityNote('jpeg', 80).headline).toContain('fine detail')
    expect(qualityNote('jpeg', 60).headline).toContain('visible texture')
    expect(qualityNote('jpeg', 30).headline).toContain('a lot')
  })

  it('names the number it was given', () => {
    expect(qualityNote('webp', 82).headline).toContain('At 82')
  })
})

describe('capabilityNote', () => {
  it('warns about PNG transparency becoming black in a JPEG', () => {
    const note = capabilityNote('png', 'jpeg')
    expect(note).toContain('Transparent areas will become black')
    expect(note).toContain('alpha channel')
  })

  it('warns that an animated GIF loses its animation', () => {
    const note = capabilityNote('gif', 'png')
    expect(note).toContain('Only the first frame')
  })

  it('warns that an SVG can only go to PNG', () => {
    expect(capabilityNote('svg', 'jpeg')).toContain('SVG must be rasterised')
    expect(capabilityNote('svg', 'webp')).toContain('SVG must be rasterised')
    expect(capabilityNote('svg', 'png')).toBeNull()
  })

  it('says nothing when there is nothing to warn about', () => {
    expect(capabilityNote('png', 'webp')).toBeNull()
    expect(capabilityNote('jpeg', 'webp')).toBeNull()
    expect(capabilityNote('webp', 'png')).toBeNull()
  })
})

describe('formatVerdict', () => {
  it('reports the detected format', () => {
    expect(formatVerdict('png', 'png')).toContain('Read as PNG')
    expect(formatVerdict('png', 'png')).toContain('matching the .png name')
  })

  it('flags a mismatch between name and bytes', () => {
    const verdict = formatVerdict('jpeg', 'png')
    expect(verdict).toContain('Read as JPEG')
    expect(verdict).toContain('even though the name says .png')
  })

  it('accepts both jpg and jpeg spellings without a fuss', () => {
    expect(formatVerdict('jpeg', 'jpg')).toContain('matching the .jpg name')
  })

  it('reports an unreadable file as such', () => {
    expect(formatVerdict('unknown', 'bmp')).toContain('not an image this tool can read')
  })
})

describe('encodingSupport', () => {
  it('never throws in a bare environment', () => {
    // jsdom has a canvas element but no 2d context, so the answer falls back
    // to "unknown" rather than claiming a format is broken.
    expect(['supported', 'unsupported', 'unknown']).toContain(encodingSupport('png'))
  })
})

describe('hasHeaderSize', () => {
  const png = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x04, 0xb0, 0x00, 0x00, 0x03, 0x20,
    0x08, 0x06, 0x00, 0x00, 0x00,
  ])

  it('is true for a PNG', () => {
    expect(hasHeaderSize(png)).toBe(true)
  })

  it('is false for a JPEG, whose size has to be decoded', () => {
    expect(hasHeaderSize(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6, 7, 8]))).toBe(false)
  })
})
