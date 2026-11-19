import { describe, expect, it } from 'vitest'

import { joinItems, documentText, countWords, extractionSummary, type PageText } from './logic'

describe('PDF to Word logic', () => {
  describe('joinItems', () => {
    it('joins text items into lines', () => {
      const result = joinItems([
        { str: 'Hello ', hasEOL: false },
        { str: 'world', hasEOL: true },
      ])
      expect(result).toBe('Hello world')
    })

    it('preserves line breaks', () => {
      const result = joinItems([
        { str: 'Line 1', hasEOL: true },
        { str: 'Line 2', hasEOL: true },
      ])
      expect(result).toBe('Line 1\nLine 2')
    })

    it('handles paragraph breaks (empty items with EOL)', () => {
      const result = joinItems([
        { str: 'Para 1', hasEOL: true },
        { str: '', hasEOL: true },
        { str: 'Para 2', hasEOL: true },
      ])
      expect(result).toBe('Para 1\n\nPara 2')
    })

    it('skips empty spacer items', () => {
      const result = joinItems([
        { str: '', hasEOL: false },
        { str: 'Text', hasEOL: true },
      ])
      expect(result).toBe('Text')
    })

    it('trims trailing whitespace from lines', () => {
      const result = joinItems([{ str: 'Hello   ', hasEOL: true }])
      expect(result).toBe('Hello')
    })
  })

  describe('documentText', () => {
    it('joins pages with double newlines', () => {
      const pages: PageText[] = [
        { pageNumber: 1, text: 'Page one', items: 2 },
        { pageNumber: 2, text: 'Page two', items: 2 },
      ]
      expect(documentText(pages)).toBe('Page one\n\nPage two')
    })

    it('skips empty pages', () => {
      const pages: PageText[] = [
        { pageNumber: 1, text: 'Has text', items: 2 },
        { pageNumber: 2, text: '', items: 0 },
        { pageNumber: 3, text: 'Also has text', items: 2 },
      ]
      expect(documentText(pages)).toBe('Has text\n\nAlso has text')
    })
  })

  describe('countWords', () => {
    it('counts words in text', () => {
      expect(countWords('Hello world')).toBe(2)
    })

    it('returns 0 for empty text', () => {
      expect(countWords('')).toBe(0)
      expect(countWords('   ')).toBe(0)
    })

    it('returns 1 for single word', () => {
      expect(countWords('Hello')).toBe(1)
    })
  })

  describe('extractionSummary', () => {
    it('reports words and pages', () => {
      const pages: PageText[] = [
        { pageNumber: 1, text: 'Hello world', items: 2 },
        { pageNumber: 2, text: 'More text here', items: 3 },
      ]
      expect(extractionSummary(pages)).toBe('5 words from 2 pages.')
    })

    it('reports blank pages', () => {
      const pages: PageText[] = [
        { pageNumber: 1, text: 'Hello', items: 1 },
        { pageNumber: 2, text: '', items: 0 },
      ]
      expect(extractionSummary(pages)).toBe('1 word from 2 pages. 1 page had no text layer.')
    })

    it('handles single page', () => {
      const pages: PageText[] = [{ pageNumber: 1, text: 'Hello', items: 1 }]
      expect(extractionSummary(pages)).toBe('1 word from 1 page.')
    })
  })
})
