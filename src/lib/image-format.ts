/**
 * Image format identification, EXIF reading and file naming.
 *
 * All of it works on raw bytes, so it runs in a worker or in tests with no
 * browser at all.
 */

export type ImageFormat = 'png' | 'jpeg' | 'webp' | 'gif' | 'bmp' | 'avif' | 'svg' | 'tiff' | 'ico' | 'unknown'

export interface FormatInfo {
  format: ImageFormat
  mime: string
  label: string
  /** Whether the browser can natively *encode* this format from a canvas. */
  canEncode: boolean
  /** Whether the format holds transparency. */
  supportsAlpha: boolean
  extension: string
}

const FORMATS: Record<ImageFormat, Omit<FormatInfo, 'format'>> = {
  png: {
    mime: 'image/png',
    label: 'PNG',
    canEncode: true,
    supportsAlpha: true,
    extension: 'png',
  },
  jpeg: {
    mime: 'image/jpeg',
    label: 'JPEG',
    canEncode: true,
    supportsAlpha: false,
    extension: 'jpg',
  },
  webp: {
    mime: 'image/webp',
    label: 'WebP',
    canEncode: true,
    supportsAlpha: true,
    extension: 'webp',
  },
  gif: {
    mime: 'image/gif',
    label: 'GIF',
    canEncode: false,
    supportsAlpha: true,
    extension: 'gif',
  },
  bmp: {
    mime: 'image/bmp',
    label: 'BMP',
    canEncode: false,
    supportsAlpha: false,
    extension: 'bmp',
  },
  avif: {
    mime: 'image/avif',
    label: 'AVIF',
    canEncode: false,
    supportsAlpha: true,
    extension: 'avif',
  },
  svg: {
    mime: 'image/svg+xml',
    label: 'SVG',
    canEncode: false,
    supportsAlpha: true,
    extension: 'svg',
  },
  tiff: {
    mime: 'image/tiff',
    label: 'TIFF',
    canEncode: false,
    supportsAlpha: true,
    extension: 'tif',
  },
  ico: {
    mime: 'image/x-icon',
    label: 'ICO',
    canEncode: false,
    supportsAlpha: true,
    extension: 'ico',
  },
  unknown: {
    mime: 'application/octet-stream',
    label: 'Unknown',
    canEncode: false,
    supportsAlpha: false,
    extension: 'bin',
  },
}

/** Everything the UI needs to know about a format. */
export function formatInfo(format: ImageFormat): FormatInfo {
  return { format, ...FORMATS[format] }
}

/** All formats the tool knows how to describe, in display order. */
export const KNOWN_FORMATS: ImageFormat[] = [
  'png',
  'jpeg',
  'webp',
  'gif',
  'bmp',
  'avif',
  'svg',
  'tiff',
  'ico',
]

/** Formats a canvas can actually write, which is what the converter offers. */
export const ENCODABLE_FORMATS: ImageFormat[] = ['png', 'jpeg', 'webp']

/** The four leading bytes of an ASCII string, as a comparable number. */
function tag(bytes: Uint8Array, offset: number, text: string): boolean {
  if (offset + text.length > bytes.length) return false
  for (let i = 0; i < text.length; i += 1) {
    if (bytes[offset + i] !== text.charCodeAt(i)) return false
  }
  return true
}

function u16(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1]
}

function u32(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  )
}

/** `RIFF` container length, used to validate a WebP header. */
function riffHasWebp(bytes: Uint8Array): boolean {
  return tag(bytes, 0, 'RIFF') && tag(bytes, 8, 'WEBP') && u32(bytes, 4) >= 12
}

/**
 * Identify an image from its leading bytes.
 *
 * The extension the user's file carries is deliberately ignored — a JPEG named
 * `photo.png` is still a JPEG, and the tool should not silently mislabel it.
 */
export function detectFormat(bytes: Uint8Array): ImageFormat {
  if (bytes.length < 12) {
    if (bytes.length >= 4) {
      // GIF and BMP both need only a short header.
      if (tag(bytes, 0, 'GIF8')) return 'gif'
      if (tag(bytes, 0, 'BM')) return 'bmp'
      if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'jpeg'
    }
    return 'unknown'
  }

  // PNG
  if (tag(bytes, 1, 'PNG')) return 'png'

  // JPEG (raw, and inside an MPO/EXIF-wrapped stream)
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg'

  // GIF
  if (tag(bytes, 0, 'GIF87a') || tag(bytes, 0, 'GIF89a')) return 'gif'

  // BMP
  if (tag(bytes, 0, 'BM')) return 'bmp'

  // WebP, validated against its RIFF container
  if (riffHasWebp(bytes)) return 'webp'

  // AVIF and HEIF share the ISO-BMFF box layout
  if (tag(bytes, 4, 'ftyp')) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11])
    if (brand.startsWith('avif') || brand.startsWith('avis')) return 'avif'
    if (brand.startsWith('heic') || brand.startsWith('heix') || brand.startsWith('mif1')) {
      return 'avif'
    }
  }

  // TIFF, both byte orders
  if ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
      (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a)) {
    return 'tiff'
  }

  // Windows icon
  if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) return 'ico'

  // SVG: an XML declaration or a root element, decoded as text.
  if (bytes[0] === 0x3c) {
    const head = new TextDecoder('utf-8', { fatal: false }).decode(bytes.subarray(0, 512))
    if (/<svg[\s>]/.test(head) || (/<\?xml/.test(head) && /<svg[\s>]/.test(head))) return 'svg'
  }

  return 'unknown'
}

