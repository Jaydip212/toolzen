/**
 * Resize and crop geometry for the image tools.
 *
 * Every decision here is pure arithmetic on numbers, so the tool can show its
 * working and the maths can be tested without a canvas.
 */

export type FitMode = 'contain' | 'cover' | 'fill' | 'scale-down'

export interface Dimensions {
  width: number
  height: number
}

/**
 * Scale a size so it fits inside a bound, never exceeding it in either axis and
 * never scaling up unless the caller asks for it.
 */
export function fitWithin(
  source: Dimensions,
  bound: Dimensions,
  allowUpscale = false,
): Dimensions {
  const { width, height } = source
  if (width <= 0 || height <= 0) {
    return { width: 0, height: 0 }
  }

  const ratio = Math.min(bound.width / width, bound.height / height)
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return { width: 0, height: 0 }
  }
  // scale-down must never enlarge.
  if (!allowUpscale && ratio > 1) {
    return { width, height }
  }

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

/**
 * The rectangle a source must be cropped to so that it can be scaled to
 * `target` at the same aspect ratio. Cropping first and scaling second means
 * the tool never has to stretch a picture it was asked to keep proportional.
 */
export function cropForAspect(
  source: Dimensions,
  target: Dimensions,
  mode: FitMode,
): Dimensions {
  const { width, height } = source
  if (width <= 0 || height <= 0) return { width: 0, height: 0 }

  if (mode === 'fill') return { width, height }

  const targetRatio = target.width / target.height
  const sourceRatio = width / height

  if (mode === 'contain') {
    // Keep the source shape; the target is the outer bound it fits inside.
    return fitWithin(source, target)
  }
  if (mode === 'cover' || mode === 'scale-down') {
    if (sourceRatio > targetRatio) {
      // Too wide — trim the sides.
      return { width: Math.max(1, Math.round(height * targetRatio)), height }
    }
    return { width, height: Math.max(1, Math.round(width / targetRatio)) }
  }
  return { width, height }
}

/**
 * The rectangle to actually crop, anchored per `anchor`, after the crop size
 * has been decided. Returns zeros when there is nothing to crop.
 */
export function cropRect(
  source: Dimensions,
  crop: Dimensions,
  anchor: CropAnchor = 'center',
): { x: number; y: number; width: number; height: number } {
  const width = Math.max(1, Math.min(Math.round(crop.width), Math.round(source.width)))
  const height = Math.max(1, Math.min(Math.round(crop.height), Math.round(source.height)))

  const overflowX = source.width - width
  const overflowY = source.height - height

  const place = (overflow: number, axis: 'x' | 'y'): number => {
    if (overflow <= 0) return 0
    switch (anchor) {
      case 'top-left':
        return axis === 'x' ? 0 : 0
      case 'top':
        return axis === 'x' ? overflow / 2 : 0
      case 'top-right':
        return axis === 'x' ? overflow : 0
      case 'left':
        return axis === 'x' ? 0 : overflow / 2
      case 'right':
        return axis === 'x' ? overflow : overflow / 2
      case 'bottom-left':
        return axis === 'x' ? 0 : overflow
      case 'bottom':
        return axis === 'x' ? overflow / 2 : overflow
      case 'bottom-right':
        return overflow
      default:
        return overflow / 2
    }
  }

  const x = place(overflowX, 'x')
  const y = place(overflowY, 'y')

  return {
    x: Math.round(x),
    y: Math.round(y),
    width,
    height,
  }
}

export type CropAnchor =
  | 'center'
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right'

export const CROP_ANCHORS: Array<{ value: CropAnchor; label: string }> = [
  { value: 'center', label: 'Centre' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'top-left', label: 'Top left' },
  { value: 'top-right', label: 'Top right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-right', label: 'Bottom right' },
]

export const FIT_MODE_LABELS: Record<FitMode, string> = {
  contain: 'Fit inside (keep shape, pad the rest)',
  cover: 'Fill the frame (crop the overflow)',
  fill: 'Stretch to the exact size',
  'scale-down': 'Only shrink, never enlarge',
}

/** Aspect ratio as a decimal, rounded for display. */
export function aspectRatio({ width, height }: Dimensions): number {
  if (height === 0) return 0
  return Math.round((width / height) * 1000) / 1000
}

