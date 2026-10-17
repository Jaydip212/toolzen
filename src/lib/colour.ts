/**
 * Colour maths shared by the image tools.
 *
 * Everything here is pure so it can be tested without a canvas.
 */

export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Hsl {
  h: number
  s: number
  l: number
}

/** Clamp to a byte and drop any fractional part. */
function toByte(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(255, Math.round(value)))
}

/** Clamp to a percentage in 0–100. */
function toPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

/** `#abc` / `#aabbcc` / `#aabbccdd` / `aabbcc` to RGB, or null if unreadable. */
export function parseHex(input: string): Rgb | null {
  const hex = input.trim().replace(/^#/, '')
  if (!/^[0-9a-f]{3,8}$/i.test(hex)) return null

  const expand = (chunk: string): number => parseInt(chunk.length === 1 ? chunk + chunk : chunk, 16)

  if (hex.length === 3 || hex.length === 4) {
    return { r: expand(hex[0]), g: expand(hex[1]), b: expand(hex[2]) }
  }
  if (hex.length === 6 || hex.length === 8) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    }
  }
  return null
}

/** The two-digit hex form, always with a leading `#`. */
export function toHex({ r, g, b }: Rgb): string {
  const pair = (value: number) => toByte(value).toString(16).padStart(2, '0')
  return `#${pair(r)}${pair(g)}${pair(b)}`
}

/** Uppercase hex, which is what design hand-offs usually ask for. */
export function toHexUpper(rgb: Rgb): string {
  return toHex(rgb).toUpperCase()
}

/** `rgb(255, 0, 128)` / `rgba(255, 0, 128, .5)` to RGB, ignoring the alpha channel. */
export function parseRgbString(input: string): Rgb | null {
  const match = input
    .trim()
    .match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
  if (!match) return null
  const values = [Number(match[1]), Number(match[2]), Number(match[3])]
  if (values.some((value) => !Number.isFinite(value))) return null
  return { r: toByte(values[0]), g: toByte(values[1]), b: toByte(values[2]) }
}

/**
 * Parse either notation. Returns null rather than throwing, so a caller can
 * keep the previous valid value while the user is mid-typing.
 */
export function parseColour(input: string): Rgb | null {
  if (!input.trim()) return null
  return parseHex(input) ?? parseRgbString(input)
}

/** Relative luminance on the 0–1 scale, per WCAG 2.x. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const v = value / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG contrast ratio between two colours, from 1 to 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

export type WcagLevel = 'AAA' | 'AA' | 'AA Large' | 'Fail'

/**
 * The strongest WCAG conformance level a colour pair achieves. 4.5:1 is the
 * normal-text bar; 3:1 is allowed for large text and UI components.
 */
export function wcagLevel(a: Rgb, b: Rgb): WcagLevel {
  const ratio = contrastRatio(a, b)
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA Large'
  return 'Fail'
}

/** Black or white, whichever reads better on this background. */
export function readableTextOn(background: Rgb): Rgb {
  return contrastRatio(background, { r: 0, g: 0, b: 0 }) >=
    contrastRatio(background, { r: 255, g: 255, b: 255 })
    ? { r: 0, g: 0, b: 0 }
    : { r: 255, g: 255, b: 255 }
}

/** Hue in degrees, saturation and lightness in percent. */
export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6
    else if (max === gn) h = (bn - rn) / delta + 2
    else h = (rn - gn) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }

  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  return { h: Math.round(h), s: toPercent(s * 100), l: toPercent(l * 100) }
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const sn = Math.max(0, Math.min(100, s)) / 100
  const ln = Math.max(0, Math.min(100, l)) / 100
  const hue = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = ln - c / 2

  let rgb: [number, number, number]
  if (hue < 60) rgb = [c, x, 0]
  else if (hue < 120) rgb = [x, c, 0]
  else if (hue < 180) rgb = [0, c, x]
  else if (hue < 240) rgb = [0, x, c]
  else if (hue < 300) rgb = [x, 0, c]
  else rgb = [c, 0, x]

  return {
    r: toByte((rgb[0] + m) * 255),
    g: toByte((rgb[1] + m) * 255),
    b: toByte((rgb[2] + m) * 255),
  }
}

