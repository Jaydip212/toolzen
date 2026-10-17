import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { Checkbox, Input } from '@/components/ui/Form'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { CopyButton } from '@/components/ui/CopyButton'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import { normalizeDomain, validateDomain } from '@/lib/dns'
import {
  CertificateLookupError,
  dataCaveat,
  headline,
  lookupCertificates,
  summariseCertificates,
  toCsv,
  toRows,
  uniqueNames,
  validityBadge,
  type Certificate,
  type CertificateSummary,
} from './logic'

const TIMEOUT_MS = 25_000

interface LookupState {
  domain: string
  certificates: Certificate[]
  summary: CertificateSummary
  url: string
}

export function SslCertificateInfoTool() {
  const [domain, setDomain] = useState('')
  const [includeSubdomains, setIncludeSubdomains] = useState(true)
  const [state, setState] = useState<LookupState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function run() {
    const problem = validateDomain(domain)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    setLoading(true)

    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const { certificates, url } = await lookupCertificates(domain, {
        includeSubdomains,
        signal: controller.signal,
      })
      setState({
        domain: normalizeDomain(domain),
        certificates,
        summary: summariseCertificates(certificates),
        url,
      })
    } catch (failure) {
      setError(
        failure instanceof CertificateLookupError || failure instanceof Error
          ? failure.message
          : String(failure),
      )
    } finally {
      window.clearTimeout(timer)
      setLoading(false)
    }
  }

  const rows = state ? toRows(state.certificates) : []
  const names = state ? uniqueNames(state.certificates) : []

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="Search the certificate transparency logs"
        description="crt.sh is queried directly from your browser. No proxy, no account."
      >
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Domain"
            value={domain}
            containerClassName="min-w-56 flex-1"
            placeholder="example.com"
            spellCheck={false}
            onChange={(event) => {
              setDomain(event.target.value)
              setError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !loading) void run()
            }}
          />
          <Button onClick={() => void run()} disabled={loading || domain.trim() === ''}>
            {loading ? 'Searching…' : 'Search certificates'}
          </Button>
        </div>
        <Checkbox
          label="Include subdomains"
          hint="Uses a %.domain pattern. Uncheck for the exact name only — useful when a domain has thousands of subdomains."
          checked={includeSubdomains}
          onChange={(event) => setIncludeSubdomains(event.target.checked)}
        />
      </ToolPanel>

      {error && <ErrorState title="Could not look up certificates" message={error} />}

      {state && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Certificates" value={state.summary.unique} hint="after deduplication" />
            <StatTile label="Valid now" value={state.summary.valid} />
            <StatTile label="Expired" value={state.summary.expired} />
            <StatTile
              label="Expiring soon"
              value={state.summary.expiringSoon}
              hint="within 30 days"
            />
          </div>

          <div className="rounded-2xl border border-brand/30 bg-brand-soft p-4">
            <p className="text-sm font-medium text-fg">{headline(state.domain, state.summary)}</p>
            {state.summary.issuers.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">Issuers:</span>
                {state.summary.issuers.slice(0, 6).map((issuer) => (
                  <Badge key={issuer.name} variant="outline">
                    {issuer.name} · {issuer.count}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <ToolPanel
            title="Certificates"
            description="Newest expiry first. Times are UTC."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <CopyButton value={toCsv(state.certificates)} label="Copy CSV" />
                <a
                  href={state.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line px-3 text-sm text-fg transition-colors hover:bg-surface-2"
                >
                  <Icon name="external-link" size={14} />
                  View on crt.sh
                </a>
              </div>
            }
          >
            {rows.length === 0 ? (
              <p className="rounded-xl border border-line bg-surface-2/40 p-3 text-sm text-muted">
                crt.sh returned no certificates for {state.domain}. Either the domain has never had
                a publicly trusted certificate, or the query matched nothing — try unchecking
                “Include subdomains”.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface-2/60">
                      <th scope="col" className="px-3 py-2 text-left font-medium text-muted">Common name</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-muted">Issuer</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-muted">Valid from</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-muted">Valid to</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => {
                      const badge = validityBadge(row.validity)
                      return (
                        <tr
                          key={`${row.certificate.serialNumber}:${index}`}
                          className="border-b border-line last:border-b-0"
                        >
                          <td className="px-3 py-2 align-top">
                            <span className="font-mono text-xs text-fg">{row.certificate.commonName}</span>
                            {row.certificate.names.length > 1 && (
                              <span className="mt-1 block text-xs text-muted">
                                +{row.certificate.names.length - 1} more name
                                {row.certificate.names.length - 1 === 1 ? '' : 's'}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 align-top text-xs text-muted">{row.issuerLabel}</td>
                          <td className="whitespace-nowrap px-3 py-2 align-top text-xs text-muted">
                            {row.notBefore}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 align-top text-xs text-muted">
                            {row.notAfter}
                            {row.remainingDays !== null && row.validity === 'valid' && (
                              <span className="ml-1 text-muted">({row.remainingDays}d)</span>
                            )}
                          </td>
                          <td className="px-3 py-2 align-top">
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </ToolPanel>

          {names.length > 0 && (
            <ToolPanel
              title="Names covered"
              description={`${names.length} distinct hostname${names.length === 1 ? '' : 's'} across every certificate returned.`}
              actions={<CopyButton value={names.join('\n')} label="Copy names" />}
            >
              <div className="flex max-h-64 flex-wrap gap-1.5 overflow-auto rounded-xl border border-line bg-surface-2/30 p-3">
                {names.map((name) => (
                  <code
                    key={name}
                    className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-xs text-fg"
                  >
                    {name}
                  </code>
                ))}
              </div>
            </ToolPanel>
          )}
        </>
      )}

      {!state && !error && (
        <EmptyState
          icon="lock"
          title="Look up a domain's certificates"
          description="Enter a domain to see every certificate a public CA has logged for it, with issuer, validity dates and covered names. Results come from the public Certificate Transparency log via crt.sh."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setDomain('example.com')
                void run()
              }}
            >
              Try example.com
            </Button>
          }
        />
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface-2/40 p-4 text-xs leading-relaxed text-muted">
        <Icon name="info" size={16} className="mt-0.5 shrink-0" />
        <p>{dataCaveat()}</p>
      </div>
    </div>
  )
}

export default SslCertificateInfoTool
