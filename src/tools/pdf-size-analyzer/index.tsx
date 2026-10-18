import { useCallback, useState } from 'react'

import { FileDrop, ToolPanel } from '@/tools/shared'
import { StatTile } from '@/components/tools/StatTile'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { formatBytes } from '@/lib/utils'
import { openPdf } from '@/lib/pdf'

import { KIND_LABELS, SCOPE_NOTE, adviceFor, analyseSize, formatBinary, sizeSummary, type StreamEntry } from './logic'

/** Break down where the bytes inside a PDF actually are. */
export default function PdfSizeAnalyzer() {
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<number | null>(null)
  const [report, setReport] = useState<ReturnType<typeof analyseSize> | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(async (files: File[]) => {
    const chosen = files[0] ?? null
    setFile(chosen)
    setReport(null)
    setError(null)
    setPages(null)
    if (!chosen) return

    setBusy(true)
    try {
      const opened = await openPdf(new Uint8Array(await chosen.arrayBuffer()))
      if (!opened.ok) {
        setError(opened.error)
        return
      }
      const document = opened.document
      setPages(document.getPageCount())

      // Walk the objects and classify the binary streams. A stream whose
      // dictionary names an Image is an image; a Font is a font; a form or
      // content stream is page content.
      const streams: StreamEntry[] = []
      for (const [, object] of document.context.enumerateIndirectObjects()) {
        const candidate = object as unknown as {
          dict?: { get?: (name: string) => { decodeText?: () => string } | undefined }
          getContents?: () => Uint8Array
        }
        if (!candidate.dict || typeof candidate.getContents !== 'function') continue

        const subType = candidate.dict.get?.('Subtype')?.decodeText?.()
        const type = candidate.dict.get?.('Type')?.decodeText?.()

        let kind: StreamEntry['kind'] = 'other'
        if (subType === 'Image') kind = 'image'
        else if (type === 'Font' || subType === 'Type1' || subType === 'TrueType' || subType === 'Type0') kind = 'font'
        else if (subType === 'Form' || type === 'XObject' || candidate.dict.get?.('Length') !== undefined) kind = 'content'

        let bytes = 0
        try {
          bytes = candidate.getContents().length
        } catch {
          // A stream this reader cannot decode still occupies space, but there
          // is nothing honest to report about its size, so it is skipped.
          continue
        }
        streams.push({ kind, bytes })
      }

      setReport(analyseSize(chosen.size, streams))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That file could not be measured.')
    } finally {
      setBusy(false)
    }
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="Choose the PDF">
        <FileDrop
          accept="application/pdf,.pdf"
          label="Drop a PDF here, or choose one"
          hint="Read in this browser tab and never uploaded. Nothing is changed."
          onFiles={(files) => void handleFile(files)}
        />
        {file && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <StatTile label="File" value={file.name} />
            <StatTile label="Size on disk" value={formatBytes(file.size)} />
          </div>
        )}
      </ToolPanel>

      {busy && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Spinner size={16} label="Measuring" />
          Measuring the objects…
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {report && (
        <ToolPanel title="Where the bytes are">
          <p className="mb-3 text-sm text-fg">{sizeSummary(report)}</p>

          {report.parts.length === 0 ? (
            <p className="text-sm text-muted">No embedded streams were found in this document.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {report.parts.map((part) => (
                <li key={part.kind} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-fg">{KIND_LABELS[part.kind]}</span>
                    <span className="text-muted">
                      {formatBinary(part.bytes)} — {part.share}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.min(100, Math.max(1, part.share))}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 rounded-xl border border-line bg-surface-2/40 px-4 py-3 text-sm text-fg">
            {adviceFor(report)}
          </p>
          <p className="mt-1 text-xs text-muted">{SCOPE_NOTE}</p>
        </ToolPanel>
      )}

      {!report && !busy && !error && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Icon name="bar-chart" size={16} />
          Choose a PDF to see which parts of it hold the space{pages !== null ? '' : ''}.
        </p>
      )}
    </div>
  )
}
