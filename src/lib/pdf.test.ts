import { describe, expect, it } from 'vitest'

import {
  angleSwapsSize,
  complementOf,
  displayedSize,
  formatPageList,
  isEncryptedPdfError,
  nameForRange,
  normaliseAngle,
  outputName,
  parsePageGroups,
  readPdfHeader,
  withSuffix,
} from './pdf'

/** A minimal PDF header for sniffing tests. */
function bytesFrom(text: string): Uint8Array {
  return Uint8Array.from(text.split('').map((ch) => ch.charCodeAt(0)))
}

describe('readPdfHeader', () => {
  it('accepts a header and reads its version', () => {
    const header = readPdfHeader(bytesFrom('%PDF-1.7\n...'))
    expect(header.ok).toBe(true)
    expect(header.version).toBe('1.7')
    expect(header.error).toBeNull()
  })

  it('finds a header that sits a little way into the file, as the spec allows', () => {
    const header = readPdfHeader(bytesFrom('   \n%PDF-2.0 rest of document'))
    expect(header.ok).toBe(true)
    expect(header.version).toBe('2.0')
  })

  it('rejects a file with no header in the search window', () => {
    const header = readPdfHeader(bytesFrom('<html><body>not a pdf</body></html>'))
    expect(header.ok).toBe(false)
    expect(header.version).toBeNull()
    expect(header.error).toContain('does not start with a PDF header')
  })

  it('says so when a version cannot be read rather than inventing one', () => {
    const header = readPdfHeader(bytesFrom('%PDF-XX'))
    expect(header.ok).toBe(true)
    expect(header.version).toBeNull()
    expect(header.error).toContain('version number is unusual')
  })
})

describe('isEncryptedPdfError', () => {
  it('recognises the encryption error pdf-lib raises', () => {
    const error = new Error('Input document to `PDFDocument.load` is encrypted.')
    expect(isEncryptedPdfError(error)).toBe(true)
  })

  it('recognises it by name as well as message', () => {
    const error = new Error('boom')
    error.name = 'EncryptedPDFError'
    expect(isEncryptedPdfError(error)).toBe(true)
  })

  it('does not call every failure an encryption problem', () => {
    expect(isEncryptedPdfError(new Error('The file is corrupt'))).toBe(false)
    expect(isEncryptedPdfError('a string')).toBe(false)
  })
})

describe('parsePageGroups', () => {
  it('reads single pages and ranges into separate groups', () => {
    const parsed = parsePageGroups('1-3, 7, 9-10', 20)
    expect(parsed.ok).toBe(true)
    expect(parsed.groups).toEqual([
      { label: '1-3', pages: [1, 2, 3] },
      { label: '7', pages: [7] },
      { label: '9-10', pages: [9, 10] },
    ])
    expect(parsed.selected).toEqual([1, 2, 3, 7, 9, 10])
  })

  it('treats a trailing dash as "to the end"', () => {
    const parsed = parsePageGroups('4-', 6)
    expect(parsed.ok).toBe(true)
    expect(parsed.groups[0].pages).toEqual([4, 5, 6])
  })

  it('treats a leading dash as "from the start"', () => {
    const parsed = parsePageGroups('-3', 6)
    expect(parsed.ok).toBe(true)
    expect(parsed.groups[0].pages).toEqual([1, 2, 3])
  })

  it('rejects an empty specification', () => {
    const parsed = parsePageGroups('   ', 10)
    expect(parsed.ok).toBe(false)
    expect(parsed.error).toContain('at least one page')
  })

  it('rejects a doubled comma by name', () => {
    const parsed = parsePageGroups('1,,3', 10)
    expect(parsed.ok).toBe(false)
    expect(parsed.error).toContain('doubled comma')
  })

  it('rejects a range that runs backwards', () => {
    const parsed = parsePageGroups('5-2', 10)
    expect(parsed.ok).toBe(false)
    expect(parsed.error).toContain('runs backwards')
    expect(parsed.error).toContain('2-5')
  })

  it('rejects zero, because pages start at one', () => {
    expect(parsePageGroups('0', 10).error).toContain('start at 1')
    expect(parsePageGroups('2-0', 10).error).toContain('start at 1')
  })

  it('rejects a start past the end of the document', () => {
    const parsed = parsePageGroups('11', 10)
    expect(parsed.ok).toBe(false)
    expect(parsed.error).toContain('10 pages')
    expect(parsed.error).toContain('no page 11')
  })

  it('rejects a range that reaches past the end', () => {
    const parsed = parsePageGroups('8-12', 10)
    expect(parsed.ok).toBe(false)
    expect(parsed.error).toContain('runs past the last page')
  })

  it('rejects text that is not a number or a range', () => {
    expect(parsePageGroups('one', 10).error).toContain('not a page number')
    expect(parsePageGroups('1-a', 10).error).toContain('not a page number')
  })

  it('deduplicates pages across groups but keeps each group whole', () => {
    const parsed = parsePageGroups('1-2, 2-3', 10)
    expect(parsed.ok).toBe(true)
    expect(parsed.groups.map((group) => group.pages)).toEqual([
      [1, 2],
      [2, 3],
    ])
    expect(parsed.selected).toEqual([1, 2, 3])
  })

  it('says so for a document with no pages', () => {
    expect(parsePageGroups('1', 0).error).toContain('no pages')
  })
})

