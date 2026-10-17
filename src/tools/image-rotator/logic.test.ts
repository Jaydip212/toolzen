import { describe, expect, it } from 'vitest'

import { IDENTITY, applyTransforms, cssFor, describeTransform, fromExifOrientation, losslessRotatePossible, outputSizeFor } from './logic'

describe('applyTransforms', () => {
  it('starts from identity', () => {
    expect(applyTransforms(IDENTITY, {})).toEqual(IDENTITY)
  })

  it('applies one change at a time', () => {
    expect(applyTransforms(IDENTITY, { rotation: 90 }).rotation).toBe(90)
    expect(applyTransforms(IDENTITY, { flipX: true }).flipX).toBe(true)
    expect(applyTransforms(IDENTITY, { flipY: true }).flipY).toBe(true)
  })

  it('wraps a rotation back into a quarter turn', () => {
    // The type is a quarter turn, so a full-turn and a negative both fold.
    const fullTurn = 90 + 360
    const negative = 0 - 90
    expect(applyTransforms(IDENTITY, { rotation: fullTurn as 90 }).rotation).toBe(90)
    expect(applyTransforms(IDENTITY, { rotation: negative as 270 }).rotation).toBe(270)
  })

  it('keeps a flip that is not being changed', () => {
    const flipped = applyTransforms(IDENTITY, { flipX: true })
    expect(applyTransforms(flipped, { rotation: 90 })).toEqual({ rotation: 90, flipX: true, flipY: false })
  })
})

describe('cssFor', () => {
  it('is none for identity', () => {
    expect(cssFor(IDENTITY)).toBe('none')
  })

  it('matches what a canvas draw would produce', () => {
    expect(cssFor({ rotation: 90, flipX: false, flipY: false })).toBe('rotate(90deg)')
    expect(cssFor({ rotation: 180, flipX: true, flipY: false })).toBe('rotate(180deg) scaleX(-1)')
    expect(cssFor({ rotation: 0, flipX: true, flipY: true })).toBe('scaleX(-1) scaleY(-1)')
  })
})

describe('outputSizeFor', () => {
  it('swaps the axes for a quarter turn', () => {
    expect(outputSizeFor({ width: 800, height: 600 }, { rotation: 90, flipX: false, flipY: false })).toEqual({
      width: 600,
      height: 800,
    })
  })

  it('keeps the axes for 180', () => {
    expect(outputSizeFor({ width: 800, height: 600 }, { rotation: 180, flipX: false, flipY: false })).toEqual({
      width: 800,
      height: 600,
    })
  })

  it('does not swap for a flip on its own', () => {
    expect(outputSizeFor({ width: 800, height: 600 }, { rotation: 0, flipX: true, flipY: false })).toEqual({
      width: 800,
      height: 600,
    })
  })
})

describe('describeTransform', () => {
  it('says so when nothing changes', () => {
    expect(describeTransform(IDENTITY)).toContain('No change')
  })

  it('lists each operation', () => {
    expect(describeTransform({ rotation: 90, flipX: false, flipY: false })).toContain('rotated 90°')
    expect(describeTransform({ rotation: 0, flipX: true, flipY: false })).toContain('flipped horizontally')
    expect(describeTransform({ rotation: 0, flipX: false, flipY: true })).toContain('flipped vertically')
    expect(describeTransform({ rotation: 180, flipX: true, flipY: true })).toContain('rotated 180° and flipped horizontally and flipped vertically')
  })
})

describe('fromExifOrientation', () => {
  it('leaves a normal photo alone', () => {
    expect(fromExifOrientation(1)).toEqual(IDENTITY)
    expect(fromExifOrientation(undefined)).toEqual(IDENTITY)
  })

  it('rotates the sideways-portrait tag 6 by 90', () => {
    expect(fromExifOrientation(6).rotation).toBe(90)
  })

  it('rotates tag 8 by 270 and tag 3 by 180', () => {
    expect(fromExifOrientation(8).rotation).toBe(270)
    expect(fromExifOrientation(3).rotation).toBe(180)
  })

  it('applies the mirror for the flipped tags', () => {
    expect(fromExifOrientation(2).flipX).toBe(true)
    expect(fromExifOrientation(5).flipX).toBe(true)
    expect(fromExifOrientation(7).flipX).toBe(true)
  })
})

describe('losslessRotatePossible', () => {
  it('never claims a lossless result this tool cannot deliver', () => {
    // The tool draws through a canvas, which always re-encodes.
    for (const transform of [
      IDENTITY,
      { rotation: 90, flipX: false, flipY: false },
      { rotation: 180, flipX: true, flipY: false },
    ] as const) {
      expect(losslessRotatePossible('jpeg', transform).possible).toBe(false)
    }
  })

  it('explains why for each case', () => {
    expect(losslessRotatePossible('jpeg', IDENTITY).reason).toContain('nothing to rotate')
    expect(losslessRotatePossible('png', { rotation: 90, flipX: false, flipY: false }).reason).toContain(
      'Only JPEG',
    )
    expect(losslessRotatePossible('jpeg', { rotation: 0, flipX: true, flipY: false }).reason).toContain(
      'A flip has to be re-encoded',
    )
    expect(losslessRotatePossible('jpeg', { rotation: 90, flipX: false, flipY: false }).reason).toContain(
      're-encodes it',
    )
  })
})
