import { describe, expect, it } from 'vitest'

import { MAX_BATCH, batchName, batchStatus, batchSummary, progressLine, targetFor } from './logic'

describe('targetFor', () => {
  it('keeps each image’s own shape in long-edge mode', () => {
    expect(targetFor({ width: 4000, height: 3000 }, 'long-edge', 1600)).toEqual({
      width: 1600,
      height: 1200,
      ratio: 0.4,
    })
    expect(targetFor({ width: 3000, height: 4000 }, 'long-edge', 1600)).toEqual({
      width: 1200,
      height: 1600,
      ratio: 0.4,
    })
  })

  it('forces a square in exact mode and says the ratio was sacrificed', () => {
    const target = targetFor({ width: 4000, height: 3000 }, 'exact', 1024)
    expect(target.width).toBe(1024)
    expect(target.height).toBe(1024)
    expect(target.ratio).toBeNull()
  })

  it('returns zeros for an unreadable size', () => {
    expect(targetFor({ width: 0, height: 0 }, 'long-edge', 1600)).toEqual({ width: 0, height: 0, ratio: null })
  })
})

describe('progressLine', () => {
  it('reports the empty queue', () => {
    expect(progressLine(0, 0)).toContain('No images yet')
  })

  it('counts up and finishes', () => {
    expect(progressLine(0, 3)).toBe('Waiting — 3 images queued.')
    expect(progressLine(2, 3)).toBe('2 of 3 done.')
    expect(progressLine(3, 3)).toBe('All 3 images done.')
  })

  it('agrees on the singular', () => {
    expect(progressLine(1, 1)).toBe('All 1 image done.')
  })
})

describe('batchName', () => {
  it('numbers with a shared width so the files sort', () => {
    expect(batchName('holiday.png', 0, 12, 'jpg')).toBe('holiday-01.jpg')
    expect(batchName('holiday.png', 11, 12, 'jpg')).toBe('holiday-12.jpg')
  })

  it('does not pad past what the batch needs', () => {
    expect(batchName('a.png', 0, 3, 'png')).toBe('a-1.png')
  })

  it('falls back to a sensible stem for a pathless name', () => {
    expect(batchName('', 0, 1, 'png')).toBe('image-1.png')
  })
})

describe('batchStatus', () => {
  it('allows an empty batch', () => {
    expect(batchStatus(0).reason).toBeNull()
  })

  it('allows a batch at the limit', () => {
    expect(batchStatus(MAX_BATCH).ok).toBe(true)
  })

  it('refuses one past the limit, and says why', () => {
    const status = batchStatus(MAX_BATCH + 1)
    expect(status.ok).toBe(false)
    expect(status.reason).toContain(`${MAX_BATCH + 1} files`)
    expect(status.reason).toContain('memory')
  })
})

describe('batchSummary', () => {
  it('warns about stretching in exact mode', () => {
    expect(batchSummary('exact', 1024, 5)).toContain('stretched')
  })

  it('promises shape is kept in long-edge mode', () => {
    expect(batchSummary('long-edge', 1600, 5)).toContain('keeps its own shape')
  })

  it('says so when nothing has been added', () => {
    expect(batchSummary('long-edge', 1600, 0)).toContain('Add images')
  })
})
