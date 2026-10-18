import { useCallback, useState } from 'react'

import { DownloadButton, FileDrop, ToolPanel } from '@/tools/shared'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Form'
import { StatTile } from '@/components/tools/StatTile'
import { openPdf } from '@/lib/pdf'

import { deleteName, deleteSummary, planDelete } from './logic'

/** Remove pages from a PDF and keep everything else exactly as it was. */
export default function DeletePdfPages() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
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

  const plan = planDelete(rangeText, pageCount ?? 0)

  async function handleDelete() {
    if (!file || !plan.ok) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const { PDFDocument } = await import('pdf-lib')
      const opened = await openPdf(new Uint8Array(await file.arrayBuffer()))
      if (!opened.ok) {
        setError(opened.error)
        return
      }

      const cleaned = await PDFDocument.create()
      const copied = await cleaned.copyPages(
        opened.document,
        plan.keeping.map((page) => page - 1),
      )
      for (const page of copied) cleaned.addPage(page)

      const saved = await cleaned.save()
      setResult({
        blob: new Blob([saved.buffer as ArrayBuffer], { type: 'application/pdf' }),
        name: deleteName(file.name),
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The pages could not be removed.')
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

      <ToolPanel title="2. Choose the pages to remove">
        <label htmlFor="delete-ranges" className="text-sm font-medium text-fg">
          Pages to delete
        </label>
        <Textarea
          id="delete-ranges"
          value={rangeText}
          onChange={(event) => {
            setRangeText(event.target.value)
            setResult(null)
          }}
          rows={2}
          spellCheck={false}
          placeholder="4, 7-9"
          className="mt-2 font-mono text-sm"
        />
        <p className="mt-2 text-xs text-muted">
          Single pages, ranges, or both, separated by commas. Everything else is kept, in its original order.
        </p>

        <div className="mt-4 rounded-xl border border-line bg-surface-2/40 p-3 text-sm">
          {plan.ok ? (
            <>
              <p className="font-medium text-fg">{deleteSummary(plan)}</p>
              <p className="mt-1 text-xs text-muted">
                Kept: {plan.keeping.slice(0, 24).join(', ')}
                {plan.keeping.length > 24 ? ` …and ${plan.keeping.length - 24} more` : ''}
              </p>
            </>
          ) : (
            <p className="text-warning">{plan.error ?? 'Enter the pages to remove.'}</p>
          )}
        </div>
      </ToolPanel>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {result ? (
        <ToolPanel title="Cleaned up" className="border-success/30">
          <div className="flex flex-wrap items-center gap-3">
            <DownloadButton blob={result.blob} filename={result.name} label="Download the trimmed PDF" size="md" />
            <span className="text-sm text-muted">{result.name}</span>
          </div>
        </ToolPanel>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void handleDelete()} disabled={busy || !plan.ok} size="lg">
            {busy ? (
              <>
                <Spinner size={16} label="Removing" />
                Removing pages…
              </>
            ) : (
              <>
                <Icon name="trash" size={16} />
                Remove {plan.ok ? `${plan.removing.length} page${plan.removing.length === 1 ? '' : 's'}` : 'the pages'}
              </>
            )}
          </Button>
          <span className="text-xs text-muted">The original file on your device is never modified.</span>
        </div>
      )}
    </div>
  )
}
