import { describe, expect, it } from 'vitest'

import {
  ENCODABLE_FORMATS,
  KNOWN_FORMATS,
  baseNameOf,
  combineExifDateTime,
  describeFormatMismatch,
  detectFormat,
  exifTransform,
  extensionOf,
  formatInfo,
  gifDimensions,
  headerDimensions,
  sniffDimensions,
  suggestName,
  withExtension,
} from './image-format'

/** Concatenate byte arrays, which is how the fixtures below are assembled. */
function concat(...parts: Array<number[] | Uint8Array>): Uint8Array {
  const arrays = parts.map((part) => (Array.isArray(part) ? new Uint8Array(part) : part))
  const total = arrays.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(total)
  let at = 0
  for (const part of arrays) {
    out.set(part, at)
    at += part.length
  }
  return out
}

/** An ASCII string as bytes. */
function ascii(text: string): number[] {
  return Array.from(text, (ch) => ch.charCodeAt(0))
}

/** A minimal but structurally valid PNG. */
function pngHeader(width = 1200, height = 800): Uint8Array {
  const ihdr = [
    0x00, 0x00, 0x00, 0x0d, // length
    0x49, 0x48, 0x44, 0x52, // "IHDR"
    (width >>> 24) & 0xff, (width >>> 16) & 0xff, (width >>> 8) & 0xff, width & 0xff,
    (height >>> 24) & 0xff, (height >>> 16) & 0xff, (height >>> 8) & 0xff, height & 0xff,
    0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, colour type, compression, filter, interlace
    0x1f, 0x15, 0xc4, 0x89, // CRC (not validated)
  ]
  return concat([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], ihdr)
}

/** A minimal GIF87a with a logical screen descriptor. */
function gifHeader(width = 640, height = 480): Uint8Array {
  return concat(
    ascii('GIF87a'),
    [width & 0xff, (width >>> 8) & 0xff, height & 0xff, (height >>> 8) & 0xff, 0x80, 0x00, 0x00],
  )
}

/** A 24-bit DIB BMP header. */
function bmpHeader(width = 800, height = 600): Uint8Array {
  const rows = [
    ...ascii('BM'),
    0x36, 0x00, 0x00, 0x00, // file size
    0x00, 0x00, 0x00, 0x00, // reserved
    0x36, 0x00, 0x00, 0x00, // pixel data offset
    0x28, 0x00, 0x00, 0x00, // DIB header size
    width & 0xff, (width >>> 8) & 0xff, (width >>> 16) & 0xff, (width >>> 24) & 0xff,
    height & 0xff, (height >>> 8) & 0xff, (height >>> 16) & 0xff, (height >>> 24) & 0xff,
    0x01, 0x00, // planes
    0x18, 0x00, // bits per pixel
    ...new Array(24).fill(0),
  ]
  return new Uint8Array(rows)
}

/**
 * Build a JPEG carrying an EXIF APP1 segment with the given entries.
 *
 * Entries are `[tag, type, count, valueBytes]`, and if `valueBytes` is longer
 * than four bytes they are placed in a shared heap the entry points at.
 */
function jpegWithExif(entries: Array<[number, number, number, number[]]>): Uint8Array {
  // Figure out which values are inline and which need heap space.
  const heap: number[] = []
  const sizeOf = (type: number, count: number): number => {
    if (type === 2) return count
    if (type === 3) return 2 * count
    if (type === 5 || type === 10 || type === 12) return 8 * count
    return 4 * count
  }
  const built = entries.map(([tag, type, count, value]) => {
    const size = sizeOf(type, count)
    if (size <= 4) {
      // Inline: pad the value into four bytes.
      const inline = [...value, 0, 0, 0, 0].slice(0, 4)
      return { tag, type, count, inline }
    }
    const offset = 8 + heap.length
    heap.push(...value)
    return { tag, type, count, heapOffset: offset }
  })

  const ifdSize = 2 + built.length * 12 + 4
  const ifd: number[] = [
    built.length & 0xff, (built.length >>> 8) & 0xff,
  ]
  for (const entry of built) {
    const size = sizeOf(entry.type, entry.count)
    // The union only narrows through a field that exists on both arms.
    if ('inline' in entry && entry.inline) {
      ifd.push(
        entry.tag & 0xff, (entry.tag >>> 8) & 0xff,
        entry.type & 0xff, (entry.type >>> 8) & 0xff,
        entry.count & 0xff, (entry.count >>> 8) & 0xff, (entry.count >>> 16) & 0xff, (entry.count >>> 24) & 0xff,
        entry.inline[0], entry.inline[1], entry.inline[2], entry.inline[3],
      )
    } else {
      const heapOffset = (entry as { heapOffset: number }).heapOffset + ifdSize
      ifd.push(
        entry.tag & 0xff, (entry.tag >>> 8) & 0xff,
        entry.type & 0xff, (entry.type >>> 8) & 0xff,
        entry.count & 0xff, (entry.count >>> 8) & 0xff, (entry.count >>> 16) & 0xff, (entry.count >>> 24) & 0xff,
        heapOffset & 0xff, (heapOffset >>> 8) & 0xff, (heapOffset >>> 16) & 0xff, (heapOffset >>> 24) & 0xff,
      )
    }
    if (size <= 4) {
      // nothing — the value is inline
    }
  }
  ifd.push(0, 0, 0, 0) // next-IFD pointer: none
  ifd.push(...heap)

  const tiff = concat(
    ascii('II'), [0x2a, 0x00],
    [0x08, 0x00, 0x00, 0x00],
    ifd,
  )
  const app1 = concat(ascii('Exif\0\0'), tiff)

  return concat(
    [0xff, 0xd8, 0xff, 0xe1],
    [(app1.length >>> 8) & 0xff, app1.length & 0xff],
    app1,
    [0xff, 0xda, 0x00, 0x02],
  )
}

