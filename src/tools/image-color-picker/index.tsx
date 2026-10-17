import { useCallback, useMemo, useRef, useState } from 'react'

import { ToolPanel } from '@/tools/shared'
import { FileDrop } from '@/tools/shared'
import { StatTile } from '@/components/tools/StatTile'
import { Input } from '@/components/ui/Form'
import { CopyButton } from '@/components/ui/CopyButton'
import { useFileBytes } from '@/tools/shared/useCanvas'
import { parseColour, toHex } from '@/lib/colour'
import { detectFormat } from '@/lib/image-format'

import { EXPORTS, colourAt, contrastVerdict, paletteOf, parsePasted, readout } from './logic'

/**
 * Pick a colour from an image, or from a hex you paste in.
 *
 * The picker reads one pixel at a time from a downscaled copy, so a huge
 * panorama does not need to be decoded at full resolution just to click it.
 */
export default function ImageColorPicker() {
  const [file, setFile] = useState<File | null>(null)
  const [pasted, setPasted] = useState('')
  const [picked, setPicked] = useState<{ x: number; y: number } | null>(null)
  const [second, setSecond] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const bytes = useFileBytes(file)
  const format = bytes ? detectFormat(bytes) : 'unknown'

  const loadImage = useCallback((target: File) => {
    const image = new Image()
    image.onload = () => {
      imageRef.current = image
      const canvas = canvasRef.current
      if (!canvas) return

      // Cap the working copy at 1600px so the pixel maths stays cheap, and
      // report the real size separately.
      const scale = Math.min(1, 1600 / Math.max(image.width, image.height))
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
    }
    image.src = URL.createObjectURL(target)
  }, [])

  const palette = useMemo(() => {
    const canvas = canvasRef.current
    if (!canvas || canvas.width === 0) return []
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return []
    return paletteOf(context.getImageData(0, 0, canvas.width, canvas.height).data)
    // A file change is the only trigger; the canvas fills asynchronously.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, format])

  const pastedResult = parsePasted(pasted)
  const pickedColour = useMemo(() => {
    const canvas = canvasRef.current
    if (!picked || !canvas || canvas.width === 0) return null
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return null
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data
    return colourAt(data, canvas.width, picked.x, picked.y)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked, file])

  const active = pickedColour ?? pastedResult.rgb
  const readoutOf = active ? readout(active) : null

  const secondRgb = useMemo(() => parseColour(second), [second])
  const verdict = active && secondRgb ? contrastVerdict(active, secondRgb) : null

  function handleCanvasClick(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width)
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height)
    setPicked({ x, y })
    setPasted('')
  }

  return (
    <div className="space-y-4">
      <FileDrop
        accept="image/*"
        onFiles={(files) => {
          const next = files[0] ?? null
          setFile(next)
          setPicked(null)
          if (next) loadImage(next)
        }}
        hint="Click anywhere on the image to pick that pixel's colour."
      />

      <ToolPanel title="Or paste a colour">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <Input
              id="pasted"
              label="Hex or rgb()"
              value={pasted}
              onChange={(event) => setPasted(event.target.value)}
              error={pastedResult.error ?? undefined}
              placeholder="#3b82f6 or rgb(59, 130, 246)"
            />
          </div>
          {pastedResult.rgb && (
            <span
              className="h-10 w-16 rounded border border-line"
              style={{ backgroundColor: toHex(pastedResult.rgb) }}
              aria-hidden="true"
            />
          )}
        </div>
      </ToolPanel>

      {file && (
        <div className="space-y-2">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="max-h-[60vh] w-full cursor-crosshair rounded-lg border border-line"
          />
          <p className="text-xs text-muted">
            Clicked pixel: {picked ? `${picked.x}, ${picked.y} on the working copy` : 'none yet'}. The working copy is
            capped at 1600 pixels wide, so a click reads the colour at that spot on the whole image.
          </p>
        </div>
      )}

      {palette.length > 0 && (
        <ToolPanel title="Palette">
          <div className="grid gap-2 sm:grid-cols-3">
            {palette.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => setPasted(swatch.hex)}
                className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2 text-left hover:border-brand/40"
              >
                <span className="h-8 w-8 shrink-0 rounded border border-line" style={{ backgroundColor: swatch.hex }} />
                <span className="min-w-0">
                  <span className="block font-mono text-xs text-fg">{swatch.hex}</span>
                  <span className="block text-xs text-muted">{swatch.share}% of pixels</span>
                </span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Near-identical colours are merged into one swatch, so a photograph's hundreds of near-greens do not drown
            the ones that matter.
          </p>
        </ToolPanel>
      )}

      {readoutOf && (
        <ToolPanel
          title="The colour"
          actions={
            <>
              {EXPORTS.map((entry) => (
                <CopyButton key={entry.label} value={entry.pick(readoutOf)} label={entry.label} />
              ))}
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-4">
            <StatTile label="Description" value={readoutOf.description} />
            <StatTile label="As rgb()" value={readoutOf.rgb} />
            <StatTile label="As hsl()" value={readoutOf.hsl} />
            <StatTile label="Reads better on" value={readoutOf.betterOn} />
          </div>
          <p className="mt-3 text-xs text-muted">
            {readoutOf.onWhite.toFixed(2)}:1 against white and {readoutOf.onBlack.toFixed(2)}:1 against black. Those
            are the only two backgrounds you usually have to choose between, so both are reported.
          </p>
        </ToolPanel>
      )}

      {active && (
        <ToolPanel title="Contrast">
          <div className="max-w-xs">
            <Input
              id="second"
              label="A second colour"
              value={second}
              onChange={(event) => setSecond(event.target.value)}
              placeholder="#ffffff"
              hint="Compare the picked colour against this one."
            />
          </div>
          {verdict && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-3">
                <span
                  className="h-10 w-24 rounded border border-line"
                  style={{ backgroundColor: toHex(active), color: toHex(secondRgb ?? { r: 255, g: 255, b: 255 }) }}
                >
                  <span className="flex h-full items-center justify-center text-xs">Sample</span>
                </span>
                <div>
                  <p className="text-sm font-medium text-fg">{verdict.ratio.toFixed(2)}:1 — {verdict.level}</p>
                  <p className="text-xs text-muted">{verdict.sentence}</p>
                </div>
              </div>
              {verdict.suggested && <p className="text-xs text-warning">{verdict.suggested}</p>}
            </div>
          )}
        </ToolPanel>
      )}
    </div>
  )
}