/**
 * Describe a mismatch between the extension and the real format.
 *
 * Returns null when they agree, which is the common case and keeps the UI quiet.
 */
export function describeFormatMismatch(bytes: Uint8Array, filename: string): string | null {
  const detected = detectFormat(bytes)
  if (detected === 'unknown') return null

  const actualExtension = FORMATS[detected].extension
  const declared = extensionOf(filename)

  if (!declared) return null
  if (declared === actualExtension) return null
  // jpeg/jpg are the same thing under two names.
  if (detected === 'jpeg' && declared === 'jpeg') return null

  return `This file is really a ${FORMATS[detected].label} image, but it is named .${declared}. The tool uses what the bytes say, not the name.`
}

/** The lower-case extension of a filename, without the dot. */
export function extensionOf(filename: string): string {
  const match = filename.trim().toLowerCase().match(/\.([a-z0-9]{1,5})$/)
  return match ? match[1] : ''
}

/** A filename with its extension swapped. */
export function withExtension(filename: string, extension: string): string {
  const base = filename.trim().replace(/\.[^.]+$/, '')
  const clean = extension.replace(/^\./, '').toLowerCase()
  return base ? `${base}.${clean}` : `image.${clean}`
}

/** The stem of a filename, for building sibling outputs. */
export function baseNameOf(filename: string): string {
  const name = filename.trim().split(/[\\/]/).pop() ?? ''
  return name.replace(/\.[^.]+$/, '')
}

/** A suggested output name, appending a suffix before the extension. */
export function suggestName(filename: string, suffix: string, extension?: string): string {
  const base = baseNameOf(filename) || 'image'
  const originalExtension = extensionOf(filename)
  const next = extension ?? originalExtension
  return `${base}-${suffix}${next ? `.${next}` : ''}`
}

/** PNG's IHDR chunk carries the pixel size at a fixed offset. */
export function pngDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (tag(bytes, 1, 'PNG') && bytes.length >= 24) {
    return { width: u32(bytes, 16), height: u32(bytes, 20) }
  }
  return null
}

/** The minimum GIF header is six bytes plus a logical screen descriptor. */
export function gifDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (!tag(bytes, 0, 'GIF8') || bytes.length < 10) return null
  return { width: bytes[6] | (bytes[7] << 8), height: bytes[8] | (bytes[9] << 8) }
}

/** BMP's `DIB` header holds a signed width and height. */
export function bmpDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (!tag(bytes, 0, 'BM') || bytes.length < 26) return null
  const width = bytes[18] | (bytes[19] << 8) | (bytes[20] << 16) | (bytes[21] << 24)
  const height = bytes[22] | (bytes[23] << 8) | (bytes[24] << 16) | (bytes[25] << 24)
  return { width: Math.abs(width), height: Math.abs(height) }
}

/**
 * Dimensions straight from the header, without decoding the picture.
 *
 * Only the formats whose headers carry a plain size are supported; JPEG and
 * WebP need their segment tables walked, and callers fall back to a canvas.
 */
export function headerDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  return pngDimensions(bytes) ?? gifDimensions(bytes) ?? bmpDimensions(bytes)
}

/** JPEG's dimension segment parser. */
export function jpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8)) return null
  let offset = 2
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }
    const marker = bytes[offset + 1]
    // Standalone markers carry no length.
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      offset += 2
      continue
    }
    const length = u16(bytes, offset + 2)
    // SOF0–SOF15, except the progressive-only and arithmetic-only variants,
    // all carry height then width.
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      return {
        height: u16(bytes, offset + 5),
        width: u16(bytes, offset + 7),
      }
    }
    if (length < 2) break
    offset += 2 + length
  }
  return null
}

/** The union of the header and JPEG paths, used by the metadata viewer. */
export function sniffDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  return headerDimensions(bytes) ?? jpegDimensions(bytes)
}