/**
 * Aspect ratio as `W:H`. Narrow, useful numbers come out as `16:9`; awkward
 * ones fall back to a decimal so `1893:1000` is never shown.
 */
export function aspectRatioLabel({ width, height }: Dimensions): string {
  if (width <= 0 || height <= 0) return '—'
  const divisor = gcd(width, height)
  const w = Math.round(width / divisor)
  const h = Math.round(height / divisor)
  if (separators(w) <= 2 && separators(h) <= 2 && w + h <= 60) return `${w}:${h}`
  return `${aspectRatio({ width, height })}:1`
}

function separators(value: number): number {
  return String(value).length
}

/** Greatest common divisor, by the Euclidean algorithm. */
export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a))
  let y = Math.abs(Math.round(b))
  while (y) {
    const t = y
    y = x % y
    x = t
  }
  return x || 1
}

/** A readable ratio such as "1.78 (wider than tall)". */
export function describeRatio({ width, height }: Dimensions): string {
  const ratio = aspectRatio({ width, height })
  if (ratio === 0) return '—'
  if (Math.abs(ratio - 1) < 0.02) return 'square'
  if (ratio > 1) return `${ratio.toFixed(2)} — wider than tall`
  return `${ratio.toFixed(2)} — taller than long`
}

/** Common target sizes, offered as presets. */
export const SIZE_PRESETS: Array<{ label: string; width: number; height: number }> = [
  { label: 'Full HD', width: 1920, height: 1080 },
  { label: 'HD', width: 1280, height: 720 },
  { label: 'Square 1080', width: 1080, height: 1080 },
  { label: 'Square 512', width: 512, height: 512 },
  { label: 'Instagram portrait', width: 1080, height: 1350 },
  { label: 'Twitter header', width: 1500, height: 500 },
  { label: 'Open Graph', width: 1200, height: 630 },
  { label: 'Thumbnail', width: 320, height: 320 },
]

/** A percentage change label between two sizes. */
export function sizeChange(source: Dimensions, result: Dimensions): string {
  const before = source.width * source.height
  const after = result.width * result.height
  if (before === 0 || after === 0) return '—'
  const percent = Math.round((after / before) * 100)
  if (percent === 100) return 'same pixel count'
  return `${percent > 100 ? '+' : ''}${percent - 100}% pixels`
}

/** The largest dimension, used for the "long edge" input. */
export function longEdge({ width, height }: Dimensions): number {
  return Math.max(width, height)
}

/**
 * Scale from a long-edge target, keeping the aspect ratio. A 4000×3000 image
 * with a 1600 long edge becomes 1600×1200, not 1600×1600.
 */
export function scaleToLongEdge(source: Dimensions, edge: number): Dimensions {
  if (edge <= 0) return { width: 0, height: 0 }
  const current = longEdge(source)
  if (current === 0) return { width: 0, height: 0 }
  return {
    width: Math.max(1, Math.round((source.width / current) * edge)),
    height: Math.max(1, Math.round((source.height / current) * edge)),
  }
}

/** Rotation, in quarter turns, so 90/180/270 and their negative forms agree. */
export function normaliseRotation(degrees: number): 0 | 90 | 180 | 270 {
  const turns = Math.round(((degrees % 360) + 360) % 360 / 90)
  return ([0, 90, 180, 270] as const)[turns % 4]
}

/**
 * The dimensions after a quarter-turn rotation. 90 and 270 swap the axes;
 * 0 and 180 do not.
 */
export function dimensionsAfterRotation(source: Dimensions, degrees: number): Dimensions {
  const quarter = normaliseRotation(degrees)
  return quarter === 90 || quarter === 270
    ? { width: source.height, height: source.width }
    : { width: source.width, height: source.height }
}

/** A CSS transform that reproduces a rotation plus optional flip. */
export function transformFor(degrees: number, flipX: boolean, flipY: boolean): string {
  const parts: string[] = []
  const quarter = normaliseRotation(degrees)
  if (quarter !== 0) parts.push(`rotate(${quarter}deg)`)
  if (flipX) parts.push('scaleX(-1)')
  if (flipY) parts.push('scaleY(-1)')
  return parts.length > 0 ? parts.join(' ') : 'none'
}
