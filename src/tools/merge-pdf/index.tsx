import { useCallback, useEffect, useRef, useState } from 'react'

import { DownloadButton, FileDrop, ToolPanel } from '@/tools/shared'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { formatBytes } from '@/lib/utils'
import { openPdf } from '@/lib/pdf'

import { MAX_MERGE_FILES, MERGE_NOTE, mergeError, mergeSummary, mergedName } from './logic'

interface Entry {
  file: File
  /** Null until the file has been opened and counted. */
  pageCount: number | null
  error: string | null
}

/**
 * Merge PDFs in the order the user arranges them.
 *
 * The order is the point: files are appended in list order, and the list can
 * be rearranged before anything is written, because "in the order you arrange
 * them" is the promise the tool makes.
 */
export default function MergePdf() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Blob | null>(null)
  const [resultName, setResultName] = useState('merged.pdf')

  // Count pages for any entry that has not been measured yet. One pass per
  // change, guarded so a fast add-remove cadence does not double-count.
  const pendingKey = entries
    .map((entry, index) => (entry.pageCount === null && entry.error === null ? index : null))
    .filter((index) => index !== null)
    .join(',')
  const measured = useRef(new Set<string>())

  useEffect(() => {
    if (pendingKey === '') return

    let cancelled = false
    async function measureAll() {
      const indices = pendingKey.split(',').map(Number)
      for (const index of indices) {
        const entry = entries[index]
        if (!entry) continue
        const key = `${entry.file.name}:${entry.file.size}:${index}`
        if (measured.current.has(key)) continue
        measured.current.add(key)

        try {
          const bytes = new Uint8Array(await entry.file.arrayBuffer())
          const opened = await openPdf(bytes)
          if (cancelled) return
          setEntries((current) =>
            current.map((at, position) =>
              position === index
                ? {
                    ...at,
                    pageCount: opened.ok ? opened.document.getPageCount() : null,
                    error: opened.ok ? null : opened.error,
                  }
                : at,
            ),
          )
        } catch {
          if (cancelled) return
          setEntries((current) =>
            current.map((at, position) =>
              position === index ? { ...at, error: 'That file could not be read.' } : at,
            ),
          )
        }
      }
    }

    void measureAll()
    return () => {
      cancelled = true
    }
    // `entries` is read inside, but re-running on every entry change would
    // restart the loop for files already measured; the key decides that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingKey])

  const handleFiles = useCallback((files: File[]) => {
    setResult(null)
    setError(null)
    setEntries((current) => {
      const next = [...current]
      for (const file of files) {
        if (next.length >= MAX_MERGE_FILES) break
        next.push({ file, pageCount: null, error: null })
      }
      return next
    })
  }, [])

  const move = (index: number, direction: -1 | 1) => {
    setResult(null)
    setEntries((current) => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
  }

  const loaded = entries.filter((entry) => entry.pageCount !== null)
  const unreadable = entries.filter((entry) => entry.error !== null)
  const blocked = mergeError(entries.length, loaded.length)
  const summary = mergeSummary(entries.map((entry) => entry.pageCount ?? 0))

  async function handleMerge() {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const { PDFDocument } = await import('pdf-lib')
      const merged = await PDFDocument.create()

      for (const entry of entries) {
        const bytes = new Uint8Array(await entry.file.arrayBuffer())
        const opened = await openPdf(bytes)
        if (!opened.ok) {
          setError(`${entry.file.name}: ${opened.error}`)
          return
        }
        const copied = await merged.copyPages(opened.document, opened.document.getPageIndices())
        for (const page of copied) merged.addPage(page)
      }

      const saved = await merged.save()
      setResult(new Blob([saved.buffer as ArrayBuffer], { type: 'application/pdf' }))
      setResultName(mergedName(entries[0]?.file.name ?? 'document.pdf'))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The merge could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="1. Choose the PDFs">
        <FileDrop
          maxFileSizeBytes={50 * 1024 * 1024}
          accept="application/pdf,.pdf"
          multiple
          label="Drop PDFs here, or choose files"
          hint={`Up to ${MAX_MERGE_FILES} files, 50 MB each. They are read in this browser tab and never uploaded.`}
          onFiles={handleFiles}
        />
      </ToolPanel>

      {entries.length > 0 && (
        <ToolPanel title={`2. Arrange the order (${entries.length})`}>
          <ol className="flex flex-col gap-2">
            {entries.map((entry, index) => (
              <li
                key={`${entry.file.name}-${index}`}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-2/30 p-3 text-sm"
              >
                <span className="w-6 shrink-0 text-center font-medium text-muted">{index + 1}</span>
                <Icon name="file-text" size={16} className="shrink-0 text-muted" />
                <span className="min-w-0 flex-1 truncate font-medium text-fg">{entry.file.name}</span>
                <span className="shrink-0 text-muted">{formatBytes(entry.file.size)}</span>
                <span className="w-20 shrink-0 text-right text-muted">
                  {entry.error
                    ? 'could not open'
                    : entry.pageCount === null
                      ? 'reading…'
                      : `${entry.pageCount} page${entry.pageCount === 1 ? '' : 's'}`}
                </span>
                <span className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${entry.file.name} up`}
                  >
                    <Icon name="chevron-right" size={14} className="rotate-[-90deg]" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => move(index, 1)}
                    disabled={index === entries.length - 1}
                    aria-label={`Move ${entry.file.name} down`}
                  >
                    <Icon name="chevron-right" size={14} className="rotate-90" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setResult(null)
                      setEntries((current) => current.filter((_, at) => at !== index))
                    }}
                    aria-label={`Remove ${entry.file.name}`}
                  >
                    <Icon name="trash" size={14} />
                  </Button>
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-3 text-sm text-fg">{summary}</p>
          <p className="mt-1 text-xs text-muted">{MERGE_NOTE}</p>
          {unreadable.length > 0 && (
            <p className="mt-2 text-xs text-danger">
              {unreadable.length} file{unreadable.length === 1 ? '' : 's'} could not be opened. Remove{' '}
              {unreadable.length === 1 ? 'it' : 'them'} before merging.
            </p>
          )}
        </ToolPanel>
      )}

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {result ? (
        <ToolPanel title="Merged" className="border-success/30">
          <div className="flex flex-wrap items-center gap-3">
            <DownloadButton blob={result} filename={resultName} label="Download the merged PDF" size="md" />
            <span className="text-sm text-muted">
              {formatBytes(result.size)} — {resultName}
            </span>
          </div>
        </ToolPanel>
      ) : (
        <Button
          onClick={() => void handleMerge()}
          disabled={busy || blocked !== null}
          size="lg"
          className="self-start"
        >
          {busy ? (
            <>
              <Spinner size={16} label="Merging" />
              Merging…
            </>
          ) : (
            <>
              <Icon name="layers" size={16} />
              Merge {entries.length === 0 ? 'the files' : `${entries.length} file${entries.length === 1 ? '' : 's'}`}
            </>
          )}
        </Button>
      )}
    </div>
  )
}
