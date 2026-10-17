/**
 * Pixel dimension reading and reporting.
 */

import { aspectRatioLabel, describeRatio } from '@/lib/image-geometry'
import { detectFormat, headerDimensions, jpegDimensions } from '@/lib/image-format'

export interface DimensionReport {
  width: number
  height: number
  megapixels: number
  ratio: string
  description: string
  /** How the size was obtained, so the user knows how much to trust it. */
  source: 'header' | 'decoded' | 'unknown'
}

/** Read the size from a file's bytes without decoding the whole thing. */
export function reportFromBytes(bytes: Uint8Array): DimensionReport | null {
  // The header covers PNG/GIF/BMP; a JPEG needs its segments walked.
  const header = headerDimensions(bytes) ?? jpegDimensions(bytes)
  if (!header) return null
  return build(header, 'header')
}

/** Read the size after the browser has decoded the image. */
export function reportFromDecoded(size: { width: number; height: number }): DimensionReport {
  return build(size, 'decoded')
}

function build(size: { width: number; height: number }, source: DimensionReport['source']): DimensionReport {
  const width = Math.round(size.width)
  const height = Math.round(size.height)
  return {
    width,
    height,
    megapixels: Math.round(((width * height) / 1_000_000) * 100) / 100,
    ratio: aspectRatioLabel({ width, height }),
    description: describeRatio({ width, height }),
    source,
  }
}

/** A verdict on whether an image is big enough for a job. */
export function sizeVerdict(size: { width: number; height: number }, job: string): string {
  const probes: Array<{ test: RegExp; min: number; label: string }> = [
    { test: /html|web|website|page|banner/i, min: 1200, label: 'a full-width website image' },
    { test: /thumb|icon|avatar/i, min: 512, label: 'a thumbnail or avatar' },
    { test: /social|facebook|twitter|instagram|og|card/i, min: 1200, label: 'a social card' },
    { test: /print|poster|a4|letter/i, min: 2400, label: 'a printed page' },
    { test: /4k|uhd|television|screen/i, min: 3840, label: 'a 4K display' },
  ]

  const probe = probes.find((entry) => entry.test.test(job))
  if (!probe) {
    return `No benchmark matches "${job}", so the tool reports the raw size rather than judging it: ${size.width} × ${size.height}.`
  }
  const longEdge = Math.max(size.width, size.height)
  if (longEdge >= probe.min) {
    return `${size.width} × ${size.height} is large enough for ${probe.label} (${probe.min} pixels on the long edge).`
  }
  return `${size.width} × ${size.height} is smaller than ${probe.label} needs, which is ${probe.min} pixels on the long edge. It will work but may look soft.`
}

/** The file-size-to-pixel-density read-out people ask for when printing. */
export function printSize(size: { width: number; height: number }, dpi: number): string {
  if (dpi <= 0) return 'Enter a DPI above zero — 300 is the usual choice for print.'
  const widthInches = size.width / dpi
  const heightInches = size.height / dpi
  return `${widthInches.toFixed(2)} × ${heightInches.toFixed(2)} inches at ${dpi} DPI.`
}

/** Re-export so the UI can sniff a format in one import. */
export { detectFormat, jpegDimensions }
