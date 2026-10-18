import { describe, expect, it } from 'vitest'

import { SCAN_NOTE, countWords, documentText, joinItems, textName } from './logic'

describe('joinItems', () => {
  it('keeps words on the line the original put them on', () => {
    expect(
      joinItems([
        { str: 'Quarterly', hasEOL: false },
        { str: ' report', hasEOL: true },
        { str: 'Page two', hasEOL: true },
      ]),
    ).toBe('Quarterly report\nPage two')
  })

  it('drops a spacer item rather than scattering gaps', () => {
    expect(
      joinItems([
        { str: 'a', hasEOL: false },
        { str: '', hasEOL: false },
        { str: 'b', hasEOL: true },
      ]),
    ).toBe('ab')
  })

  it('keeps a blank line when the document actually drew one', () => {
    expect(
      joinItems([
        { str: 'paragraph one', hasEOL: true },
        { str: '', hasEOL: true },
        { str: 'paragraph two', hasEOL: true },
      ]),
    ).toBe('paragraph one\n\nparagraph two')
  })

  it('collapses several blank lines into one paragraph break', () => {
    expect(
      joinItems([
        { str: 'above', hasEOL: true },
        { str: '', hasEOL: true },
        { str: '', hasEOL: true },
        { str: '', hasEOL: true },
        { str: 'below', hasEOL: true },
      ]),
    ).toBe('above\n\nbelow')
  })

  it('does not open the page with a blank line', () => {
    expect(joinItems([{ str: '', hasEOL: true }, { str: 'text', hasEOL: true }])).toBe('text')
  })

  it('keeps a blank line drawn inside a sentence break too', () => {
    expect(
      joinItems([
        { str: 'first', hasEOL: true },
        { str: '', hasEOL: false },
        { str: '', hasEOL: true },
        { str: 'second', hasEOL: true },
      ]),
    ).toBe('first\n\nsecond')
  })

  it('collapses a trailing space a reader cannot see', () => {
    expect(joinItems([{ str: 'word   ', hasEOL: true }])).toBe('word')
  })

  it('returns an empty string for a page with no text layer', () => {
    expect(joinItems([{ str: '', hasEOL: false }])).toBe('')
    expect(joinItems([])).toBe('')
  })

  it('keeps the final partial line when the page does not end with one', () => {
    expect(joinItems([{ str: 'no line end', hasEOL: false }])).toBe('no line end')
  })
})

describe('documentText', () => {
  const pages = [
    { pageNumber: 1, text: 'First page.', items: 2 },
    { pageNumber: 2, text: '', items: 0 },
  ]

  it('adds a page marker when asked, including one for a blank page', () => {
    expect(documentText(pages, true)).toBe('[Page 1]\nFirst page.\n\n[Page 2]')
  })

  it('omits blank pages entirely when no markers are wanted', () => {
    expect(documentText(pages, false)).toBe('First page.')
  })

  it('separates pages with a blank line so paragraphs stay apart', () => {
    const two = [
      { pageNumber: 1, text: 'one', items: 1 },
      { pageNumber: 2, text: 'two', items: 1 },
    ]
    expect(documentText(two, true)).toBe('[Page 1]\none\n\n[Page 2]\ntwo')
  })
})

describe('countWords', () => {
  it('counts words and ignores padding', () => {
    expect(countWords('  one   two  ')).toBe(2)
    expect(countWords('')).toBe(0)
    expect(countWords('   ')).toBe(0)
    expect(countWords('lonely')).toBe(1)
  })
})

describe('textName', () => {
  it('replaces the extension with txt', () => {
    expect(textName('report.pdf')).toBe('report.txt')
    expect(textName('My File.PDF')).toBe('My File.txt')
  })

  it('adds txt when the file had no extension', () => {
    expect(textName('scan')).toBe('scan.txt')
  })
})

describe('SCAN_NOTE', () => {
  it('names the reason and what the tool does not do', () => {
    expect(SCAN_NOTE).toContain('photographs of writing')
    expect(SCAN_NOTE).toContain('does not run optical character recognition')
  })
})
