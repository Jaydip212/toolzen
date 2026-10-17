/**
 * Resize planning: which dimension wins, and what the result will be.
 */

import { fitWithin, aspectRatioLabel } from '@/lib/image-geometry'

export type ResizeMode = 'exact' | 'long-edge' | 'percent' | 'preset'

export interface ResizePlan {
  mode: ResizeMode
  width: number
  height: number
  /** The ratio kept from the source, when one was kept. */
  keptAspect: boolean
  /** A sentence describing what will happen. */
  sentence: string
}

/**
 * Work out the output size for the chosen mode.
 *
 * The rules, stated because each is a decision the user is making:
 * - `exact`      — the numbers given, aspect ratio sacrificed
 * - `long-edge`  — one number, the other derived from the source ratio
 * - `percent`    — both derived, ratio kept
 * - `preset`     — fit inside the preset's box, ratio kept
 *
 * There is deliberately no `lockAspect` flag. In every mode except `exact`
 * the ratio is kept by construction, and in `exact` the user typed both
 * numbers, so a flag would only be a promise the tool silently ignores.
 */
export function planResize(
  source: { width: number; height: number },
  mode: ResizeMode,
  input: { width?: number; height?: number; percent?: number; preset?: { width: number; height: number }; longEdge?: number },
): ResizePlan {
  if (source.width <= 0 || source.height <= 0) {
    return { mode, width: 0, height: 0, keptAspect: false, sentence: 'That image has no readable size.' }
  }

  if (mode === 'exact') {
    const width = Math.round(input.width ?? 0)
    const height = Math.round(input.height ?? 0)
    if (width <= 0 || height <= 0) {
      return { mode, width: 0, height: 0, keptAspect: false, sentence: 'Enter both a width and a height above zero.' }
    }
    if (width === source.width && height === source.height) {
      return { mode, width, height, keptAspect: true, sentence: 'That is already the size it is; nothing would change.' }
    }
    const keptAspect = aspectRatioLabel(source) === aspectRatioLabel({ width, height })
    return {
      mode,
      width,
      height,
      keptAspect,
      sentence: keptAspect
        ? `Output will be exactly ${width} × ${height}, keeping the shape.`
        : `Output will be exactly ${width} × ${height}. The shape changes, because the two numbers do not match the original ${aspectRatioLabel(source)} ratio.`,
    }
  }

  if (mode === 'percent') {
    const percent = input.percent ?? 100
    if (percent <= 0) {
      return { mode, width: 0, height: 0, keptAspect: false, sentence: 'A percentage below zero would leave nothing to draw.' }
    }
    const width = Math.max(1, Math.round((source.width * percent) / 100))
    const height = Math.max(1, Math.round((source.height * percent) / 100))
    return {
      mode,
      width,
      height,
      keptAspect: true,
      sentence: `Output will be ${width} × ${height}, which is ${percent}% of the original.`,
    }
  }

  if (mode === 'long-edge') {
    const edge = Math.round(input.longEdge ?? 0)
    if (edge <= 0) {
      return { mode, width: 0, height: 0, keptAspect: false, sentence: 'Enter the length of the longest side.' }
    }
    const longest = Math.max(source.width, source.height)
    if (edge === longest) {
      return { mode, width: source.width, height: source.height, keptAspect: true, sentence: 'That is already the longest side; nothing would change.' }
    }
    const scale = edge / longest
    const width = Math.max(1, Math.round(source.width * scale))
    const height = Math.max(1, Math.round(source.height * scale))
    return {
      mode,
      width,
      height,
      keptAspect: true,
      sentence: `The longest side becomes ${edge}, so the other becomes ${
        width > height ? height : width
      }. Output: ${width} × ${height}.`,
    }
  }

  // preset
  const box = input.preset ?? { width: 1280, height: 720 }
  const fitted = fitWithin(source, box)
  if (fitted.width === 0 || fitted.height === 0) {
    return { mode, width: 0, height: 0, keptAspect: false, sentence: 'That preset box is not usable.' }
  }
  const fillsExactly = fitted.width === box.width && fitted.height === box.height
  return {
    mode,
    width: fitted.width,
    height: fitted.height,
    keptAspect: true,
    sentence: fillsExactly
      ? `Fits the ${box.width} × ${box.height} preset exactly.`
      : `Fits inside the ${box.width} × ${box.height} preset at ${fitted.width} × ${fitted.height}, keeping the shape.`,
  }
}

/** Which inputs a mode needs. */
export function fieldsFor(mode: ResizeMode): Array<'width' | 'height' | 'percent' | 'longEdge'> {
  if (mode === 'exact') return ['width', 'height']
  if (mode === 'percent') return ['percent']
  if (mode === 'long-edge') return ['longEdge']
  return []
}

/** A warning when the resize would enlarge a small image without being asked. */
export function upscaleWarning(source: { width: number; height: number }, plan: ResizePlan): string | null {
  if (plan.width === 0 || plan.height === 0) return null
  if (plan.width <= source.width && plan.height <= source.height) return null
  const factor = Math.max(plan.width / source.width, plan.height / source.height)
  return `This would make the image ${factor.toFixed(1)}× larger. A bigger file cannot add detail that was never captured — the result will look soft.`
}
