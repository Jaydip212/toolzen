import { describe, expect, it } from 'vitest'

import {
  SCOPE_NOTE,
  compareSizes,
  compressionError,
  isMarginal,
  sizeLine,
  smallerSave,
  verdictFor,
} from './logic'

/** Binary formatting, the same units the size analyzer uses. */
function format(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

describe('compareSizes', () => {
  it('reports the saving when packing helps', () => {
    const result = compareSizes(1000, 800)
    expect(result.saved).toBe(200)
    expect(result.savedShare).toBe(20)
    expect(result.packedIsLarger).toBe(false)
  })

  it('reports no saving rather than a negative one when packing hurts', () => {
    const result = compareSizes(1000, 1100)
    expect(result.saved).toBe(0)
    expect(result.savedShare).toBe(0)
    expect(result.packedIsLarger).toBe(true)
  })

  it('handles identical sizes', () => {
    const result = compareSizes(1000, 1000)
    expect(result.saved).toBe(0)
    expect(result.packedIsLarger).toBe(false)
  })

  it('handles a zero-byte file without dividing by zero', () => {
    expect(compareSizes(0, 0).savedShare).toBe(0)
  })

  it('keeps one decimal place for small percentages', () => {
    expect(compareSizes(10000, 9995).savedShare).toBe(0.1)
  })
})

describe('smallerSave', () => {
  it('uses the packed save when it is smaller', () => {
    expect(smallerSave(compareSizes(1000, 800))).toBe('packed')
  })

  it('falls back to the plain save when packing hurts', () => {
    expect(smallerSave(compareSizes(1000, 1200))).toBe('plain')
  })

  it('prefers the packed save on a tie, because it is the tidier document', () => {
    expect(smallerSave(compareSizes(1000, 1000))).toBe('packed')
  })
})

describe('verdictFor', () => {
  it('says so when nothing changed, and why', () => {
    expect(verdictFor(compareSizes(1000, 1000))).toContain('made no difference')
    expect(verdictFor(compareSizes(1000, 1000))).toContain('does not re-compress')
  })

  it('reports the saving as a percentage', () => {
    expect(verdictFor(compareSizes(1000, 800))).toContain('saved 20%')
  })

  it('says "less than 0.1%" rather than rounding to nothing', () => {
    expect(verdictFor(compareSizes(10000, 9998))).toContain('less than 0.1%')
  })
})

describe('sizeLine', () => {
  it('shows both sizes and the saving', () => {
    expect(sizeLine(compareSizes(1048576, 838860), format)).toBe('1024.0 KB → 819.2 KB, saving 20%.')
  })

  it('admits a growth instead of hiding it', () => {
    expect(sizeLine(compareSizes(1024, 2048), format)).toContain('made it larger, so the original is kept')
  })

  it('says so when neither save is smaller', () => {
    expect(sizeLine(compareSizes(1024, 1024), format)).toContain('no change either way')
  })
})

describe('compressionError', () => {
  it('allows a normal file', () => {
    expect(compressionError(10, 5000)).toBeNull()
  })

  it('refuses a page-less document and an unreadable one', () => {
    expect(compressionError(0, 100)).toContain('no pages')
    expect(compressionError(10, 0)).toContain('size could not be measured')
  })
})

describe('isMarginal', () => {
  it('is true for a saving too small to be worth celebrating', () => {
    expect(isMarginal(compareSizes(10000, 9995))).toBe(true)
  })

  it('is false for a real saving and for no saving at all', () => {
    expect(isMarginal(compareSizes(1000, 500))).toBe(false)
    expect(isMarginal(compareSizes(1000, 1000))).toBe(false)
  })
})

describe('SCOPE_NOTE', () => {
  it('says what happens and what does not, in that order', () => {
    expect(SCOPE_NOTE).toContain('objects packed into compressed object streams')
    expect(SCOPE_NOTE).toContain('does not re-compress images')
    expect(SCOPE_NOTE).toContain('photographs will barely move')
  })
})
