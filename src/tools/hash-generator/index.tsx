import { useCallback, useEffect, useState } from 'react'
import { Checkbox, Input, Textarea } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { CopyButton } from '@/components/ui/CopyButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Spinner } from '@/components/ui/Spinner'
import { FileDrop, ToolPanel, useObjectUrl } from '@/tools/shared'
import { formatBytes } from '@/lib/utils'
import {
  DIGEST_ALGORITHMS,
  compareChecksums,
  guessAlgorithm,
  hashAllFile,
  hashAllText,
  isAvailable,
  type DigestId,
  type HashRow,
} from './logic'

type Source = 'text' | 'file'

const ALL_IDS: DigestId[] = DIGEST_ALGORITHMS.map((algorithm) => algorithm.id)

export function HashGeneratorTool() {
  const [source, setSource] = useState<Source>('text')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [selected, setSelected] = useState<DigestId[]>(ALL_IDS)
  const [rows, setRows] = useState<HashRow[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expected, setExpected] = useState('')

  const fileUrl = useObjectUrl(source === 'file' ? file : null)

  const run = useCallback(async () => {
    setError(null)
    if (source === 'text') {
      if (text === '') {
        setRows([])
        return
      }
      setBusy(true)
      try {
        setRows(await hashAllText(text, selected))
      } catch (thrown) {
        setError(thrown instanceof Error ? thrown.message : 'Hashing failed.')
        setRows([])
      } finally {
        setBusy(false)
      }
      return
    }

    if (!file) {
      setRows([])
      return
    }
    setBusy(true)
    try {
      setRows(await hashAllFile(file, selected))
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : 'Hashing failed.')
      setRows([])
    } finally {
      setBusy(false)
    }
  }, [source, text, file, selected])

  // Recompute whenever the input or the selected algorithms change.
  useEffect(() => {
    void run()
  }, [run])

  const comparison = compareChecksums(expected, rows[0]?.value ?? '')
  const guessed = expected.trim() === '' ? null : guessAlgorithm(expected)

  function toggleAlgorithm(id: DigestId, enabled: boolean) {
    setSelected((current) =>
      enabled ? [...new Set([...current, id])] : current.filter((item) => item !== id),
    )
  }

  const hasInput = source === 'text' ? text !== '' : file !== null

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel title="What to hash">
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface-2/30 p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={source === 'text' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSource('text')}
            >
              <Icon name="type" size={16} />
              Text
            </Button>
            <Button
              variant={source === 'file' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSource('file')}
            >
              <Icon name="file" size={16} />
              File
            </Button>
          </div>

          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {DIGEST_ALGORITHMS.map((algorithm) => (
              <Checkbox
                key={algorithm.id}
                label={algorithm.label}
                hint={
                  isAvailable(algorithm.id)
                    ? algorithm.id === 'md5'
                      ? 'Legacy checksum — broken for security use.'
                      : 'Via the browser Web Crypto API.'
                    : 'Unavailable here — needs HTTPS or localhost.'
                }
                disabled={!isAvailable(algorithm.id)}
                checked={selected.includes(algorithm.id)}
                onChange={(event) => toggleAlgorithm(algorithm.id, event.target.checked)}
              />
            ))}
          </div>
        </div>
      </ToolPanel>

      {source === 'text' ? (
        <Textarea
          label="Text to hash"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type or paste the text you want to hash…"
          rows={6}
          spellCheck={false}
          className="font-mono text-xs"
        />
      ) : (
        <div className="flex flex-col gap-3">
          <FileDrop
            label="Choose a file to hash"
            hint="The file is read in your browser. Nothing is uploaded."
            onFiles={(files) => setFile(files[0] ?? null)}
          />
          {file && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-2/30 p-3 text-sm">
              <Icon name="file" size={16} className="shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate font-medium text-fg">{file.name}</span>
              <span className="text-muted">{formatBytes(file.size)}</span>
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand underline underline-offset-2"
                >
                  Open
                </a>
              )}
              <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                <Icon name="trash" size={16} />
                Remove
              </Button>
            </div>
          )}
        </div>
      )}

      {error && <ErrorState title="Hashing failed" message={error} />}

      {busy && (
        <div className="flex items-center gap-3 text-sm text-muted">
          <Spinner size={18} />
          Hashing…
        </div>
      )}

      {!busy && hasInput && rows.length > 0 && (
        <>
          <ToolPanel
            title="Digests"
            description="Every selected algorithm, computed from the same input."
            actions={
              <CopyButton
                value={rows.map((row) => `${row.label}: ${row.value}`).join('\n')}
                label="Copy all"
              />
            }
          >
            <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line">
              {rows.map((row) => (
                <div key={row.id} className="flex flex-wrap items-center gap-3 p-3">
                  <Badge variant={row.id === 'md5' ? 'warning' : 'brand'}>{row.label}</Badge>
                  <code className="min-w-0 flex-1 break-all font-mono text-xs text-fg">
                    {row.value}
                  </code>
                  <CopyButton value={row.value} label="Copy" />
                </div>
              ))}
            </div>
          </ToolPanel>

          <ToolPanel
            title="Verify a checksum"
            description="Paste a checksum you were given and compare it against the computed digests."
          >
            <div className="flex flex-col gap-3">
              <Input
                label="Expected checksum"
                value={expected}
                placeholder="Paste the checksum to compare…"
                className="font-mono text-xs"
                spellCheck={false}
                hint={
                  guessed
                    ? `That is the length of a ${guessed} digest.`
                    : 'Spaces, colons and a leading 0x are ignored when comparing.'
                }
                onChange={(event) => setExpected(event.target.value)}
              />

              {comparison && (
                <div
                  className={
                    comparison.match
                      ? 'flex items-start gap-3 rounded-2xl border border-success/30 bg-success/8 p-4 text-sm'
                      : 'flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/8 p-4 text-sm'
                  }
                  role="status"
                >
                  <Icon
                    name={comparison.match ? 'circle-check' : 'circle-x'}
                    size={18}
                    className={comparison.match ? 'mt-0.5 shrink-0 text-success' : 'mt-0.5 shrink-0 text-danger'}
                  />
                  <div>
                    <p className="font-medium text-fg">
                      {comparison.match
                        ? 'Match — the checksum is identical.'
                        : 'No match — the checksum is different.'}
                    </p>
                    {!comparison.comparable && (
                      <p className="mt-1 leading-relaxed text-muted">
                        The two values are different lengths, so they cannot be the same digest.
                        Check that you are comparing the same algorithm.
                      </p>
                    )}
                    <p className="mt-1 break-all font-mono text-xs text-muted">
                      expected {comparison.normalizedExpected || '(empty)'}
                    </p>
                    <p className="break-all font-mono text-xs text-muted">
                      computed {comparison.normalizedActual}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ToolPanel>
        </>
      )}

      {!hasInput && (
        <EmptyState
          icon="hash"
          title="Nothing to hash yet"
          description="Type some text or choose a file. Every selected algorithm is computed in your browser — the input never leaves your device."
        />
      )}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Icon name="alert-triangle" size={14} className="mt-0.5 shrink-0 text-warning" />
        MD5 and SHA-1 are included so you can check legacy checksums, but both are considered broken
        for security purposes. Use SHA-256 or stronger when you are protecting something.
      </p>
    </div>
  )
}

export default HashGeneratorTool
