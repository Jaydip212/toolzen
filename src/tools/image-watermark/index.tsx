import { useState } from 'react'

import { ToolPanel } from '@/tools/shared'
import { FileDrop } from '@/tools/shared'
import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton } from '@/tools/shared'
import { useDecodedImage } from '@/tools/shared/useCanvas'
import { useObjectUrl } from '@/tools/shared'
import { withExtension } from '@/lib/image-format'

import { POSITIONS, placeWatermark, opacityWarning } from './logic'

export default function ImageWatermark() {
  const [file, setFile] = useState<File | null>(null)
  const [markFile, setMarkFile] = useState<File | null>(null)
  const [position, setPosition] = useState('bottom-right')
  const [scalePercent, setScalePercent] = useState(20)
  const [opacity, setOpacity] = useState(35)
  const [result, setResult] = useState<{ blob: Blob; width: number; height: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const { image: base } = useDecodedImage(file)
  const { image: mark } = useDecodedImage(markFile)
  const markUrl = useObjectUrl(markFile)

  const opacityNote = opacityWarning(opacity / 100)
  const tiles = base && mark ? placeWatermark(base, mark, position as 'bottom-right', scalePercent / 100) : []

  async function handleApply() {
    if (!base || !mark) return
    setBusy(true)
    setError(null)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = base.width
      canvas.height = base.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('This browser refused to create a canvas.')

      context.drawImage(base, 0, 0)
      context.globalAlpha = opacity / 100
      for (const tile of tiles) {
        context.drawImage(mark, tile.x, tile.y, tile.width, tile.height)
      }
      context.globalAlpha = 1

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) {
        setError('The browser could not export the watermarked image. Nothing was downloaded.')
        setResult(null)
        return
      }
      setResult({ blob, width: base.width, height: base.height })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The watermark could not be applied.')
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FileDrop
          label="Choose the image"
          onFiles={(files) => {
            setFile(files[0] ?? null)
            setResult(null)
          }}
          hint="The photo or artwork you are protecting."
        />
        <FileDrop
          label="Choose the watermark"
          accept="image/png,image/webp,image/svg+xml"
          onFiles={(files) => setMarkFile(files[0] ?? null)}
          hint="A PNG with transparency works best."
        />
      </div>

      {base && mark && (
        <div className="grid gap-3 sm:grid-cols-4">
          <StatTile label="Image" value={`${base.width} × ${base.height}`} />
          <StatTile label="Watermark" value={`${mark.width} × ${mark.height}`} />
          <StatTile label="Placements" value={String(tiles.length)} />
          <StatTile label="Mark width" value={`${Math.round((mark.width * scalePercent) / 100)} px`} />
        </div>
      )}

      {markUrl && (
        <div className="flex items-center gap-3">
          <img src={markUrl} alt="Your watermark" className="h-12 w-12 rounded border border-line object-contain" />
          <p className="text-xs text-muted">
            A PNG with a transparent background is the right watermark. A solid rectangle will simply cover the image.
          </p>
        </div>
      )}

      {base && mark && (
        <>
          <ToolPanel title="Placement">
            <div className="grid gap-2 sm:grid-cols-3">
              {POSITIONS.map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  onClick={() => setPosition(entry.value)}
                  aria-pressed={entry.value === position}
                  className={`rounded-lg border px-3 py-2 text-left text-sm ${
                    entry.value === position
                      ? 'border-brand bg-brand-soft text-brand-fg'
                      : 'border-line bg-surface text-fg hover:border-brand/40'
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </ToolPanel>

          <ToolPanel title="Size and strength">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="scale" className="text-sm font-medium text-fg">
                  Mark width — {scalePercent}% of the image
                </label>
                <input
                  id="scale"
                  type="range"
                  min={2}
                  max={80}
                  value={scalePercent}
                  onChange={(event) => setScalePercent(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </div>
              <div>
                <label htmlFor="opacity" className="text-sm font-medium text-fg">
                  Opacity — {opacity}%
                </label>
                <input
                  id="opacity"
                  type="range"
                  min={5}
                  max={100}
                  value={opacity}
                  onChange={(event) => setOpacity(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </div>
            </div>

            {opacityNote && (
              <p className="mt-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-fg">
                {opacityNote}
              </p>
            )}

            <p className="mt-3 text-xs text-muted">
              {position === 'center'
                ? 'A centred mark sits over the subject, which is the hardest position to crop out but also the easiest to remove with a patch tool.'
                : 'A corner mark is the conventional choice: it proves authorship without covering the picture.'}
            </p>
          </ToolPanel>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleApply()}
              disabled={busy}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg disabled:opacity-50"
            >
              {busy ? 'Applying…' : 'Apply watermark'}
            </button>
            {result && (
              <DownloadButton
                filename={withExtension(file?.name ?? 'watermarked.png', 'png')}
                blob={result.blob}
                label="Download"
              />
            )}
          </div>
        </>
      )}

      {error && (
        <ToolPanel title="That did not work">
          <p className="text-sm text-danger">{error}</p>
        </ToolPanel>
      )}

      {result && (
        <ToolPanel title="Watermarked">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile label="Output" value={`${result.width} × ${result.height}`} />
            <StatTile label="File size" value={`${Math.round(result.blob.size / 1024)} KB`} />
          </div>
        </ToolPanel>
      )}
    </div>
  )
}
