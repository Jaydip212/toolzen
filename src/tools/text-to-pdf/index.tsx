import { useMemo, useState } from 'react'

import { DownloadButton, ToolPanel } from '@/tools/shared'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Form'
import { SegmentedControl } from '@/tools/shared'
import { StatTile } from '@/components/tools/StatTile'
import { formatBytes } from '@/lib/utils'

import { LAYOUT_NOTE, PAGE_SIZES, encodingError, layoutError, layoutFor, layoutSummary, type PageSizeId } from './logic'

const OPTIONS = PAGE_SIZES.map((entry) => ({ value: entry.value, label: entry.label }))

/** Turn plain text into a PDF document. */
export default function TextToPdf() {
  const [text, setText] = useState('')
  const [size, setSize] = useState<PageSizeId>('a4')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ blob: Blob; name: string; pages: number } | null>(null)

  const layout = useMemo(() => layoutFor(text, size), [text, size])
  const blocked = layoutError(text)
  // A missing document and an undrawable character are different failures, so
  // they are shown in different places: one disables the button, one explains.
  const encodingNote = text.trim() === '' ? null : encodingError(text)

  async function handleBuild() {
    if (blocked) return
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
          // PDF text starts at the baseline, and the origin is bottom-left.
          const y = page.height - margin - fontSize - index * lineHeight
          pageDoc.drawText(line, { x: margin, y, size: fontSize, font })
        })
      }

      // Metadata is written at save time, so it goes in before the save, not
      // after — otherwise the document claims no producer at all.
      document.setTitle('Text to PDF')
      document.setProducer('TOOLZEN')
      document.setCreator('TOOLZEN Text to PDF')

      const saved = await document.save()
      setResult({
        blob: new Blob([saved.buffer as ArrayBuffer], { type: 'application/pdf' }),
        name: 'text.pdf',
        pages: layout.pages.length,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The PDF could not be built.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="1. Write the text">
        <label htmlFor="the-text" className="text-sm font-medium text-fg">
          The text for the document
        </label>
        <Textarea
          id="the-text"
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            setResult(null)
          }}
          rows={14}
          spellCheck={false}
          placeholder={"Type or paste the text here.\n\nBlank lines start a new paragraph."}
          className="mt-2 text-sm"
        />
        <p className="mt-2 text-xs text-muted">Nothing is uploaded. The text stays in this tab.</p>
      </ToolPanel>

      <ToolPanel title="2. Choose the page">
        <SegmentedControl label="Page size" options={OPTIONS} value={size} onChange={(value) => setSize(value as PageSizeId)} />

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatTile label="Words" value={String(text.trim() === '' ? 0 : text.trim().split(/\s+/).length)} />
          <StatTile label="Pages" value={String(layout.pages.length)} />
          <StatTile label="Lines per page" value={String(layout.perPage)} />
        </div>
        <p className="mt-3 text-sm text-fg">{layoutSummary(text, layout)}</p>
        <p className="mt-1 text-xs text-muted">{LAYOUT_NOTE}</p>
        {encodingNote && <p className="mt-2 text-xs text-danger">{encodingNote}</p>}
      </ToolPanel>

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
            The document is plain type on a plain page: one font, one size, no formatting. Bold, italics and headings
            are not supported, because this tool does not claim to read markdown or rich text.
          </p>
        </ToolPanel>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void handleBuild()} disabled={busy || blocked !== null} size="lg">
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
          {blocked && <span className="text-sm text-danger">{blocked}</span>}
        </div>
      )}
    </div>
  )
}
