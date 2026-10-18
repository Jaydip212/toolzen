import { useCallback, useState } from 'react'

import { DownloadButton, FileDrop, SegmentedControl, ToolPanel } from '@/tools/shared'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { Input } from '@/components/ui/Form'
import { StatTile } from '@/components/tools/StatTile'
import { baseName } from '@/lib/download'
import { openPdf } from '@/lib/pdf'

import {
  POSITIONS,
  DIAGONAL_ANGLE,
  stampOrigin,
  strengthWarning,
  watermarkError,
  watermarkSummary,
  type WatermarkPosition,
} from './logic'

const OPTIONS = POSITIONS.map((entry) => ({ value: entry.value, label: entry.label }))

/** Stamp text across every page of a PDF. */
export default function AddWatermark() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [text, setText] = useState('CONFIDENTIAL')
  const [position, setPosition] = useState<WatermarkPosition>('diagonal')
  const [opacity, setOpacity] = useState(20)
  const [size, setSize] = useState(48)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null)

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

  const strength = opacity / 100
  const warning = strengthWarning(strength)
  const blocked = watermarkError(pageCount ?? 0, text, strength)
  const summary = watermarkSummary(pageCount ?? 0, position)

  async function handleApply() {
    if (!file || pageCount === null || blocked) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const { StandardFonts, rgb, degrees } = await import('pdf-lib')
      const opened = await openPdf(new Uint8Array(await file.arrayBuffer()))
      if (!opened.ok) {
        setError(opened.error)
        return
      }
      const document = opened.document
      const font = await document.embedFont(StandardFonts.HelveticaBold)

      for (const page of document.getPages()) {
        const textWidth = font.widthOfTextAtSize(text, size)
        const textHeight = size
        const origin = stampOrigin(page.getWidth(), page.getHeight(), textWidth, textHeight, position)

        page.drawText(text, {
          x: origin.x,
          y: origin.y,
          size,
          font,
          color: rgb(0.55, 0.55, 0.55),
          opacity: strength,
          rotate: origin.rotate ? degrees(DIAGONAL_ANGLE) : degrees(0),
        })
      }

      const saved = await document.save()
      setResult({
        blob: new Blob([saved.buffer as ArrayBuffer], { type: 'application/pdf' }),
        name: `${baseName(file.name)}-stamped.pdf`,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The watermark could not be added.')
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

      <ToolPanel title="2. Choose the stamp">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="watermark-text"
            label="Text"
            value={text}
            maxLength={60}
            onChange={(event) => {
              setText(event.target.value)
              setResult(null)
            }}
            hint="Up to sixty characters. Longer text overflows the page it is measured against."
          />
          <Input
            id="watermark-size"
            type="number"
            label="Text size in points"
            value={String(size)}
            min={8}
            max={200}
            step={1}
            onChange={(event) => setSize(Number(event.target.value))}
            hint="48 is a normal stamp on an A4 page."
          />
        </div>

        <div className="mt-4">
          <SegmentedControl label="Position" options={OPTIONS} value={position} onChange={(value) => setPosition(value as WatermarkPosition)} />
        </div>

        <div className="mt-4">
          <label htmlFor="watermark-strength" className="text-sm font-medium text-fg">
            Strength — {opacity}%
          </label>
          <input
            id="watermark-strength"
            type="range"
            min={5}
            max={100}
            step={5}
            value={opacity}
            onChange={(event) => {
              setOpacity(Number(event.target.value))
              setResult(null)
            }}
            className="mt-2 w-full"
          />
          {warning && (
            <p className="mt-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-fg">{warning}</p>
          )}
        </div>

        <p className="mt-4 text-sm text-fg">{summary}</p>
        <p className="mt-1 text-xs text-muted">
          The stamp is drawn over the page content, so it cannot be removed by the person who receives the file — but it
          also means anything underneath is partly covered. That is the trade a watermark makes.
        </p>
      </ToolPanel>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {result ? (
        <ToolPanel title="Stamped" className="border-success/30">
          <div className="flex flex-wrap items-center gap-3">
            <DownloadButton blob={result.blob} filename={result.name} label="Download the stamped PDF" size="md" />
            <span className="text-sm text-muted">{result.name}</span>
          </div>
        </ToolPanel>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void handleApply()} disabled={busy || blocked !== null} size="lg">
            {busy ? (
              <>
                <Spinner size={16} label="Stamping" />
                Stamping…
              </>
            ) : (
              <>
                <Icon name="droplet" size={16} />
                Add the watermark
              </>
            )}
          </Button>
          {blocked && <span className="text-sm text-danger">{blocked}</span>}
        </div>
      )}
    </div>
  )
}