describe('formatInfo', () => {
  it('describes each known format', () => {
    expect(KNOWN_FORMATS).toHaveLength(9)
    for (const format of KNOWN_FORMATS) {
      const info = formatInfo(format)
      expect(info.mime).toMatch(/^image\//)
      expect(info.label.length).toBeGreaterThan(0)
      expect(info.extension.length).toBeGreaterThan(0)
    }
  })

  it('names jpg as jpeg, because that is the extension people use', () => {
    // The extension is "jpg" while the format and label are "JPEG".
    expect(formatInfo('jpeg').extension).toBe('jpg')
    expect(formatInfo('jpeg').label).toBe('JPEG')
  })

  it('only offers the formats a canvas can actually write', () => {
    expect(ENCODABLE_FORMATS).toEqual(['png', 'jpeg', 'webp'])
  })

  it('marks JPEG as having no transparency', () => {
    expect(formatInfo('jpeg').supportsAlpha).toBe(false)
    expect(formatInfo('png').supportsAlpha).toBe(true)
  })

  it('falls back to a binary MIME for an unknown format', () => {
    expect(formatInfo('unknown').mime).toBe('application/octet-stream')
  })
})

describe('detectFormat', () => {
  it('reads a PNG signature', () => {
    expect(detectFormat(pngHeader())).toBe('png')
  })

  it('reads a GIF of either vintage', () => {
    expect(detectFormat(new Uint8Array(ascii('GIF87a')))).toBe('gif')
    expect(detectFormat(new Uint8Array(ascii('GIF89a')))).toBe('gif')
  })

  it('reads a BMP', () => {
    expect(detectFormat(bmpHeader())).toBe('bmp')
  })

  it('reads a JPEG', () => {
    expect(detectFormat(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg')
  })

  it('reads a WebP only when its RIFF container checks out', () => {
    expect(detectFormat(concat(ascii('RIFF'), [0x10, 0x00, 0x00, 0x00], ascii('WEBPVP8 ')))).toBe('webp')
  })

  it('rejects a WebP-looking RIFF that is actually something else', () => {
    expect(detectFormat(concat(ascii('RIFF'), [0x10, 0x00, 0x00, 0x00], ascii('WAVEfmt ')))).toBe('unknown')
  })

  it('reads an AVIF brand', () => {
    expect(detectFormat(concat([0, 0, 0, 20], ascii('ftypavif'), [0, 0, 0, 0]))).toBe('avif')
  })

  it('reads a TIFF in both byte orders', () => {
    expect(detectFormat(new Uint8Array([0x49, 0x49, 0x2a, 0x00, 8, 0, 0, 0, 0, 0, 0, 0]))).toBe('tiff')
    expect(detectFormat(new Uint8Array([0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 0, 0, 0]))).toBe('tiff')
  })

  it('reads a Windows icon', () => {
    expect(detectFormat(new Uint8Array([0, 0, 1, 0, 1, 0, 16, 16, 0, 0, 1, 0]))).toBe('ico')
  })

  it('reads an SVG from its root element', () => {
    expect(detectFormat(new Uint8Array(ascii('<svg xmlns="http://www.w3.org/2000/svg"></svg>')))).toBe('svg')
    expect(detectFormat(new Uint8Array(ascii('<?xml version="1.0"?><svg></svg>')))).toBe('svg')
  })

  it('does not call an HTML file an SVG', () => {
    // Both start with "<", so only the root element counts.
    expect(detectFormat(new Uint8Array(ascii('<html><body>hi</body></html>')))).toBe('unknown')
  })

  it('returns unknown for a short or empty buffer rather than throwing', () => {
    expect(detectFormat(new Uint8Array())).toBe('unknown')
    expect(detectFormat(new Uint8Array([0, 0, 0]))).toBe('unknown')
  })
})

describe('describeFormatMismatch', () => {
  it('says nothing when the name agrees with the bytes', () => {
    expect(describeFormatMismatch(pngHeader(), 'photo.png')).toBeNull()
  })

  it('flags a JPEG named as a PNG', () => {
    const note = describeFormatMismatch(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6, 7, 8]), 'photo.png')
    expect(note).toContain('really a JPEG')
    expect(note).toContain('.png')
  })

  it('accepts both jpg and jpeg spellings', () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6, 7, 8])
    expect(describeFormatMismatch(bytes, 'photo.jpg')).toBeNull()
    expect(describeFormatMismatch(bytes, 'photo.jpeg')).toBeNull()
  })

  it('stays quiet when the bytes are unreadable', () => {
    expect(describeFormatMismatch(new Uint8Array([1, 2, 3]), 'photo.png')).toBeNull()
  })
})

