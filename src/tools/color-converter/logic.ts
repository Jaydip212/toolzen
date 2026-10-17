/**
 * Colour conversion maths for the Colour Converter tool.
 *
 * Everything here is pure and deterministic. Conversions round-trip through
 * RGB, and the WCAG contrast helpers follow the published relative-luminance
 * formula so the accessibility figures are the real ones.
 */

export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Hsl {
  /** Hue in degrees, 0–360. */
  h: number
  /** Saturation as a percentage, 0–100. */
  s: number
  /** Lightness as a percentage, 0–100. */
  l: number
}

export interface Hsv {
  /** Hue in degrees, 0–360. */
  h: number
  /** Saturation as a percentage, 0–100. */
  s: number
  /** Value as a percentage, 0–100. */
  v: number
}

/** A small set of CSS named colours, enough for the common cases. */
export const NAMED_COLORS: Record<string, string> = {
  black: '#000000',
  silver: '#c0c0c0',
  gray: '#808080',
  grey: '#808080',
  white: '#ffffff',
  maroon: '#800000',
  red: '#ff0000',
  purple: '#800080',
  fuchsia: '#ff00ff',
  magenta: '#ff00ff',
  green: '#008000',
  lime: '#00ff00',
  olive: '#808000',
  yellow: '#ffff00',
  navy: '#000080',
  blue: '#0000ff',
  teal: '#008080',
  aqua: '#00ffff',
  cyan: '#00ffff',
  orange: '#ffa500',
  pink: '#ffc0cb',
  brown: '#a52a2a',
  gold: '#ffd700',
  indigo: '#4b0082',
  violet: '#ee82ee',
  tomato: '#ff6347',
  salmon: '#fa8072',
  coral: '#ff7f50',
  crimson: '#dc143c',
  transparent: '#000000',
}

/** Clamp a value into an inclusive range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Round to a whole number of channel steps. */
function roundChannel(value: number): number {
  return clamp(Math.round(value), 0, 255)
}

/** Wrap a hue into [0, 360). */
export function normalizeHue(hue: number): number {
  if (!Number.isFinite(hue)) return 0
  const wrapped = hue % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

/* -------------------------------------------------------------------------- */
/* Parsing                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Parse a CSS colour into RGB.
 * Accepts `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`/`rgba()`,
 * `hsl()`/`hsla()`, and CSS named colours. Returns `null` for anything else.
 */
export function parseColor(input: string): Rgb | null {
  const text = input.trim().toLowerCase()
  if (text === '') return null

  if (text in NAMED_COLORS) return hexToRgb(NAMED_COLORS[text])

  if (text.startsWith('#')) return hexToRgb(text)

  const rgbMatch = /^rgba?\(\s*([^)]+)\)$/.exec(text)
  if (rgbMatch) {
    const parts = rgbMatch[1].split(/[\s,/]+/).filter((part) => part !== '')
    if (parts.length < 3) return null
    const channels = parts.slice(0, 3).map(parseChannel)
    if (channels.some((value) => value === null)) return null
    return { r: channels[0] as number, g: channels[1] as number, b: channels[2] as number }
  }

  const hslMatch = /^hsla?\(\s*([^)]+)\)$/.exec(text)
  if (hslMatch) {
    const parts = hslMatch[1].split(/[\s,/]+/).filter((part) => part !== '')
    if (parts.length < 3) return null
    const hue = Number.parseFloat(parts[0].replace('deg', ''))
    const sat = Number.parseFloat(parts[1])
    const light = Number.parseFloat(parts[2])
    if (![hue, sat, light].every(Number.isFinite)) return null
    return hslToRgb({ h: hue, s: sat, l: light })
  }

  return null
}

/** Parse one rgb() channel, which may be a percentage. */
function parseChannel(value: string): number | null {
  if (value.endsWith('%')) {
    const percent = Number.parseFloat(value)
    if (!Number.isFinite(percent)) return null
    return roundChannel((percent / 100) * 255)
  }
  const number = Number.parseFloat(value)
  if (!Number.isFinite(number)) return null
  return roundChannel(number)
}

