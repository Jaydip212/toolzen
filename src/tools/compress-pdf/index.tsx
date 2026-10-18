import { useCallback, useState } from 'react'

import { DownloadButton, FileDrop, ToolPanel } from '@/tools/shared'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { StatTile } from '@/components/tools/StatTile'
import { formatBytes } from '@/lib/utils'
import { openPdf } from '@/lib/pdf'

import { SCOPE_NOTE, compareSizes, compressionError, isMarginal, sizeLine, smallerSave, verdictFor } from './logic'

/**
 * Compress a PDF by re-saving its structure.
 *
 * Both saves are measured and the smaller one is kept, so the number on the
 * page is what happened to the file rather than a claim made in advance.
 */
export default function CompressPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ blob: Blob; name: string; sizes: ReturnType<typeof compareSizes> } | null>(null)

  const handleFile = useCallback(async (files: File[]) => {
    const chosen = files[0] ?? null
    setFile(chosen)
    setResult(null)
    setError(null)
    setPageCount(null)
    if (!chosen) return

    try {
      const opened = await openPdf(new Uint8Array(await chosen.arrayBuffer()))
      if (!opened.ok) {
        setError(opened.error)
        return
      }
      setPageCount(opened.document.getPageCount())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That file could not be read.')
    }
  }, [])

  async function handleCompress() {
    if (!file || pageCount === null) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const source = await openPdf(new Uint8Array(await file.arrayBuffer()))
      if (!source.ok) {
        setError(source.error)
        return
      }

      // Two saves of the same document, so the comparison is a measurement
      // rather than a promise.
      const plain = await source.document.save({ useObjectStreams: false })
      const packed = await source.document.save({ useObjectStreams: true })
      const sizes = compareSizes(plain.length, packed.length)

      const chosen = smallerSave(sizes) === 'packed' ? packed : plain
      setResult({
        blob: new Blob([chosen.buffer as ArrayBuffer], { type: 'application/pdf' }),
        name: file.name.replace(/\.pdf$/i, '') + '-compressed.pdf',
        sizes,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The PDF could not be re-saved.')
    } finally {
      setBusy(false)
    }
  }

  const blocked = pageCount === null ? 'Choose a PDF first.' : compressionError(pageCount, file?.size ?? 0)

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="1. Choose the PDF">
        <FileDrop
          accept="application/pdf,.pdf"
          label="Drop a PDF here, or choose one"
          hint="Read in this browser tab and never uploaded. Nothing is changed."
          onFiles={(files) => void handleFile(files)}
        />
        {file && pageCount !== null && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <StatTile label="File" value={file.name} />
            <StatTile label="Pages" value={String(pageCount)} />
          </div>
        )}
      </ToolPanel>

      <ToolPanel title="2. Read this first">
        <p className="text-sm text-fg">{SCOPE_NOTE}</p>
      </ToolPanel>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {result ? (
        <ToolPanel title="Done" className="border-success/30">
          <div className="flex flex-wrap items-center gap-3">
            <DownloadButton blob={result.blob} filename={result.name} label="Download the compressed PDF" size="md" />
            <span className="text-sm text-muted">{formatBytes(result.blob.size)} — {result.name}</span>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <StatTile label="Saved with object streams" value={formatBytes(result.sizes.packedBytes)} />
            <StatTile label="Saved as it was" value={formatBytes(result.sizes.plainBytes)} />
            <StatTile label="Kept" value={smallerSave(result.sizes) === 'packed' ? 'the packed version' : 'the original'} />
          </dl>

          <p className="mt-3 text-sm text-fg">{sizeLine(result.sizes, formatBytes)}</p>
          <p className="mt-1 text-sm text-muted">{verdictFor(result.sizes)}</p>
          {isMarginal(result.sizes) && (
            <p className="mt-2 text-xs text-warning">
              A saving under one percent is within the noise of a re-save. The file is the smaller of the two, and
              nothing was changed visually.
            </p>
          )}
        </ToolPanel>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void handleCompress()} disabled={busy || blocked !== null} size="lg">
            {busy ? (
              <>
                <Spinner size={16} label="Re-saving" />
                Re-saving…
              </>
            ) : (
              <>
                <Icon name="gauge" size={16} />
                Compress
              </>
            )}
          </Button>
          {blocked && <span className="text-sm text-danger">{blocked}</span>}
        </div>
      )}
    </div>
  )
}