/* ------------------------------------------------------------------ */
/* EXIF                                                                */
/* ------------------------------------------------------------------ */

export interface ExifField {
  key: string
  label: string
  value: string
}

export interface ExifData {
  /** Every tag the reader could make sense of, in tag-number order. */
  fields: ExifField[]
  /** The EXIF orientation, translated into words. */
  orientation?: string
  camera?: string
  lens?: string
  takenAt?: string
  exposure?: string
  gps?: { latitude: number; longitude: number } | null
  /** True when a GPS block was present but could not be deciphered. */
  hasGps: boolean
}

const EXIF_LABELS: Record<number, string> = {
  0x010f: 'Camera make',
  0x0110: 'Camera model',
  0x0112: 'Orientation',
  0x011a: 'X resolution',
  0x0131: 'Software',
  0x0132: 'Date taken',
  0x013b: 'Artist',
  0x8298: 'Copyright',
  0x8769: 'Exif IFD offset',
  0x8825: 'GPS IFD offset',
  0x829a: 'Exposure time',
  0x829d: 'F-number',
  0x8827: 'ISO speed',
  0x9000: 'Exif version',
  0x9003: 'Date taken (original)',
  0x9201: 'Shutter speed',
  0x9202: 'Aperture',
  0x920a: 'Focal length',
  0xa405: 'Lens model',
  0xa433: 'Lens make',
  0x9286: 'User comment',
}

const ORIENTATIONS: Record<number, string> = {
  1: 'Top-left (normal)',
  2: 'Top-right (mirrored)',
  3: 'Bottom-right (upside down)',
  4: 'Bottom-left (mirrored, upside down)',
  5: 'Left-top (mirrored, rotated 90° CW)',
  6: 'Right-top (rotated 90° CCW)',
  7: 'Right-bottom (mirrored, rotated 90° CCW)',
  8: 'Left-bottom (rotated 90° CW)',
}

/**
 * Walk a JPEG's APP1 segment and pull out the EXIF block.
 *
 * Returns an empty result rather than throwing for a picture with no EXIF,
 * because that is the common case and says something worth reporting.
 */
/**
 * Walk a JPEG's APP1 segment and pull out the EXIF block.
 *
 * Returns an empty result rather than throwing for a picture with no EXIF,
 * because that is the common case and says something worth reporting.
 */