describe('formatPageList', () => {
  it('turns a list into compact range text', () => {
    expect(formatPageList([1, 2, 3, 7, 9, 10])).toBe('1-3, 7, 9-10')
  })

  it('sorts before it compresses, so order does not change the text', () => {
    expect(formatPageList([7, 1, 3, 2])).toBe('1-3, 7')
  })

  it('returns an empty string for no pages', () => {
    expect(formatPageList([])).toBe('')
  })
})

describe('complementOf', () => {
  it('lists the pages that were not chosen', () => {
    expect(complementOf([2, 4], 5)).toEqual([1, 3, 5])
  })

  it('keeps the document when nothing is chosen', () => {
    expect(complementOf([], 3)).toEqual([1, 2, 3])
  })
})

describe('normaliseAngle', () => {
  it('reduces angles to the four the format stores', () => {
    expect(normaliseAngle(0)).toBe(0)
    expect(normaliseAngle(90)).toBe(90)
    expect(normaliseAngle(270)).toBe(270)
    expect(normaliseAngle(360)).toBe(0)
    expect(normaliseAngle(450)).toBe(90)
    expect(normaliseAngle(-90)).toBe(270)
    expect(normaliseAngle(-450)).toBe(270)
  })

  it('rounds a sloppy angle to the nearest quarter, rather than rejecting it', () => {
    expect(normaliseAngle(91)).toBe(90)
    expect(normaliseAngle(89)).toBe(90)
    expect(normaliseAngle(44)).toBe(0)
  })
})

describe('displayedSize', () => {
  it('swaps the stored rectangle for a sideways angle', () => {
    expect(displayedSize(595, 842, 90)).toEqual({ width: 842, height: 595 })
    expect(displayedSize(595, 842, 270)).toEqual({ width: 842, height: 595 })
  })

  it('leaves it alone for upright and upside down', () => {
    expect(displayedSize(595, 842, 0)).toEqual({ width: 595, height: 842 })
    expect(displayedSize(595, 842, 180)).toEqual({ width: 595, height: 842 })
  })
})

describe('angleSwapsSize', () => {
  it('is true for the two sideways angles only', () => {
    expect(angleSwapsSize(90)).toBe(true)
    expect(angleSwapsSize(270)).toBe(true)
    expect(angleSwapsSize(450)).toBe(true)
    expect(angleSwapsSize(0)).toBe(false)
    expect(angleSwapsSize(180)).toBe(false)
  })
})

describe('naming', () => {
  it('builds a name from a range label', () => {
    expect(nameForRange('report', '2-5')).toBe('report-p2-5.pdf')
    expect(nameForRange('report', '7')).toBe('report-p7.pdf')
  })

  it('falls back to "pages" when a label has no digits', () => {
    expect(nameForRange('report', 'all')).toBe('report-pages.pdf')
  })

  it('keeps the extension the user uploaded, in the case they used', () => {
    expect(withSuffix('Photo.JPG', '-cropped')).toBe('Photo-cropped.JPG')
  })

  it('always produces a PDF when there was no extension at all', () => {
    expect(withSuffix('scan', '-split')).toBe('scan-split.pdf')
  })

  it('names an output by what was done to it', () => {
    expect(outputName('report.pdf', 'rotated')).toBe('report-rotated.pdf')
  })
})
