import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Form'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { CopyButton } from '@/components/ui/CopyButton'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import {
  BULK_TYPES,
  DNS_RECORD_TYPES,
  DOH_PROVIDERS,
  describeResult,
  formatTtl,
  groupByType,
  normalizeDomain,
  queryDns,
  toDisplayRecords,
  toZoneText,
  uniformTtl,
  validateDomain,
  type DnsRecordType,
  type DnsResult,
  type DohProviderId,
} from './logic'

interface LookupState {
  domain: string
  results: Partial<Record<DnsRecordType, DnsResult>>
  errors: Partial<Record<DnsRecordType, string>>
}

export function DnsLookupTool() {
  const [domain, setDomain] = useState('')
  const [type, setType] = useState<DnsRecordType>('A')
  const [provider, setProvider] = useState<DohProviderId>('google')
  const [state, setState] = useState<LookupState | null>(null)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function lookup(types: DnsRecordType[]) {
    const problem = validateDomain(domain)
    if (problem) {
      setFormError(problem)
      return
    }
    setFormError(null)
    setLoading(true)

    const results: Partial<Record<DnsRecordType, DnsResult>> = {}
    const errors: Partial<Record<DnsRecordType, string>> = {}

    // Run in parallel — each request is tiny and independent.
    await Promise.all(
      types.map(async (recordType) => {
        try {
          results[recordType] = await queryDns(domain, recordType, { provider })
        } catch (error) {
          errors[recordType] = error instanceof Error ? error.message : String(error)
        }
      }),
    )

    setState({ domain: normalizeDomain(domain), results, errors })
    setLoading(false)
  }

  const current = state?.results[type] ?? null
  const currentError = state?.errors[type] ?? null
  const records = current ? toDisplayRecords(current) : []
  const groups = groupByType(records)
  const sharedTtl = current ? uniformTtl(current) : null
  const answerCount = state
    ? Object.values(state.results).reduce((total, entry) => total + (entry?.answers.length ?? 0), 0)
    : 0
  const typeCount = state ? Object.values(state.results).filter((entry) => (entry?.answers.length ?? 0) > 0).length : 0

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="Look up a domain"
        description="Queries are sent from your browser to a public DNS-over-HTTPS resolver. TOOLZEN never sees them."
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
              setFormError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !loading) void lookup([type])
            }}
          />
          <Select
            label="Record type"
            value={type}
            containerClassName="min-w-32"
            onChange={(event) => setType(event.target.value as DnsRecordType)}
          >
            {DNS_RECORD_TYPES.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.value}
              </option>
            ))}
          </Select>
          <Select
            label="Resolver"
            value={provider}
            containerClassName="min-w-44"
            onChange={(event) => setProvider(event.target.value as DohProviderId)}
          >
            {DOH_PROVIDERS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => void lookup([type])} disabled={loading || domain.trim() === ''}>
            {loading ? 'Looking up…' : `Look up ${type}`}
          </Button>
          <Button variant="secondary" onClick={() => void lookup(BULK_TYPES)} disabled={loading || domain.trim() === ''}>
            Look up all common records
          </Button>
        </div>

        <p className="text-xs leading-relaxed text-muted">
          {DNS_RECORD_TYPES.find((entry) => entry.value === type)?.description}
        </p>
      </ToolPanel>

      {formError && <ErrorState title="Check the domain name" message={formError} />}

      {state && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Domain" value={<span className="text-base">{state.domain}</span>} />
            <StatTile label="Answers" value={answerCount} hint={`across ${typeCount} record type${typeCount === 1 ? '' : 's'}`} />
            <StatTile
              label="Resolver"
              value={<span className="text-base">{DOH_PROVIDERS.find((entry) => entry.id === provider)?.label ?? provider}</span>}
            />
            <StatTile
              label="Shared TTL"
              value={sharedTtl === null ? '—' : formatTtl(sharedTtl)}
              hint={sharedTtl === null ? 'varies per record' : undefined}
            />
          </div>

          <ToolPanel
            title={`${type} records`}
            description={current ? describeResult(state.domain, type, current) : undefined}
            actions={
              current && current.answers.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <CopyButton value={toZoneText(state.domain, current)} label="Copy zone lines" />
                  <CopyButton
                    value={JSON.stringify(current.answers, null, 2)}
                    label="Copy JSON"
                  />
                </div>
              ) : undefined
            }
          >
            {currentError && <ErrorState title={`Could not look up ${type} records`} message={currentError} />}

            {current && current.status !== 0 && (
              <ErrorState title="The resolver reported a problem" message={current.statusText} />
            )}

            {current && current.status === 0 && current.answers.length === 0 && (
              <p className="rounded-xl border border-line bg-surface-2/40 p-3 text-sm text-muted">
                No {type} records were returned. The domain exists — it simply has nothing published
                for this record type.
              </p>
            )}

            {current && current.answers.length > 0 && (
              <div className="flex flex-col gap-4">
                {current.truncated && (
                  <p className="rounded-xl border border-warning/30 bg-warning/8 p-3 text-xs text-muted">
                    The resolver truncated this answer because it was too large. Some records may be
                    missing.
                  </p>
                )}

                {groups.map((group) => (
                  <div key={group.type} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="brand">{group.type}</Badge>
                      <span className="text-xs text-muted">
                        {group.records.length} record{group.records.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-line">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-line bg-surface-2/60">
                            <th scope="col" className="px-3 py-2 text-left font-medium text-muted">Name</th>
                            <th scope="col" className="px-3 py-2 text-left font-medium text-muted">Value</th>
                            <th scope="col" className="px-3 py-2 text-right font-medium text-muted">TTL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.records.map((record, index) => (
                            <tr
                              key={`${record.name}:${record.value}:${index}`}
                              className="border-b border-line last:border-b-0"
                            >
                              <td className="px-3 py-2 align-top font-mono text-xs text-fg">{record.name}</td>
                              <td className="px-3 py-2 align-top">
                                <span className="break-all font-mono text-xs text-fg">
                                  {record.priority !== null && (
                                    <span className="mr-2 text-muted">{record.priority}</span>
                                  )}
                                  {record.value}
                                </span>
                                {record.note && (
                                  <span className="mt-1 block text-xs text-muted">{record.note}</span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-right align-top text-xs tabular-nums text-muted">
                                {record.ttl}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!current && !currentError && (
              <p className="text-sm text-muted">
                No {type} lookup has run yet for this domain. Choose the type above and press Look up.
              </p>
            )}
          </ToolPanel>

          {state.results && Object.keys(state.results).length > 1 && (
            <ToolPanel title="All types fetched" description="One line per record type.">
              <div className="flex flex-wrap gap-2">
                {DNS_RECORD_TYPES.filter((entry) => state.results[entry.value] !== undefined).map((entry) => {
                  const found = state.results[entry.value]?.answers.length ?? 0
                  const failed = state.errors[entry.value] !== undefined
                  return (
                    <button
                      key={entry.value}
                      type="button"
                      onClick={() => setType(entry.value)}
                      className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/40 px-3 py-1.5 text-xs transition-colors hover:border-brand/60"
                    >
                      <span className="font-mono text-fg">{entry.value}</span>
                      <Badge variant={failed ? 'danger' : found > 0 ? 'success' : 'neutral'}>
                        {failed ? 'error' : found}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            </ToolPanel>
          )}
        </>
      )}

      {!state && !formError && (
        <EmptyState
          icon="globe"
          title="Look up DNS records"
          description="Enter a domain and pick a record type. A, AAAA, MX, TXT, CNAME, NS, SOA, CAA, SRV and PTR are supported. Nothing is sent to TOOLZEN — the query goes straight to the resolver you choose."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setDomain('example.com')
                void lookup(BULK_TYPES)
              }}
            >
              Try example.com
            </Button>
          }
        />
      )}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        Results come from a public DoH resolver's cache, so a record you have just changed may take
        its TTL to appear. Private and loopback names are refused. DNS answers show what a resolver
        returns, not what your own network is configured to see.
      </p>
    </div>
  )
}

export default DnsLookupTool
