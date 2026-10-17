import { useMemo, useState } from 'react'
import { Textarea } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { CopyButton } from '@/components/ui/CopyButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ToolPanel } from '@/tools/shared'
import {
  JwtError,
  decodeJwt,
  describeAlgorithm,
  describeClaims,
  formatDuration,
  jwtStatus,
} from './logic'

const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE4OTM0NTYwMDAsInJvbGVzIjpbImFkbWluIiwidXNlciJdfQ.dyt0CoTl4WoVjAHI9Q_CwSKhl6d_9rhM3NrXuJttkao'

export function JwtDecoderTool() {
  const [token, setToken] = useState('')

  const result = useMemo(() => {
    if (token.trim() === '') return { decoded: null, error: null as string | null }
    try {
      return { decoded: decodeJwt(token), error: null as string | null }
    } catch (error) {
      return {
        decoded: null,
        error: error instanceof JwtError ? error.message : 'The token could not be decoded.',
      }
    }
  }, [token])

  const claims = useMemo(
    () => (result.decoded ? describeClaims(result.decoded.payload) : []),
    [result.decoded],
  )
  const status = useMemo(
    () => (result.decoded ? jwtStatus(result.decoded.payload) : null),
    [result.decoded],
  )

  return (
    <div className="flex flex-col gap-6">
      {/* The honesty banner is not optional: a decoder is not a verifier. */}
      <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/8 p-4 text-sm">
        <Icon name="alert-triangle" size={18} className="mt-0.5 shrink-0 text-warning" />
        <div>
          <p className="font-medium text-fg">Decoding does not verify anything</p>
          <p className="mt-1 leading-relaxed text-muted">
            This tool reads the token's contents. It does <strong>not</strong> check the signature,
            so a decoded token is not proof that it is genuine or untampered — anyone can write any
            payload they like. Never trust a token's contents just because it decoded cleanly, and
            never paste a production token you do not own.
          </p>
        </div>
      </div>

      <Textarea
        label="JSON Web Token"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        placeholder="Paste a JWT — three Base64URL segments separated by dots…"
        rows={5}
        spellCheck={false}
        className="font-mono text-xs"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => setToken(SAMPLE)}>
          <Icon name="key" size={16} />
          Load example token
        </Button>
        <Button variant="ghost" onClick={() => setToken('')} disabled={!token}>
          <Icon name="trash" size={16} />
          Clear
        </Button>
      </div>

      {result.error && <ErrorState title="That token could not be decoded" message={result.error} />}

      {result.decoded && status && (
        <>
          {/* Time-based claims */}
          <div className="flex flex-wrap items-center gap-2">
            {status.expired === null ? (
              <Badge variant="neutral">No expiry claim</Badge>
            ) : status.expired ? (
              <Badge variant="danger">Expired</Badge>
            ) : (
              <Badge variant="success">Not expired</Badge>
            )}
            {status.notYetValid === true && <Badge variant="warning">Not valid yet</Badge>}
            {status.secondsUntilExpiry !== null && (
              <Badge variant={status.secondsUntilExpiry < 0 ? 'danger' : 'neutral'}>
                {formatDuration(status.secondsUntilExpiry)}
              </Badge>
            )}
            {status.issuedAt && <Badge variant="neutral">Issued {status.issuedAt.toUTCString()}</Badge>}
          </div>

          <ToolPanel
            title="Header"
            description={describeAlgorithm(result.decoded.header)}
            actions={<CopyButton value={JSON.stringify(result.decoded.header, null, 2)} label="Copy" />}
          >
            <pre className="tz-scroll overflow-auto rounded-xl border border-line bg-surface-2/40 p-3 font-mono text-xs leading-relaxed text-fg">
              {JSON.stringify(result.decoded.header, null, 2)}
            </pre>
          </ToolPanel>

          <ToolPanel
            title="Payload claims"
            description="Registered claims first, then anything custom."
            actions={
              <CopyButton value={JSON.stringify(result.decoded.payload, null, 2)} label="Copy" />
            }
          >
            {claims.length === 0 ? (
              <p className="rounded-xl border border-line bg-surface-2/30 p-4 text-sm text-muted">
                The payload is an empty object — this token carries no claims.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-line">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface-2/60">
                      <th scope="col" className="px-3 py-2 text-left font-medium text-muted">
                        Claim
                      </th>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-muted">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map((claim) => (
                      <tr key={claim.key} className="border-b border-line last:border-b-0">
                        <td className="px-3 py-2 align-top">
                          <span className="block font-medium text-fg">{claim.label}</span>
                          <code className="text-xs text-muted">{claim.key}</code>
                          {claim.description && (
                            <span className="mt-0.5 block text-xs text-muted">
                              {claim.description}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <code className="block break-all font-mono text-xs text-fg">
                            {claim.value}
                          </code>
                          {claim.human && (
                            <span className="mt-0.5 block text-xs text-muted">{claim.human}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ToolPanel>

          <ToolPanel
            title="Signature"
            description="Shown as it appears in the token. TOOLZEN does not verify it."
          >
            <div className="flex items-start gap-2">
              <code className="min-w-0 flex-1 break-all rounded-xl border border-line bg-surface-2/40 p-3 font-mono text-xs text-fg">
                {result.decoded.signature || '(empty)'}
              </code>
              <CopyButton value={result.decoded.signature} label="Copy" />
            </div>
          </ToolPanel>
        </>
      )}

      {token.trim() === '' && (
        <EmptyState
          icon="key"
          title="Paste a token to decode it"
          description="The header and payload are read locally in your browser. Nothing is sent anywhere, and the signature is never verified."
          action={
            <Button variant="secondary" onClick={() => setToken(SAMPLE)}>
              Load example token
            </Button>
          }
        />
      )}
    </div>
  )
}

export default JwtDecoderTool