describe('extension and name helpers', () => {
  it('extracts a lower-case extension', () => {
    expect(extensionOf('Photo.PNG')).toBe('png')
    expect(extensionOf('archive.tar.gz')).toBe('gz')
  })

  it('returns an empty string for a dotless name', () => {
    expect(extensionOf('README')).toBe('')
    expect(extensionOf('')).toBe('')
  })

  it('strips a path before taking the base name', () => {
    expect(baseNameOf('C:\\Users\\me\\Pictures\\holiday.png')).toBe('holiday')
    expect(baseNameOf('a/b/c/file')).toBe('file')
  })

  it('swaps the extension', () => {
    expect(withExtension('photo.png', 'jpg')).toBe('photo.jpg')
    expect(withExtension('photo.png', '.webp')).toBe('photo.webp')
    expect(withExtension('archive', 'zip')).toBe('archive.zip')
  })

  it('suggests a name with a suffix', () => {
    expect(suggestName('holiday.png', 'compressed')).toBe('holiday-compressed.png')
    expect(suggestName('holiday.png', 'compressed', 'webp')).toBe('holiday-compressed.webp')
  })

  it('gives an unnamed file a sensible default', () => {
    expect(suggestName('', 'compressed')).toBe('image-compressed')
  })
})

describe('header dimensions', () => {
  it('reads a PNG size from its IHDR', () => {
    expect(pngDimensionsOf(pngHeader(1200, 800))).toEqual({ width: 1200, height: 800 })
  })

  it('reads a GIF logical screen size', () => {
    expect(gifDimensions(gifHeader(640, 480))).toEqual({ width: 640, height: 480 })
  })

  it('reads a BMP size, ignoring a negative height that means bottom-up', () => {
    // A negative height in a BMP just means the rows are stored bottom-up.
    const bytes = bmpHeader(800, 600)
    bytes[22] = 0xa8
    bytes[23] = 0xfd
    bytes[24] = 0xff
    bytes[25] = 0xff
    expect(bmpDimensionsOf(bytes)).toEqual({ width: 800, height: 600 })
  })

  it('reads a JPEG size by walking its segments', () => {
    const sof = [
      0xff, 0xc0, 0x00, 0x11,
      0x08,
      0x04, 0x00, // height 1024
      0x02, 0x80, // width 640
    ]
    const jpeg = concat([0xff, 0xd8], sof, [0xff, 0xda, 0x00, 0x02])
    expect(sniffDimensions(jpeg)).toEqual({ width: 640, height: 1024 })
  })

  it('skips non-SOF segments while hunting for the size', () => {
    // An APP0 "JFIF" segment comes first, and must be stepped over.
    const jfif = [0xff, 0xe0, 0x00, 0x06, ...ascii('JFIF'), 0x00]
    const sof = [0xff, 0xc2, 0x00, 0x11, 0x08, 0x03, 0x20, 0x02, 0x58]
    const jpeg = concat([0xff, 0xd8], jfif, sof, [0xff, 0xda, 0x00, 0x02])
    expect(sniffDimensions(jpeg)).toEqual({ width: 600, height: 800 })
  })

  it('returns null rather than guessing when there is no size', () => {
    expect(sniffDimensions(new Uint8Array([0xff, 0xd8, 0xff, 0xda]))).toBeNull()
    expect(sniffDimensions(new Uint8Array())).toBeNull()
  })
})

