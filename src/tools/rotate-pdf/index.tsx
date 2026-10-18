import { useCallback, useState } from 'react'

import { DownloadButton, FileDrop, SegmentedControl, ToolPanel } from '@/tools/shared'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Form'
import { StatTile } from '@/components/tools/StatTile'
import { baseName } from '@/lib/download'
import { normaliseAngle, openPdf, parsePageGroups } from '@/lib/pdf'

import { TURNS, orientationNote, pagesToRotate, rotationSummary } from './logic'

/** One of the three turns, or "keep as-is". */
const OPTIONS = [{ value: '0', label: 'No turn' }, ...TURNS.map((turn) => ({ value: String(turn.value), label: turn.label }))]

/** Rotate selected pages, or all of them, by a quarter or a half turn. */
export default function RotatePdf() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [turn, setTurn] = useState('90')
  const [scope, setScope] = useState<'all' | 'selected'>('all')
  const [rangeText, setRangeText] = useState('')
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

  const turnBy = Number(turn)
  const parsedSelection = parsePageGroups(rangeText, pageCount ?? 0)
  const selection =
    scope === 'all'
      ? Array.from({ length: pageCount ?? 0 }, (_, index) => index + 1)
      : parsedSelection.selected
  const affected = pagesToRotate(pageCount ?? 0, selection)
  const note = orientationNote(turnBy, affected.length)
  const summary = rotationSummary(turnBy, affected.length)

  let blocked: string | null
  if (pageCount === null) blocked = 'Choose a PDF first.'
  else if (turnBy === 0) blocked = 'Choose a turn to apply.'
  else if (scope === 'selected' && !parsedSelection.ok) blocked = parsedSelection.error
  else if (affected.length === 0) blocked = 'No pages in that selection are inside this document.'
  else blocked = null

  async function handleRotate() {
    if (!file || pageCount === null) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const { degrees } = await import('pdf-lib')
      const opened = await openPdf(new Uint8Array(await file.arrayBuffer()))
      if (!opened.ok) {
        setError(opened.error)
        return
      }
      const document = opened.document
      const pages = document.getPages()

      for (const oneBased of affected) {
        const page = pages[oneBased - 1]
        if (!page) continue
        const current = page.getRotation().angle
        // pdf-lib takes a Rotation, not a bare number.
        page.setRotation(degrees(normaliseAngle(current + turnBy)))
      }

      const saved = await document.save()
      const stem = baseName(file.name)
      setResult({
        blob: new Blob([saved.buffer as ArrayBuffer], { type: 'application/pdf' }),
        name: `${stem}-rotated.pdf`,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The rotation could not be applied.')
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

      <ToolPanel title="2. Choose the turn">
        <SegmentedControl label="Rotation" options={OPTIONS} value={turn} onChange={setTurn} />

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {(['all', 'selected'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setScope(option)}
              aria-pressed={scope === option}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                scope === option
                  ? 'border-brand bg-brand-soft text-brand-fg'
                  : 'border-line bg-surface text-fg hover:border-brand/40'
              }`}
            >
              <span className="block font-medium">{option === 'all' ? 'Every page' : 'Pages I choose'}</span>
              <span className="mt-0.5 block text-xs text-muted">
                {option === 'all'
                  ? 'The whole document turns by the same amount.'
                  : 'Only the pages you list; the rest stay as they are.'}
              </span>
            </button>
          ))}
        </div>

        {scope === 'selected' && (
          <div className="mt-4">
            <label htmlFor="rotate-ranges" className="text-sm font-medium text-fg">
              Pages to turn
            </label>
            <Textarea
              id="rotate-ranges"
              value={rangeText}
              onChange={(event) => {
                setRangeText(event.target.value)
                setResult(null)
              }}
              rows={2}
              spellCheck={false}
              placeholder="1-3, 7"
              className="mt-2 font-mono text-sm"
            />
          </div>
        )}

        <p className="mt-4 text-sm text-fg">{summary}</p>
        {note && <p className="mt-1 text-xs text-warning">{note}</p>}
        <p className="mt-1 text-xs text-muted">
          Rotation is stored as an angle, so the page content is not re-drawn and no quality is lost. A page that
          already had a rotation keeps it and turns further.
        </p>
      </ToolPanel>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {result ? (
        <ToolPanel title="Rotated" className="border-success/30">
          <div className="flex flex-wrap items-center gap-3">
            <DownloadButton blob={result.blob} filename={result.name} label="Download the rotated PDF" size="md" />
            <span className="text-sm text-muted">{result.name}</span>
          </div>
        </ToolPanel>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void handleRotate()} disabled={busy || blocked !== null} size="lg">
            {busy ? (
              <>
                <Spinner size={16} label="Rotating" />
                Rotating…
              </>
            ) : (
              <>
                <Icon name="rotate-cw" size={16} />
                Rotate {affected.length} page{affected.length === 1 ? '' : 's'}
              </>
            )}
          </Button>
          {blocked && <span className="text-sm text-danger">{blocked}</span>}
        </div>
      )}
    </div>
  )
}
