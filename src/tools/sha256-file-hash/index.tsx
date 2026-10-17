import { useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { CopyButton } from '@/components/ui/CopyButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Spinner } from '@/components/ui/Spinner'
import { FileDrop, ToolPanel } from '@/tools/shared'
import { downloadText } from '@/lib/download'
import { formatBytes } from '@/lib/utils'
import {
  DEFAULT_ALGORITHMS,
  FILE_ALGORITHMS,
  buildChecksumFile,
  checksumFileName,
  computeFileHashes,
  isAvailable,
  largeFileWarning,
  type DigestId,
  type HashRow,
} from './logic'

export function Sha256FileHashTool() {
  const [file, setFile] = useState<File | null>(null)
  const [selected, setSelected] = useState<DigestId[]>(DEFAULT_ALGORITHMS)
  const [rows, setRows] = useState<HashRow[]>([])
  const [progress, setProgress] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!file || selected.length === 0) {
        setRows([])
        setProgress(0)
        return
      }
      setBusy(true)
      setError(null)
      setProgress(0)
      try {
        const result = await computeFileHashes(file, selected, (fraction) => {
          if (!cancelled) setProgress(fraction)
        })
        if (!cancelled) setRows(result)
      } catch (thrown) {
        if (!cancelled) {
          setError(thrown instanceof Error ? thrown.message : 'Hashing failed.')
          setRows([])
        }
      } finally {
        if (!cancelled) setBusy(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [file, selected])

  function toggleAlgorithm(id: DigestId, enabled: boolean) {
    setSelected((current) =>
      enabled ? [...new Set([...current, id])] : current.filter((item) => item !== id),
    )
  }

  const warning = file ? largeFileWarning(file.size) : null
  const checksumText = file ? buildChecksumFile(file.name, rows) : ''

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel title="Choose a file">
        <FileDrop
          label="Drop a file here, or choose one"
          hint="Any file type. It is read in your browser — nothing is uploaded."
          onFiles={(files) => setFile(files[0] ?? null)}
        />
      </ToolPanel>

      {file && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-2/30 p-3 text-sm">
          <Icon name="file" size={16} className="shrink-0 text-muted" />
          <span className="min-w-0 flex-1 truncate font-medium text-fg">{file.name}</span>
          <span className="text-muted">{formatBytes(file.size)}</span>
          <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
            <Icon name="trash" size={16} />
            Remove
          </Button>
        </div>
      )}

      <ToolPanel
        title="Algorithms"
        description="SHA-256 is selected by default; add others if you need them."
      >
        <div className="grid gap-x-6 gap-y-3 rounded-2xl border border-line bg-surface-2/30 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {FILE_ALGORITHMS.map((algorithm) => (
            <Checkbox
              key={algorithm.id}
              label={algorithm.label}
              hint={
                algorithm.id === 'md5'
                  ? 'Legacy checksum — broken for security use.'
                  : algorithm.id === 'SHA-1'
                    ? 'Legacy checksum — no longer collision-resistant.'
                    : 'Via the browser Web Crypto API.'
              }
              disabled={!isAvailable(algorithm.id)}
              checked={selected.includes(algorithm.id)}
              onChange={(event) => toggleAlgorithm(algorithm.id, event.target.checked)}
            />
          ))}
        </div>
      </ToolPanel>

      {warning && (
        <p className="flex items-start gap-2 rounded-2xl border border-warning/30 bg-warning/8 p-4 text-sm text-fg">
          <Icon name="alert-triangle" size={16} className="mt-0.5 shrink-0 text-warning" />
          {warning}
        </p>
      )}

      {error && <ErrorState title="Hashing failed" message={error} />}

      {busy && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-sm text-muted">
            <Spinner size={18} />
            Reading and hashing…
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-150"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {!busy && rows.length > 0 && (
        <ToolPanel
          title="Digests"
          description="Every selected algorithm, computed from the same bytes."
          actions={
            <>
              <CopyButton
                value={rows.map((row) => `${row.label}: ${row.value}`).join('\n')}
                label="Copy all"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadText(
                    checksumText,
                    checksumFileName(file?.name ?? '', selected),
                    'text/plain',
                  )
                }
              >
                <Icon name="download" size={16} />
                Download checksums
              </Button>
            </>
          }
        >
          <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line">
            {rows.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center gap-3 p-3">
                <Badge variant={row.id === 'md5' || row.id === 'SHA-1' ? 'warning' : 'brand'}>
                  {row.label}
                </Badge>
                <code className="min-w-0 flex-1 break-all font-mono text-xs text-fg">
                  {row.value}
                </code>
                <CopyButton value={row.value} label="Copy" />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            The downloaded file uses the <code className="font-mono">sha256sum</code> format
            (<code className="font-mono">hash␣␣filename</code>), so it can be verified directly
            with <code className="font-mono">sha256sum -c</code> on Linux or macOS.
          </p>
        </ToolPanel>
      )}

      {!file && (
        <EmptyState
          icon="hash"
          title="No file selected"
          description="Choose a file to compute its SHA-256 (and any other digest you tick). The file is read locally with the browser's crypto API — it never leaves your device."
        />
      )}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Icon name="alert-triangle" size={14} className="mt-0.5 shrink-0 text-warning" />
        A matching hash proves the file is byte-for-byte what you expected. It does not prove the
        file is safe — always compare against a checksum published by the file's official source.
      </p>
    </div>
  )
}

export default Sha256FileHashTool
