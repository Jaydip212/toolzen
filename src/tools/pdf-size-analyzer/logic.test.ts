import { describe, expect, it } from 'vitest'

import {
  SCOPE_NOTE,
  adviceFor,
  analyseSize,
  formatBinary,
  isCoherent,
  sizeSummary,
  type StreamEntry,
} from './logic'

function streams(...entries: Array<[StreamEntry['kind'], number]>): StreamEntry[] {
  return entries.map(([kind, bytes]) => ({ kind, bytes }))
}

describe('analyseSize', () => {
  it('adds the streams up by kind, largest first', () => {
    const report = analyseSize(1000, streams(['content', 100], ['image', 600], ['image', 200], ['font', 50]))
    expect(report.parts).toEqual([
      { kind: 'image', bytes: 800, share: 80 },
      { kind: 'content', bytes: 100, share: 10 },
      { kind: 'font', bytes: 50, share: 5 },
    ])
    expect(report.biggest).toBe('image')
    expect(report.measured).toBe(950)
  })

  it('reports no biggest part for a document with no streams', () => {
    const report = analyseSize(500, [])
    expect(report.parts).toEqual([])
    expect(report.biggest).toBeNull()
    expect(report.measured).toBe(0)
  })

  it('never reports a negative share when the streams exceed the file', () => {
    // A file can compress its streams; the measurement is of the decoded sizes.
    const report = analyseSize(100, streams(['content', 400]))
    expect(report.parts[0].share).toBe(400)
    expect(isCoherent(report)).toBe(false)
  })

  it('handles a zero-byte file without dividing by zero', () => {
    expect(analyseSize(0, streams(['content', 0])).parts[0].share).toBe(0)
  })
})

describe('isCoherent', () => {
  it('is true when the streams fit inside the file', () => {
    expect(isCoherent(analyseSize(1000, streams(['image', 900])))).toBe(true)
  })

  it('is false when they cannot', () => {
    expect(isCoherent(analyseSize(100, streams(['image', 900])))).toBe(false)
  })
})

describe('adviceFor', () => {
  it('says images cannot be re-compressed here, which is the usual case', () => {
    const advice = adviceFor(analyseSize(1000, streams(['image', 900])))
    expect(advice).toContain('does not do in the browser')
    expect(advice).toContain('shrinking the images before they go in')
  })

  it('is more hopeful when images are only the largest of several parts', () => {
    const advice = adviceFor(analyseSize(1000, streams(['image', 400], ['font', 300], ['content', 200])))
    expect(advice).toContain('may still help a little')
  })

  it('says fonts are already compressed', () => {
    expect(adviceFor(analyseSize(1000, streams(['font', 900])))).toContain('already compressed')
  })

  it('points at content streams as the part a re-save touches', () => {
    expect(adviceFor(analyseSize(1000, streams(['content', 900])))).toContain('can help most here')
  })

  it('says so when there is nothing to shrink', () => {
    expect(adviceFor(analyseSize(1000, []))).toContain('nothing to shrink')
  })

  it('describes a spread-out document rather than inventing a winner', () => {
    const advice = adviceFor(analyseSize(1000, streams(['image', 200], ['font', 200], ['other', 200])))
    expect(advice).toContain('no single part dominating')
  })
})

describe('sizeSummary', () => {
  it('names the total and the biggest part', () => {
    expect(sizeSummary(analyseSize(2_500_000, streams(['image', 1_700_000])))).toBe('2.4 MB, 68% of it images.')
  })

  it('says so when no streams were measured', () => {
    expect(sizeSummary(analyseSize(500, []))).toContain('no embedded streams measured')
  })
})

describe('formatBinary', () => {
  it('uses the units a file manager uses', () => {
    expect(formatBinary(512)).toBe('512 B')
    expect(formatBinary(1024)).toBe('1.0 KB')
    expect(formatBinary(2_500_000)).toBe('2.4 MB')
    expect(formatBinary(3_500_000_000)).toBe('3.3 GB')
  })

  it('stops at gigabytes rather than inventing terabytes', () => {
    expect(formatBinary(5_000_000_000_000)).toBe('4656.6 GB')
  })
})

describe('SCOPE_NOTE', () => {
  it('states what the measurement is not', () => {
    expect(SCOPE_NOTE).toContain('does not decode the images')
    expect(SCOPE_NOTE).toContain('A measurement, not an optimisation')
  })
})
