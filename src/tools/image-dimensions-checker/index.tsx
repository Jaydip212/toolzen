import { useMemo, useState } from 'react'

import { ToolPanel } from '@/tools/shared'
import { FileDrop } from '@/tools/shared'
import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton } from '@/tools/shared'
import { Input } from '@/components/ui/Form'
import { useDecodedImage, useFileBytes } from '@/tools/shared/useCanvas'
import { formatBytes } from '@/lib/utils'

import { printSize, reportFromBytes, reportFromDecoded, sizeVerdict } from './logic'

/**
 * Report an image's pixel dimensions and what that means for a job.
 *
 * The benchmark list is deliberately short and matched by keyword, so a job it
 * does not recognise gets the raw numbers rather than an invented verdict.
 */
export default function ImageDimensionsChecker() {
  const [file, setFile] = useState<File | null>(null)
  const [job, setJob] = useState('website hero')
  const [dpi, setDpi] = useState(300)

  const { image } = useDecodedImage(file)
  const bytes = useFileBytes(file)

  const report = useMemo(() => {
    if (bytes) {
      const fromBytes = reportFromBytes(bytes)
      if (fromBytes) return fromBytes
    }
    return image ? reportFromDecoded(image) : null
  }, [bytes, image])

  const verdict = report ? sizeVerdict(report, job) : null

  return (
    <div className="space-y-4">
      <FileDrop
        accept="image/*"
        onFiles={(files) => setFile(files[0] ?? null)}
        hint="The size is read from the file's header where possible, and by decoding it otherwise."
      />

      {file && report && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <StatTile label="Width" value={String(report.width)} />
            <StatTile label="Height" value={String(report.height)} />
            <StatTile label="Megapixels" value={String(report.megapixels)} />
            <StatTile label="File size" value={formatBytes(file.size)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
              <p className="text-xs text-muted">Aspect ratio</p>
              <p className="text-sm font-medium text-fg">{report.ratio}</p>
              <p className="text-xs text-muted">{report.description}</p>
            </div>
            <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
              <p className="text-xs text-muted">How the size was read</p>
              <p className="text-sm font-medium text-fg">
                {report.source === 'header'
                  ? 'From the file header — no decoding needed'
                  : 'By decoding the image in this browser'}
              </p>
            </div>
          </div>
        </>
      )}

      <ToolPanel title="Is it big enough?">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="job"
            label="What is it for?"
            value={job}
            onChange={(event) => setJob(event.target.value)}
            hint="Try “website hero”, “thumbnail”, “print poster” or “4k screen”."
          />
          <Input
            id="dpi"
            label="DPI, for print"
            type="number"
            min={72}
            max={1200}
            value={dpi}
            onChange={(event) => setDpi(Number(event.target.value))}
          />
        </div>
        {verdict && <p className="mt-3 text-sm text-fg">{verdict}</p>}
        {report && <p className="mt-2 text-xs text-muted">{printSize(report, dpi)}</p>}
      </ToolPanel>

      {file && (
        <ToolPanel title="Copy">
          <div className="flex flex-wrap items-center gap-2">
            <DownloadButton
              filename={file.name.replace(/\.[^.]+$/, '') + '-dimensions.txt'}
              text={report ? `${report.width} × ${report.height} pixels\n${report.ratio} ratio\n${report.megapixels} megapixels\n` : ''}
              label="Download a text summary"
            />
            <span className="text-xs text-muted">A plain record of the numbers, for your notes.</span>
          </div>
        </ToolPanel>
      )}
    </div>
  )
}
