import { describe, expect, it } from 'vitest'

import {
  PRESETS,
  betterLever,
  canBeLossless,
  estimateSaving,
  presetById,
  resolveQuality,
  resultNote,
} from './logic'

describe('the presets', () => {
  it('runs from lossless to tiny', () => {
    expect(PRESETS[0].id).toBe('lossless')
    expect(PRESETS[PRESETS.length - 1].id).toBe('tiny')
    expect(PRESETS[0].quality).toBeGreaterThan(PRESETS[PRESETS.length - 1].quality)
  })

  it('gives every preset a use case', () => {
    for (const preset of PRESETS) {
      expect(preset.label.length).toBeGreaterThan(0)
      expect(preset.useCase.length).toBeGreaterThan(0)
    }
  })

  it('falls back to High for an unknown id rather than returning undefined', () => {
    expect(presetById('nonsense').id).toBe('high')
    expect(presetById('small').id).toBe('small')
  })
})

describe('canBeLossless', () => {
  it('is true for PNG only', () => {
    expect(canBeLossless('png')).toBe(true)
    expect(canBeLossless('jpeg')).toBe(false)
    expect(canBeLossless('webp')).toBe(false)
  })
})

describe('resolveQuality', () => {
  it('forces 100 for PNG whatever the preset says', () => {
    const tiny = presetById('tiny')
    expect(tiny.quality).toBe(40)
    // A "lossless 40" would be a contradiction; the tool pins it.
    expect(resolveQuality(tiny, 'png')).toBe(100)
  })

  it('honours the preset for a lossy target', () => {
    expect(resolveQuality(presetById('balanced'), 'jpeg')).toBe(78)
    expect(resolveQuality(presetById('high'), 'webp')).toBe(88)
  })
})

describe('estimateSaving', () => {
  it('says nothing is compressable in an empty file', () => {
    expect(estimateSaving(0, 80).sentence).toContain('empty')
  })

  it('saves almost nothing at lossless quality', () => {
    const estimate = estimateSaving(1_000_000, 100)
    expect(estimate.fraction).toBeGreaterThan(-0.1)
  })

  it('saves a lot at low quality', () => {
    const low = estimateSaving(1_000_000, 40)
    const high = estimateSaving(1_000_000, 88)
    expect(low.fraction).toBeLessThan(high.fraction)
    expect(low.fraction).toBeLessThan(-0.3)
  })

  it('labels itself an estimate rather than a promise', () => {
    expect(estimateSaving(100_000, 78).sentence).toContain('estimate')
  })

  it('warns when a re-encode could grow instead of shrink', () => {
    // A hand-picked small file at high quality is the case people hit.
    const estimate = estimateSaving(200, 100)
    expect(estimate.sentence).toContain('may not get smaller')
  })

  it('never estimates below 5% of the original', () => {
    // Even at the lowest quality there is a floor, so the number stays sane.
    expect(estimateSaving(10_000, 1).fraction).toBeGreaterThan(-0.95)
  })
})

describe('betterLever', () => {
  it('says dimensions when more than half the pixels go', () => {
    expect(betterLever({ width: 4000, height: 3000 }, { width: 2000, height: 1500 })).toBe('dimensions')
  })

  it('says quality when the size is unchanged', () => {
    expect(betterLever({ width: 1000, height: 500 }, { width: 1000, height: 500 })).toBe('quality')
  })

  it('still says dimensions for an enlargement, because that is the real cost', () => {
    expect(betterLever({ width: 100, height: 100 }, { width: 400, height: 400 })).toBe('dimensions')
  })
})

describe('resultNote', () => {
  it('reports the saving when the file got smaller', () => {
    const note = resultNote(1_000_000, 400_000, 'JPEG')
    expect(note).toContain('585.9 KB saved')
    expect(note).toContain('60% smaller')
  })

  it('explains a growth rather than hiding it', () => {
    const note = resultNote(400_000, 1_000_000, 'JPEG')
    expect(note).toContain('larger than the original')
    expect(note).toContain('cannot undo compression')
  })

  it('does not divide by zero on an empty original', () => {
    expect(() => resultNote(0, 100, 'PNG')).not.toThrow()
    expect(resultNote(0, 100, 'PNG')).toContain('larger')
  })
})
