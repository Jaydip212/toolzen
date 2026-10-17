import { describe, expect, it } from 'vitest'

import { printSize, reportFromBytes, reportFromDecoded, sizeVerdict } from './logic'

/** A minimal PNG header for 1200×800. */
const PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x04, 0xb0, 0x00, 0x00, 0x03, 0x20,
  0x08, 0x06, 0x00, 0x00, 0x00,
])

describe('reportFromBytes', () => {
  it('reads a PNG size straight from its header', () => {
    const report = reportFromBytes(PNG)
    expect(report).toMatchObject({ width: 1200, height: 800, source: 'header' })
    expect(report?.megapixels).toBeCloseTo(0.96, 2)
    expect(report?.ratio).toBe('3:2')
    expect(report?.description).toContain('wider than tall')
  })

  it('returns null for a format whose size needs decoding', () => {
    // A JPEG needs its segments walked, which needs more than this stub.
    expect(reportFromBytes(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBeNull()
  })

  it('returns null rather than guessing for an unknown file', () => {
    expect(reportFromBytes(new Uint8Array([1, 2, 3, 4]))).toBeNull()
  })
})

describe('reportFromDecoded', () => {
  it('labels its source as decoded, so the user knows it was measured', () => {
    const report = reportFromDecoded({ width: 1920, height: 1080 })
    expect(report.source).toBe('decoded')
    expect(report.ratio).toBe('16:9')
    expect(report.description).toContain('wider than tall')
  })

  it('recognises a square', () => {
    expect(reportFromDecoded({ width: 100, height: 100 }).description).toBe('square')
  })
})

describe('sizeVerdict', () => {
  it('matches a job by keyword, not by exact phrase', () => {
    expect(sizeVerdict({ width: 1920, height: 1080 }, 'website hero')).toContain('large enough')
    expect(sizeVerdict({ width: 1920, height: 1080 }, 'print poster')).toContain('smaller than')
  })

  it('says so for a size that falls short', () => {
    expect(sizeVerdict({ width: 400, height: 300 }, 'thumbnail')).toContain('smaller than')
    expect(sizeVerdict({ width: 400, height: 300 }, '4k screen')).toContain('may look soft')
  })

  it('reports the raw size when no benchmark matches, instead of inventing one', () => {
    const verdict = sizeVerdict({ width: 777, height: 333 }, 'something odd')
    expect(verdict).toContain('No benchmark matches')
    expect(verdict).toContain('777 × 333')
  })

  it('judges on the long edge whichever way round the image is', () => {
    const portrait = { width: 1080, height: 1920 }
    expect(sizeVerdict(portrait, 'website hero')).toContain('large enough')
  })
})

describe('printSize', () => {
  it('converts pixels and DPI into inches', () => {
    expect(printSize({ width: 2400, height: 1800 }, 300)).toBe('8.00 × 6.00 inches at 300 DPI.')
  })

  it('refuses a zero DPI rather than dividing by zero', () => {
    expect(printSize({ width: 100, height: 100 }, 0)).toContain('above zero')
  })
})