export function readExif(bytes: Uint8Array): ExifData {
  const result: ExifData = { fields: [], hasGps: false, gps: null }
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8)) return result

  let exifStart = -1
  let offset = 2

  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }
    const marker = bytes[offset + 1]
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      offset += 2
      continue
    }
    if (marker === 0xda || marker === 0xd9) break
    const length = u16(bytes, offset + 2)
    const dataStart = offset + 4
    if (marker === 0xe1 && tag(bytes, dataStart, 'Exif\0\0')) {
      exifStart = dataStart + 6
      break
    }
    if (length < 2) break
    offset += 2 + length
  }

  if (exifStart < 0 || exifStart + 8 > bytes.length) return result

  const bigEndian = bytes[exifStart] === 0x4d && bytes[exifStart + 1] === 0x4d
  const littleEndian = bytes[exifStart] === 0x49 && bytes[exifStart + 1] === 0x49
  if (!bigEndian && !littleEndian) return result

  const read16 = (at: number): number =>
    littleEndian ? (bytes[at] | (bytes[at + 1] << 8)) & 0xffff : (bytes[at] << 8) | bytes[at + 1]
  const read32 = (at: number): number =>
    littleEndian
      ? (bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16) | (bytes[at + 3] << 24)) >>> 0
      : u32(bytes, at)

  const ifdOffset = read32(exifStart + 4)
  if (ifdOffset <= 0 || exifStart + ifdOffset + 2 > bytes.length) return result

  const valueSizeOf = (type: number): number => {
    switch (type) {
      case 1:
      case 2:
      case 6:
      case 7:
        return 1
      case 3:
      case 8:
        return 2
      case 4:
      case 9:
      case 11:
        return 4
      case 5:
      case 10:
      case 12:
        return 8
      default:
        return 1
    }
  }

  interface Entry {
    tag: number
    type: number
    count: number
    /** The offset field of the entry, which doubles as the value itself when short. */
    valueOffset: number
    /** Absolute offset of the entry's own 12 bytes, needed for inline values. */
    entryAt: number
  }

  /**
   * Resolve one entry. Values of four bytes or fewer are stored inline in the
   * value-offset field itself, so `entryAt + 8` doubles as their data address.
   */
  const readEntryValue = (entry: Entry): string | null => {
    const size = valueSizeOf(entry.type)
    const total = size * entry.count
    if (total === 0 || total > 1_000_000) return null

    const dataStart = total <= 4 ? entry.entryAt + 8 : exifStart + entry.valueOffset
    if (dataStart < 0 || dataStart + total > bytes.length) return null

    if (entry.type === 2) {
      return new TextDecoder('utf-8', { fatal: false })
        .decode(bytes.subarray(dataStart, dataStart + Math.min(entry.count, total)))
        .replace(/\0.*$/, '')
        .trim()
    }

    if (entry.type === 3 || entry.type === 4) {
      const step = size
      const limit = Math.min(entry.count, 16)
      const values: number[] = []
      for (let i = 0; i < limit; i += 1) {
        const at = dataStart + i * step
        values.push(entry.type === 3 ? read16(at) : read32(at))
      }
      return values.join(', ')
    }

    if (entry.type === 5) {
      const numerator = read32(dataStart)
      const denominator = read32(dataStart + 4)
      if (denominator === 0) return null
      return String(Math.round((numerator / denominator) * 10000) / 10000)
    }

    return null
  }

  /** Read one IFD, following the sub-IFD pointers that matter. */
  const readIfd = (ifdAt: number, depth: number): void => {
    if (depth > 2 || ifdAt + 2 > bytes.length) return
    const count = read16(ifdAt)
    if (count > 512) return

    for (let i = 0; i < count; i += 1) {
      const entryAt = ifdAt + 2 + i * 12
      if (entryAt + 12 > bytes.length) return
      const entry: Entry = {
        tag: read16(entryAt),
        type: read16(entryAt + 2),
        count: read32(entryAt + 4),
        valueOffset: read32(entryAt + 8),
        entryAt,
      }

      const label = EXIF_LABELS[entry.tag]
      if (entry.tag === 0x8825) result.hasGps = true

      const value = readEntryValue(entry)
      if (value === null || value === '') continue

      const key = `0x${entry.tag.toString(16).padStart(4, '0')}`
      if (label && !result.fields.some((field) => field.key === key)) {
        result.fields.push({ key, label, value })
      }
      if (entry.tag === 0x0110) result.camera = value
      if (entry.tag === 0x0112) result.orientation = ORIENTATIONS[Number(value)] ?? value
      if (entry.tag === 0xa405) result.lens = value
      if (entry.tag === 0x0132 || entry.tag === 0x9003) result.takenAt ??= value
      if (entry.tag === 0x829a) result.exposure = value

      if ((entry.tag === 0x8769 || entry.tag === 0x8825) && entry.type === 4 && depth < 2) {
        const next = read32(entryAt + 8)
        if (next > 0 && exifStart + next + 2 <= bytes.length) {
          readIfd(exifStart + next, depth + 1)
        }
      }
    }
  }

  readIfd(exifStart + ifdOffset, 0)
  return result
}

/**
 * The orientation the picture needs, expressed as a rotation plus flips.
 * Browsers ignore this tag by default, which is why phones take "sideways" photos.
 */
export function exifTransform(
  orientation: number | undefined,
): { rotation: 0 | 90 | 180 | 270; flipX: boolean; flipY: boolean } {
  switch (orientation) {
    case 2:
      return { rotation: 0, flipX: true, flipY: false }
    case 3:
      return { rotation: 180, flipX: false, flipY: false }
    case 4:
      return { rotation: 180, flipX: true, flipY: false }
    case 5:
      return { rotation: 90, flipX: true, flipY: false }
    case 6:
      return { rotation: 90, flipX: false, flipY: false }
    case 7:
      return { rotation: 270, flipX: true, flipY: false }
    case 8:
      return { rotation: 270, flipX: false, flipY: false }
    default:
      return { rotation: 0, flipX: false, flipY: false }
  }
}

/**
 * Merge a date and a time into an ISO-ish timestamp.
 * EXIF stores them separately, often as `2024:03:07` and `14:22:31`.
 */
export function combineExifDateTime(date?: string, time?: string): string | null {
  if (!date) return null
  const cleanedDate = date.replace(/^(\d{4}):(\d{2}):(\d{2})$/, '$1-$2-$3')
  const cleanedTime = (time ?? '00:00:00').replace(/^(\d{2}):(\d{2})$/, '$1:$2:00')
  const parsed = new Date(`${cleanedDate}T${cleanedTime}`)
  if (Number.isNaN(parsed.getTime())) return null
  // EXIF timestamps carry no timezone, so report the wall-clock reading
  // rather than silently offsetting it into UTC.
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(
    parsed.getHours(),
  )}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`
}

/** True when a GPS IFD pointer was present but unreadable. */
export function gpsPresenceNote(data: ExifData): string | null {
  if (!data.hasGps) return null
  if (data.gps) return null
  return 'This photo carries a GPS tag, but the tool could not read its coordinates.'
}
