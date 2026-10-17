/**
 * Rotate and flip planning.
 *
 * The visible preview uses a CSS transform; the exported canvas needs the
 * matching draw, and those two must never disagree. This module produces the
 * single source of truth both read from.
 */

import { dimensionsAfterRotation, normaliseRotation, transformFor } from '@/lib/image-geometry'

export interface Transform {
  rotation: 0 | 90 | 180 | 270
  flipX: boolean
  flipY: boolean
}

export const IDENTITY: Transform = { rotation: 0, flipX: false, flipY: false }

/** Apply the four operations in a fixed order so the result is predictable. */
export function applyTransforms(current: Transform, next: Partial<Transform>): Transform {
  const merged: Transform = {
    rotation: next.rotation ?? current.rotation,
    flipX: next.flipX ?? current.flipX,
    flipY: next.flipY ?? current.flipY,
  }
  return {
    rotation: normaliseRotation(merged.rotation),
    flipX: merged.flipX,
    flipY: merged.flipY,
  }
}

/**
 * The combination a user asked for, expressed as a CSS transform.
 *
 * `flipY` on its own is a mirror people rarely want, so the UI never offers
 * it alone — the vertical flip is only reachable combined with a rotation,
 * which is how a 90°-rotated portrait is corrected.
 */
export function cssFor(transform: Transform): string {
  return transformFor(transform.rotation, transform.flipX, transform.flipY)
}

/** The canvas size the rotated image needs. */
export function outputSizeFor(source: { width: number; height: number }, transform: Transform) {
  return dimensionsAfterRotation(source, transform.rotation)
}

/** A one-line description of what will happen. */
export function describeTransform(transform: Transform): string {
  const parts: string[] = []
  if (transform.rotation !== 0) parts.push(`rotated ${transform.rotation}°`)
  if (transform.flipX) parts.push('flipped horizontally')
  if (transform.flipY) parts.push('flipped vertically')
  if (parts.length === 0) return 'No change — this would export the original.'
  return `Exporting ${parts.join(' and ')}.`
}

/**
 * The orientation a phone photo needs to display correctly.
 *
 * EXIF orientation 6 means "rotate 90° CCW to display", which is exactly the
 * sideways-portrait case; the tool offers this as one button rather than
 * making the user read a table.
 */
export function fromExifOrientation(orientation: number | undefined): Transform {
  switch (orientation) {
    case 2:
      return { rotation: 0, flipX: true, flipY: false }
    case 3:
      return { rotation: 180, flipX: false, flipY: false }
    case 4:
      return { rotation: 180, flipX: true, flipY: false }
    case 5:
      return { rotation: 90, flipX: true, flipY: false }
    case 6:
      return { rotation: 90, flipX: false, flipY: false }
    case 7:
      return { rotation: 270, flipX: true, flipY: false }
    case 8:
      return { rotation: 270, flipX: false, flipY: false }
    default:
      return IDENTITY
  }
}

/**
 * A lossless rotation is only possible at multiples of 90° for JPEG, and only
 * when the dimensions are multiples of the block size.
 *
 * Most tools claim "lossless 90° rotation"; in practice it fails on any image
 * whose side is not a multiple of 8 or 16. This reports the truth.
 */
export function losslessRotatePossible(
  format: string,
  transform: Transform,
): { possible: boolean; reason: string } {
  if (transform.rotation !== 0 && transform.rotation !== 90 && transform.rotation !== 180 && transform.rotation !== 270) {
    return { possible: false, reason: 'Only quarter turns can be lossless.' }
  }
  if (format !== 'jpeg') {
    return { possible: false, reason: 'Only JPEG can be reoriented losslessly.' }
  }
  if (transform.flipX || transform.flipY) {
    return { possible: false, reason: 'A flip has to be re-encoded, so some detail is always lost.' }
  }
  if (transform.rotation === 0) {
    return { possible: false, reason: 'There is nothing to rotate.' }
  }
  return {
    possible: false,
    reason:
      'This tool re-draws the image on a canvas, which re-encodes it. A true lossless rotation is not offered because it silently fails on images whose sides are not a multiple of the encoder block size.',
  }
}