/** A CSS `hsl()` string, which keeps hue values above 359 out of the output. */
export function toHslString({ h, s, l }: Hsl): string {
  return `hsl(${((h % 360) + 360) % 360}, ${s}%, ${l}%)`
}

/** A CSS `rgb()` string. */
export function toRgbString({ r, g, b }: Rgb): string {
  return `rgb(${toByte(r)}, ${toByte(g)}, ${toByte(b)})`
}

/**
 * The nearest CSS named colour from a small, deliberately short list. Long
 * lists produce confidently wrong answers like "maroon" for dark grey, so the
 * palette is limited to buckets a human would actually agree with.
 */
const NAMED_COLOURS: Array<{ name: string; hex: string }> = [
  { name: 'black', hex: '#000000' },
  { name: 'white', hex: '#ffffff' },
  { name: 'red', hex: '#ff0000' },
  { name: 'lime', hex: '#00ff00' },
  { name: 'blue', hex: '#0000ff' },
  { name: 'yellow', hex: '#ffff00' },
  { name: 'cyan', hex: '#00ffff' },
  { name: 'magenta', hex: '#ff00ff' },
  { name: 'silver', hex: '#c0c0c0' },
  { name: 'grey', hex: '#808080' },
  { name: 'maroon', hex: '#800000' },
  { name: 'olive', hex: '#808000' },
  { name: 'green', hex: '#008000' },
  { name: 'purple', hex: '#800080' },
  { name: 'teal', hex: '#008080' },
  { name: 'navy', hex: '#000080' },
  { name: 'orange', hex: '#ffa500' },
]

export function nearestNamedColour(rgb: Rgb): string {
  let best = NAMED_COLOURS[0]
  let bestDistance = Number.POSITIVE_INFINITY
  for (const candidate of NAMED_COLOURS) {
    const parsed = parseHex(candidate.hex)
    if (!parsed) continue
    // Redmean weighting — plain RGB distance calls mid-greens "blue".
    const rMean = (rgb.r + parsed.r) / 2
    const dr = rgb.r - parsed.r
    const dg = rgb.g - parsed.g
    const db = rgb.b - parsed.b
    const distance =
      (2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db
    if (distance < bestDistance) {
      bestDistance = distance
      best = candidate
    }
  }
  return best.name
}

/** Average colour of a raw RGBA or RGB pixel buffer. */
export function averageColour(pixels: Uint8ClampedArray | Uint8Array): Rgb {
  let r = 0
  let g = 0
  let b = 0
  let count = 0
  const step = pixels.length % 4 === 0 ? 4 : 3
  for (let i = 0; i < pixels.length; i += step) {
    r += pixels[i]
    g += pixels[i + 1]
    b += pixels[i + 2]
    count += 1
  }
  if (count === 0) return { r: 0, g: 0, b: 0 }
  return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) }
}

export interface Swatch {
  hex: string
  rgb: Rgb
  /** How many pixels fell into this bucket, over the buffer's alpha-aware pixels. */
  count: number
  /** 0–100 share of all counted pixels. */
  share: number
}

/**
 * Quantise a raw RGBA pixel buffer into a palette.
 *
 * Two colours land in the same bucket when every channel is within
 * `tolerance`, which is what keeps a photograph's 256 near-identical greens
 * from becoming 256 swatches. Pixels whose alpha is below `alphaThreshold`
 * are skipped entirely, so a transparent PNG reports its visible colours.
 */
