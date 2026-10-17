/**
 * Image background utilities.
 *
 * This is explicitly *not* background removal. Automatic background removal
 * needs a segmentation model this tool does not have, and pretending otherwise
 * would be dishonest. What it does is add borders, fit an image onto a solid
 * background, and produce a transparent canvas — all of which are real and
 * all of which people mistake for "removing the background".
 */

import { clamp } from '@/lib/utils'

export type BackgroundJob = 'pad' | 'extend-canvas' | 'outline' | 'solid-backdrop'

export const JOBS: Array<{ id: BackgroundJob; label: string; description: string }> = [
  {
    id: 'pad',
    label: 'Add a padding border',
    description: 'Keeps the picture exactly as it is and grows the canvas around it. The image is never cropped.',
  },
  {
    id: 'extend-canvas',
    label: 'Place on a solid colour',
    description: 'Draws the image over a filled background of your colour, so a transparent-only image gets visible edges.',
  },
  {
    id: 'outline',
    label: 'Add an outline',
    description: 'Draws a border of the chosen colour immediately around the image edge, without changing its size.',
  },
  {
    id: 'solid-backdrop',
    label: 'Transparent canvas',
    description: 'Creates an empty transparent canvas at the size you ask for, for pasting your own artwork into.',
  },
]

/** What the tool is not, stated up front. */
export const NOT_BACKGROUND_REMOVAL =
  'This tool does not remove backgrounds. Cutting a subject out of its background needs a segmentation model, and a tool that guessed would produce a bad cut-out without telling you. What it does instead is add borders, fill a backdrop, and set up a transparent canvas — the jobs that are often mistaken for removal.'

export interface PadPlan {
  width: number
  height: number
  offsetX: number
  offsetY: number
  /** How much canvas was added on the shortest side. */
  percentGrown: number
}

/**
 * The canvas needed to pad an image by a percentage.
 *
 * Padding is applied to the *shorter* side, so a percentage means the same
 * thing visually on a wide banner as on a tall portrait.
 */
export function planPad(
  source: { width: number; height: number },
  percent: number,
): PadPlan {
  const shortSide = Math.min(source.width, source.height)
  const pad = Math.round(shortSide * (clamp(percent, 0, 200) / 100))
  const width = source.width + pad * 2
  const height = source.height + pad * 2
  const before = shortSide
  const after = Math.min(width, height)
  return {
    width,
    height,
    offsetX: pad,
    offsetY: pad,
    percentGrown: before === 0 ? 0 : Math.round((after / before - 1) * 100),
  }
}

/** The border thickness requested, clamped to something drawable. */
export function outlineWidth(image: { width: number; height: number }, percent: number): number {
  const shortSide = Math.min(image.width, image.height)
  // Never more than a quarter of the shortest side, or the border swallows it.
  return Math.max(1, Math.min(Math.round(shortSide * (clamp(percent, 0, 100) / 100)), Math.floor(shortSide / 4)))
}

/** A plain description of the chosen job. */
export function describeJob(job: BackgroundJob, source: { width: number; height: number }, percent: number): string {
  const plan = planPad(source, percent)
  switch (job) {
    case 'pad':
      return `A ${padPixels(source, percent)}-pixel border on each side. Output ${plan.width} × ${plan.height}.`
    case 'extend-canvas':
      return 'The image is drawn over a filled backdrop at its own size, so nothing is cropped.'
    case 'outline':
      return `A ${outlineWidth(source, percent)}-pixel outline is drawn just inside each edge. Output size is unchanged at ${source.width} × ${source.height}.`
    case 'solid-backdrop':
      return `A transparent ${source.width} × ${source.height} canvas. Download it as PNG, which is the only format here that keeps transparency.`
  }
}

function padPixels(source: { width: number; height: number }, percent: number): number {
  return Math.round(Math.min(source.width, source.height) * (clamp(percent, 0, 200) / 100))
}

/** Whether a format can keep the transparency these jobs rely on. */
export function warnsAboutFormat(format: string): string | null {
  if (format === 'png') return null
  if (format === 'webp') return null
  if (format === 'jpeg') {
    return 'JPEG has no transparency, so any transparent area will be filled with black. Save as PNG or WebP to keep it see-through.'
  }
  return null
}
