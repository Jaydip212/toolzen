import { useMemo, useState } from 'react'
import { ErrorState } from '@/components/ui/ErrorState'
import { Icon } from '@/components/ui/Icon'
import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton, FileDrop, ToolPanel, useObjectUrl } from '@/tools/shared'
import { useDecodedImage } from '@/tools/shared/useCanvas'
import { formatBytes } from '@/lib/utils'
import { applyEffect, IMAGE_EFFECTS, MAX_IMAGE_PIXELS, type ImageEffect } from '@/lib/phase7/image-effects'

export function ImageEffects() {
  const [file, setFile] = useState<File | null>(null)
  const [effect, setEffect] = useState<ImageEffect>('grayscale')
  const [amount, setAmount] = useState(20)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Blob | null>(null)
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)

  const { image, error: decodeError } = useDecodedImage(file)
  const originalUrl = useObjectUrl(file)
  const resultUrl = useObjectUrl(result)
  const activeEffect = useMemo(() => IMAGE_EFFECTS.find((entry) => entry.id === effect)!, [effect])

  function handleFiles(files: File[]) {
    const next = files[0]!
    setFile(next)
    setResult(null)
    setError(null)
    setDimensions(null)
  }

  function run() {
    if (!image) {
      setError(decodeError ?? 'The image is still decoding — try again in a moment.')
      return
    }
    const width = 'width' in image ? image.width : 0
    const height = 'height' in image ? image.height : 0
    if (width * height > MAX_IMAGE_PIXELS) {
      setError(`That image has ${width * height} pixels, over the ${MAX_IMAGE_PIXELS.toLocaleString()} pixel safety ceiling. Resize it first.`)
      return
    }
    try {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas is unavailable in this browser.')
      context.drawImage(image, 0, 0)
      const pixels = context.getImageData(0, 0, width, height)
      const transformed = applyEffect(effect, pixels.data, amount)
      // ImageData requires an ArrayBuffer-backed array in current TS lib.dom.
      const output = new Uint8ClampedArray(new ArrayBuffer(transformed.length))
      output.set(transformed)
      context.putImageData(new ImageData(output, width, height), 0, 0)
      canvas.toBlob((blob) => {
        if (!blob) {
          setError('The browser could not encode the result as a PNG.')
          return
        }
        setResult(blob)
        setDimensions({ width, height })
        setError(null)
      }, 'image/png')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The effect could not be applied.')
    }
  }

  function reset() {
    setFile(null)
    setResult(null)
    setError(null)
    setDimensions(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel
        title="Choose an image"
        description="Grayscale, invert, brightness and contrast — real pixel operations, applied in your browser."
        actions={
          file && (
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-medium text-muted transition-colors hover:text-fg">
              <Icon name="refresh" size={14} />
              Reset
            </button>
          )
        }
      >
        <FileDrop
          accept="image/png,image/jpeg,image/webp"
          onFiles={handleFiles}
          label="Drop an image to edit"
          hint="PNG, JPEG or WebP. Up to 100 MB and 12 megapixels; the file never leaves your device."
        />
      </ToolPanel>

      {(error || decodeError) && <ErrorState title="Could not process that image" message={error ?? decodeError!} />}

      {file && (
        <ToolPanel title="Effect">
          <div className="flex flex-wrap gap-2">
            {IMAGE_EFFECTS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setEffect(entry.id)}
                aria-pressed={effect === entry.id}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                  effect === entry.id ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:text-fg'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">{activeEffect.description}</p>

          {activeEffect.hasAmount && (
            <label className="mt-4 block text-sm text-fg">
              Amount: {amount}
              <input
                type="range"
                min={-100}
                max={100}
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
                aria-label="Effect amount"
                className="mt-2 w-full accent-brand"
              />
            </label>
          )}

          <button
            type="button"
            onClick={run}
            className="mt-4 inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-medium text-brand-fg transition-opacity hover:opacity-90"
          >
            Apply effect
          </button>
        </ToolPanel>
      )}

      {result && (
        <ToolPanel
          title="Result"
          description="Compare before and after, then download the PNG."
          actions={<DownloadButton blob={result} filename={`toolzen-${effect}.png`} label="Download PNG" />}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Original</p>
              {originalUrl && <img src={originalUrl} alt="Original image" className="w-full rounded-xl border border-line" />}
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">After {activeEffect.label.toLowerCase()}</p>
              {resultUrl && <img src={resultUrl} alt="Image after the effect" className="w-full rounded-xl border border-line" />}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <StatTile label="Original size" value={file ? formatBytes(file.size) : '—'} />
            <StatTile label="Result size" value={formatBytes(result.size)} />
            <StatTile label="Dimensions" value={dimensions ? `${dimensions.width} × ${dimensions.height}` : '—'} />
          </div>
        </ToolPanel>
      )}
    </div>
  )
}

export default ImageEffects