export function extractPalette(
  pixels: Uint8ClampedArray | Uint8Array,
  options: { tolerance?: number; alphaThreshold?: number; maxColours?: number } = {},
): Swatch[] {
  const tolerance = options.tolerance ?? 16
  const alphaThreshold = options.alphaThreshold ?? 16
  const maxColours = options.maxColours ?? 12

  const buckets: Array<{ rgb: Rgb; count: number }> = []
  let total = 0

  const step = pixels.length % 4 === 0 ? 4 : 3
  const hasAlpha = step === 4

  for (let i = 0; i < pixels.length; i += step) {
    if (hasAlpha && pixels[i + 3] < alphaThreshold) continue
    const rgb = { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] }
    total += 1

    let bucket = buckets.find(
      (candidate) =>
        Math.abs(candidate.rgb.r - rgb.r) <= tolerance &&
        Math.abs(candidate.rgb.g - rgb.g) <= tolerance &&
        Math.abs(candidate.rgb.b - rgb.b) <= tolerance,
    )
    if (!bucket) {
      if (buckets.length >= 512) {
        // Guard against a pathological buffer; keep the running mean cheap by
        // folding into the first bucket rather than growing without limit.
        bucket = buckets[0]
        bucket.count += 1
        bucket.rgb = {
          r: Math.round((bucket.rgb.r * (bucket.count - 1) + rgb.r) / bucket.count),
          g: Math.round((bucket.rgb.g * (bucket.count - 1) + rgb.g) / bucket.count),
          b: Math.round((bucket.rgb.b * (bucket.count - 1) + rgb.b) / bucket.count),
        }
        continue
      }
      bucket = { rgb, count: 1 }
      buckets.push(bucket)
    } else {
      bucket.count += 1
      bucket.rgb = {
        r: Math.round((bucket.rgb.r * (bucket.count - 1) + rgb.r) / bucket.count),
        g: Math.round((bucket.rgb.g * (bucket.count - 1) + rgb.g) / bucket.count),
        b: Math.round((bucket.rgb.b * (bucket.count - 1) + rgb.b) / bucket.count),
      }
    }
  }

  return buckets
    .sort((a, b) => b.count - a.count)
    .slice(0, maxColours)
    .map((bucket) => ({
      hex: toHex(bucket.rgb),
      rgb: bucket.rgb,
      count: bucket.count,
      share: total === 0 ? 0 : Math.round((bucket.count / total) * 1000) / 10,
    }))
}

/** Lightness words used in the palette read-out. */
export function describeLightness({ l }: Hsl): string {
  if (l >= 95) return 'nearly white'
  if (l >= 80) return 'very light'
  if (l >= 60) return 'light'
  if (l >= 40) return 'mid'
  if (l >= 20) return 'dark'
  return 'nearly black'
}

/** Saturation words, for the same read-out. */
export function describeSaturation({ s }: Hsl): string {
  if (s < 8) return 'neutral'
  if (s < 30) return 'subtle'
  if (s < 60) return 'muted'
  if (s < 85) return 'vivid'
  return 'electric'
}

/** A one-line description such as "a vivid red". */
export function describeColour(rgb: Rgb): string {
  const hsl = rgbToHsl(rgb)
  const saturation = describeSaturation(hsl)
  const lightness = describeLightness(hsl)

  if (saturation === 'neutral') return lightness === 'mid' ? 'grey' : `a ${lightness} grey`
  const hueName = hueNameOf(hsl.h)
  if (lightness === 'nearly white') return `a pale ${hueName}`
  if (lightness === 'very light' || lightness === 'light') return `a light ${hueName}`
  if (lightness === 'nearly black') return `a very dark ${hueName}`
  if (lightness === 'dark') return `a dark ${hueName}`
  // A mid-lightness colour is named for its saturation instead.
  if (saturation === 'subtle') return `a soft ${hueName}`
  return `a ${saturation} ${hueName}`
}

/** The twelve hue buckets, named. */
export function hueNameOf(hue: number): string {
  const h = ((hue % 360) + 360) % 360
  if (h < 15 || h >= 345) return 'red'
  if (h < 40) return 'orange'
  if (h < 65) return 'yellow'
  if (h < 90) return 'lime'
  if (h < 150) return 'green'
  if (h < 175) return 'teal'
  if (h < 195) return 'cyan'
  if (h < 215) return 'azure'
  if (h < 260) return 'blue'
  if (h < 290) return 'violet'
  if (h < 330) return 'magenta'
  return 'pink'
}

/** The number of distinct colours in a buffer, capped at `limit`. */
export function countDistinctColours(pixels: Uint8ClampedArray | Uint8Array, limit = 100_000): number {
  const step = pixels.length % 4 === 0 ? 4 : 3
  const hasAlpha = step === 4
  const seen = new Set<number>()
  for (let i = 0; i < pixels.length; i += step) {
    if (hasAlpha && pixels[i + 3] === 0) continue
    seen.add((pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2])
    if (seen.size >= limit) return seen.size
  }
  return seen.size
}
