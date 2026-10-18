import { useCallback, useState } from 'react'

import { FileDrop, ToolPanel } from '@/tools/shared'
import { StatTile } from '@/components/tools/StatTile'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { openPdf } from '@/lib/pdf'

import { MISSING_NOTE, SCOPE_NOTE, isEmptyMetadata, metadataSummary, toRows, type RawMetadata } from './logic'

/** Read the document information dictionary out of a PDF. */
export default function PdfMetadataViewer() {
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ReturnType<typeof toRows> | null>(null)
  const [summary, setSummary] = useState('')
  const [hasXmp, setHasXmp] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(async (files: File[]) => {
    const chosen = files[0] ?? null
    setFile(chosen)
    setRows(null)
    setError(null)
    setHasXmp(false)
    if (!chosen) return

    setBusy(true)
    try {
      const opened = await openPdf(new Uint8Array(await chosen.arrayBuffer()))
      if (!opened.ok) {
        setError(opened.error)
        return
      }
      const document = opened.document

      // pdf-lib exposes the standard information dictionary. An XMP packet is
      // only detected, not read, and the report says so.
      let xmp = false
      try {
        const bytes = new Uint8Array(await chosen.arrayBuffer())
        xmp = new TextDecoder('latin1').decode(bytes.subarray(0, Math.min(bytes.length, 65536))).includes(
          'http://ns.adobe.com/xap/1.0/',
        )
      } catch {
        xmp = false
      }

      const raw: RawMetadata = {
        title: safeGet(() => document.getTitle()),
        author: safeGet(() => document.getAuthor()),
        subject: safeGet(() => document.getSubject()),
        keywords: safeGet(() => document.getKeywords()?.toString()),
        producer: safeGet(() => document.getProducer()),
        creator: safeGet(() => document.getCreator()),
        creationDate: safeGet(() => document.getCreationDate() ?? null),
        modificationDate: safeGet(() => document.getModificationDate() ?? null),
        pageCount: document.getPageCount(),
        hasXmp: xmp,
        permissions: [],
      }

      const built = toRows(raw)
      setRows(built)
      setSummary(metadataSummary(built, raw.pageCount))
      setHasXmp(xmp)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That file could not be read.')
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
          hint="Read in this browser tab and never uploaded. The metadata stays with the file."
          onFiles={(files) => void handleFile(files)}
        />
      </ToolPanel>

      {busy && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Spinner size={16} label="Reading" />
          Reading the document…
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {rows && (
        <ToolPanel title="What the document says about itself">
          <p className="mb-3 text-sm text-fg">{summary}</p>

          <dl className="divide-y divide-line">
            {rows.map((row) => (
              <div key={row.label} className="grid gap-1 py-2 sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-muted">{row.label}</dt>
                <dd className={`sm:col-span-2 ${row.missing ? 'text-sm italic text-muted' : 'text-sm text-fg'}`}>
                  {row.value}
                </dd>
              </div>
            ))}
            <div className="grid gap-1 py-2 sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-muted">XMP metadata</dt>
              <dd className="sm:col-span-2 text-sm text-fg">
                {hasXmp ? 'present, and not decoded here' : 'not present'}
              </dd>
            </div>
          </dl>

          {isEmptyMetadata(rows) && (
            <p className="mt-3 rounded-xl border border-line bg-surface-2/40 px-4 py-3 text-sm text-fg">
              This document states nothing about itself at all. That is common: plenty of PDF generators write the pages
              and never set a title or an author.
            </p>
          )}

          <p className="mt-3 text-xs text-muted">{MISSING_NOTE}</p>
          <p className="mt-1 text-xs text-muted">{SCOPE_NOTE}</p>
        </ToolPanel>
      )}

      {!rows && !busy && !error && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Icon name="info" size={16} />
          The report appears here, with anything the document does not say marked as such.
        </div>
      )}

      {file && rows && (
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile label="File" value={file.name} />
          <StatTile label="Size on disk" value={`${(file.size / 1024).toFixed(1)} KB`} />
        </div>
      )}
    </div>
  )
}

/** Read a value without letting one broken field take the whole report down. */
function safeGet<T>(read: () => T): NonNullable<T> | null {
  try {
    const value = read()
    return value === undefined || value === null ? null : (value as NonNullable<T>)
  } catch {
    return null
  }
}
