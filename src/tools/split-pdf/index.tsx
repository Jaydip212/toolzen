import { useCallback, useState } from 'react'
import JSZip from 'jszip'

import { DownloadButton, FileDrop, ToolPanel } from '@/tools/shared'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Form'
import { SegmentedControl } from '@/tools/shared'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { baseName } from '@/lib/download'
import { openPdf } from '@/lib/pdf'

import { planSplit, splitError, splitSummary, type SplitMode } from './logic'

const MODES = [
  { value: 'ranges', label: 'By page ranges' },
  { value: 'every-page', label: 'Every page separately' },
]

/** Split a PDF into several documents, by ranges or into single pages. */
export default function SplitPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [mode, setMode] = useState<SplitMode>('ranges')
  const [rangeText, setRangeText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [download, setDownload] = useState<{ blob: Blob; name: string; count: number } | null>(null)

  const handleFile = useCallback(async (files: File[]) => {
    const chosen = files[0] ?? null
    setFile(chosen)
    setDownload(null)
    setError(null)
    setPageCount(null)
    if (!chosen) return

    try {
      const bytes = new Uint8Array(await chosen.arrayBuffer())
      const opened = await openPdf(bytes)
      if (!opened.ok) {
        setError(opened.error)
        return
      }
      setPageCount(opened.document.getPageCount())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That file could not be read.')
    }
  }, [])

  const stem = file ? baseName(file.name) : 'document'
  const plan = planSplit(mode, rangeText, pageCount ?? 0, stem)
  const blocked = splitError(pageCount ?? 0, plan.parts.length)

  async function handleSplit() {
    if (!file || !plan.ok) return
    setBusy(true)
    setError(null)
    setDownload(null)
    try {
      const { PDFDocument } = await import('pdf-lib')
      const bytes = new Uint8Array(await file.arrayBuffer())
      const source = await openPdf(bytes)
      if (!source.ok) {
        setError(source.error)
        return
      }

      const outputs: Array<{ name: string; bytes: Uint8Array }> = []
      for (const part of plan.parts) {
        const piece = await PDFDocument.create()
        const copied = await piece.copyPages(source.document, part.pages.map((page) => page - 1))
        for (const page of copied) piece.addPage(page)
        outputs.push({ name: part.fileName, bytes: await piece.save() })
      }

      if (outputs.length === 1) {
        const only = outputs[0]
        setDownload({
          blob: new Blob([only.bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
          name: only.name,
          count: 1,
        })
        return
      }

      const zip = new JSZip()
      for (const output of outputs) zip.file(output.name, output.bytes.buffer as ArrayBuffer)
      const blob = await zip.generateAsync({ type: 'blob' })
      setDownload({ blob, name: `${stem}-split.zip`, count: outputs.length })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The split could not be completed.')
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

      <ToolPanel title="2. Choose how to split">
        <SegmentedControl
          label="Split mode"
          options={MODES}
          value={mode}
          onChange={(value) => {
            setMode(value as SplitMode)
            setDownload(null)
          }}
        />

        {mode === 'ranges' ? (
          <div className="mt-4">
            <label htmlFor="ranges" className="text-sm font-medium text-fg">
              Page ranges, one output file per comma-separated group
            </label>
            <Textarea
              id="ranges"
              value={rangeText}
              onChange={(event) => {
                setRangeText(event.target.value)
                setDownload(null)
              }}
              rows={2}
              spellCheck={false}
              placeholder="1-3, 4-6, 7"
              className="mt-2 font-mono text-sm"
            />
            <p className="mt-2 text-xs text-muted">
              A single page is just its number. A trailing dash means “to the end”, as in 7-, and a leading dash means
              “from the start”, as in -3.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Every page becomes its own file, numbered from 1. The ranges box is ignored.
          </p>
        )}
      </ToolPanel>

      {error && <ErrorState title="The file could not be split" message={error} />}

      {plan.ok && plan.parts.length > 0 && (
        <ToolPanel title="3. Check the output files">
          <p className="mb-3 text-sm text-fg">{splitSummary(plan.parts)}</p>
          <ul className="flex flex-col gap-1.5">
            {plan.parts.slice(0, 12).map((part) => (
              <li key={part.fileName} className="flex items-center gap-2 text-sm text-muted">
                <Icon name="file-text" size={14} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate text-fg">{part.fileName}</span>
                <span className="shrink-0">
                  {part.pages.length} page{part.pages.length === 1 ? '' : 's'} ({part.label})
                </span>
              </li>
            ))}
          </ul>
          {plan.parts.length > 12 && (
            <p className="mt-2 text-xs text-muted">…and {plan.parts.length - 12} more.</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              onClick={() => void handleSplit()}
              disabled={busy || blocked !== null || !file}
              size="lg"
            >
              {busy ? (
                <>
                  <Spinner size={16} label="Splitting" />
                  Splitting…
                </>
              ) : (
                <>
                  <Icon name="scissors" size={16} />
                  Split into {plan.parts.length} file{plan.parts.length === 1 ? '' : 's'}
                </>
              )}
            </Button>
            {blocked && <span className="text-sm text-danger">{blocked}</span>}
          </div>
        </ToolPanel>
      )}

      {plan.ok === false && plan.error && (
        <p className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-fg">{plan.error}</p>
      )}

      {download ? (
        <ToolPanel title="Ready" className="border-success/30">
          <div className="flex flex-wrap items-center gap-3">
            <DownloadButton
              blob={download.blob}
              filename={download.name}
              label={download.count === 1 ? 'Download the PDF' : `Download ${download.count} files as a ZIP`}
              size="md"
            />
            <span className="text-sm text-muted">{download.name}</span>
          </div>
        </ToolPanel>
      ) : (
        pageCount === null &&
        !file && (
          <EmptyState
            icon="scissors"
            title="Choose a PDF to split"
            description="The output files are listed before anything is written, so you can see exactly what you will get."
          />
        )
      )}
    </div>
  )
}
