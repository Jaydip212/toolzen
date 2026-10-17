/**
 * Resize scaling, saturation and the long-edge helper for the multi-file resizer.
 */

export interface ResizeTarget {
  width: number
  height: number
  /** The ratio that was used, or null when the size was forced. */
  ratio: number | null
}

/**
 * The size each of a batch of images should become.
 *
 * A mixed batch cannot all be the same number of pixels and keep their shape,
 * so "same size" is defined as the same *ratio*: a landscape and a portrait
 * with a 1600 long edge both become 1600 on their longest side.
 */
export function targetFor(size: { width: number; height: number }, mode: 'long-edge' | 'exact', value: number): ResizeTarget {
  if (mode === 'exact') {
    return { width: Math.max(1, Math.round(value)), height: Math.max(1, Math.round(value)), ratio: null }
  }
  const longest = Math.max(size.width, size.height)
  if (longest <= 0) return { width: 0, height: 0, ratio: null }
  const ratio = value / longest
  return {
    width: Math.max(1, Math.round(size.width * ratio)),
    height: Math.max(1, Math.round(size.height * ratio)),
    ratio,
  }
}

/** A readable progress line for the batch panel. */
export function progressLine(done: number, total: number): string {
  if (total === 0) return 'No images yet.'
  if (done === 0) return `Waiting — ${total} image${total === 1 ? '' : 's'} queued.`
  if (done >= total) return `All ${total} image${total === 1 ? '' : 's'} done.`
  return `${done} of ${total} done.`
}

/** The filename for a numbered member of a batch. */
export function batchName(original: string, index: number, total: number, extension: string): string {
  const base = original.replace(/\.[^.]+$/, '') || 'image'
  const digits = String(Math.max(total, 1)).length
  const suffix = String(index + 1).padStart(digits, '0')
  return `${base}-${suffix}.${extension.replace(/^\./, '')}`
}

/** How many files the tool will accept in one batch. */
export const MAX_BATCH = 50

/** Whether a batch is within the limit, with the reason if not. */
export function batchStatus(count: number): { ok: boolean; reason: string | null } {
  if (count === 0) return { ok: true, reason: null }
  if (count > MAX_BATCH) {
    return {
      ok: false,
      reason: `That is ${count} files. The tool handles up to ${MAX_BATCH} at a time, because everything runs on this device and a very large batch would exhaust the memory in a browser tab.`,
    }
  }
  return { ok: true, reason: null }
}

/** A summary of what the batch will do. */
export function batchSummary(mode: 'long-edge' | 'exact', value: number, count: number): string {
  if (count === 0) return 'Add images to see the plan.'
  if (mode === 'exact') {
    return `Each image becomes ${value} × ${value}. Images whose shape does not match will be stretched, because a batch shares one pair of numbers.`
  }
  return `Each image keeps its own shape, with its longest side set to ${value} pixels.`
}
