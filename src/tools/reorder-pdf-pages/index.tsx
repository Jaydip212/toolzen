import { useCallback, useMemo, useState } from 'react'

import { DownloadButton, FileDrop, ToolPanel } from '@/tools/shared'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Form'
import { StatTile } from '@/components/tools/StatTile'
import { openPdf } from '@/lib/pdf'

import { identityOrder, isReordered, planReorder, reorderSummary } from './logic'

/** Change the order of the pages without touching their content. */
export default function ReorderPdfPages() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [order, setOrder] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null)

  const handleFile = useCallback(async (files: File[]) => {
    const chosen = files[0] ?? null
    setFile(chosen)
    setResult(null)
    setError(null)
    setPageCount(null)
    setOrder([])
    if (!chosen) return

    try {
      const opened = await openPdf(new Uint8Array(await chosen.arrayBuffer()))
      if (!opened.ok) {
        setError(opened.error)
        return
      }
      const count = opened.document.getPageCount()
      setPageCount(count)
      setOrder(identityOrder(count))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That file could not be read.')
    }
  }, [])

  const text = order.join(', ')
  const plan = planReorder(text, pageCount ?? 0)
  const changed = isReordered(order, pageCount ?? 0)

  const move = (index: number, direction: -1 | 1) => {
    setResult(null)
    setOrder((current) => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
  }

  // The rendered list is capped so a 400-page document does not create 400 rows.
  const visible = useMemo(() => order.slice(0, 60), [order])

  async function handleApply() {
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

      const reordered = await PDFDocument.create()
      const copied = await reordered.copyPages(
        opened.document,
        plan.order.map((page) => page - 1),
      )
      for (const page of copied) reordered.addPage(page)

      const saved = await reordered.save()
      setResult({
        blob: new Blob([saved.buffer as ArrayBuffer], { type: 'application/pdf' }),
        name: file.name.replace(/\.pdf$/i, '') + '-reordered.pdf',
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The order could not be applied.')
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

      {order.length > 0 && (
        <ToolPanel title="2. Set the new order">
          <p className="text-sm text-fg">{reorderSummary(pageCount ?? 0)}</p>

          <div className="mt-3">
            <label htmlFor="new-order" className="text-sm font-medium text-fg">
              Or type the whole order, one page number per comma
            </label>
            <Textarea
              id="new-order"
              value={text}
              onChange={(event) => {
                setResult(null)
                const typed = planReorder(event.target.value, pageCount ?? 0)
                if (typed.ok) setOrder(typed.order)
              }}
              rows={2}
              spellCheck={false}
              className="mt-2 font-mono text-sm"
            />
            {!plan.ok && <p className="mt-2 text-xs text-warning">{plan.error}</p>}
          </div>

          <ol className="mt-4 flex flex-col gap-1.5">
            {visible.map((page, index) => (
              <li
                key={`${page}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-line bg-surface-2/30 px-3 py-2 text-sm"
              >
                <span className="w-16 shrink-0 text-muted">position {index + 1}</span>
                <Icon name="arrow-right" size={14} className="shrink-0 text-muted" />
                <span className="min-w-0 flex-1 font-medium text-fg">page {page}</span>
                <span className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move page ${page} earlier`}
                  >
                    <Icon name="chevron-right" size={14} className="rotate-[-90deg]" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => move(index, 1)}
                    disabled={index === visible.length - 1}
                    aria-label={`Move page ${page} later`}
                  >
                    <Icon name="chevron-right" size={14} className="rotate-90" />
                  </Button>
                </span>
              </li>
            ))}
          </ol>
          {order.length > visible.length && (
            <p className="mt-2 text-xs text-muted">
              Showing the first {visible.length} of {order.length} positions. Use the field above to set the rest.
            </p>
          )}
        </ToolPanel>
      )}

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {result ? (
        <ToolPanel title="Reordered" className="border-success/30">
          <div className="flex flex-wrap items-center gap-3">
            <DownloadButton blob={result.blob} filename={result.name} label="Download the reordered PDF" size="md" />
            <span className="text-sm text-muted">{result.name}</span>
          </div>
        </ToolPanel>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void handleApply()} disabled={busy || !plan.ok || !changed} size="lg">
            {busy ? (
              <>
                <Spinner size={16} label="Applying" />
                Applying…
              </>
            ) : (
              <>
                <Icon name="sort" size={16} />
                Apply the new order
              </>
            )}
          </Button>
          {!changed && order.length > 0 && (
            <span className="text-sm text-muted">Move a page first — the current order is the document's own.</span>
          )}
        </div>
      )}
    </div>
  )
}
