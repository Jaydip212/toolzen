import { useEffect, useMemo, useState } from 'react'
import { Textarea } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { CopyButton } from '@/components/ui/CopyButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Spinner } from '@/components/ui/Spinner'
import { FileDrop, ToolPanel } from '@/tools/shared'
import { formatBytes } from '@/lib/utils'
import {
  parseChecksumLines,
  verifyFile,
  type VerificationResult,
} from './logic'

export function FileIntegrityVerificationTool() {
  const [file, setFile] = useState<File | null>(null)
  const [expected, setExpected] = useState('')
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const entries = useMemo(() => parseChecksumLines(expected), [expected])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!file || expected.trim() === '') {
        setResult(null)
        return
      }
      setBusy(true)
      setError(null)
      try {
        const outcome = await verifyFile(file, expected)
        if (!cancelled) setResult(outcome)
      } catch (thrown) {
        if (!cancelled) {
          setError(thrown instanceof Error ? thrown.message : 'Verification failed.')
          setResult(null)
        }
      } finally {
        if (!cancelled) setBusy(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [file, expected])

  const tone =
    result?.verdict === 'match'
      ? {
          border: 'border-success/30 bg-success/8',
          icon: 'circle-check' as const,
          iconClass: 'text-success',
          title: 'Checksum matches',
        }
      : result?.verdict === 'mismatch'
        ? {
            border: 'border-danger/30 bg-danger/8',
            icon: 'circle-x' as const,
            iconClass: 'text-danger',
            title: 'Checksum does not match',
          }
        : null

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel title="1. Choose the file you downloaded">
        <FileDrop
          label="Drop the downloaded file here, or choose one"
          hint="The file is read in your browser and never uploaded."
          onFiles={(files) => setFile(files[0] ?? null)}
        />
        {file && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-2/30 p-3 text-sm">
            <Icon name="file" size={16} className="shrink-0 text-muted" />
            <span className="min-w-0 flex-1 truncate font-medium text-fg">{file.name}</span>
            <span className="text-muted">{formatBytes(file.size)}</span>
            <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
              <Icon name="trash" size={16} />
              Remove
            </Button>
          </div>
        )}
      </ToolPanel>

      <ToolPanel
        title="2. Paste the published checksum"
        description="A single hash, or a whole checksum file — one line per file."
      >
        <Textarea
          label="Expected checksum"
          value={expected}
          rows={5}
          spellCheck={false}
          className="font-mono text-xs"
          placeholder="e.g. ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
          onChange={(event) => setExpected(event.target.value)}
        />
        {expected.trim() !== '' && entries.length === 0 && (
          <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-muted">
            <Icon name="info" size={14} className="mt-0.5 shrink-0" />
            No checksum could be read from that. Paste a hex digest — with or without a file name.
          </p>
        )}
        {entries.length > 1 && (
          <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-muted">
            <Icon name="info" size={14} className="mt-0.5 shrink-0" />
            Found {entries.length} checksums. The one whose file name matches{' '}
            <span className="font-medium text-fg">{file?.name ?? 'your file'}</span> is used; if
            none matches, the first one is.
          </p>
        )}
      </ToolPanel>

      {error && <ErrorState title="Verification failed" message={error} />}

      {busy && (
        <div className="flex items-center gap-3 text-sm text-muted">
          <Spinner size={18} />
          Computing the digest…
        </div>
      )}

      {!busy && result && tone && (
        <div className={`flex flex-col gap-4 rounded-2xl border p-5 ${tone.border}`} role="status">
          <div className="flex items-start gap-3">
            <Icon name={tone.icon} size={24} className={`mt-0.5 shrink-0 ${tone.iconClass}`} />
            <div className="min-w-0">
              <p className="text-base font-semibold text-fg">{tone.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{result.detail}</p>
            </div>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface/60 p-3">
              <dt className="flex items-center justify-between gap-2 text-xs text-muted">
                <span>Expected</span>
                <CopyButton value={result.expected?.hash ?? ''} label="Copy" />
              </dt>
              <dd className="mt-1 break-all font-mono text-xs text-fg">
                {result.expected?.hash ?? '—'}
              </dd>
            </div>
            <div className="rounded-xl border border-line bg-surface/60 p-3">
              <dt className="flex items-center justify-between gap-2 text-xs text-muted">
                <span>Computed from your file</span>
                <CopyButton value={result.actual ?? ''} label="Copy" />
              </dt>
              <dd className="mt-1 break-all font-mono text-xs text-fg">
                {result.actual ?? '—'}
              </dd>
            </div>
          </dl>

          {result.algorithmLabel && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span>Algorithm used:</span>
              <Badge variant={result.algorithm === 'md5' ? 'warning' : 'brand'}>
                {result.algorithmLabel}
              </Badge>
              <span>— chosen from the length of the checksum you pasted.</span>
            </div>
          )}
        </div>
      )}

      {!busy && result && !tone && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/8 p-5">
          <Icon name="alert-triangle" size={20} className="mt-0.5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-fg">
              {result.verdict === 'no-checksum' ? 'No checksum to check against' : 'Unsupported checksum'}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{result.detail}</p>
          </div>
        </div>
      )}

      {!file && (
        <EmptyState
          icon="shield"
          title="Verify a download"
          description="Drop in a file and paste the checksum its publisher gave you. TOOLZEN recomputes the digest locally and compares the two — a match means the file is byte-for-byte what was published."
        />
      )}

      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface-2/30 p-4 text-xs leading-relaxed text-muted">
        <p className="flex items-start gap-2">
          <Icon name="lock" size={14} className="mt-0.5 shrink-0 text-brand" />
          <span>
            The file is read in your browser using the Web Crypto API. It is never uploaded, and
            neither the file nor the checksum is stored.
          </span>
        </p>
        <p className="flex items-start gap-2">
          <Icon name="alert-triangle" size={14} className="mt-0.5 shrink-0 text-warning" />
          <span>
            A match only means the file is identical to the one described by that checksum. If an
            attacker could change the file, they could change the published checksum too — always
            take the checksum from the official source, over HTTPS.
          </span>
        </p>
      </div>
    </div>
  )
}

export default FileIntegrityVerificationTool
