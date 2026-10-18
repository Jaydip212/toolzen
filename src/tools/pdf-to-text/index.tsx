import { useCallback, useState } from 'react'

import { DownloadButton, FileDrop, ToolPanel } from '@/tools/shared'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { Checkbox } from '@/components/ui/Form'
import { StatTile } from '@/components/tools/StatTile'
import { readPdfHeader } from '@/lib/pdf'
import { openForRendering, pageTextItems } from '@/lib/pdf-render'

import { SCAN_NOTE, countWords, documentText, joinItems, textName, type PageText } from './logic'

/** Extract the selectable text from a PDF. */
export default function PdfToText() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState<string | null>(null)
  const [pages, setPages] = useState<PageText[]>([])
  const [withMarkers, setWithMarkers] = useState(true)

  const handleFile = useCallback(async (files: File[]) => {
    const chosen = files[0] ?? null
    setFile(chosen)
    setText(null)
    setPages([])
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
      // The page count comes from the reader rather than the header, because a
      // wrong page count in the header is one of the ways a PDF is broken.
      const opened = await openForRendering(bytes)
      setPageCount(opened.numPages)
      await opened.destroy?.()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That file could not be read.')
    }
  }, [])

  async function handleExtract() {
    if (!file) return
    setBusy(true)
    setError(null)
    setText(null)
    setPages([])
    let opened: Awaited<ReturnType<typeof openForRendering>> | null = null
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      // The text lives behind pdfjs's reader rather than the editor, because
      // the editor has no text layer API.
      opened = await openForRendering(bytes)

      const collected: PageText[] = []
      for (let page = 1; page <= opened.numPages; page += 1) {
        const items = (await pageTextItems(opened, page))
          .map((item) => ('str' in item ? { str: String(item.str), hasEOL: Boolean(item.hasEOL) } : null))
          .filter((entry): entry is { str: string; hasEOL: boolean } => entry !== null)
        collected.push({ pageNumber: page, text: joinItems(items), items: items.length })
      }

      setPages(collected)
      setText(documentText(collected, withMarkers))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The text could not be extracted.')
    } finally {
      void opened?.destroy?.()
      setBusy(false)
    }
  }

  const words = pages.reduce((total, page) => total + countWords(page.text), 0)
  const blank = pages.filter((page) => page.text.trim() === '').length

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="Choose the PDF">
        <FileDrop
          accept="application/pdf,.pdf"
          label="Drop a PDF here, or choose one"
          hint="Read in this browser tab and never uploaded."
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
        <Button onClick={() => void handleExtract()} disabled={busy || !file} size="lg">
          {busy ? (
            <>
              <Spinner size={16} label="Extracting" />
              Reading the text layer…
            </>
          ) : (
            <>
              <Icon name="file-text" size={16} />
              Extract the text
            </>
          )}
        </Button>
        {pages.length > 0 && (
          <Checkbox
            label="Mark page breaks in the output"
            checked={withMarkers}
            onChange={(event) => {
              setWithMarkers(event.target.checked)
              setText(documentText(pages, event.target.checked))
            }}
          />
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {text !== null && (
        <ToolPanel title="The text">
          <div className="mb-3 grid gap-3 sm:grid-cols-3">
            <StatTile label="Words" value={words.toLocaleString()} />
            <StatTile label="Pages" value={String(pages.length)} />
            <StatTile label="Pages with no text" value={String(blank)} />
          </div>

          {blank > 0 && (
            <p className="mb-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-fg">
              {blank} page{blank === 1 ? '' : 's'} had no text layer at all. {SCAN_NOTE}
            </p>
          )}

          <pre className="max-h-96 overflow-auto rounded-xl border border-line bg-surface-2/40 p-3 text-xs text-fg">
            {text === '' ? '(nothing was extracted)' : text}
          </pre>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <DownloadButton text={text} filename={textName(file?.name ?? 'document.pdf')} label="Download the text" size="md" />
            <span className="text-xs text-muted">
              Saved as plain text with the pages in document order.
            </span>
          </div>
        </ToolPanel>
      )}
    </div>
  )
}
