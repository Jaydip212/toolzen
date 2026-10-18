import { useCallback, useEffect, useRef, useState } from 'react'

import { FileDrop, ToolPanel } from '@/tools/shared'
import { StatTile } from '@/components/tools/StatTile'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { formatBytes } from '@/lib/utils'
import { displayedSize, openPdf } from '@/lib/pdf'
import { openForRendering, renderPage, THUMBNAIL_WIDTH } from '@/lib/pdf-render'

/** Show the pages of a PDF as they will print, before any processing. */
export default function PdfPagePreview() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [thumbs, setThumbs] = useState<Record<number, string>>({})
  const [sizes, setSizes] = useState<Array<{ width: number; height: number; rotation: number }>>([])
  const [drawing, setDrawing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bytesRef = useRef<Uint8Array | null>(null)

  const handleFile = useCallback(async (files: File[]) => {
    const chosen = files[0] ?? null
    setFile(chosen)
    setThumbs({})
    setSizes([])
    setError(null)
    setPageCount(null)
    bytesRef.current = null
    if (!chosen) return

    try {
      const bytes = new Uint8Array(await chosen.arrayBuffer())
      bytesRef.current = bytes
      const opened = await openPdf(bytes)
      if (!opened.ok) {
        setError(opened.error)
        return
      }
      const document = opened.document
      setPageCount(document.getPageCount())
      setSizes(
        document.getPages().map((page) => {
          const stored = page.getSize()
          const rotation = page.getRotation().angle
          const shown = displayedSize(stored.width, stored.height, rotation)
          return { width: shown.width, height: shown.height, rotation }
        }),
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That file could not be read.')
    }
  }, [])

  useEffect(() => {
    const bytes = bytesRef.current
    if (!bytes || pageCount === null || pageCount < 1) return

    let cancelled = false
    async function drawAll() {
      setDrawing(true)
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
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'The pages could not be drawn.')
      } finally {
        void opened?.destroy?.()
        if (!cancelled) setDrawing(false)
      }
    }

    void drawAll()
    return () => {
      cancelled = true
    }
  }, [pageCount])

  const mixed = new Set(sizes.map((size) => `${Math.round(size.width)}×${Math.round(size.height)}`))
  const rotated = sizes.filter((size) => size.rotation % 180 !== 0).length

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="Choose the PDF">
        <FileDrop
          accept="application/pdf,.pdf"
          label="Drop a PDF here, or choose one"
          hint="Read in this browser tab and never uploaded. Nothing is changed."
          onFiles={(files) => void handleFile(files)}
        />
        {file && pageCount !== null && (
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <StatTile label="File" value={file.name} />
            <StatTile label="Pages" value={String(pageCount)} />
            <StatTile label="Size on disk" value={formatBytes(file.size)} />
            <StatTile
              label="Page sizes"
              value={mixed.size === 1 ? [...mixed][0] : `${mixed.size} different`}
            />
          </div>
        )}
      </ToolPanel>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger-8 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {rotated > 0 && (
        <p className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-fg">
          {rotated} page{rotated === 1 ? '' : 's'} {rotated === 1 ? 'is' : 'are'} stored sideways. The sizes shown are
          what a reader sees after the rotation is applied, which is the number that matters for printing.
        </p>
      )}

      {drawing && pageCount !== null && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Spinner size={16} label="Drawing" />
          Drawing page {Object.keys(thumbs).length + 1} of {pageCount}…
        </p>
      )}

      {pageCount !== null && pageCount > 0 && (
        <ToolPanel title="The pages">
          <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => {
              const size = sizes[page - 1]
              return (
                <li key={page} className="rounded-xl border border-line bg-surface-2/30 p-2 text-sm">
                  <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-surface">
                    {thumbs[page] ? (
                      <img src={thumbs[page]} alt={`Page ${page}`} className="max-h-full max-w-full" />
                    ) : (
                      <Spinner size={16} label={`Drawing page ${page}`} />
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted">
                    <span className="font-medium text-fg">page {page}</span>
                    {size && (
                      <span>
                        {Math.round(size.width)} × {Math.round(size.height)}
                        {size.rotation % 180 !== 0 && ` · turned ${size.rotation}°`}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </ToolPanel>
      )}

      {pageCount === null && !error && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Icon name="eye" size={16} />
          Choose a PDF and its pages are drawn here, with the size each one prints at.
        </p>
      )}
    </div>
  )
}
