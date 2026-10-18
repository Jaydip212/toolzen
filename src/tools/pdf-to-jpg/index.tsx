import { useCallback, useState } from 'react'
import JSZip from 'jszip'

import { DownloadButton, FileDrop, ToolPanel } from '@/tools/shared'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { SegmentedControl } from '@/tools/shared'
import { StatTile } from '@/components/tools/StatTile'
import { formatBytes } from '@/lib/utils'
import { baseName } from '@/lib/download'
import { openPdf } from '@/lib/pdf'
import { EXPORT_WIDTH, openForRendering, renderPage } from '@/lib/pdf-render'

/** The output scales on offer, in pixels wide. */
const SCALES = [
  { value: String(EXPORT_WIDTH), label: '150 DPI' },
  { value: '850', label: '72 DPI' },
  { value: '2550', label: '300 DPI' },
]

/** Render each page of a PDF as a JPG image. */
export default function PdfToJpg() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [scale, setScale] = useState(String(EXPORT_WIDTH))
  const [quality, setQuality] = useState(85)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ blob: Blob; name: string; count: number } | null>(null)

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

  async function handleConvert() {
    if (!file || pageCount === null) return
    setBusy(true)
    setDone(0)
    setError(null)
    setResult(null)
    let opened: Awaited<ReturnType<typeof openForRendering>> | null = null

    try {
      opened = await openForRendering(new Uint8Array(await file.arrayBuffer()))
      const width = Number(scale)
      const zip = new JSZip()
      const stem = baseName(file.name)

      for (let page = 1; page <= opened.numPages; page += 1) {
        const rendered = await renderPage(opened, page, width, 'image/jpeg', quality / 100)
        const bytes = Uint8Array.from(atob(rendered.dataUrl.split(',')[1]), (ch) => ch.charCodeAt(0))
        const name = `${stem}-p${String(page).padStart(String(pageCount).length, '0')}.jpg`
        zip.file(name, bytes.buffer as ArrayBuffer)
        setDone(page)
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      setResult({ blob, name: `${stem}-pages.zip`, count: opened.numPages })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The pages could not be rendered.')
    } finally {
      void opened?.destroy?.()
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
            <StatTile label="Pages to render" value={String(pageCount)} />
          </div>
        )}
      </ToolPanel>

      <ToolPanel title="2. Choose the output">
        <SegmentedControl
          label="Resolution"
          options={SCALES}
          value={scale}
          onChange={(value) => {
            setScale(value)
            setResult(null)
          }}
        />

        <div className="mt-4">
          <label htmlFor="jpg-quality" className="text-sm font-medium text-fg">
            JPEG quality — {quality}%
          </label>
          <input
            id="jpg-quality"
            type="range"
            min={40}
            max={100}
            step={5}
            value={quality}
            onChange={(event) => {
              setQuality(Number(event.target.value))
              setResult(null)
            }}
            className="mt-2 w-full"
          />
        </div>

        <p className="mt-3 text-xs text-muted">
          Each page is drawn at the chosen width and saved as a JPEG. Transparent areas are painted white, because JPEG
          has no way to keep them. Several pages download as one ZIP, named with the page number padded so the files
          sort correctly.
        </p>
      </ToolPanel>

      {busy && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Spinner size={16} label="Rendering" />
          Rendering page {done} of {pageCount}…
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {result ? (
        <ToolPanel title="Ready" className="border-success/30">
          <div className="flex flex-wrap items-center gap-3">
            <DownloadButton
              blob={result.blob}
              filename={result.name}
              label={`Download ${result.count} page${result.count === 1 ? '' : 's'} as a ZIP`}
              size="md"
            />
            <span className="text-sm text-muted">
              {formatBytes(result.blob.size)} — {result.name}
            </span>
          </div>
        </ToolPanel>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void handleConvert()} disabled={busy || pageCount === null} size="lg">
            {busy ? (
              <>
                <Spinner size={16} label="Rendering" />
                Rendering…
              </>
            ) : (
              <>
                <Icon name="image" size={16} />
                Render {pageCount ?? 0} page{pageCount === 1 ? '' : 's'}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
