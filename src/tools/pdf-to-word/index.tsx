import { useCallback, useState } from 'react'

import { DownloadButton, FileDrop, ToolPanel } from '@/tools/shared'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { StatTile } from '@/components/tools/StatTile'
import { readPdfHeader } from '@/lib/pdf'
import { openForRendering, pageTextItems } from '@/lib/pdf-render'
import { buildDocx, docxName, paragraphsFromText } from '@/lib/docx'

import { SCAN_NOTE, countWords, documentText, joinItems, extractionSummary, type PageText } from './logic'

/**
 * PDF to Word converter.
 *
 * Reads the text layer of a PDF and packages it into a .docx file, all in the
 * browser. The layout caveat is stated plainly: this extracts text, not
 * layout, so columns, tables and images do not carry across.
 */
export default function PdfToWord() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ blob: Blob; name: string; pages: PageText[] } | null>(null)

  const handleFile = useCallback(async (files: File[]) => {
    const chosen = files[0] ?? null
    setFile(chosen)
    setResult(null)
    setError(null)
    setPageCount(null)
    if (!chosen) return

    try {
      const bytes = new Uint8Array(await chosen.arrayBuffer())
      const header = readPdfHeader(bytes)
      if (!header.ok) {
        setError(header.error ?? 'That file could not be read as a PDF.')
        return
      }
      const opened = await openForRendering(bytes)
      setPageCount(opened.numPages)
      await opened.destroy?.()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That file could not be read.')
    }
  }, [])

  async function handleConvert() {
    if (!file) return
    setBusy(true)
    setError(null)
    setResult(null)
    let opened: Awaited<ReturnType<typeof openForRendering>> | null = null
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      opened = await openForRendering(bytes)

      const collected: PageText[] = []
      for (let page = 1; page <= opened.numPages; page += 1) {
        const items = (await pageTextItems(opened, page))
          .map((item) => ('str' in item ? { str: String(item.str), hasEOL: Boolean(item.hasEOL) } : null))
          .filter((entry): entry is { str: string; hasEOL: boolean } => entry !== null)
        collected.push({ pageNumber: page, text: joinItems(items), items: items.length })
      }

      const text = documentText(collected)
      const paragraphs = paragraphsFromText(text)
      const blob = await buildDocx(paragraphs)

      setResult({ blob, name: docxName(file.name), pages: collected })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The document could not be built.')
    } finally {
      void opened?.destroy?.()
      setBusy(false)
    }
  }

  const summary = result ? extractionSummary(result.pages) : null
  const words = result ? result.pages.reduce((total, page) => total + countWords(page.text), 0) : 0
  const blank = result ? result.pages.filter((page) => page.text.trim() === '').length : 0

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="Choose the PDF">
        <FileDrop
          accept="application/pdf,.pdf"
          label="Drop a PDF here, or choose one"
          hint="Read in this browser tab and never uploaded."
          maxFileSizeBytes={50 * 1024 * 1024}
          onFiles={(files) => void handleFile(files)}
        />
        {file && pageCount !== null && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <StatTile label="File" value={file.name} />
            <StatTile label="Pages" value={String(pageCount)} />
          </div>
        )}
      </ToolPanel>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void handleConvert()} disabled={busy || !file} size="lg">
          {busy ? (
            <>
              <Spinner size={16} label="Converting" />
              Building the document…
            </>
          ) : (
            <>
              <Icon name="file-text" size={16} />
              Convert to Word
            </>
          )}
        </Button>
      </div>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {result && (
        <ToolPanel title="Word document built" className="border-success/30">
          <div className="mb-3 grid gap-3 sm:grid-cols-3">
            <StatTile label="Words" value={words.toLocaleString()} />
            <StatTile label="Pages read" value={String(result.pages.length)} />
            <StatTile label="Blank pages" value={String(blank)} />
          </div>

          {summary && <p className="mb-3 text-sm text-fg">{summary}</p>}

          {blank > 0 && (
            <p className="mb-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-fg">
              {blank} page{blank === 1 ? '' : 's'} had no text layer at all. {SCAN_NOTE}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <DownloadButton blob={result.blob} filename={result.name} label="Download the .docx" size="md" />
          </div>

          <p className="mt-3 text-xs text-muted">
            The document contains the text extracted from the PDF in reading order. Formatting, images, tables and
            columns are not preserved, because this tool reads the text layer rather than reconstructing the layout.
            For a scan or photographed document, the text layer is empty and nothing can be extracted without OCR,
            which this tool does not do.
          </p>
        </ToolPanel>
      )}
    </div>
  )
}
