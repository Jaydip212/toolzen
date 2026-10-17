import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { Input, Textarea } from '@/components/ui/Form'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { CopyButton } from '@/components/ui/CopyButton'
import { StatTile } from '@/components/tools/StatTile'
import { SegmentedControl, ToolPanel } from '@/tools/shared'
import { probeUrl, type ProbeResult } from '@/lib/http-probe'
import {
  filterHeaders,
  groupHeaders,
  headersToCurl,
  headersToJson,
  parseHeaderBlock,
  sortHeaders,
  summariseResponse,
  type HeaderPair,
} from './logic'

type Mode = 'live' | 'paste'
type View = 'grouped' | 'raw' | 'json'

const SAMPLE = [
  'HTTP/2 200',
  'date: Sat, 17 Oct 2026 09:00:00 GMT',
  'content-type: text/html; charset=utf-8',
  'content-length: 1256',
  'cache-control: public, max-age=0, must-revalidate',
  'server: cloudflare',
  'strict-transport-security: max-age=31536000; includeSubDomains',
  'access-control-allow-origin: *',
  'cf-ray: 8c1a2b3c4d5e-FRA',
].join('\n')

export function HttpHeaderViewerTool() {
  const [mode, setMode] = useState<Mode>('live')
  const [view, setView] = useState<View>('grouped')
  const [url, setUrl] = useState('')
  const [raw, setRaw] = useState('')
  const [query, setQuery] = useState('')
  const [probe, setProbe] = useState<ProbeResult | null>(null)
  const [probeError, setProbeError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const parsed = useMemo(() => parseHeaderBlock(raw), [raw])

  const activeHeaders: HeaderPair[] = probe && mode === 'live' ? probe.headers : parsed.headers
  const status = probe && mode === 'live' ? probe.status : parsed.status
  const filtered = useMemo(() => filterHeaders(activeHeaders, query), [activeHeaders, query])
  const groups = useMemo(() => groupHeaders(sortHeaders(filtered)), [filtered])

  async function runProbe() {
    setLoading(true)
    setProbeError(null)
    setProbe(null)
    try {
      setProbe(await probeUrl(url))
      setView('grouped')
    } catch (error) {
      setProbeError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }

  const sourceUrl = mode === 'live' ? probe?.finalUrl ?? url : url
  const hasData = activeHeaders.length > 0

  return (
    <div className="flex flex-col gap-6">
      <SegmentedControl
        label="Header source"
        value={mode}
        onChange={(next) => {
          setMode(next)
          setView('grouped')
        }}
        options={[
          { value: 'live', label: 'Fetch a URL', title: 'Browser request — limited by CORS' },
          { value: 'paste', label: 'Paste headers', title: 'Complete header set, always works' },
        ]}
      />

      {mode === 'live' && (
        <ToolPanel
          title="Request"
          description="Sent by your browser with no cookies and no proxy."
        >
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="URL"
              value={url}
              containerClassName="min-w-64 flex-1"
              placeholder="https://example.com"
              inputMode="url"
              spellCheck={false}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !loading) void runProbe()
              }}
            />
            <Button onClick={() => void runProbe()} disabled={loading || url.trim() === ''}>
              {loading ? 'Fetching…' : 'Fetch headers'}
            </Button>
          </div>
        </ToolPanel>
      )}

      {mode === 'paste' && (
        <ToolPanel
          title="Raw response headers"
          description="Paste curl -sSI output or the response headers from your browser's Network panel."
          actions={
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRaw(SAMPLE)}>
                Load sample
              </Button>
              {raw !== '' && (
                <Button variant="ghost" size="sm" onClick={() => setRaw('')}>
                  Clear
                </Button>
              )}
            </div>
          }
        >
          <Textarea
            label="Headers"
            rows={9}
            value={raw}
            placeholder={'HTTP/2 200\ncontent-type: text/html\nserver: nginx'}
            className="font-mono text-xs"
            spellCheck={false}
            onChange={(event) => setRaw(event.target.value)}
          />
        </ToolPanel>
      )}

      {probeError && <ErrorState title="Could not fetch that URL" message={probeError} />}

      {probe && mode === 'live' && probe.corsLimited && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/8 p-4 text-sm">
          <Icon name="alert-triangle" size={18} className="mt-0.5 shrink-0 text-warning" />
          <div>
            <p className="font-medium text-fg">Only the CORS-safelisted headers came back</p>
            <p className="mt-1 leading-relaxed text-muted">
              The server did not send Access-Control-Expose-Headers, so the browser hid everything
              except content-type, content-length, cache-control and a few others. The headers below
              are real, but the list is incomplete — switch to Paste for the full set.
            </p>
          </div>
        </div>
      )}

      {hasData && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Status" value={status ?? '—'} hint={probe?.statusText || undefined} />
            <StatTile label="Headers" value={activeHeaders.length} hint={mode === 'live' ? 'visible to JS' : 'parsed'} />
            <StatTile
              label="Round trip"
              value={probe && mode === 'live' ? `${probe.timeMs} ms` : '—'}
              hint={probe && mode === 'live' ? undefined : 'live fetch only'}
            />
            <StatTile
              label="Redirected"
              value={probe && mode === 'live' ? (probe.redirected ? 'Yes' : 'No') : '—'}
              hint={probe && mode === 'live' && probe.redirected ? probe.finalUrl : undefined}
            />
          </div>

          <ToolPanel
            title="Headers"
            description={summariseResponse(status, activeHeaders)}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  aria-label="Filter headers"
                  value={query}
                  placeholder="Filter…"
                  containerClassName="w-40"
                  className="h-9"
                  onChange={(event) => setQuery(event.target.value)}
                />
                <CopyButton value={headersToJson(activeHeaders)} label="Copy JSON" />
                <CopyButton value={headersToCurl(sourceUrl, activeHeaders)} label="Copy curl" />
              </div>
            }
          >
            <SegmentedControl
              label="Display format"
              size="sm"
              value={view}
              onChange={setView}
              options={[
                { value: 'grouped', label: 'Grouped' },
                { value: 'raw', label: 'Raw' },
                { value: 'json', label: 'JSON' },
              ]}
            />

            {view === 'grouped' && (
              <div className="flex flex-col gap-4">
                {groups.length === 0 && (
                  <p className="text-sm text-muted">No header matches “{query}”.</p>
                )}
                {groups.map((group) => (
                  <div key={group.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {group.label}
                      </h3>
                      <Badge variant="outline">{group.headers.length}</Badge>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-line">
                      <table className="w-full border-collapse text-sm">
                        <tbody>
                          {group.headers.map((header) => (
                            <tr
                              key={`${group.id}:${header.name}:${header.value}`}
                              className="border-b border-line last:border-b-0"
                            >
                              <td className="w-2/5 px-3 py-2 align-top font-mono text-xs text-fg">
                                {header.name}
                              </td>
                              <td className="break-all px-3 py-2 font-mono text-xs text-muted">
                                {header.value}
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

            {view === 'raw' && (
              <pre className="max-h-96 overflow-auto rounded-xl border border-line bg-surface-2/40 p-3 font-mono text-xs leading-relaxed text-fg">
                {status !== null ? `HTTP/1.1 ${status}\n` : ''}
                {filtered.map((header) => `${header.name}: ${header.value}`).join('\n')}
              </pre>
            )}

            {view === 'json' && (
              <pre className="max-h-96 overflow-auto rounded-xl border border-line bg-surface-2/40 p-3 font-mono text-xs leading-relaxed text-fg">
                {headersToJson(filtered)}
              </pre>
            )}
          </ToolPanel>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
            <Icon name="info" size={14} className="mt-0.5 shrink-0" />
            Header names are case-insensitive, and a header may legally appear more than once — the
            JSON view joins repeats with a comma. Set-Cookie is the notable exception: it must stay
            separate, which is why it gets its own group.
          </p>
        </>
      )}

      {!hasData && !probeError && mode === 'paste' && (
        <EmptyState
          icon="activity"
          title="Paste some headers"
          description="Copy the response headers from your browser's Network panel, or run curl -sSI https://example.com in a terminal and paste the output here."
          action={
            <Button variant="secondary" onClick={() => setRaw(SAMPLE)}>
              Try a sample
            </Button>
          }
        />
      )}

      {!hasData && !probeError && mode === 'live' && (
        <EmptyState
          icon="globe"
          title="Fetch a URL's headers"
          description="Your browser makes the request directly. If a site does not allow cross-origin reads you will get a clear explanation, and the Paste tab still works for every site."
        />
      )}
    </div>
  )
}

export default HttpHeaderViewerTool
