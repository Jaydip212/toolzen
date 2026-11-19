/**
 * Minimal browser-side .docx builder.
 *
 * A .docx file is a ZIP archive containing a set of XML parts at specific
 * paths. This module assembles the minimum set that Word, LibreOffice and
 * Google Docs all accept: a document part, a content-types part, a
 * relationships part, and the styles part that declares the Normal style.
 *
 * Everything is built from strings and packed with jszip — no server, no
 * upload, no temporary files.
 */

/** Escapes XML special characters in text content. */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** A paragraph of text, split into lines that map to Word runs. */
export interface DocxParagraph {
  /** Lines within the paragraph. Each becomes a `<w:r>` with a `<w:br/>` between. */
  lines: string[]
}

/**
 * Build the word/document.xml body from paragraphs.
 *
 * Each paragraph becomes a `<w:p>`. Lines within a paragraph are joined by
 * `<w:br/>` run breaks, so a multi-line paragraph keeps its line structure
 * without becoming separate paragraphs.
 */
function buildBody(paragraphs: DocxParagraph[]): string {
  const parts: string[] = []
  for (const para of paragraphs) {
    if (para.lines.length === 0) {
      // An empty paragraph is valid and intentional — it is a blank line.
      parts.push('<w:p/>')
      continue
    }
    const runs = para.lines
      .map((line, index) => {
        const escaped = escapeXml(line)
        const breakTag = index > 0 ? '<w:r><w:br/></w:r>' : ''
        return escaped === '' ? breakTag : `${breakTag}<w:r><w:t xml:space="preserve">${escaped}</w:t></w:r>`
      })
      .join('')
    parts.push(`<w:p>${runs}</w:p>`)
  }
  return parts.join('')
}

/**
 * The minimal set of XML parts inside a .docx, as a record of path → content.
 *
 * These are the parts every .docx reader needs, and nothing more: no headers,
 * footers, themes, or settings. The result opens cleanly in Word, LibreOffice
 * and Google Docs.
 */
export function docxParts(paragraphs: DocxParagraph[]): Record<string, string> {
  const body = buildBody(paragraphs)

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body>
</w:document>`

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="word/styles.xml"/>
</Relationships>`

  const documentRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults>
<w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault>
</w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
</w:styles>`

  return {
    '[Content_Types].xml': contentTypes,
    '_rels/.rels': rels,
    'word/document.xml': documentXml,
    'word/_rels/document.xml.rels': documentRels,
    'word/styles.xml': styles,
  }
}

/**
 * Build a .docx file as a Blob from paragraphs.
 *
 * The caller is responsible for splitting text into paragraphs and lines —
 * this function only assembles the package, so it can be tested without jszip
 * by testing `docxParts` directly.
 */
export async function buildDocx(paragraphs: DocxParagraph[]): Promise<Blob> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const parts = docxParts(paragraphs)
  for (const [path, content] of Object.entries(parts)) {
    zip.file(path, content)
  }
  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
}

/**
 * Split raw text into paragraphs for docx output.
 *
 * Paragraphs are separated by blank lines. Lines within a paragraph are kept
 * as separate runs joined by line breaks, so the original line structure is
 * preserved without inflating the paragraph count.
 */
export function paragraphsFromText(text: string): DocxParagraph[] {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/)
  return blocks.map((block) => ({
    lines: block.split('\n').filter((line, index, arr) => !(index === arr.length - 1 && line.trim() === '')),
  }))
}

/** The output filename for a PDF-to-Word conversion. */
export function docxName(pdfName: string): string {
  const dot = pdfName.lastIndexOf('.')
  const stem = dot > 0 ? pdfName.slice(0, dot) : pdfName
  return `${stem}.docx`
}
