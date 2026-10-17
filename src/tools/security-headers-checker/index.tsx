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
  analyzeSecurityHeaders,
  buildMarkdownReport,
  countByStatus,
  curlCommand,
  gradeSecurityScore,
  parseHeaderBlock,
  sortFindings,
  statusLabel,
  type HeaderFinding,
} from './logic'

type Mode = 'paste' | 'live'

const STATUS_BADGE: Record<HeaderFinding['status'], 'success' | 'warning' | 'danger' | 'neutral'> = {
  pass: 'success',
  warn: 'warning',
  fail: 'danger',
  absent: 'danger',
  info: 'neutral',
}

const SAMPLE = [
  'HTTP/2 200',
  'content-type: text/html; charset=utf-8',
  'strict-transport-security: max-age=63072000; includeSubDomains',
  'content-security-policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\'',
  'x-frame-options: SAMEORIGIN',
  'referrer-policy: strict-origin-when-cross-origin',
  'server: nginx',
].join('\n')

export function SecurityHeadersCheckerTool() {
  const [mode, setMode] = useState<Mode>('paste')
  const [raw, setRaw] = useState('')
  const [url, setUrl] = useState('')
  const [probe, setProbe] = useState<ProbeResult | null>(null)
  const [probeError, setProbeError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const parsed = useMemo(() => parseHeaderBlock(raw), [raw])
  const report = useMemo(() => analyzeSecurityHeaders(parsed.headers), [parsed.headers])
  const grade = gradeSecurityScore(report.score)
  const counts = countByStatus(report.findings)
  const ordered = sortFindings(report.findings)

  const hasPasted = parsed.headers.length > 0

  async function runProbe() {
    setLoading(true)
    setProbeError(null)
    setProbe(null)
    try {
      const result = await probeUrl(url)
      setProbe(result)
    } catch (error) {
      setProbeError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }

  const liveReport = probe ? analyzeSecurityHeaders(probe.headers) : null

  return (
    <div className="flex flex-col gap-6">
      <SegmentedControl
        label="Header source"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'paste', label: 'Paste headers', title: 'Complete and works for every site' },
          { value: 'live', label: 'Check a URL', title: 'Limited by browser CORS rules' },
        ]}
      />

      {mode === 'paste' && (
        <>
          <ToolPanel
            title="Raw response headers"
            description="Paste the output of curl -sSI https://example.com, or the response headers from your browser's Network panel."
            actions={
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setRaw(SAMPLE)}>
                  Load sample
                </Button>
                {hasPasted && (
                  <Button variant="ghost" size="sm" onClick={() => setRaw('')}>
                    Clear
                  </Button>
                )}
              </div>
            }
          >
            <Textarea
              label="Headers"
              rows={10}
              value={raw}
              placeholder={'HTTP/2 200\nstrict-transport-security: max-age=31536000; includeSubDomains\nx-content-type-options: nosniff'}
              className="font-mono text-xs"
              spellCheck={false}
              onChange={(event) => setRaw(event.target.value)}
            />
          </ToolPanel>

          {hasPasted && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Score" value={`${report.score}/100`} hint={grade.label} />
                <StatTile label="Passed" value={counts.pass} hint={`of ${report.graded} graded`} />
                <StatTile label="Improve" value={counts.warn} hint="present but weak" />
                <StatTile
                  label="Missing"
                  value={counts.fail + counts.absent}
                  hint="not sent at all"
                />
              </div>

              <ToolPanel
                title="Findings"
                description={`${parsed.blocks.length > 1 ? `${parsed.blocks.length} responses detected — analysing the last one. ` : ''}Sorted so the most urgent item is first.`}
                actions={
                  <CopyButton
                    value={buildMarkdownReport(report.findings, { source: 'Pasted headers', score: report.score })}
                    label="Copy report"
                  />
                }
              >
                <ul className="flex flex-col gap-2">
                  {ordered.map((finding) => (
                    <li
                      key={finding.id}
                      className="rounded-xl border border-line bg-surface-2/30 p-3.5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={STATUS_BADGE[finding.status]}>
                          {statusLabel(finding.status)}
                        </Badge>
                        <span className="font-mono text-sm font-medium text-fg">{finding.name}</span>
                        {finding.weight === 0 && <Badge variant="outline">informational</Badge>}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{finding.protects}</p>
                      {finding.value !== null && (
                        <code className="mt-2 block break-all rounded-lg bg-surface px-2 py-1.5 font-mono text-xs text-fg">
                          {finding.value}
                        </code>
                      )}
                      <p className="mt-2 text-sm leading-relaxed text-fg">{finding.note}</p>
                    </li>
                  ))}
                </ul>
              </ToolPanel>

              <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
                <Icon name="info" size={14} className="mt-0.5 shrink-0" />
                A header being present is not proof it is enforced correctly. This checks the
                response headers only — it cannot see server configuration, application logic or
                whether a policy actually blocks an attack.
              </p>
            </>
          )}

          {!hasPasted && (
            <EmptyState
              icon="shield"
              title="Paste some response headers"
              description="Run curl -sSI on a site, or open the Network panel in your browser's developer tools and copy the response headers. Every header is checked, including the ones browsers hide from JavaScript."
              action={
                <Button variant="secondary" onClick={() => setRaw(SAMPLE)}>
                  Try a sample
                </Button>
              }
            />
          )}
        </>
      )}

      {mode === 'live' && (
        <>
          <ToolPanel
            title="Fetch a URL"
            description="The browser makes the request directly. Most security headers will not be visible — see the note below."
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
                {loading ? 'Checking…' : 'Check headers'}
              </Button>
            </div>
          </ToolPanel>

          {probeError && <ErrorState title="Could not check that URL" message={probeError} />}

          {probe && liveReport && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Status" value={probe.status} hint={probe.statusText || '—'} />
                <StatTile label="Round trip" value={`${probe.timeMs} ms`} />
                <StatTile label="Headers visible" value={probe.headers.length} hint="after CORS filtering" />
                <StatTile
                  label="Redirected"
                  value={probe.redirected ? 'Yes' : 'No'}
                  hint={probe.redirected ? 'final URL differs' : undefined}
                />
              </div>

              {probe.corsLimited && (
                <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/8 p-4 text-sm">
                  <Icon name="alert-triangle" size={18} className="mt-0.5 shrink-0 text-warning" />
                  <div>
                    <p className="font-medium text-fg">The browser hid almost every header</p>
                    <p className="mt-1 leading-relaxed text-muted">
                      Cross-origin JavaScript only sees a short safelist (content-type,
                      content-length, cache-control and a few others) unless the server sends
                      Access-Control-Expose-Headers. That means this live view cannot audit HSTS or
                      CSP. Use the Paste tab instead — it reads the complete header set.
                    </p>
                  </div>
                </div>
              )}

              <ToolPanel
                title="Visible headers"
                description="Exactly what the browser allowed this page to read."
                actions={<CopyButton value={curlCommand(url)} label="Copy curl command" />}
              >
                {probe.headers.length === 0 ? (
                  <p className="text-sm text-muted">No headers were exposed.</p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-line">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-line bg-surface-2/60">
                          <th scope="col" className="px-3 py-2 text-left font-medium text-muted">Header</th>
                          <th scope="col" className="px-3 py-2 text-left font-medium text-muted">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {probe.headers.map((header) => (
                          <tr key={`${header.name}:${header.value}`} className="border-b border-line last:border-b-0">
                            <td className="px-3 py-2 font-mono text-xs text-fg">{header.name}</td>
                            <td className="break-all px-3 py-2 font-mono text-xs text-muted">{header.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </ToolPanel>

              <ToolPanel title="What this run can say" description={`Score ${liveReport.score}/100 based only on the visible headers.`}>
                <p className="text-sm leading-relaxed text-muted">
                  {probe.corsLimited
                    ? 'Because only safelisted headers came back, the score below reflects almost none of the real configuration. Treat it as a connectivity check, not an audit.'
                    : 'Some non-safelisted headers came back, so this score is meaningful for those. Any header the server did not expose is still counted as missing.'}
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {sortFindings(liveReport.findings)
                    .filter((finding) => finding.value !== null)
                    .map((finding) => (
                      <li key={finding.id}>
                        <Badge variant={STATUS_BADGE[finding.status]}>{finding.name}</Badge>
                      </li>
                    ))}
                </ul>
              </ToolPanel>
            </>
          )}

          {!probe && !probeError && (
            <EmptyState
              icon="globe"
              title="Enter a URL to check"
              description="The browser will fetch it directly. Sites that do not allow cross-origin reads will be refused by the browser — that is a CORS rule, not a TOOLZEN limitation, and the Paste tab always works."
            />
          )}
        </>
      )}
    </div>
  )
}

export default SecurityHeadersCheckerTool
