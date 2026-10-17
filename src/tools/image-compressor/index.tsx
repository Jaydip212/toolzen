import { useMemo, useState } from 'react'

import { SegmentedControl } from '@/tools/shared'
import { ToolPanel } from '@/tools/shared'
import { FileDrop } from '@/tools/shared'
import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton } from '@/tools/shared'
import { Input, Select } from '@/components/ui/Form'
import { useDecodedImage } from '@/tools/shared/useCanvas'
import { SIZE_PRESETS, fitWithin } from '@/lib/image-geometry'
import { formatBytes } from '@/lib/utils'

import { PRESETS, betterLever, estimateSaving, presetById, resolveQuality, resultNote } from './logic'

const MODES = [
  { value: 'long-edge', label: 'Long edge' },
  { value: 'percent', label: 'Percent' },
  { value: 'preset', label: 'Preset' },
  { value: 'exact', label: 'Exact' },
]

/**
 * Shrink an image without wrecking it.
 *
 * The page shows the two levers side by side and names which one is actually
 * doing the work, because lowering quality when the size is the problem is
 * the single most common mistake.
 */
export default function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null)
  const [presetId, setPresetId] = useState('balanced')
  const [format, setFormat] = useState('keep')
  const [longEdge, setLongEdge] = useState(1600)
  const [percent, setPercent] = useState(50)
  const [presetIndex, setPresetIndex] = useState(0)
  const [mode, setMode] = useState('long-edge')
  const [result, setResult] = useState<{ blob: Blob; size: number; width: number; height: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const { image } = useDecodedImage(file)
  const preset = presetById(presetId)

  const plan = useMemo(() => {
    if (!image) return null
    const source = { width: image.width, height: image.height }
    const bound =
      mode === 'long-edge'
        ? { width: longEdge, height: longEdge }
        : mode === 'percent'
          ? { width: Math.round((image.width * percent) / 100), height: Math.round((image.height * percent) / 100) }
          : mode === 'preset'
            ? SIZE_PRESETS[presetIndex]
            : { width: image.width, height: image.height }
    return { source, target: fitWithin(source, bound) }
  }, [image, mode, longEdge, percent, presetIndex])

  const quality = useMemo(() => {
    if (format === 'png' || format === 'keep') return 100
    return resolveQuality(preset, format)
  }, [format, preset])

  const estimate = file ? estimateSaving(file.size, quality) : null
  const lever = plan ? betterLever(plan.source, plan.target) : null

  async function handleCompress() {
    if (!file || !image || !plan) return
    setBusy(true)
    setError(null)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = plan.target.width
      canvas.height = plan.target.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('This browser refused to create a canvas.')
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.drawImage(image, 0, 0, plan.target.width, plan.target.height)

      const mime = format === 'keep' ? 'image/webp' : format === 'jpg' ? 'image/jpeg' : `image/${format}`
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality / 100))
      if (!blob) {
        setError(`This browser could not write that format. Nothing was compressed and no file was downloaded.`)
        setResult(null)
        return
      }
      setResult({ blob, size: blob.size, width: plan.target.width, height: plan.target.height })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The compression failed.')
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <FileDrop
        accept="image/*"
        onFiles={(files) => {
          setFile(files[0] ?? null)
          setResult(null)
          setError(null)
        }}
        hint="Any image the browser can read. Everything happens on this device."
      />

      {file && plan && (
        <div className="grid gap-3 sm:grid-cols-4">
          <StatTile label="Original" value={`${plan.source.width} × ${plan.source.height}`} />
          <StatTile label="Original size" value={formatBytes(file.size)} />
          <StatTile label="Output" value={`${plan.target.width} × ${plan.target.height}`} />
          <StatTile
            label="Quality"
            value={format === 'png' || format === 'keep' ? 'lossless' : String(quality)}
          />
        </div>
      )}

      <ToolPanel title="Size">
        <SegmentedControl value={mode} onChange={setMode} options={MODES} label="Resize mode" />

        {mode === 'long-edge' && (
          <div className="mt-3">
            <Input
              id="long-edge"
              label="Longest side, in pixels"
              type="number"
              min={16}
              max={20000}
              value={longEdge}
              onChange={(event) => setLongEdge(Number(event.target.value))}
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
              min={5}
              max={200}
              value={percent}
              onChange={(event) => setPercent(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </div>
        )}

        {mode === 'preset' && (
          <div className="mt-3">
            <Select
              id="preset"
              label="Fit inside"
              value={String(presetIndex)}
              onChange={(event) => setPresetIndex(Number(event.target.value))}
            >
              {SIZE_PRESETS.map((entry, index) => (
                <option key={entry.label} value={String(index)}>
                  {entry.label} — {entry.width} × {entry.height}
                </option>
              ))}
            </Select>
          </div>
        )}

        {mode === 'exact' && (
          <p className="mt-3 text-xs text-muted">
            Exact mode is not offered here, because typing both numbers by hand is what the resize tool is for. This
            tool always keeps the aspect ratio, so the two sides can never disagree.
          </p>
        )}

        {lever === 'dimensions' && (
          <p className="mt-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-fg">
            The size is doing most of the work here. Lowering the quality dial as well would cost detail for very
            little, so leave it as high as you can stand.
          </p>
        )}
      </ToolPanel>

      <ToolPanel title="Quality">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setPresetId(entry.id)}
              aria-pressed={entry.id === presetId}
              className={`rounded-lg border px-3 py-2 text-left text-sm ${
                entry.id === presetId
                  ? 'border-brand bg-brand-soft text-brand-fg'
                  : 'border-line bg-surface text-fg hover:border-brand/40'
              }`}
            >
              <span className="block font-medium">{entry.label}</span>
              <span className="block text-xs text-muted">{entry.useCase}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 max-w-xs">
          <Select id="format" label="Output format" value={format} onChange={(event) => setFormat(event.target.value)}>
            <option value="keep">WebP — smallest lossy result</option>
            <option value="png">PNG — lossless, keeps transparency</option>
            <option value="jpg">JPEG — widest compatibility</option>
          </Select>
        </div>

        {estimate && <p className="mt-3 text-xs text-muted">{estimate.sentence}</p>}
      </ToolPanel>

      {file && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleCompress()}
            disabled={busy || !plan}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg disabled:opacity-50"
          >
            {busy ? 'Compressing…' : 'Compress'}
          </button>
          <span className="text-xs text-muted">Heavily-compressed files sometimes come out bigger. The tool will say so.</span>
        </div>
      )}

      {error && (
        <ToolPanel title="That did not work">
          <p className="text-sm text-danger">{error}</p>
        </ToolPanel>
      )}

      {result && file && (
        <ToolPanel
          title="Compressed"
          actions={<DownloadButton filename={file.name.replace(/\.[^.]+$/, '') + '.webp'} blob={result.blob} label="Download" />}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="New size" value={formatBytes(result.size)} />
            <StatTile label="Dimensions" value={`${result.width} × ${result.height}`} />
            <StatTile label="Format" value="WebP" />
          </div>
          <p className="mt-3 text-xs text-muted">{resultNote(file.size, result.size, 'WebP')}</p>
        </ToolPanel>
      )}
    </div>
  )
}
