import { describe, expect, it } from 'vitest'

import { docxParts, paragraphsFromText, docxName } from '@/lib/docx'

describe('docx builder', () => {
  describe('paragraphsFromText', () => {
    it('splits on blank lines into paragraphs', () => {
      const result = paragraphsFromText('Hello world\n\nSecond paragraph')
      expect(result).toHaveLength(2)
      expect(result[0].lines).toEqual(['Hello world'])
      expect(result[1].lines).toEqual(['Second paragraph'])
    })

    it('keeps multi-line paragraphs as runs within one paragraph', () => {
      const result = paragraphsFromText('Line 1\nLine 2\n\nNext para')
      expect(result).toHaveLength(2)
      expect(result[0].lines).toEqual(['Line 1', 'Line 2'])
      expect(result[1].lines).toEqual(['Next para'])
    })

    it('handles empty text', () => {
      expect(paragraphsFromText('')).toHaveLength(1)
      expect(paragraphsFromText('')[0].lines).toEqual([])
    })

    it('handles text with only blank lines', () => {
      const result = paragraphsFromText('\n\n\n')
      expect(result.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('docxParts', () => {
    it('produces all required parts', () => {
      const parts = docxParts([{ lines: ['Hello'] }])
      expect(parts['[Content_Types].xml']).toBeDefined()
      expect(parts['_rels/.rels']).toBeDefined()
      expect(parts['word/document.xml']).toBeDefined()
      expect(parts['word/_rels/document.xml.rels']).toBeDefined()
      expect(parts['word/styles.xml']).toBeDefined()
    })

    it('includes text content in document.xml', () => {
      const parts = docxParts([{ lines: ['Test content'] }])
      expect(parts['word/document.xml']).toContain('Test content')
      expect(parts['word/document.xml']).toContain('xml:space="preserve"')
    })

    it('escapes XML special characters', () => {
      const parts = docxParts([{ lines: ['<tag> & "quotes"'] }])
      expect(parts['word/document.xml']).toContain('&lt;tag&gt;')
      expect(parts['word/document.xml']).toContain('&amp;')
      expect(parts['word/document.xml']).toContain('&quot;')
      expect(parts['word/document.xml']).not.toContain('<tag>')
    })

    it('declares the Normal style', () => {
      const parts = docxParts([{ lines: ['Hello'] }])
      expect(parts['word/styles.xml']).toContain('Normal')
      expect(parts['word/styles.xml']).toContain('Calibri')
    })

    it('declares content types for document and styles', () => {
      const parts = docxParts([{ lines: ['Hello'] }])
      expect(parts['[Content_Types].xml']).toContain('wordprocessingml.document.main+xml')
      expect(parts['[Content_Types].xml']).toContain('wordprocessingml.styles+xml')
    })

    it('includes page size and margins in the section properties', () => {
      const parts = docxParts([{ lines: ['Hello'] }])
      expect(parts['word/document.xml']).toContain('w:pgSz')
      expect(parts['word/document.xml']).toContain('w:pgMar')
    })

    it('handles empty paragraphs', () => {
      const parts = docxParts([{ lines: [] }])
      expect(parts['word/document.xml']).toContain('<w:p/>')
    })

    it('handles multiple paragraphs', () => {
      const parts = docxParts([{ lines: ['First'] }, { lines: ['Second'] }])
      const bodyMatch = parts['word/document.xml'].match(/<w:p>/g)
      expect(bodyMatch).toHaveLength(2)
    })
  })

  describe('docxName', () => {
    it('replaces .pdf with .docx', () => {
      expect(docxName('report.pdf')).toBe('report.docx')
    })

    it('handles files without extension', () => {
      expect(docxName('report')).toBe('report.docx')
    })

    it('handles double extensions', () => {
      expect(docxName('my.report.pdf')).toBe('my.report.docx')
    })
  })
})
