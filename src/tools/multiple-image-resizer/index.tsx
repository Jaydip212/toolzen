import { useState } from 'react'

import { ToolPanel } from '@/tools/shared'
import { FileDrop } from '@/tools/shared'
import { StatTile } from '@/components/tools/StatTile'
import { SegmentedControl } from '@/tools/shared'
import { Input } from '@/components/ui/Form'
import JSZip from 'jszip'
import { formatBytes } from '@/lib/utils'

import { MAX_BATCH, batchName, batchStatus, batchSummary, progressLine, targetFor } from './logic'

const MODES = [
  { value: 'long-edge', label: 'Long edge' },
  { value: 'exact', label: 'Exact square' },
]

export default function MultipleImageResizer() {
  const [files, setFiles] = useState<File[]>([])
  const [mode, setMode] = useState('long-edge')
  const [value, setValue] = useState(1600)
  const [jobs, setJobs] = useState<{ name: string; blob: Blob; size: number }[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const statusCheck = batchStatus(files.length)
  const done = jobs.length

  async function handleResize() {
    if (files.length === 0) return
    setError(null)
    setJobs([])
    setStatus(progressLine(0, files.length))

    const produced: { name: string; blob: Blob; size: number }[] = []
    try {
      for (const file of files) {
        const image = await decode(file)
        const target = targetFor({ width: image.width, height: image.height }, mode as 'long-edge', value)

        const canvas = document.createElement('canvas')
        canvas.width = target.width
        canvas.height = target.height
        const context = canvas.getContext('2d')
        if (!context) throw new Error(`This browser refused to create a canvas for ${file.name}.`)
        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = 'high'
        context.drawImage(image, 0, 0, target.width, target.height)

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.92))
        if (!blob) {
          throw new Error(`The browser could not write a WebP file for ${file.name}. Nothing was produced.`)
        }
        produced.push({
          name: batchName(file.name, produced.length, files.length, 'webp'),
          blob,
          size: blob.size,
        })
        setStatus(progressLine(produced.length, files.length))
      }
      setJobs(produced)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The batch failed part-way through.')
    } finally {
      setStatus(progressLine(produced.length, files.length))
    }
  }

  async function handleDownloadZip() {
    if (jobs.length === 0) return
    const zip = new JSZip()
    for (const job of jobs) zip.file(job.name, job.blob)
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'resized-images.zip'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <FileDrop
        accept="image/*"
        multiple
        onFiles={(files) => {
          setFiles(files)
          setJobs([])
          setError(null)
          setStatus(null)
        }}
        hint={`Up to ${MAX_BATCH} images at once.`}
      />

      {!statusCheck.ok && statusCheck.reason && <p className="text-sm text-danger">{statusCheck.reason}</p>}

      {files.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Images" value={String(files.length)} />
          <StatTile label="Total size" value={formatBytes(files.reduce((sum, file) => sum + file.size, 0))} />
          <StatTile label="Resized" value={String(done)} />
        </div>
      )}

      {status && (
        <p className="text-sm text-fg" role="status">
          {status}
        </p>
      )}

      <ToolPanel title="Target">
        <SegmentedControl value={mode} onChange={setMode} options={MODES} label="Resize mode" />
        <div className="mt-3 max-w-xs">
          <Input
            id="value"
            label={mode === 'long-edge' ? 'Longest side, in pixels' : 'Square size, in pixels'}
            type="number"
            min={16}
            max={20000}
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
          />
        </div>
        <p className="mt-3 text-xs text-muted">{batchSummary(mode as 'long-edge', value, files.length)}</p>
      </ToolPanel>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleResize()}
          disabled={files.length === 0 || !statusCheck.ok}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg disabled:opacity-50"
        >
          Resize {files.length > 0 ? `${files.length} image${files.length === 1 ? '' : 's'}` : ''}
        </button>
        {jobs.length > 0 && (
          <button
            type="button"
            onClick={() => void handleDownloadZip()}
            className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-fg"
          >
            Download all as a zip
          </button>
        )}
      </div>

      {error && (
        <ToolPanel title="That did not work">
          <p className="text-sm text-danger">{error}</p>
        </ToolPanel>
      )}

      {jobs.length > 0 && (
        <ToolPanel title="Results">
          <ul className="divide-y divide-line">
            {jobs.map((job) => (
              <li key={job.name} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate font-mono text-xs text-fg">{job.name}</span>
                <span className="shrink-0 text-xs text-muted">{formatBytes(job.size)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            The files are numbered with a shared width so they sort the same way in every file manager. Nothing left
            this device.
          </p>
        </ToolPanel>
      )}
    </div>
  )
}

/** Local decode helper; the batch cannot share one image element. */
function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
  }
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('That image could not be decoded.'))
    image.src = URL.createObjectURL(file)
  })
}
