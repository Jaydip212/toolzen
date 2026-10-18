import { useCallback, useState } from 'react'

import { DownloadButton, FileDrop, ToolPanel } from '@/tools/shared'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { Input, Select } from '@/components/ui/Form'
import { StatTile } from '@/components/tools/StatTile'
import { baseName } from '@/lib/download'
import { openPdf } from '@/lib/pdf'

import {
  FORMATS,
  POSITIONS,
  fontSizeFor,
  labelFor,
  numberingError,
  numberingSummary,
  positionOf,
  totalNote,
  type NumberFormat,
  type NumberPosition,
} from './logic'

/** Stamp page numbers onto every page of a PDF. */
export default function AddPageNumbers() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [format, setFormat] = useState<NumberFormat>('page-of')
  const [position, setPosition] = useState<NumberPosition>('bottom-center')
  const [startAt, setStartAt] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ blob: Blob; name: string; numbers: number } | null>(null)

  const handleFile = useCallback(async (files: File[]) => {
    const chosen = files[0] ?? null
    setFile(chosen)
    setResult(null)
    setError(null)
    setPageCount(null)
    if (!chosen) return

    try {
      const opened = await openPdf(new Uint8Array(await chosen.arrayBuffer()))
      if (!opened.ok) {
        setError(opened.error)
        return
      }
      setPageCount(opened.document.getPageCount())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That file could not be read.')
    }
  }, [])

  const blocked = numberingError(pageCount ?? 0, startAt)
  const note = totalNote(startAt, pageCount ?? 0)

  async function handleApply() {
    if (!file || pageCount === null || blocked) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const { StandardFonts, rgb } = await import('pdf-lib')
      const opened = await openPdf(new Uint8Array(await file.arrayBuffer()))
      if (!opened.ok) {
        setError(opened.error)
        return
      }
      const document = opened.document
      const font = await document.embedFont(StandardFonts.Helvetica)
      const pages = document.getPages()

      for (let index = 0; index < pages.length; index += 1) {
        const page = pages[index]
        const number = startAt + index
        const text = labelFor(number, pageCount, format)

        // The number is sized against the page it sits on, so a postcard and
        // a poster read the same way.
        const size = fontSizeFor(page.getWidth(), page.getHeight())
        const textWidth = font.widthOfTextAtSize(text, size)
        const at = positionOf(page.getWidth(), page.getHeight(), textWidth, size, position)

        page.drawText(text, {
          x: at.x,
          y: at.y,
          size,
          font,
          // A mid grey reads as furniture rather than content on any page.
          color: rgb(0.35, 0.35, 0.35),
        })
      }

      const saved = await document.save()
      setResult({
        blob: new Blob([saved.buffer as ArrayBuffer], { type: 'application/pdf' }),
        name: `${baseName(file.name)}-numbered.pdf`,
        numbers: pages.length,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The page numbers could not be added.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="1. Choose the PDF">
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

      <ToolPanel title="2. Choose the numbering">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            id="number-format"
            label="Format"
            value={format}
            onChange={(event) => setFormat(event.target.value as NumberFormat)}
          >
            {FORMATS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label} — {entry.value === 'page-of' ? 'counts the whole document' : entry.value}
              </option>
            ))}
          </Select>
          <Select
            id="number-position"
            label="Position"
            value={position}
            onChange={(event) => setPosition(event.target.value as NumberPosition)}
          >
            {POSITIONS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </Select>
          <Input
            id="start-at"
            type="number"
            label="Start numbering at"
            value={String(startAt)}
            min={1}
            step={1}
            onChange={(event) => setStartAt(Number(event.target.value))}
            hint="Leave at 1 for an ordinary document."
          />
        </div>

        <p className="mt-4 text-sm text-fg">{numberingSummary(pageCount ?? 0, startAt, position)}</p>
        {note && <p className="mt-1 text-xs text-muted">{note}</p>}
        <p className="mt-1 text-xs text-muted">
          The number is drawn on top of the page, so it sits over whatever is already there. Grey, and sized to the page,
          so it reads as furniture rather than as content.
        </p>
      </ToolPanel>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {result ? (
        <ToolPanel title="Numbered" className="border-success/30">
          <div className="flex flex-wrap items-center gap-3">
            <DownloadButton blob={result.blob} filename={result.name} label="Download the numbered PDF" size="md" />
            <span className="text-sm text-muted">
              {result.numbers} page{result.numbers === 1 ? '' : 's'} numbered — {result.name}
            </span>
          </div>
        </ToolPanel>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void handleApply()} disabled={busy || blocked !== null} size="lg">
            {busy ? (
              <>
                <Spinner size={16} label="Numbering" />
                Numbering…
              </>
            ) : (
              <>
                <Icon name="hash" size={16} />
                Add page numbers
              </>
            )}
          </Button>
          {blocked && <span className="text-sm text-danger">{blocked}</span>}
        </div>
      )}
    </div>
  )
}
