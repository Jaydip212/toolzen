import { useCallback, useState } from 'react'

import { DownloadButton, FileDrop, ToolPanel } from '@/tools/shared'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Form'
import { StatTile } from '@/components/tools/StatTile'
import { openPdf } from '@/lib/pdf'

import { extractName, extractSummary, planExtract } from './logic'

/** Pull the pages you select into a brand new PDF. */
export default function ExtractPdfPages() {
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

  const plan = planExtract(rangeText, pageCount ?? 0)

  async function handleExtract() {
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

      const extracted = await PDFDocument.create()
      const copied = await extracted.copyPages(
        opened.document,
        plan.taking.map((page) => page - 1),
      )
      for (const page of copied) extracted.addPage(page)

      const saved = await extracted.save()
      setResult({
        blob: new Blob([saved.buffer as ArrayBuffer], { type: 'application/pdf' }),
        name: extractName(file.name, plan.taking),
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The pages could not be extracted.')
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

      <ToolPanel title="2. Choose the pages to extract">
        <label htmlFor="extract-ranges" className="text-sm font-medium text-fg">
          Pages to extract
        </label>
        <Textarea
          id="extract-ranges"
          value={rangeText}
          onChange={(event) => {
            setRangeText(event.target.value)
            setResult(null)
          }}
          rows={2}
          spellCheck={false}
          placeholder="1-4, 9"
          className="mt-2 font-mono text-sm"
        />
        <p className="mt-2 text-xs text-muted">
          Single pages, ranges, or both. The pages are taken in ascending order, so 9-3 is rejected rather than
          silently reversed. A trailing dash means “to the end”.
        </p>

        <div className="mt-4 rounded-xl border border-line bg-surface-2/40 p-3 text-sm">
          {plan.ok ? (
            <p className="font-medium text-fg">{extractSummary(plan, pageCount ?? 0)}</p>
          ) : (
            <p className="text-warning">{plan.error ?? 'Enter the pages to extract.'}</p>
          )}
        </div>
      </ToolPanel>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {result ? (
        <ToolPanel title="Extracted" className="border-success/30">
          <div className="flex flex-wrap items-center gap-3">
            <DownloadButton blob={result.blob} filename={result.name} label="Download the extracted PDF" size="md" />
            <span className="text-sm text-muted">{result.name}</span>
          </div>
        </ToolPanel>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void handleExtract()} disabled={busy || !plan.ok} size="lg">
            {busy ? (
              <>
                <Spinner size={16} label="Extracting" />
                Extracting…
              </>
            ) : (
              <>
                <Icon name="scan" size={16} />
                Extract {plan.ok ? `${plan.taking.length} page${plan.taking.length === 1 ? '' : 's'}` : 'the pages'}
              </>
            )}
          </Button>
          <span className="text-xs text-muted">The original document is left untouched.</span>
        </div>
      )}
    </div>
  )
}
