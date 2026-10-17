/**
 * Image format detection and export-quality guidance.
 *
 * This module deliberately contains no canvas code: it decides what a file is
 * and compares it with the alternatives, so a caller (the tool page) does the
 * encoding.
 */

import {
  type FormatInfo,
  type ImageFormat,
  detectFormat,
  formatInfo,
  headerDimensions,
} from '@/lib/image-format'

export interface FormatComparison {
  format: ImageFormat
  info: FormatInfo
  /** Why this format wins, in one sentence. */
  advantage: string
  /** What it costs you. */
  tradeoff: string
  /** Common jobs it is the right answer for. */
  bestFor: string[]
}

/** The comparison table, keyed by every known format, null where not comparable. */
export const COMPARISONS: Record<ImageFormat, FormatComparison | null> = {
  png: {
    format: 'png',
    info: formatInfo('png'),
    advantage: 'Lossless — a pixel is exactly the pixel you put in.',
    tradeoff: 'The largest file of the three for anything photographic.',
    bestFor: ['Screenshots with text', 'Logos and line art', 'Anything you will edit again'],
  },
  jpeg: {
    format: 'jpeg',
    info: formatInfo('jpeg'),
    advantage: 'The smallest file for a photograph, by a wide margin.',
    tradeoff: 'Loses detail every time you re-save it, and cannot hold transparency.',
    bestFor: ['Photographs', 'Website heroes', 'Email attachments'],
  },
  webp: {
    format: 'webp',
    info: formatInfo('webp'),
    advantage: 'Smaller than a JPEG at the same visible quality, with transparency on top.',
    tradeoff: 'Older software and some social platforms still do not accept it.',
    bestFor: ['Modern websites', 'Photographs that need transparency', 'Replacing both PNG and JPEG'],
  },
  gif: null,
  bmp: null,
  avif: null,
  svg: null,
  tiff: null,
  ico: null,
  unknown: null,
}

/** The three conversions the tool offers, in the order it offers them. */
export const CONVERTIBLE: ImageFormat[] = ['png', 'jpeg', 'webp']

export function comparisonFor(format: ImageFormat): FormatComparison | null {
  return COMPARISONS[format] ?? null
}

/**
 * Every comparison the UI should show, given the source format.
 *
 * The source itself is excluded — converting a PNG to a PNG is not a job.
 */
export function comparisonsFor(source: ImageFormat): FormatComparison[] {
  return CONVERTIBLE.filter((format) => format !== source)
    .map((format) => comparisonFor(format))
    .filter((entry): entry is FormatComparison => entry !== null)
}

export interface QualityNote {
  /** A plain statement of what the chosen quality setting does. */
  headline: string
  /** A number from 0 to 100, as the slider will show it. */
  suggested: number
}

/**
 * A sensible starting quality for a target format.
 *
 * WebP needs a lower number than JPEG to look the same, which is the whole
 * point of it; guessing 85 for both would waste the advantage.
 */
export function suggestedQuality(target: ImageFormat): number {
  if (target === 'webp') return 82
  if (target === 'jpeg') return 85
  return 92
}

/** The ceiling for a lossless target, which has no quality dial at all. */
export function isLossless(target: ImageFormat): boolean {
  return target === 'png'
}

/** The quality explanation shown next to the slider. */
export function qualityNote(target: ImageFormat, quality: number): QualityNote {
  if (target === 'png') {
    return {
      headline: 'PNG is lossless, so there is no quality dial — the number has no effect.',
      suggested: 100,
    }
  }
  const loss =
    quality >= 90 ? 'almost nothing' : quality >= 75 ? 'fine detail' : quality >= 50 ? 'visible texture' : 'a lot'
  return {
    headline: `At ${quality}, a re-save typically costs ${loss}.`,
    suggested: suggestedQuality(target),
  }
}

/** What the tool will actually be able to produce, stated honestly. */
export function capabilityNote(source: ImageFormat, target: ImageFormat): string | null {
  if (source === 'png' && target === 'jpeg') {
    return 'Transparent areas will become black, because JPEG has no alpha channel. Choose WebP or PNG to keep them.'
  }
  if (source === 'gif' && target !== 'webp') {
    return 'Only the first frame of an animated GIF is converted; the result is a still image.'
  }
  if (source === 'svg' && target !== 'png') {
    return 'An SVG must be rasterised first, so PNG is the only direct conversion from it.'
  }
  return null
}

/** A short verdict on a detected format, for the result panel. */
export function formatVerdict(detected: ImageFormat, declared: string): string {
  if (detected === 'unknown') return 'That file is not an image this tool can read.'
  const info = formatInfo(detected)
  if (!declared) return `Read as ${info.label}.`
  if (declared === info.extension || (detected === 'jpeg' && declared === 'jpeg')) {
    return `Read as ${info.label}, matching the .${declared} name.`
  }
  return `Read as ${info.label} even though the name says .${declared}.`
}

/**
 * Whether the browser can encode a target directly from a canvas.
 *
 * Reported per-format rather than assumed, because support varies and a silent
 * failure here would produce a broken download.
 */
export function encodingSupport(target: ImageFormat): 'supported' | 'unsupported' | 'unknown' {
  const canvas = typeof document === 'undefined' ? null : document.createElement('canvas')
  if (!canvas || !('toDataURL' in canvas)) return 'unknown'
  const mime = formatInfo(target).mime
  let dataUrl: string | null = null
  try {
    dataUrl = canvas.toDataURL(mime)
  } catch {
    return 'unknown'
  }
  if (typeof dataUrl !== 'string') return 'unknown'
  if (dataUrl.startsWith(`data:${mime}`)) return 'supported'
  return 'unsupported'
}

/**
 * Whether a file's pixel size can be read without decoding it.
 *
 * Only PNG, GIF and BMP carry a plain size; the tool falls back to a canvas
 * for the rest, which is slower but always works.
 */
export function hasHeaderSize(bytes: Uint8Array): boolean {
  return detectFormat(bytes) === 'png' || headerDimensions(bytes) !== null
}