/* -------------------------------------------------------------------------- */
/* Hex                                                                        */
/* -------------------------------------------------------------------------- */

/** Parse a hex colour into RGB. Supports 3, 4, 6 and 8 digit forms. */
export function hexToRgb(hex: string): Rgb | null {
  let value = hex.trim().replace(/^#/, '')

  if (!/^[0-9a-fA-F]+$/.test(value)) return null

  if (value.length === 3 || value.length === 4) {
    value = value
      .slice(0, 3)
      .split('')
      .map((char) => char + char)
      .join('')
  } else if (value.length === 6 || value.length === 8) {
    value = value.slice(0, 6)
  } else {
    return null
  }

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  }
}

/** Format RGB as `#rrggbb`. */
export function rgbToHex(rgb: Rgb): string {
  const part = (channel: number) => roundChannel(channel).toString(16).padStart(2, '0')
  return `#${part(rgb.r)}${part(rgb.g)}${part(rgb.b)}`
}

/** Format RGB as `#rgb` when every channel repeats, otherwise `#rrggbb`. */
export function rgbToShortHex(rgb: Rgb): string {
  const full = rgbToHex(rgb)
  const [r1, r2, g1, g2, b1, b2] = full.slice(1)
  if (r1 === r2 && g1 === g2 && b1 === b2) return `#${r1}${g1}${b1}`
  return full
}

/* -------------------------------------------------------------------------- */
/* HSL                                                                        */
/* -------------------------------------------------------------------------- */

/** Convert RGB to HSL. */
export function rgbToHsl(rgb: Rgb): Hsl {
  const r = roundChannel(rgb.r) / 255
  const g = roundChannel(rgb.g) / 255
  const b = roundChannel(rgb.b) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const lightness = (max + min) / 2

  let hue = 0
  let saturation = 0

  if (delta !== 0) {
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
    if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0)
    else if (max === g) hue = (b - r) / delta + 2
    else hue = (r - g) / delta + 4
    hue *= 60
  }

  return {
    h: Math.round(normalizeHue(hue)),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  }
}

/** Convert HSL to RGB. */
export function hslToRgb(hsl: Hsl): Rgb {
  const hue = normalizeHue(hsl.h)
  const saturation = clamp(hsl.s, 0, 100) / 100
  const lightness = clamp(hsl.l, 0, 100) / 100

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const secondary = chroma * (1 - Math.abs(((hue / 60) % 2) - 1))
  const offset = lightness - chroma / 2

  let r = 0
  let g = 0
  let b = 0

  if (hue < 60) [r, g, b] = [chroma, secondary, 0]
  else if (hue < 120) [r, g, b] = [secondary, chroma, 0]
  else if (hue < 180) [r, g, b] = [0, chroma, secondary]
  else if (hue < 240) [r, g, b] = [0, secondary, chroma]
  else if (hue < 300) [r, g, b] = [secondary, 0, chroma]
  else [r, g, b] = [chroma, 0, secondary]

  return {
    r: roundChannel((r + offset) * 255),
    g: roundChannel((g + offset) * 255),
    b: roundChannel((b + offset) * 255),
  }
}

/** Format HSL as a CSS `hsl(…)` string. */
export function formatHsl(hsl: Hsl): string {
  return `hsl(${Math.round(normalizeHue(hsl.h))}, ${Math.round(clamp(hsl.s, 0, 100))}%, ${Math.round(clamp(hsl.l, 0, 100))}%)`
}

/* -------------------------------------------------------------------------- */
/* HSV / HSB                                                                  */
/* -------------------------------------------------------------------------- */

