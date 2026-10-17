import { useMemo, useState } from 'react'

import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton } from '@/tools/shared'
import { FileDrop } from '@/tools/shared'
import { ToolPanel } from '@/tools/shared'
import { useFileBytes } from '@/tools/shared/useCanvas'
import { decodeImage } from '@/tools/shared/useCanvas'
import { detectFormat, extensionOf, formatInfo, withExtension } from '@/lib/image-format'
import { formatBytes } from '@/lib/utils'

import {
  capabilityNote,
  comparisonsFor,
  encodingSupport,
  formatVerdict,
  isLossless,
  qualityNote,
  suggestedQuality,
} from './logic'

const TARGETS = ['png', 'jpeg', 'webp'] as const

export interface ImageFormatConverterProps {
  /**
   * A target the page has already decided on, used by the job-specific pages
   * (`jpg-to-png` and friends). The chooser is hidden rather than removed, so
   * the shared body of code does not fork.
   */
  forcedTarget?: (typeof TARGETS)[number]
}

/**
 * Convert between PNG, JPEG and WebP.
 *
 * Everything happens on a canvas in this tab. The tool says which formats it
 * can write before asking for a file, so nobody converts to GIF and gets a
 * silent no-op.
 */
export default function ImageFormatConverter({ forcedTarget }: ImageFormatConverterProps = {}) {
  const [file, setFile] = useState<File | null>(null)
  const [target, setTarget] = useState<(typeof TARGETS)[number]>(forcedTarget ?? 'webp')
  const [quality, setQuality] = useState(suggestedQuality('webp'))
  const [result, setResult] = useState<{ blob: Blob | null; size: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const bytes = useFileBytes(file)
  const source = useMemo(() => (bytes ? detectFormat(bytes) : 'unknown' as const), [bytes])
  const sourceInfo = formatInfo(source)
  const targetInfo = formatInfo(target)
  const note = capabilityNote(source, target)
  const comparisons = comparisonsFor(source)
  const suggested = suggestedQuality(target)
  const effectiveQuality = isLossless(target) ? 100 : quality
  const qualityWords = qualityNote(target, quality)
  const support = encodingSupport(target)

  async function handleConvert() {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const image = await decodeImage(file)
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('This browser refused to create a canvas.')
      context.drawImage(image, 0, 0)

      const mime = targetInfo.mime
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mime, effectiveQuality / 100),
      )
      if (!blob) {
        setError(
          `This browser could not write ${targetInfo.label}. Nothing was converted, and no file was downloaded.`,
        )
        setResult(null)
        return
      }
      setResult({ blob, size: blob.size })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The conversion failed.')
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  function handleTarget(next: (typeof TARGETS)[number]) {
    if (forcedTarget) return
    setTarget(next)
    setQuality(suggestedQuality(next))
    setResult(null)
  }

  const verdict = source === 'unknown' ? null : formatVerdict(source, extensionOf(file?.name ?? ''))
  const change =
    file && result ? Math.round((result.size / file.size) * 100) - 100 : null

  return (
    <div className="space-y-4">
      <FileDrop
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
        onFiles={(files) => {
          setFile(files[0] ?? null)
          setResult(null)
          setError(null)
        }}
        hint="PNG, JPEG, WebP, GIF or BMP. The first frame of an animated GIF is used."
      />

      {file && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="File" value={file.name} />
          <StatTile label="Read as" value={sourceInfo.label} />
          <StatTile label="Original size" value={formatBytes(file.size)} />
        </div>
      )}

      {verdict && (
        <ToolPanel title="What the bytes say">
          <p className="text-sm text-muted">{verdict}</p>
        </ToolPanel>
      )}

      {file && source !== 'unknown' && (
        <>
          <ToolPanel title="Convert to">
            <div className="flex flex-wrap gap-2">
              {TARGETS.map((option) => {
                const info = formatInfo(option)
                const isCurrent = option === target
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleTarget(option)}
                    aria-pressed={isCurrent}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      isCurrent
                        ? 'border-brand bg-brand-soft text-brand-fg'
                        : 'border-line bg-surface text-fg hover:border-brand/40'
                    }`}
                  >
                    {info.label}
                  </button>
                )
              })}
            </div>

            {!isLossless(target) && (
              <div className="mt-4">
                <label htmlFor="quality" className="text-sm font-medium text-fg">
                  Quality
                </label>
                <input
                  id="quality"
                  type="range"
                  min={10}
                  max={100}
                  step={1}
                  value={quality}
                  onChange={(event) => {
                    setQuality(Number(event.target.value))
                    setResult(null)
                  }}
                  className="mt-2 w-full"
                />
                <div className="mt-1 flex items-center justify-between text-xs text-muted">
                  <span>10 — smallest</span>
                  <span className="font-mono text-fg">{quality}</span>
                  <span>100 — sharpest</span>
                </div>
                <p className="mt-2 text-xs text-muted">{qualityWords.headline}</p>
                {quality !== suggested && (
                  <p className="mt-1 text-xs text-muted">
                    {targetInfo.label} usually looks fine at {suggested}.
                  </p>
                )}
              </div>
            )}

            {isLossless(target) && (
              <p className="mt-3 text-xs text-muted">PNG is lossless, so there is nothing to trade away.</p>
            )}

            {note && (
              <p className="mt-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-fg">
                {note}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleConvert()}
                disabled={busy}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg disabled:opacity-50"
              >
                {busy ? 'Converting…' : `Convert to ${targetInfo.label}`}
              </button>
              {support === 'unsupported' && (
                <span className="text-xs text-warning">
                  This browser may not be able to write {targetInfo.label}. You will be told if the result is
                  empty.
                </span>
              )}
            </div>
          </ToolPanel>

          {error && (
            <ToolPanel title="That did not work">
              <p className="text-sm text-danger">{error}</p>
            </ToolPanel>
          )}

          {result?.blob && (
            <ToolPanel
              title="Converted"
              actions={
                <DownloadButton
                  filename={withExtension(file.name, targetInfo.extension)}
                  blob={result.blob}
                  label={`Download ${targetInfo.label}`}
                />
              }
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <StatTile label="New size" value={formatBytes(result.size)} />
                <StatTile
                  label="Change"
                  value={
                    change === null
                      ? '—'
                      : change === 0
                        ? 'no change'
                        : `${change > 0 ? '+' : ''}${change}%`
                  }
                />
                <StatTile label="Format" value={targetInfo.label} />
              </div>
              {change !== null && change > 0 && (
                <p className="mt-3 text-xs text-muted">
                  The converted file is larger than the original. That is normal when an already-compressed
                  JPEG is re-encoded, and it is why this tool reports the number instead of a percentage
                  saved.
                </p>
              )}
            </ToolPanel>
          )}

          {comparisons.length > 0 && (
            <ToolPanel title="Which format should you choose?">
              <dl className="space-y-3">
                {comparisons.map((comparison) => (
                  <div key={comparison.format}>
                    <dt className="text-sm font-medium text-fg">{comparison.info.label}</dt>
                    <dd className="mt-0.5 text-xs text-muted">
                      <span className="text-success">+ {comparison.advantage}</span>
                      <br />
                      <span className="text-warning">− {comparison.tradeoff}</span>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-muted">
                This tool converts {sourceInfo.label} to {TARGETS.filter((option) => option !== source).join(', ')}{' '}
                only. Everything is done in this browser tab; nothing is uploaded.
              </p>
            </ToolPanel>
          )}
        </>
      )}
    </div>
  )
}
