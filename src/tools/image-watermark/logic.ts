/**
 * Watermark placement and sizing.
 */

import { clamp } from '@/lib/utils'

export type WatermarkPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left'
  | 'center'
  | 'tiled'

export const POSITIONS: Array<{ value: WatermarkPosition; label: string }> = [
  { value: 'bottom-right', label: 'Bottom right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'top-right', label: 'Top right' },
  { value: 'top-left', label: 'Top left' },
  { value: 'center', label: 'Dead centre' },
  { value: 'tiled', label: 'Tiled across the whole image' },
]

/** The margin, as a fraction of the shorter side. */
const MARGIN = 0.03

export interface Placement {
  x: number
  y: number
  /** Pixels of the watermark's own size, after scaling. */
  width: number
  height: number
  /** True when the watermark overlaps the middle of the image. */
  overSubject: boolean
}

/**
 * Where a watermark of the given size goes.
 *
 * `tiled` returns one placement per repeat, because the UI draws each one and
 * a single rectangle could not describe a repeating grid.
 */
export function placeWatermark(
  image: { width: number; height: number },
  mark: { width: number; height: number },
  position: WatermarkPosition,
  scale: number,
): Placement[] {
  const width = Math.max(1, Math.round(mark.width * scale))
  const height = Math.max(1, Math.round(mark.height * scale))
  const margin = Math.round(Math.min(image.width, image.height) * MARGIN)

  const corner = (): Placement => {
    const overflowX = image.width - width
    const overflowY = image.height - height
    const x =
      position === 'bottom-right' || position === 'top-right' ? Math.max(margin, overflowX - margin) : margin
    const y = position === 'bottom-right' || position === 'bottom-left' ? Math.max(margin, overflowY - margin) : margin
    return { x, y, width, height, overSubject: false }
  }

  if (position === 'center') {
    const x = Math.max(0, Math.round((image.width - width) / 2))
    const y = Math.max(0, Math.round((image.height - height) / 2))
    return [{ x, y, width, height, overSubject: true }]
  }

  if (position !== 'tiled') return [corner()]

  // Tile with a gap of one watermark's own size, so the grid reads evenly
  // without needing the user to tune two numbers.
  const stepX = width + Math.round(width * 0.5)
  const stepY = height + Math.round(height * 0.5)
  const tiles: Placement[] = []
  for (let y = 0; y + height <= image.height; y += stepY) {
    for (let x = 0; x + width <= image.width; x += stepX) {
      tiles.push({ x, y, width, height, overSubject: true })
    }
  }
  return tiles.length > 0 ? tiles : [corner()]
}

/** The opacity a watermark needs to be visible but not shouty. */
export const DEFAULT_OPACITY = 0.35

/**
 * A readable-watermark check.
 *
 * A watermark at full opacity defeats the point of the image, and one below
 * roughly 15% disappears on a dark photo. This reports the truth either way.
 */
export function opacityWarning(opacity: number): string | null {
  if (opacity >= 0.75) {
    return 'At this opacity the watermark covers the picture. Around 20–40% is enough to see without spoiling it.'
  }
  if (opacity < 0.08) {
    return 'At this opacity the watermark may be invisible on a busy photo. Around 20–40% is a safer range.'
  }
  return null
}

/** The scale a watermark should be, from a percentage of the image width. */
export function scaleFromPercent(percent: number, markWidth: number, imageWidth: number): number {
  if (markWidth <= 0 || imageWidth <= 0) return 0.1
  return clamp((percent / 100) * imageWidth / markWidth, 0.02, 4)
}

/** Whether the watermark fits at all. */
export function fitsAt(image: { width: number; height: number }, mark: { width: number; height: number }): boolean {
  return mark.width <= image.width && mark.height <= image.height
}