/** Convert RGB to HSV (also known as HSB). */
export function rgbToHsv(rgb: Rgb): Hsv {
  const r = roundChannel(rgb.r) / 255
  const g = roundChannel(rgb.g) / 255
  const b = roundChannel(rgb.b) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let hue = 0
  if (delta !== 0) {
    if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0)
    else if (max === g) hue = (b - r) / delta + 2
    else hue = (r - g) / delta + 4
    hue *= 60
  }

  return {
    h: Math.round(normalizeHue(hue)),
    s: Math.round(max === 0 ? 0 : (delta / max) * 100),
    v: Math.round(max * 100),
  }
}

/** Convert HSV to RGB. */
export function hsvToRgb(hsv: Hsv): Rgb {
  const hue = normalizeHue(hsv.h)
  const saturation = clamp(hsv.s, 0, 100) / 100
  const value = clamp(hsv.v, 0, 100) / 100

  const chroma = value * saturation
  const secondary = chroma * (1 - Math.abs(((hue / 60) % 2) - 1))
  const offset = value - chroma

  let r = 0
  let g = 0
  let b = 0

  if (hue < 60) [r, g, b] = [chroma, secondary, 0]
  else if (hue < 120) [r, g, b] = [secondary, chroma, 0]
  else if (hue < 180) [r, g, b] = [0, chroma, secondary]
  else if (hue < 240) [r, g, b] = [0, secondary, chroma]
  else if (hue < 300) [r, g, b] = [secondary, 0, chroma]
  else [r, g, b] = [chroma, 0, secondary]

  return {
    r: roundChannel((r + offset) * 255),
    g: roundChannel((g + offset) * 255),
    b: roundChannel((b + offset) * 255),
  }
}

/* -------------------------------------------------------------------------- */
/* CSS output                                                                 */
/* -------------------------------------------------------------------------- */

/** Format RGB as a CSS `rgb(…)` string. */
export function formatRgb(rgb: Rgb): string {
  return `rgb(${roundChannel(rgb.r)}, ${roundChannel(rgb.g)}, ${roundChannel(rgb.b)})`
}

/** Format RGB plus alpha as a CSS `rgba(…)` string. */
export function formatRgba(rgb: Rgb, alpha: number): string {
  const a = clamp(alpha, 0, 1)
  return `rgba(${roundChannel(rgb.r)}, ${roundChannel(rgb.g)}, ${roundChannel(rgb.b)}, ${Number(a.toFixed(3))})`
}

/* -------------------------------------------------------------------------- */
/* Accessibility                                                              */
/* -------------------------------------------------------------------------- */

/** WCAG relative luminance of an sRGB colour. */
export function relativeLuminance(rgb: Rgb): number {
  const channel = (value: number) => {
    const scaled = roundChannel(value) / 255
    return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
}

/** WCAG contrast ratio between two colours, from 1 to 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Black or white, whichever contrasts better against `background`. */
export function bestTextColor(background: Rgb): string {
  return contrastRatio(background, { r: 0, g: 0, b: 0 }) >=
    contrastRatio(background, { r: 255, g: 255, b: 255 })
    ? '#000000'
    : '#ffffff'
}

/** The WCAG 2.1 pass levels for a contrast ratio. */
export interface ContrastVerdict {
  /** AA for normal text (4.5:1). */
  aa: boolean
  /** AA for large text (3:1). */
  aaLarge: boolean
  /** AAA for normal text (7:1). */
  aaa: boolean
  /** AAA for large text (4.5:1). */
  aaaLarge: boolean
}

/** Evaluate a contrast ratio against the WCAG 2.1 thresholds. */
export function contrastVerdict(ratio: number): ContrastVerdict {
  return {
    aa: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaa: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  }
}

/** Build a lighter/darker variant by moving lightness by `amount` percent. */
export function adjustLightness(rgb: Rgb, amount: number): Rgb {
  const hsl = rgbToHsl(rgb)
  return hslToRgb({ ...hsl, l: clamp(hsl.l + amount, 0, 100) })
}
