import { useMemo, useState } from 'react'

import { ToolPanel } from '@/tools/shared'
import { FileDrop } from '@/tools/shared'
import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton } from '@/tools/shared'
import { Button } from '@/components/ui/Button'
import { useDecodedImage, useFileBytes } from '@/tools/shared/useCanvas'
import { useObjectUrl } from '@/tools/shared'
import {
  combineExifDateTime,
  describeFormatMismatch,
  detectFormat,
  exifTransform,
  formatInfo,
  readExif,
  withExtension,
} from '@/lib/image-format'

/**
 * Read a photo's embedded information.
 *
 * Nothing is uploaded: the file is opened in this tab and the bytes are
 * parsed here. The tool also strips EXIF on export, which is the point of
 * looking at it in the first place for most people.
 */
export default function ImageMetadataViewer() {
  const [file, setFile] = useState<File | null>(null)
  const [stripBusy, setStripBusy] = useState(false)
  const [stripResult, setStripResult] = useState<{ blob: Blob; note: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { image } = useDecodedImage(file)
  const bytes = useFileBytes(file)
  const previewUrl = useObjectUrl(file)

  const report = useMemo(() => {
    if (!file || !bytes) return null
    const format = detectFormat(bytes)
    const exif = readExif(bytes)
    const transform = exifTransform(Number(exif.orientation?.match(/\d+/)?.[0] ?? NaN))
    return { format, exif, transform }
  }, [file, bytes])

  async function handleStrip() {
    if (!file || !image) return
    setStripBusy(true)
    setError(null)
    try {
      // Re-drawing on a canvas drops every EXIF block, because the encoder
      // starts from an empty image and knows nothing about the original tags.
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('This browser refused to create a canvas.')
      context.drawImage(image, 0, 0)
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
      if (!blob) {
        setError('The browser could not export a cleaned copy. Nothing was downloaded.')
        setStripResult(null)
        return
      }
      setStripResult({
        blob,
        note: 'Re-drawing the image drops every EXIF tag, including GPS. Note that JPEG is lossy, so this re-compresses the picture.',
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The cleanup failed.')
      setStripResult(null)
    } finally {
      setStripBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <FileDrop
        accept="image/*"
        onFiles={(files) => {
          setFile(files[0] ?? null)
          setStripResult(null)
          setError(null)
        }}
        hint="JPEG gives the fullest EXIF; PNG and WebP carry almost nothing."
      />

      {file && report && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <StatTile label="File" value={file.name} />
            <StatTile label="Format" value={formatInfo(report.format).label} />
            <StatTile label="Size" value={`${Math.round(file.size / 1024)} KB`} />
            <StatTile
              label="Dimensions"
              value={image ? `${image.width} × ${image.height}` : 'reading…'}
            />
          </div>

          {bytes && (
            <p className="text-xs text-muted">{describeFormatMismatch(bytes, file.name) ?? 'The format matches the extension on the name.'}</p>
          )}

          <ToolPanel title="Exif">
            {report.exif.fields.length === 0 ? (
              <p className="text-sm text-muted">
                No EXIF tags were found. That is normal for screenshots, images exported from design tools, and
                anything that has already been through a social network — those all strip it.
              </p>
            ) : (
              <dl className="grid gap-2 sm:grid-cols-2">
                {report.exif.fields.map((field) => (
                  <div key={field.key} className="rounded-lg border border-line bg-surface-2 px-3 py-2">
                    <dt className="text-xs text-muted">{field.label}</dt>
                    <dd className="text-sm text-fg">{field.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {report.exif.takenAt && (
              <p className="mt-3 text-xs text-muted">
                Taken {combineExifDateTime(report.exif.takenAt.split(' ')[0], report.exif.takenAt.split(' ')[1]) ?? report.exif.takenAt}.
                EXIF stores the date and time separately and carries no time zone.
              </p>
            )}
          </ToolPanel>

          {previewUrl && (
            <ToolPanel title="Orientation">
              <img
                src={previewUrl}
                alt="The image you are inspecting"
                className="max-h-72 rounded border border-line"
              />
              <p className="mt-2 text-xs text-muted">
                {report.exif.orientation
                  ? `The file says it is ${report.exif.orientation}. Browsers usually honour this, so a sideways photo here means the tag is being applied.`
                  : 'No orientation tag is present, so this is how the file will be shown.'}
              </p>
            </ToolPanel>
          )}

          <ToolPanel title="Privacy">
            <p className="text-sm text-muted">
              Phone photos routinely carry the make and model of the camera, the exact time, and sometimes GPS
              coordinates. Sharing the original file shares all of it.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button onClick={() => void handleStrip()} disabled={stripBusy}>
                {stripBusy ? 'Cleaning…' : 'Export a copy without EXIF'}
              </Button>
              {stripResult && (
                <DownloadButton
                  filename={withExtension(file.name, 'jpg')}
                  blob={stripResult.blob}
                  label="Download cleaned copy"
                />
              )}
            </div>
            {stripResult && <p className="mt-2 text-xs text-muted">{stripResult.note}</p>}
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