/** Local alias so the imports above stay tidy. */
function pngDimensionsOf(bytes: Uint8Array) {
  return headerDimensions(bytes)
}
function bmpDimensionsOf(bytes: Uint8Array) {
  return headerDimensions(bytes)
}

describe('readExif', () => {
  it('reads a camera make and model written as ASCII', () => {
    const jpeg = jpegWithExif([
      [0x010f, 2, 6, ascii('Canon\0')],
      [0x0110, 2, 8, ascii('EOS R6\0')],
    ])
    const exif = readExifOf(jpeg)
    expect(exif.camera).toBe('EOS R6')
    expect(exif.fields.map((field) => field.label)).toEqual(['Camera make', 'Camera model'])
    expect(exif.fields[0].value).toBe('Canon')
  })

  it('translates the orientation tag into words', () => {
    const jpeg = jpegWithExif([[0x0112, 3, 1, [0x06, 0x00]]])
    expect(readExifOf(jpeg).orientation).toBe('Right-top (rotated 90° CCW)')
  })

  it('reads a shutter speed rational', () => {
    const jpeg = jpegWithExif([[0x829a, 5, 1, [0x0a, 0x00, 0x00, 0x00, 0x64, 0x00, 0x00, 0x00]]])
    // 10/100 = 0.1 seconds.
    expect(readExifOf(jpeg).exposure).toBe('0.1')
  })

  it('reads the date taken', () => {
    const jpeg = jpegWithExif([[0x0132, 2, 20, ascii('2024:03:07 14:22:31\0')]])
    expect(readExifOf(jpeg).takenAt).toBe('2024:03:07 14:22:31')
  })

  it('returns an empty result for a JPEG with no EXIF', () => {
    const exif = readExifOf(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02]))
    expect(exif.fields).toEqual([])
    expect(exif.camera).toBeUndefined()
    expect(exif.hasGps).toBe(false)
  })

  it('returns an empty result for a non-JPEG', () => {
    const exif = readExifOf(pngHeader())
    expect(exif.fields).toEqual([])
  })

  it('survives a truncated APP1 segment', () => {
    const jpeg = jpegWithExif([[0x0110, 2, 7, ascii('EOS R6\0')]])
    const truncated = jpeg.subarray(0, 20)
    expect(() => readExifOf(truncated)).not.toThrow()
    expect(readExifOf(truncated).fields).toEqual([])
  })
})

/** Local alias. */
function readExifOf(bytes: Uint8Array) {
  // Imported lazily so the test file's imports stay flat.
  return readExifRef(bytes)
}

import { readExif as readExifRef } from './image-format'

describe('exifTransform', () => {
  it('leaves a normal photo alone', () => {
    expect(exifTransform(1)).toEqual({ rotation: 0, flipX: false, flipY: false })
  })

  it('rotates the sideways ones the way round people expect', () => {
    expect(exifTransform(6).rotation).toBe(90)
    expect(exifTransform(8).rotation).toBe(270)
    expect(exifTransform(3).rotation).toBe(180)
  })

  it('applies the mirror for the flipped variants', () => {
    expect(exifTransform(2).flipX).toBe(true)
    expect(exifTransform(5).flipX).toBe(true)
    expect(exifTransform(7).flipX).toBe(true)
  })

  it('defaults a missing orientation to no change', () => {
    expect(exifTransform(undefined).rotation).toBe(0)
  })
})

describe('combineExifDateTime', () => {
  it('turns EXIF colon dates into an ISO timestamp', () => {
    expect(combineExifDateTime('2024:03:07', '14:22:31')).toBe('2024-03-07 14:22:31')
  })

  it('defaults a missing time to midnight', () => {
    expect(combineExifDateTime('2024:03:07')).toBe('2024-03-07 00:00:00')
    // A time with no seconds gets one rather than being dropped.
    expect(combineExifDateTime('2024:03:07', '14:22')).toBe('2024-03-07 14:22:00')
  })

  it('returns null for a missing or unreadable date', () => {
    expect(combineExifDateTime(undefined)).toBeNull()
    expect(combineExifDateTime('not a date')).toBeNull()
  })
})
