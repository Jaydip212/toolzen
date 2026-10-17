import { useState } from 'react'

import { ToolPanel } from '@/tools/shared'
import { FileDrop } from '@/tools/shared'
import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton } from '@/tools/shared'
import { Select } from '@/components/ui/Form'
import { PDFDocument } from 'pdf-lib'
import { formatBytes } from '@/lib/utils'
import { withExtension } from '@/lib/image-format'

const PAGES = [
  { label: 'A4 portrait (210 × 297 mm)', value: 'a4-portrait', width: 595.28, height: 841.89 },
  { label: 'A4 landscape (297 × 210 mm)', value: 'a4-landscape', width: 841.89, height: 595.28 },
  { label: 'US Letter portrait (8.5 × 11 in)', value: 'letter-portrait', width: 612, height: 792 },
  { label: 'US Letter landscape (11 × 8.5 in)', value: 'letter-landscape', width: 792, height: 612 },
]

/**
 * Put images into a PDF.
 *
 * Each image becomes one page. The image is scaled to fit the page with a
 * margin, and the aspect ratio is always kept — a landscape photo on a portrait
 * page is letterboxed, never stretched.
 */
export default function ImageToPdf() {
  const [files, setFiles] = useState<File[]>([])
  const [page, setPage] = useState('a4-portrait')
  const [marginMm, setMarginMm] = useState(10)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ blob: Blob; pages: number } | null>(null)

  async function handleBuild() {
    if (files.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const chosen = PAGES.find((entry) => entry.value === page) ?? PAGES[0]
      // 1mm in PDF points is 2.8346; a page's origin is bottom-left.
      const margin = marginMm * 2.8346
      const pdf = await PDFDocument.create()

      let embedded = 0
      for (const file of files) {
        const image = await decode(file)
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        const context = canvas.getContext('2d')
        if (!context) throw new Error('This browser refused to create a canvas.')

        // JPEG has no alpha, so flatten onto white first: a transparent PNG
        // would otherwise embed as black.
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0)

        const asJpeg = canvas.toDataURL('image/jpeg', 0.92)
        const bytes = Uint8Array.from(atob(asJpeg.split(',')[1]), (ch) => ch.charCodeAt(0))
        const jpeg = await pdf.embedJpg(bytes)

        const available = {
          width: chosen.width - margin * 2,
          height: chosen.height - margin * 2,
        }
        const scale = Math.min(
          available.width / jpeg.width,
          available.height / jpeg.height,
        )
        const drawWidth = jpeg.width * scale
        const drawHeight = jpeg.height * scale

        const pageDoc = pdf.addPage([chosen.width, chosen.height])
        pageDoc.drawImage(jpeg, {
          x: (chosen.width - drawWidth) / 2,
          y: (chosen.height - drawHeight) / 2,
          width: drawWidth,
          height: drawHeight,
        })
        embedded += 1
      }

      const blob = new Blob([(await pdf.save()).buffer as ArrayBuffer], { type: 'application/pdf' })
      setResult({ blob, pages: embedded })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The PDF could not be built.')
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <FileDrop
        accept="image/*"
        multiple
        onFiles={(files) => {
          setFiles(files)
          setResult(null)
          setError(null)
        }}
        hint="Each image becomes one page, in the order you add them."
      />

      {files.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile label="Images" value={String(files.length)} />
          <StatTile label="Total size" value={formatBytes(files.reduce((sum, file) => sum + file.size, 0))} />
        </div>
      )}

      <ToolPanel title="Page">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select id="page-size" label="Page size" value={page} onChange={(event) => setPage(event.target.value)}>
            {PAGES.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </Select>
          <div>
            <label htmlFor="margin" className="text-sm font-medium text-fg">
              Margin — {marginMm} mm
            </label>
            <input
              id="margin"
              type="range"
              min={0}
              max={40}
              value={marginMm}
              onChange={(event) => setMarginMm(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          An image is scaled to fit inside the page and centred, so the aspect ratio is never changed. Transparent PNGs
          are flattened onto white, because PDF has no way to keep see-through areas over a page background.
        </p>
      </ToolPanel>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleBuild()}
          disabled={busy || files.length === 0}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg disabled:opacity-50"
        >
          {busy ? 'Building…' : `Build PDF (${files.length} page${files.length === 1 ? '' : 's'})`}
        </button>
        {result && (
          <DownloadButton
            filename={files.length === 1 ? withExtension(files[0].name, 'pdf') : 'images.pdf'}
            blob={result.blob}
            label="Download PDF"
          />
        )}
      </div>

      {error && (
        <ToolPanel title="That did not work">
          <p className="text-sm text-danger">{error}</p>
        </ToolPanel>
      )}

      {result && (
        <ToolPanel title="PDF built">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile label="Pages" value={String(result.pages)} />
            <StatTile label="File size" value={formatBytes(result.blob.size)} />
          </div>
          <p className="mt-3 text-xs text-muted">
            Images are embedded as JPEG at 92% quality. That keeps the file small, and re-encoding means the PDF is not
            a pixel-identical copy of your originals.
          </p>
        </ToolPanel>
      )}
    </div>
  )
}

function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') return createImageBitmap(file)
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('That image could not be decoded.'))
    image.src = URL.createObjectURL(file)
  })
}
