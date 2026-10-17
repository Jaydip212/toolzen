import { useState } from 'react'

import { ToolPanel } from '@/tools/shared'
import { FileDrop } from '@/tools/shared'
import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton } from '@/tools/shared'
import { Input } from '@/components/ui/Form'
import { useDecodedImage, useFileBytes } from '@/tools/shared/useCanvas'
import { detectFormat, withExtension } from '@/lib/image-format'

import { NOT_BACKGROUND_REMOVAL, describeJob, outlineWidth, planPad, warnsAboutFormat } from './logic'

const JOBS = [
  { id: 'pad', label: 'Add a padding border' },
  { id: 'extend-canvas', label: 'Place on a solid colour' },
  { id: 'outline', label: 'Add an outline' },
  { id: 'solid-backdrop', label: 'Transparent canvas' },
] as const

export default function ImageBackgroundUtilities() {
  const [file, setFile] = useState<File | null>(null)
  const [job, setJob] = useState<(typeof JOBS)[number]['id']>('pad')
  const [percent, setPercent] = useState(10)
  const [colour, setColour] = useState('#ffffff')
  const [result, setResult] = useState<{ blob: Blob; width: number; height: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const { image, error: decodeError } = useDecodedImage(file)
  const bytes = useFileBytes(file)
  const format = bytes ? detectFormat(bytes) : 'png'
  const warning = warnsAboutFormat(format)

  const plan = image ? planPad(image, percent) : null
  const outline = image ? outlineWidth(image, percent) : 0

  async function handleApply() {
    if (!image) return
    setBusy(true)
    setError(null)
    try {
      let width = image.width
      let height = image.height

      if (job === 'pad') {
        width = plan?.width ?? image.width
        height = plan?.height ?? image.height
      }
      if (job === 'solid-backdrop') {
        width = plan?.width ?? image.width
        height = plan?.height ?? image.height
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('This browser refused to create a canvas.')

      if (job === 'extend-canvas') {
        context.fillStyle = colour
        context.fillRect(0, 0, width, height)
        context.drawImage(image, 0, 0)
      } else if (job === 'pad') {
        context.drawImage(image, plan?.offsetX ?? 0, plan?.offsetY ?? 0)
      } else if (job === 'outline') {
        context.drawImage(image, 0, 0)
        context.strokeStyle = colour
        context.lineWidth = outline
        context.strokeRect(outline / 2, outline / 2, image.width - outline, image.height - outline)
      } else {
        // Transparent canvas: deliberately drawn empty.
        context.clearRect(0, 0, width, height)
      }

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) {
        setError('The browser could not export that. Nothing was downloaded.')
        setResult(null)
        return
      }
      setResult({ blob, width, height })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The job failed.')
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <ToolPanel title="What this tool is for">
        <p className="text-sm text-fg">{NOT_BACKGROUND_REMOVAL}</p>
      </ToolPanel>

      <FileDrop
        accept="image/png,image/webp"
        onFiles={(files) => {
          setFile(files[0] ?? null)
          setResult(null)
          setError(null)
        }}
        hint="PNG or WebP — the two formats that keep transparency."
      />

      {decodeError && <p className="text-sm text-danger">{decodeError}</p>}

      {warning && (
        <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-fg">{warning}</p>
      )}

      {image && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Image" value={`${image.width} × ${image.height}`} />
            <StatTile label="Output" value={job === 'outline' ? 'unchanged' : `${plan?.width ?? 0} × ${plan?.height ?? 0}`} />
            <StatTile label="Detected" value={format.toUpperCase()} />
          </div>

          <ToolPanel title="Job">
            <div className="grid gap-2 sm:grid-cols-2">
              {JOBS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setJob(entry.id)}
                  aria-pressed={entry.id === job}
                  className={`rounded-lg border px-3 py-2 text-left text-sm ${
                    entry.id === job
                      ? 'border-brand bg-brand-soft text-brand-fg'
                      : 'border-line bg-surface text-fg hover:border-brand/40'
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>

            <p className="mt-3 text-xs text-muted">
              {JOBS.find((entry) => entry.id === job)?.label}: {describeJob(job, image, percent)}
            </p>
          </ToolPanel>

          <ToolPanel title="Settings">
            {job !== 'solid-backdrop' && (
              <div className="max-w-xs">
                <label htmlFor="amount" className="text-sm font-medium text-fg">
                  {job === 'pad' ? 'Padding' : 'Thickness'} — {percent}%
                </label>
                <input
                  id="amount"
                  type="range"
                  min={1}
                  max={100}
                  value={percent}
                  onChange={(event) => setPercent(Number(event.target.value))}
                  className="mt-2 w-full"
                />
                <p className="mt-1 text-xs text-muted">
                  A percentage of the shorter side, so it means the same thing on a wide banner as on a tall portrait.
                </p>
              </div>
            )}

            {job === 'extend-canvas' && (
              <div className="mt-4 max-w-xs">
                <Input
                  id="bg-colour"
                  label="Backdrop colour"
                  value={colour}
                  onChange={(event) => setColour(event.target.value)}
                  hint="Any CSS colour, e.g. #ffffff or #f3f4f6."
                />
                <span
                  className="mt-1 block h-8 w-full rounded border border-line"
                  style={{ backgroundColor: colour }}
                  aria-hidden="true"
                />
              </div>
            )}

            {job === 'outline' && (
              <div className="mt-4 max-w-xs">
                <Input
                  id="outline-colour"
                  label="Outline colour"
                  value={colour}
                  onChange={(event) => setColour(event.target.value)}
                />
              </div>
            )}
          </ToolPanel>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleApply()}
              disabled={busy}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg disabled:opacity-50"
            >
              {busy ? 'Working…' : 'Apply'}
            </button>
            {result && (
              <DownloadButton
                filename={withExtension(file?.name ?? 'image.png', 'png')}
                blob={result.blob}
                label="Download PNG"
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
        <ToolPanel title="Done">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile label="Output" value={`${result.width} × ${result.height}`} />
            <StatTile label="File size" value={`${Math.round(result.blob.size / 1024)} KB`} />
          </div>
          <p className="mt-3 text-xs text-muted">
            Saved as PNG, which is the only format here that keeps a transparent canvas see-through.
          </p>
        </ToolPanel>
      )}
    </div>
  )
}
