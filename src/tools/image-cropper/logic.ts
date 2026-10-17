/**
 * Crop planning.
 *
 * The user is given a free rectangle; this module clamps it to the image and
 * reports what comes out.
 */

import { clamp } from '@/lib/utils'

export interface CropSelection {
  left: number
  top: number
  right: number
  bottom: number
}

export interface CropPlan {
  x: number
  y: number
  width: number
  height: number
  /** Whether the selection had to be adjusted to stay inside the image. */
  clamped: boolean
  sentence: string
}

/**
 * Clamp a selection to the image and turn it into a source rectangle.
 *
 * A dragged rectangle routinely escapes the image edge by a pixel or two;
 * silently clamping is right there. A rectangle that has collapsed to nothing
 * is refused with a reason rather than producing a 0×0 canvas.
 */
export function planCrop(
  source: { width: number; height: number },
  selection: CropSelection,
): CropPlan {
  const empty: CropPlan = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    clamped: false,
    sentence: 'Drag a box over the image first.',
  }

  if (source.width <= 0 || source.height <= 0) return empty

  // Selection is in percentage of the image, so it scales to any size.
  const left = clamp(selection.left, 0, 100)
  const top = clamp(selection.top, 0, 100)
  const right = clamp(selection.right, 0, 100)
  const bottom = clamp(selection.bottom, 0, 100)

  const clamped = left !== selection.left || top !== selection.top || right !== selection.right || bottom !== selection.bottom

  if (right <= left || bottom <= top) {
    return { ...empty, clamped, sentence: 'That selection is thinner than a pixel. Drag from one corner outwards.' }
  }

  const x = Math.round((left / 100) * source.width)
  const y = Math.round((top / 100) * source.height)
  const width = Math.round(((right - left) / 100) * source.width)
  const height = Math.round(((bottom - top) / 100) * source.height)

  if (width < 1 || height < 1) {
    return { ...empty, clamped, sentence: 'That selection is thinner than a pixel on this image. Drag a bigger box.' }
  }

  const coversWhole = x === 0 && y === 0 && width === source.width && height === source.height

  // Both things can be true at once — a selection dragged well outside the
  // image that lands on the whole frame — so both are reported.
  const trimmedNote = clamped
    ? `The selection was trimmed to ${width} × ${height} at (${x}, ${y}) to stay inside the image.`
    : null
  const areaNote = `Cropping to ${width} × ${height} at (${x}, ${y}), which keeps ${Math.round(
    (width * height) / (source.width * source.height) * 100,
  )}% of the area.`

  if (coversWhole) {
    return {
      x,
      y,
      width,
      height,
      clamped,
      sentence: trimmedNote
        ? `${trimmedNote} That leaves the whole image, so cropping changes nothing.`
        : 'That box covers the whole image, so cropping changes nothing.',
    }
  }

  return {
    x,
    y,
    width,
    height,
    clamped,
    sentence: trimmedNote ?? areaNote,
  }
}

/** A percentage-based crop, for the quick aspect-ratio buttons. */
export function centredAspect(
  source: { width: number; height: number },
  ratio: number,
): CropSelection {
  const sourceRatio = source.width / source.height
  if (ratio >= sourceRatio) {
    // Too tall: trim the top and bottom.
    const keep = (sourceRatio / ratio) * 100
    return { left: 0, top: (100 - keep) / 2, right: 100, bottom: (100 + keep) / 2 }
  }
  const keep = (ratio / sourceRatio) * 100
  return { left: (100 - keep) / 2, top: 0, right: (100 + keep) / 2, bottom: 100 }
}

/** The aspect ratios offered as one-click options. */
export const CROP_RATIOS: Array<{ label: string; ratio: number | null }> = [
  { label: 'Free', ratio: null },
  { label: 'Square', ratio: 1 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '3:4', ratio: 3 / 4 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '9:16', ratio: 9 / 16 },
  { label: '3:2', ratio: 3 / 2 },
]

/** The percentage label shown while dragging. */
export function selectionLabel(selection: CropSelection): string {
  const width = Math.abs(selection.right - selection.left)
  const height = Math.abs(selection.bottom - selection.top)
  return `${Math.round(width)}% × ${Math.round(height)}%`
}
