import { useState } from 'react'

import { ToolPanel } from '@/tools/shared'
import { FileDrop } from '@/tools/shared'
import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton } from '@/tools/shared'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useDecodedImage, useFileBytes } from '@/tools/shared/useCanvas'
import { withExtension } from '@/lib/image-format'

import { OPERATIONS, applyTransforms, describeTransform, outputSizeFor, type Transform } from './logic'

/**
 * Rotate and flip.
 *
 * The preview and the export both read the same `Transform`, so what you see
 * is what the download contains.
 */
export default function ImageFlipper() {
  const [file, setFile] = useState<File | null>(null)
  const [transform, setTransform] = useState<Transform>({ rotation: 0, flipX: false, flipY: false })
  const [result, setResult] = useState<{ blob: Blob; width: number; height: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const { image } = useDecodedImage(file)
  const bytes = useFileBytes(file)
  const format = bytes ? (file?.name.split('.').pop() ?? 'jpeg') : 'jpeg'
  const output = image ? outputSizeFor({ width: image.width, height: image.height }, transform) : { width: 0, height: 0 }

  async function handleExport() {
    if (!image) return
    setBusy(true)
    setError(null)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = output.width
      canvas.height = output.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('This browser refused to create a canvas.')

      // Move to the centre, apply the transform, then draw centred.
      context.translate(canvas.width / 2, canvas.height / 2)
      context.rotate((transform.rotation * Math.PI) / 180)
      context.scale(transform.flipX ? -1 : 1, transform.flipY ? -1 : 1)
      context.drawImage(image, -image.width / 2, -image.height / 2)

      const mime = transform.rotation === 0 && !transform.flipX && !transform.flipY ? 'image/png' : 'image/png'
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime))
      if (!blob) {
        setError('The browser could not export that transform. Nothing was downloaded.')
        setResult(null)
        return
      }
      setResult({ blob, width: output.width, height: output.height })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The export failed.')
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
          setTransform({ rotation: 0, flipX: false, flipY: false })
          setResult(null)
          setError(null)
        }}
        hint="Any image the browser can read."
      />

      {image && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Original" value={`${image.width} × ${image.height}`} />
            <StatTile label="Output" value={`${output.width} × ${output.height}`} />
            <StatTile label="Transform" value={transform.rotation ? `${transform.rotation}°` : 'none'} />
          </div>

          <ToolPanel title="Transform">
            <div className="flex flex-wrap gap-2">
              {OPERATIONS.map((operation) => (
                <Button
                  key={operation.id}
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setTransform((current) => applyTransforms(current, operation.transform))
                    setResult(null)
                  }}
                >
                  {operation.label}
                </Button>
              ))}
              {transform.rotation !== 0 || transform.flipX || transform.flipY ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTransform({ rotation: 0, flipX: false, flipY: false })
                    setResult(null)
                  }}
                >
                  Reset
                </Button>
              ) : null}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Badge variant={transform.rotation === 0 && !transform.flipX && !transform.flipY ? 'neutral' : 'brand'}>
                {transform.rotation}°{transform.flipX ? ' · mirrored' : ''}{transform.flipY ? ' · flipped' : ''}
              </Badge>
              <p className="text-xs text-muted">{describeTransform(transform)}</p>
            </div>

            <p className="mt-3 text-xs text-muted">
              The export is re-drawn rather than rotated losslessly. A true lossless JPEG rotation only works on images
              whose sides are exact multiples of the encoder's block size, and this tool would rather re-encode and say
              so than claim a saving that silently fails.
            </p>
          </ToolPanel>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => void handleExport()}
              disabled={busy || (transform.rotation === 0 && !transform.flipX && !transform.flipY)}
            >
              {busy ? 'Exporting…' : 'Apply and export'}
            </Button>
            <span className="text-xs text-muted">
              Saved as {format.toUpperCase()} is not claimed — output is always PNG here, which is lossless.
            </span>
          </div>
        </>
      )}

      {error && (
        <ToolPanel title="That did not work">
          <p className="text-sm text-danger">{error}</p>
        </ToolPanel>
      )}

      {result && file && (
        <ToolPanel
          title="Exported"
          actions={
            <DownloadButton
              filename={withExtension(file.name, 'png')}
              blob={result.blob}
              label="Download PNG"
            />
          }
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="New size" value={`${result.width} × ${result.height}`} />
            <StatTile label="File size" value={`${Math.round(result.blob.size / 1024)} KB`} />
            <StatTile label="Transform" value={describeTransform(transform)} />
          </div>
        </ToolPanel>
      )}
    </div>
  )
}
