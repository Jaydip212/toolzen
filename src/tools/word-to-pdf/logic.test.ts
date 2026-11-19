import { describe, expect, it } from 'vitest'

import {
  extractParagraphs,
  paragraphsAsText,
  countWords,
  isDocxFile,
  pdfName,
  unsupportedCharacters,
  encodingError,
} from './logic'

describe('Word to PDF logic', () => {
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

  function docXml(body: string): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W}"><w:body>${body}</w:body></w:document>`
  }

  function para(text: string): string {
    return `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`
  }

  function paraWithBreak(text1: string, text2: string): string {
    return `<w:p><w:r><w:t>${text1}</w:t></w:r><w:r><w:br/></w:r><w:r><w:t>${text2}</w:t></w:r></w:p>`
  }

  function emptyPara(): string {
    return '<w:p/>'
  }

  describe('extractParagraphs', () => {
    it('extracts a single paragraph', () => {
      const xml = docXml(para('Hello world'))
      const result = extractParagraphs(xml)
      expect(result).toHaveLength(1)
      expect(result[0].lines).toEqual(['Hello world'])
    })

    it('extracts multiple paragraphs', () => {
      const xml = docXml(`${para('First')}${para('Second')}`)
      const result = extractParagraphs(xml)
      expect(result).toHaveLength(2)
      expect(result[0].lines).toEqual(['First'])
      expect(result[1].lines).toEqual(['Second'])
    })

    it('handles line breaks within a paragraph', () => {
      const xml = docXml(paraWithBreak('Line 1', 'Line 2'))
      const result = extractParagraphs(xml)
      expect(result).toHaveLength(1)
      expect(result[0].lines).toEqual(['Line 1', 'Line 2'])
    })

    it('handles empty paragraphs', () => {
      const xml = docXml(`${para('Hello')}${emptyPara()}${para('World')}`)
      const result = extractParagraphs(xml)
      expect(result).toHaveLength(3)
      expect(result[1].lines).toEqual([''])
    })

    it('handles multiple text nodes in one run', () => {
      const xml = docXml('<w:p><w:r><w:t>Hello </w:t><w:t>world</w:t></w:r></w:p>')
      const result = extractParagraphs(xml)
      expect(result[0].lines).toEqual(['Hello world'])
    })

    it('handles tabs', () => {
      const xml = docXml('<w:p><w:r><w:t>Col1</w:t><w:tab/></w:r><w:r><w:t>Col2</w:t></w:r></w:p>')
      const result = extractParagraphs(xml)
      expect(result[0].lines).toEqual(['Col1\tCol2'])
    })

    it('throws on malformed XML', () => {
      expect(() => extractParagraphs('not valid xml <<<')).toThrow()
    })

    it('handles document with no paragraphs', () => {
      const xml = docXml('')
      const result = extractParagraphs(xml)
      expect(result).toHaveLength(0)
    })
  })

  describe('paragraphsAsText', () => {
    it('joins paragraphs with blank lines', () => {
      const result = paragraphsAsText([{ lines: ['First'] }, { lines: ['Second'] }])
      expect(result).toBe('First\n\nSecond')
    })

    it('preserves line breaks within paragraphs', () => {
      const result = paragraphsAsText([{ lines: ['Line 1', 'Line 2'] }])
      expect(result).toBe('Line 1\nLine 2')
    })
  })

  describe('countWords', () => {
    it('counts words across paragraphs', () => {
      const result = countWords([{ lines: ['Hello world'] }, { lines: ['More text'] }])
      expect(result).toBe(4)
    })

    it('returns 0 for empty', () => {
      expect(countWords([{ lines: [''] }])).toBe(0)
      expect(countWords([])).toBe(0)
    })
  })

  describe('isDocxFile', () => {
    it('accepts a valid ZIP signature', () => {
      const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0])
      expect(isDocxFile(bytes)).toBe(true)
    })

    it('rejects a PDF signature', () => {
      const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46])
      expect(isDocxFile(bytes)).toBe(false)
    })

    it('rejects too-short input', () => {
      expect(isDocxFile(new Uint8Array([0x50, 0x4b]))).toBe(false)
    })
  })

  describe('pdfName', () => {
    it('replaces .docx with .pdf', () => {
      expect(pdfName('document.docx')).toBe('document.pdf')
    })

    it('handles files without extension', () => {
      expect(pdfName('document')).toBe('document.pdf')
    })

    it('handles double extensions', () => {
      expect(pdfName('my.document.docx')).toBe('my.document.pdf')
    })
  })

  describe('unsupportedCharacters', () => {
    it('returns empty for Latin text', () => {
      expect(unsupportedCharacters('Hello world')).toEqual([])
    })

    it('finds non-Latin characters', () => {
      expect(unsupportedCharacters('Hello 世界')).toContain('世')
      expect(unsupportedCharacters('Hello 世界')).toContain('界')
    })

    it('finds emoji', () => {
      expect(unsupportedCharacters('Hello 😀')).toContain('😀')
    })

    it('allows Windows-1252 extras', () => {
      expect(unsupportedCharacters('“smart quotes” — €')).toEqual([])
    })
  })

  describe('encodingError', () => {
    it('returns null for Latin text', () => {
      expect(encodingError('Hello world')).toBeNull()
    })

    it('returns a message for non-Latin text', () => {
      const msg = encodingError('Hello 世界')
      expect(msg).toContain('U+4E16')
      expect(msg).toContain('U+754C')
    })
  })
})
