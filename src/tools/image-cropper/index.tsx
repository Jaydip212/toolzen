import { useRef, useState } from 'react'

import { SegmentedControl } from '@/tools/shared'
import { ToolPanel } from '@/tools/shared'
import { FileDrop } from '@/tools/shared'
import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton } from '@/tools/shared'
import { useDecodedImage } from '@/tools/shared/useCanvas'
import { useObjectUrl } from '@/tools/shared'
import { withExtension } from '@/lib/image-format'

import { CROP_RATIOS, centredAspect, planCrop, selectionLabel } from './logic'

const MODES = CROP_RATIOS.map((entry) => ({ value: entry.label, label: entry.label }))

/**
 * Crop by dragging a box over the image.
 *
 * The selection is kept as percentages, so the same box means the same thing
 * whatever the image's actual pixel size.
 */
export default function ImageCropper() {
  const [file, setFile] = useState<File | null>(null)
  const [ratio, setRatio] = useState('Free')
  const [selection, setSelection] = useState({ left: 0, top: 0, right: 0, bottom: 0 })
  const [dragging, setDragging] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; width: number; height: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const frameRef = useRef<HTMLDivElement>(null)

  const { image } = useDecodedImage(file)
  const size = { width: image?.width ?? 0, height: image?.height ?? 0 }
  const plan = planCrop(size, selection)
  const previewUrl = useObjectUrl(file)

  function handleRatio(label: string) {
    setRatio(label)
    const entry = CROP_RATIOS.find((candidate) => candidate.label === label)
    if (entry?.ratio && image) {
      setSelection(centredAspect({ width: image.width, height: image.height }, entry.ratio))
    } else {
      setSelection({ left: 0, top: 0, right: 0, bottom: 0 })
    }
    setResult(null)
  }

  /** Convert a pointer event into percentages of the image frame. */
  function pointFromEvent(event: React.PointerEvent): { x: number; y: number } {
    const frame = frameRef.current
    if (!frame) return { x: 0, y: 0 }
    const rect = frame.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
    }
  }

  function handlePointerDown(event: React.PointerEvent) {
    event.preventDefault()
    const point = pointFromEvent(event)
    setSelection({ left: point.x, top: point.y, right: point.x, bottom: point.y })
    setDragging(true)
    setResult(null)
  }

  function handlePointerMove(event: React.PointerEvent) {
    if (!dragging) return
    const point = pointFromEvent(event)
    setSelection((current) => ({ ...current, right: point.x, bottom: point.y }))
  }

  function handlePointerUp() {
    setDragging(false)
  }

  async function handleCrop() {
    if (!image || !plan.width) return
    setBusy(true)
    setError(null)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = plan.width
      canvas.height = plan.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('This browser refused to create a canvas.')
      context.drawImage(image, plan.x, plan.y, plan.width, plan.height, 0, 0, plan.width, plan.height)

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) {
        setError('The browser could not produce a cropped file. Nothing was downloaded.')
        setResult(null)
        return
      }
      setResult({ blob, width: plan.width, height: plan.height })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The crop failed.')
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  const hasBox = selection.right > selection.left && selection.bottom > selection.top

  return (
    <div className="space-y-4">
      <FileDrop
        accept="image/*"
        onFiles={(files) => {
          setFile(files[0] ?? null)
          setSelection({ left: 0, top: 0, right: 0, bottom: 0 })
          setResult(null)
          setError(null)
        }}
        hint="Drag a box over the image to choose what to keep."
      />

      {image && (
        <>
          <ToolPanel title="Aspect ratio">
            <SegmentedControl
              value={ratio}
              onChange={handleRatio}
              options={MODES}
              label="Crop aspect ratio"
            />
            <p className="mt-3 text-xs text-muted">
              Free lets you drag any box. The fixed ratios centre a box of the right shape on the image.
            </p>
          </ToolPanel>

          <div
            ref={frameRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="relative max-w-full touch-none overflow-hidden rounded-lg border border-line bg-surface-2"
            style={{ aspectRatio: `${size.width} / ${size.height}`, cursor: 'crosshair' }}
          >
            {previewUrl && (
              <img
                src={previewUrl}
                alt="The image you are cropping"
                className="pointer-events-none block max-h-[60vh] w-full object-contain"
                draggable={false}
              />
            )}
            {hasBox && (
              <div
                className="pointer-events-none absolute border-2 border-brand bg-brand/10"
                style={{
                  left: `${Math.min(selection.left, selection.right)}%`,
                  top: `${Math.min(selection.top, selection.bottom)}%`,
                  width: `${Math.abs(selection.right - selection.left)}%`,
                  height: `${Math.abs(selection.bottom - selection.top)}%`,
                }}
              />
            )}
          </div>

          <ToolPanel
            title="Crop"
            actions={
              result ? (
                <DownloadButton
                  filename={withExtension(file?.name ?? 'cropped.png', 'png')}
                  blob={result.blob}
                  label="Download crop"
                />
              ) : undefined
            }
          >
            {hasBox ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatTile label="Selection" value={selectionLabel(selection)} />
                  <StatTile label="Output" value={`${plan.width} × ${plan.height}`} />
                  <StatTile label="Position" value={`${plan.x}, ${plan.y}`} />
                </div>
                <p className="mt-3 text-xs text-muted">{plan.sentence}</p>
                <button
                  type="button"
                  onClick={() => void handleCrop()}
                  disabled={busy || !plan.width}
                  className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg disabled:opacity-50"
                >
                  {busy ? 'Cropping…' : 'Crop'}
                </button>
              </>
            ) : (
              <p className="text-sm text-muted">Drag a box on the image to choose a region.</p>
            )}
          </ToolPanel>
        </>
      )}

      {error && (
        <ToolPanel title="That did not work">
          <p className="text-sm text-danger">{error}</p>
        </ToolPanel>
      )}
    </div>
  )
}
