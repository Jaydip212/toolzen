import { useState } from 'react'

import { ToolPanel } from '@/tools/shared'
import { FileDrop } from '@/tools/shared'
import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton } from '@/tools/shared'
import JSZip from 'jszip'
import { useDecodedImage } from '@/tools/shared/useCanvas'
import { formatBytes } from '@/lib/utils'

import { ICON_SPECS, fitInSquare, linkTags, manifestJson, sourceVerdict } from './logic'

/** The default MIME, which is what the first canvas writes. */
const FORMAT = 'image/png'

export default function FaviconGenerator() {
  const [file, setFile] = useState<File | null>(null)
  const [siteName, setSiteName] = useState('My Site')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ blob: Blob; count: number } | null>(null)

  const { image } = useDecodedImage(file)
  const verdict = image ? sourceVerdict(image) : null

  async function handleGenerate() {
    if (!image) return
    setBusy(true)
    setError(null)
    try {
      const zip = new JSZip()
      const context = document.createElement('canvas').getContext('2d')
      if (!context) throw new Error('This browser refused to create a canvas.')

      for (const spec of ICON_SPECS) {
        const canvas = document.createElement('canvas')
        canvas.width = spec.size
        canvas.height = spec.size
        const target = canvas.getContext('2d')
        if (!target) throw new Error('This browser refused to create a canvas.')

        // The Apple icon is opaque on purpose: iOS masks it with its own
        // corners over a black square, so transparency shows through there.
        target.fillStyle = '#ffffff'
        target.fillRect(0, 0, spec.size, spec.size)

        const fit = fitInSquare({ width: image.width, height: image.height }, spec.size)
        target.drawImage(image, fit.offsetX, fit.offsetY, fit.drawWidth, fit.drawHeight)

        const dataUrl = canvas.toDataURL(FORMAT)
        const bytes = Uint8Array.from(atob(dataUrl.split(',')[1]), (ch) => ch.charCodeAt(0))
        zip.file(spec.filename, bytes.buffer as ArrayBuffer)
      }

      zip.file('site.html-snippet.txt', linkTags('/'))
      zip.file('site.webmanifest', manifestJson(siteName))

      const blob = await zip.generateAsync({ type: 'blob' })
      setResult({ blob, count: ICON_SPECS.length + 2 })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The icons could not be generated.')
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <FileDrop
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onFiles={(files) => {
          setFile(files[0] ?? null)
          setResult(null)
          setError(null)
        }}
        hint="A square source works best. Start from at least 512 × 512 if you can."
      />

      {file && verdict && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Source" value={`${image?.width ?? 0} × ${image?.height ?? 0}`} />
          <StatTile label="Sizes to generate" value={String(ICON_SPECS.length)} />
          <StatTile label="Ready" value={verdict.ok ? 'yes' : 'not yet'} />
        </div>
      )}

      {verdict && <p className={`text-xs ${verdict.ok ? 'text-muted' : 'text-danger'}`}>{verdict.note}</p>}

      <ToolPanel title="Options">
        <label htmlFor="site-name" className="text-sm font-medium text-fg">
          Site name, for the web app manifest
        </label>
        <input
          id="site-name"
          value={siteName}
          onChange={(event) => setSiteName(event.target.value)}
          className="mt-1 w-full max-w-xs rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg"
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={busy || !image || !verdict?.ok}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg disabled:opacity-50"
          >
            {busy ? 'Generating…' : 'Generate all icons'}
          </button>
          <span className="text-xs text-muted">Saved as PNG, which every browser accepts.</span>
        </div>
      </ToolPanel>

      {error && (
        <ToolPanel title="That did not work">
          <p className="text-sm text-danger">{error}</p>
        </ToolPanel>
      )}

      {result && (
        <ToolPanel
          title="Icons ready"
          actions={
            <DownloadButton
              filename="favicons.zip"
              blob={result.blob}
              label="Download the zip"
            />
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile label="Files" value={String(result.count)} />
            <StatTile label="Zip size" value={formatBytes(result.blob.size)} />
          </div>

          <h3 className="mt-4 text-sm font-medium text-fg">The HTML to paste in your head</h3>
          <pre className="mt-1 overflow-x-auto rounded-lg border border-line bg-surface-2 p-3 text-xs text-fg">
            {linkTags('/')}
          </pre>
          <p className="mt-2 text-xs text-muted">
            Change the paths to match where you put the files. The manifest goes at the root for the paths above to
            line up.
          </p>

          <h3 className="mt-4 text-sm font-medium text-fg">site.webmanifest</h3>
          <pre className="mt-1 overflow-x-auto rounded-lg border border-line bg-surface-2 p-3 text-xs text-fg">
            {manifestJson(siteName)}
          </pre>

          <p className="mt-3 text-xs text-muted">
            A true .ico file with several sizes packed inside is not produced. A browser reads a PNG favicon directly,
            and a malformed multi-size ICO is worse than none.
          </p>
        </ToolPanel>
      )}
    </div>
  )
}
