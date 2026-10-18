import { useCallback, useEffect, useRef, useState } from 'react'

import { DownloadButton, FileDrop, ToolPanel } from '@/tools/shared'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { StatTile } from '@/components/tools/StatTile'
import { openPdf } from '@/lib/pdf'
import { openForRendering, renderPage, THUMBNAIL_WIDTH } from '@/lib/pdf-render'
import { baseName } from '@/lib/download'

import { countTurns, organizeSummary, planOrganize } from './logic'

interface Chips {
  order: number[]
  removed: number[]
  turns: Map<number, number>
}

/**
 * Rearrange, remove and turn pages from one grid.
 *
 * The grid holds the three operations together because doing them in sequence
 * through three tools loses the picture: the only honest way to show what the
 * result will be is to draw the pages as they will appear.
 */
export default function OrganizePdf() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [thumbs, setThumbs] = useState<Record<number, string>>({})
  const [chips, setChips] = useState<Chips>({ order: [], removed: [], turns: new Map() })
  const [rendering, setRendering] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null)
  const bytesRef = useRef<Uint8Array | null>(null)

  const reset = useCallback(() => {
    setFile(null)
    setPageCount(null)
    setThumbs({})
    setChips({ order: [], removed: [], turns: new Map() })
    setResult(null)
    setError(null)
    bytesRef.current = null
  }, [])

  const handleFile = useCallback(
    async (files: File[]) => {
      const chosen = files[0] ?? null
      reset()
      if (!chosen) return
      setFile(chosen)

      try {
        const bytes = new Uint8Array(await chosen.arrayBuffer())
        bytesRef.current = bytes

        const opened = await openPdf(bytes)
        if (!opened.ok) {
          setError(opened.error)
          return
        }
        const count = opened.document.getPageCount()
        setPageCount(count)
        setChips({
          order: Array.from({ length: count }, (_, index) => index + 1),
          removed: [],
          turns: new Map(),
        })
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'That file could not be read.')
      }
    },
    [reset],
  )

  // Draw the thumbnails once the document is open.
  useEffect(() => {
    const bytes = bytesRef.current
    if (!bytes || pageCount === null || pageCount < 1) return

    let cancelled = false
    async function renderAll() {
      setRendering(true)
      let opened: Awaited<ReturnType<typeof openForRendering>> | null = null
      try {
        opened = await openForRendering(bytes!)
        for (let page = 1; page <= opened.numPages; page += 1) {
          if (cancelled) return
          const rendered = await renderPage(opened, page, THUMBNAIL_WIDTH)
          if (cancelled) return
          setThumbs((current) => ({ ...current, [page]: rendered.dataUrl }))
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'The pages could not be drawn.')
        }
      } finally {
        // Freeing the worker matters more than it looks: a document kept open
        // pins its worker thread, and reorganising several documents in one
        // session is the normal way to use this tool.
        void opened?.destroy?.()
        if (!cancelled) setRendering(false)
      }
    }

    void renderAll()
    return () => {
      cancelled = true
    }
  }, [pageCount])

  const plan = planOrganize(chips.order, chips.removed, chips.turns)
  const turned = countTurns(chips.turns)
  const summary = organizeSummary(plan.keep, chips.removed, turned)
  const unchanged = chips.removed.length === 0 && turned === 0 && chips.order.every((page, index) => page === index + 1)

  const move = (index: number, direction: -1 | 1) => {
    setResult(null)
    setChips((current) => {
      const target = index + direction
      if (target < 0 || target >= current.order.length) return current
      const order = [...current.order]
      const [moved] = order.splice(index, 1)
      order.splice(target, 0, moved)
      return { ...current, order }
    })
  }

  const turn = (page: number, by: number) => {
    setResult(null)
    setChips((current) => {
      const turns = new Map(current.turns)
      const next = (((turns.get(page) ?? 0) + by) % 360 + 360) % 360
      if (next === 0) turns.delete(page)
      else turns.set(page, next)
      return { ...current, turns }
    })
  }

  async function handleBuild() {
    if (!file || !plan.ok) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const { PDFDocument, degrees } = await import('pdf-lib')
      const bytes = bytesRef.current ?? new Uint8Array(await file.arrayBuffer())
      const opened = await openPdf(bytes)
      if (!opened.ok) {
        setError(opened.error)
        return
      }

      const built = await PDFDocument.create()
      const copied = await built.copyPages(
        opened.document,
        plan.keep.map((page) => page - 1),
      )

      for (let index = 0; index < copied.length; index += 1) {
        const extra = plan.turns[index] ?? 0
        const page = copied[index]
        if (extra !== 0) {
          page.setRotation(degrees(page.getRotation().angle + extra))
        }
        built.addPage(page)
      }

      const saved = await built.save()
      setResult({
        blob: new Blob([saved.buffer as ArrayBuffer], { type: 'application/pdf' }),
        name: `${baseName(file.name)}-organised.pdf`,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The document could not be built.')
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
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <StatTile label="File" value={file.name} />
            <StatTile label="Pages" value={String(pageCount)} />
            <StatTile label="Drawn" value={rendering ? 'drawing…' : `${Object.keys(thumbs).length} of ${pageCount}`} />
          </div>
        )}
      </ToolPanel>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {pageCount !== null && (
        <ToolPanel title="2. Arrange the grid">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-fg">{summary}</span>
            <span className="text-muted">
              {chips.removed.length > 0 || turned > 0 ? 'Changes apply when you press Build.' : 'Nothing changed yet.'}
            </span>
          </div>

          <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {chips.order.map((page, index) => {
              const removed = chips.removed.includes(page)
              const turnAmount = chips.turns.get(page) ?? 0
              return (
                <li
                  key={`${page}-${index}`}
                  className={`rounded-xl border p-2 text-sm ${removed ? 'border-danger/40 bg-danger/5 opacity-60' : 'border-line bg-surface-2/30'}`}
                >
                  <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-surface">
                    {thumbs[page] ? (
                      <img
                        src={thumbs[page]}
                        alt={`Page ${page}`}
                        className="max-h-full max-w-full"
                        style={{ transform: `rotate(${turnAmount}deg)` }}
                      />
                    ) : (
                      <Spinner size={16} label={`Drawing page ${page}`} />
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-muted">
                    <span>
                      slot {index + 1} · page {page}
                      {turnAmount !== 0 && ` · ${turnAmount}°`}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    <Button variant="ghost" size="sm" onClick={() => move(index, -1)} disabled={index === 0 || removed} aria-label={`Move page ${page} earlier`}>
                      <Icon name="chevron-right" size={14} className="rotate-[-90deg]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => move(index, 1)}
                      disabled={index === chips.order.length - 1 || removed}
                      aria-label={`Move page ${page} later`}
                    >
                      <Icon name="chevron-right" size={14} className="rotate-90" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => turn(page, 90)} disabled={removed} aria-label={`Turn page ${page} left`}>
                      <Icon name="rotate-cw" size={14} className="rotate-180" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => turn(page, -90)} disabled={removed} aria-label={`Turn page ${page} right`}>
                      <Icon name="rotate-cw" size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setResult(null)
                        setChips((current) => ({
                          ...current,
                          removed: current.removed.includes(page)
                            ? current.removed.filter((at) => at !== page)
                            : [...current.removed, page],
                        }))
                      }}
                      aria-label={removed ? `Keep page ${page}` : `Remove page ${page}`}
                    >
                      <Icon name={removed ? 'refresh' : 'trash'} size={14} />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </ToolPanel>
      )}

      {result ? (
        <ToolPanel title="Built" className="border-success/30">
          <div className="flex flex-wrap items-center gap-3">
            <DownloadButton blob={result.blob} filename={result.name} label="Download the built PDF" size="md" />
            <span className="text-sm text-muted">{result.name}</span>
          </div>
        </ToolPanel>
      ) : (
        pageCount !== null && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void handleBuild()} disabled={busy || !plan.ok || unchanged} size="lg">
              {busy ? (
                <>
                  <Spinner size={16} label="Building" />
                  Building…
                </>
              ) : (
                <>
                  <Icon name="grid" size={16} />
                  Build the document
                </>
              )}
            </Button>
            {!plan.ok && <span className="text-sm text-danger">{plan.error}</span>}
            {plan.ok && unchanged && <span className="text-sm text-muted">Arrange or remove a page first.</span>}
          </div>
        )
      )}
    </div>
  )
}
