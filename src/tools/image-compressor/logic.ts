/**
 * Compression planning for images.
 *
 * The maths here decides the target quality and reports the expected saving;
 * the actual encode is done by the page on a canvas.
 */

import { formatBytes } from '@/lib/utils'

export interface CompressionPreset {
  id: string
  label: string
  quality: number
  /** Who it is for, in one line. */
  useCase: string
}

/**
 * Presets ordered from least to most aggressive.
 *
 * Each maps to a quality number that caps the target for lossy formats, and is
 * ignored for a lossless one — stated plainly rather than pretended away.
 */
export const PRESETS: CompressionPreset[] = [
  { id: 'lossless', label: 'Lossless', quality: 100, useCase: 'Archiving the original, no quality given up' },
  { id: 'high', label: 'High', quality: 88, useCase: 'Portfolio and print — differences are invisible' },
  { id: 'balanced', label: 'Balanced', quality: 78, useCase: 'Website images, where speed matters' },
  { id: 'small', label: 'Small', quality: 60, useCase: 'Thumbnails, previews and email' },
  { id: 'tiny', label: 'Tiny', quality: 40, useCase: 'Backgrounds and textures, where detail is noise' },
]

export function presetById(id: string): CompressionPreset {
  return PRESETS.find((preset) => preset.id === id) ?? PRESETS[1]
}

/** Whether a given format can be losslessly compressed. */
export function canBeLossless(format: string): boolean {
  return format === 'png'
}

/**
 * The quality number to encode at.
 *
 * A lossless target ignores the preset, because there is no dial — the tool
 * reports that rather than silently claiming quality 40 was "lossless".
 */
export function resolveQuality(preset: CompressionPreset, format: string): number {
  if (format === 'png') return 100
  return preset.quality
}

export interface SavingEstimate {
  /** Saved bytes, as a fraction of the original. Negative when it grows. */
  fraction: number
  /** A human sentence. */
  sentence: string
}

/**
 * Estimate the saving from a re-encode.
 *
 * Deliberately an estimate: JPEG saving at a given quality depends entirely
 * on the picture, and a number presented as exact would be a lie. The tool
 * measures the real result once the encode finishes.
 */
export function estimateSaving(originalBytes: number, quality: number): SavingEstimate {
  if (originalBytes <= 0) {
    return { fraction: 0, sentence: 'That file is empty, so there is nothing to compress.' }
  }
  // A crude but honest curve: the top of the range saves very little, the
  // bottom a lot. Calibrated against typical photographs, and labelled an
  // estimate wherever it appears.
  // At maximum quality a JPEG re-encode typically *grows*, because it is
  // re-saving a file that was already compressed. Saying so is more useful
  // than a fake saving.
  const factor =
    quality >= 100
      ? 1.2
      : 0.55 + (quality - 40) / 100 * (quality >= 88 ? 0.45 : 0.9)
  const estimated = Math.round(originalBytes * Math.max(0.05, Math.min(1, factor)))
  const fraction = (estimated - originalBytes) / originalBytes

  if (fraction >= 0) {
    return {
      fraction,
      sentence: `This may not get smaller at that setting — JPEG already-compressed files can grow when re-encoded.`,
    }
  }
  const percent = Math.abs(Math.round(fraction * 100))
  return {
    fraction,
    sentence: `A re-encode at this setting is typically around ${percent}% smaller (${formatBytes(estimated)} from ${formatBytes(originalBytes)}). This is an estimate, not a promise.`,
  }
}

/**
 * Whether shrinking the pixel dimensions would save more than the quality dial.
 *
 * Halving the side lengths cuts pixels by 75%, which beats almost any quality
 * setting — worth telling the user, because it is the mistake everyone makes
 * first: they lower quality instead of size.
 */
export function betterLever(
  original: { width: number; height: number },
  target: { width: number; height: number },
): 'quality' | 'dimensions' | 'neither' {
  const pixelRatio = (target.width * target.height) / (original.width * original.height)
  if (pixelRatio < 0.5) return 'dimensions'
  if (pixelRatio > 1) return 'dimensions'
  return 'quality'
}

/** A note for the result panel. */
export function resultNote(
  originalBytes: number,
  newBytes: number,
  format: string,
): string {
  if (newBytes >= originalBytes) {
    return `The result is larger than the original. That happens when an already-compressed ${format} is re-encoded; the quality dial cannot undo compression that already happened.`
  }
  const saved = originalBytes - newBytes
  const percent = Math.round((saved / originalBytes) * 100)
  return `${formatBytes(saved)} saved, ${percent}% smaller than the original.`
}
