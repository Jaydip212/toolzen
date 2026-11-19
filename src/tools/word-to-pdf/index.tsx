import { useMemo, useState } from 'react'

import { DownloadButton, FileDrop, ToolPanel } from '@/tools/shared'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { SegmentedControl } from '@/tools/shared'
import { StatTile } from '@/components/tools/StatTile'
import { formatBytes } from '@/lib/utils'
import { layoutFor, PAGE_SIZES, encodingError as pdfEncodingError, type PageSizeId } from '@/tools/text-to-pdf/logic'

import {
  countWords,
  extractParagraphs,
  isDocxFile,
  paragraphsAsText,
  pdfName,
  type WordParagraph,
} from './logic'

const PAGE_OPTIONS = PAGE_SIZES.map((entry) => ({ value: entry.value, label: entry.label }))

/**
 * Word to PDF converter.
 *
 * Reads a .docx file (which is a ZIP), extracts the text from
 * word/document.xml, and builds a PDF with pdf-lib. The text is laid out the
 * same way the Text-to-PDF tool lays it out, because a .docx from a word
 * processor is a stream of paragraphs, and the PDF this tool produces is the
 * same stream on a page.
 */
export default function WordToPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [paragraphs, setParagraphs] = useState<WordParagraph[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ blob: Blob; name: string; pages: number } | null>(null)
  const [size, setSize] = useState<PageSizeId>('a4')

  const text = useMemo(() => (paragraphs ? paragraphsAsText(paragraphs) : ''), [paragraphs])
  const layout = useMemo(() => layoutFor(text, size), [text, size])
  const encodingNote = text.trim() === '' ? null : pdfEncodingError(text)

  async function handleFile(files: File[]) {
    const chosen = files[0] ?? null
    setFile(chosen)
    setParagraphs(null)
    setError(null)
    setResult(null)
    if (!chosen) return

    try {
      const bytes = new Uint8Array(await chosen.arrayBuffer())
      if (!isDocxFile(bytes)) {
        setError('This file is not a .docx document. A .docx file is a ZIP archive — this file does not have the ZIP signature.')
        return
      }

      const { default: JSZip } = await import('jszip')
      const zip = await JSZip.loadAsync(bytes)
      const documentFile = zip.file('word/document.xml')
      if (!documentFile) {
        setError('The .docx archive does not contain a word/document.xml part. The file may be corrupted or not a Word document.')
        return
      }

      const documentXml = await documentFile.async('string')
      const extracted = extractParagraphs(documentXml)
      if (extracted.length === 0) {
        setError('The document contains no paragraphs of text.')
        return
      }
      setParagraphs(extracted)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That file could not be read.')
    }
  }

  async function handleBuild() {
    if (!paragraphs || !file) return
    if (encodingNote) {
      // We don't block — we warn and skip unsupported characters in the output.
    }
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const { PDFDocument, StandardFonts } = await import('pdf-lib')
      const page = PAGE_SIZES.find((entry) => entry.value === size) ?? PAGE_SIZES[0]
      const document = await PDFDocument.create()
      const font = await document.embedFont(StandardFonts.Helvetica)
      const fontSize = 11
      const lineHeight = fontSize * 1.35
      const margin = 56

      for (const lines of layout.pages) {
        const pageDoc = document.addPage([page.width, page.height])
        lines.forEach((line, index) => {
          if (line === '') return
          // Skip characters the font cannot draw rather than failing the build.
          const safe = [...line].filter((ch) => {
            const cp = ch.codePointAt(0) ?? 0
            if (cp === 0x0a || cp === 0x0d) return true
            if (cp < 0x20 || cp === 0x7f) return false
            if (cp <= 0xff) return true
            // Allow the Windows-1252 extras
            const extras = new Set([
              0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x017d,
              0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e,
              0x0178,
            ])
            return extras.has(cp)
          }).join('')
          if (safe === '') return
          const y = page.height - margin - fontSize - index * lineHeight
          pageDoc.drawText(safe, { x: margin, y, size: fontSize, font })
        })
      }

      document.setTitle(file.name.replace(/\.docx$/i, ''))
      document.setProducer('TOOLZEN')
      document.setCreator('TOOLZEN Word to PDF')

      const saved = await document.save()
      setResult({
        blob: new Blob([saved.buffer as ArrayBuffer], { type: 'application/pdf' }),
        name: pdfName(file.name),
        pages: layout.pages.length,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The PDF could not be built.')
    } finally {
      setBusy(false)
    }
  }

  const words = paragraphs ? countWords(paragraphs) : 0

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="Choose the Word document">
        <FileDrop
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          label="Drop a .docx file here, or choose one"
          hint="Read in this browser tab and never uploaded."
          maxFileSizeBytes={50 * 1024 * 1024}
          onFiles={(files) => void handleFile(files)}
        />
        {file && paragraphs && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <StatTile label="File" value={file.name} />
            <StatTile label="Paragraphs" value={String(paragraphs.length)} />
          </div>
        )}
      </ToolPanel>

      {paragraphs && (
        <ToolPanel title="Choose the page">
          <SegmentedControl label="Page size" options={PAGE_OPTIONS} value={size} onChange={(value) => setSize(value as PageSizeId)} />

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <StatTile label="Words" value={String(words)} />
            <StatTile label="Pages" value={String(layout.pages.length)} />
            <StatTile label="Lines per page" value={String(layout.perPage)} />
          </div>
          {encodingNote && <p className="mt-3 text-xs text-warning">{encodingNote}</p>}
        </ToolPanel>
      )}

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {result ? (
        <ToolPanel title="PDF built" className="border-success/30">
          <div className="flex flex-wrap items-center gap-3">
            <DownloadButton blob={result.blob} filename={result.name} label="Download the PDF" size="md" />
            <span className="text-sm text-muted">
              {formatBytes(result.blob.size)} — {result.pages} page{result.pages === 1 ? '' : 's'}
            </span>
          </div>
          <p className="mt-3 text-xs text-muted">
            The PDF contains the text from the document in reading order. Fonts, colours, bold, italic, headings,
            tables, images and other formatting are not preserved, because this tool reads the text rather than
            rendering the layout. For a formatted document, use the word processor's own PDF export.
          </p>
        </ToolPanel>
      ) : (
        paragraphs && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void handleBuild()} disabled={busy || !paragraphs} size="lg">
              {busy ? (
                <>
                  <Spinner size={16} label="Building" />
                  Building…
                </>
              ) : (
                <>
                  <Icon name="file-text" size={16} />
                  Build the PDF
                </>
              )}
            </Button>
          </div>
        )
      )}
    </div>
  )
}
