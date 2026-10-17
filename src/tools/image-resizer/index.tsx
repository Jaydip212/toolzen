import { useMemo, useState } from 'react'

import { SegmentedControl } from '@/tools/shared'
import { ToolPanel } from '@/tools/shared'
import { FileDrop } from '@/tools/shared'
import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton } from '@/tools/shared'
import { Input } from '@/components/ui/Form'
import { useDecodedImage, useFileBytes } from '@/tools/shared/useCanvas'
import { SIZE_PRESETS, aspectRatioLabel } from '@/lib/image-geometry'
import { formatBytes } from '@/lib/utils'
import { detectFormat, extensionOf, withExtension } from '@/lib/image-format'

import { planResize, upscaleWarning } from './logic'

const MODES = [
  { value: 'long-edge', label: 'Long edge' },
  { value: 'percent', label: 'Percent' },
  { value: 'preset', label: 'Preset' },
  { value: 'exact', label: 'Exact' },
]

export default function ImageResizer() {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState('long-edge')
  const [longEdge, setLongEdge] = useState(1600)
  const [percent, setPercent] = useState(50)
  const [width, setWidth] = useState(1280)
  const [height, setHeight] = useState(720)
  const [presetIndex, setPresetIndex] = useState(0)
  const [format, setFormat] = useState('keep')
  const [result, setResult] = useState<{ blob: Blob; width: number; height: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const { image } = useDecodedImage(file)
  const bytes = useFileBytes(file)

  const source = useMemo(
    () => (image ? { width: image.width, height: image.height } : { width: 0, height: 0 }),
    [image],
  )

  const plan = useMemo(
    () =>
      planResize(source, mode as 'long-edge', {
        longEdge,
        percent,
        width,
        height,
        preset: SIZE_PRESETS[presetIndex],
      }),
    [source, mode, longEdge, percent, width, height, presetIndex],
  )

  const warning = upscaleWarning(source, plan)
  const detected = bytes ? detectFormat(bytes) : 'unknown'

  async function handleResize() {
    if (!image || !plan.width) return
    setBusy(true)
    setError(null)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = plan.width
      canvas.height = plan.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('This browser refused to create a canvas.')
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.drawImage(image, 0, 0, plan.width, plan.height)

      const mime = format === 'keep' ? 'image/webp' : format === 'jpg' ? 'image/jpeg' : `image/${format}`
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, format === 'png' ? undefined : 0.92))
      if (!blob) {
        setError('This browser could not write that format. Nothing was resized and no file was downloaded.')
        setResult(null)
        return
      }
      setResult({ blob, width: plan.width, height: plan.height })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The resize failed.')
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  // The extension on the file name is not the format; the bytes are.
  const expectedExtension = detected === 'jpeg' ? 'jpg' : detected
  const mismatchNote =
    file && detected !== 'unknown' && !file.name.toLowerCase().endsWith(`.${expectedExtension}`)
      ? ' That does not match the extension on the file name, but the tool trusts the bytes.'
      : ''

  return (
    <div className="space-y-4">
      <FileDrop
        accept="image/*"
        onFiles={(files) => {
          setFile(files[0] ?? null)
          setResult(null)
          setError(null)
        }}
        hint="Any image the browser can read."
      />

      {file && image && (
        <div className="grid gap-3 sm:grid-cols-4">
          <StatTile label="Original" value={`${source.width} × ${source.height}`} />
          <StatTile label="Aspect" value={aspectRatioLabel(source)} />
          <StatTile label="Original size" value={formatBytes(file.size)} />
          <StatTile label="Output" value={plan.width ? `${plan.width} × ${plan.height}` : '—'} />
        </div>
      )}

      {file && detected !== 'unknown' && (
        <p className="text-xs text-muted">
          Read as {detected.toUpperCase()}. {mismatchNote}
        </p>
      )}

      <ToolPanel title="Target size">
        <SegmentedControl value={mode} onChange={setMode} options={MODES} label="Resize mode" />

        {mode === 'long-edge' && (
          <div className="mt-3 max-w-xs">
            <Input
              id="long-edge"
              label="Longest side, in pixels"
              type="number"
              min={1}
              max={20000}
              value={longEdge}
              onChange={(event) => setLongEdge(Number(event.target.value))}
              hint="The other side is worked out from the aspect ratio."
            />
          </div>
        )}

        {mode === 'percent' && (
          <div className="mt-3">
            <label htmlFor="percent" className="text-sm font-medium text-fg">
              Scale — {percent}%
            </label>
            <input
              id="percent"
              type="range"
              min={1}
              max={400}
              value={percent}
              onChange={(event) => setPercent(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </div>
        )}

        {mode === 'preset' && (
          <div className="mt-3 flex flex-wrap gap-2">
            {SIZE_PRESETS.map((entry, index) => (
              <button
                key={entry.label}
                type="button"
                onClick={() => setPresetIndex(index)}
                aria-pressed={index === presetIndex}
                className={`rounded-lg border px-3 py-2 text-xs ${
                  index === presetIndex
                    ? 'border-brand bg-brand-soft text-brand-fg'
                    : 'border-line bg-surface text-fg hover:border-brand/40'
                }`}
              >
                <span className="block font-medium">{entry.label}</span>
                <span className="block text-muted">
                  {entry.width} × {entry.height}
                </span>
              </button>
            ))}
          </div>
        )}

        {mode === 'exact' && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input
              id="width"
              label="Width, in pixels"
              type="number"
              min={1}
              value={width}
              onChange={(event) => setWidth(Number(event.target.value))}
            />
            <Input
              id="height"
              label="Height, in pixels"
              type="number"
              min={1}
              value={height}
              onChange={(event) => setHeight(Number(event.target.value))}
            />
          </div>
        )}

        <p className="mt-3 text-xs text-muted">{plan.sentence}</p>

        {warning && (
          <p className="mt-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-fg">{warning}</p>
        )}
      </ToolPanel>

      {mode !== 'exact' && (
        <div className="max-w-xs">
          <label htmlFor="out-format" className="text-sm font-medium text-fg">
            Output format
          </label>
          <select
            id="out-format"
            value={format}
            onChange={(event) => setFormat(event.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg"
          >
            <option value="keep">WebP — smallest</option>
            <option value="png">PNG — lossless, keeps transparency</option>
            <option value="jpg">JPEG — widest compatibility</option>
          </select>
        </div>
      )}

      {file && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleResize()}
            disabled={busy || !plan.width}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg disabled:opacity-50"
          >
            {busy ? 'Resizing…' : 'Resize'}
          </button>
          <span className="text-xs text-muted">The image stays in this browser tab.</span>
        </div>
      )}

      {error && (
        <ToolPanel title="That did not work">
          <p className="text-sm text-danger">{error}</p>
        </ToolPanel>
      )}

      {result && file && (
        <ToolPanel
          title="Resized"
          actions={
            <DownloadButton
              filename={withExtension(file.name, format === 'keep' ? 'webp' : format === 'jpg' ? 'jpg' : format)}
              blob={result.blob}
              label="Download"
            />
          }
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="New size" value={`${result.width} × ${result.height}`} />
            <StatTile label="Aspect" value={aspectRatioLabel({ width: result.width, height: result.height })} />
            <StatTile label="File size" value={formatBytes(result.blob.size)} />
          </div>
          <p className="mt-3 text-xs text-muted">
            Saved as {extensionOf(withExtension(file.name, format === 'keep' ? 'webp' : format))}. Everything was done
            on this device.
          </p>
        </ToolPanel>
      )}
    </div>
  )
}
