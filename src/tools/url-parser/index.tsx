import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/Form'
import { Icon } from '@/components/ui/Icon'
import { ErrorState } from '@/components/ui/ErrorState'
import { ToolPanel } from '@/tools/shared'
import { parseUrl } from './logic'

export function UrlParserTool() {
  const [value, setValue] = useState('https://www.etoolzen.com/tools/merge-pdf?ref=home&page=2#how-to')

  const result = useMemo(() => parseUrl(value), [value])

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="The URL" description="Parsed with the browser's own URL API — no regex guesswork.">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Paste a URL, e.g. https://example.com/page?id=7…"
          aria-label="URL to parse"
          leading={<Icon name="link" size={16} />}
        />
      </ToolPanel>

      {!result.ok && <ErrorState title="Could not parse that URL" message={result.error} />}

      {result.ok && (
        <>
          <ToolPanel title="Parts">
            <dl className="flex flex-col divide-y divide-line">
              {[
                { label: 'Scheme', value: result.url.protocol },
                {
                  label: 'Port',
                  value: result.url.port
                    ? `${result.url.port} (explicit)`
                    : result.url.schemeDefaultPort
                      ? `default ${result.url.schemeDefaultPort} for ${result.url.protocol}`
                      : 'none',
                },
                { label: 'Host', value: result.url.host },
                { label: 'Origin', value: result.url.origin },
                { label: 'Path', value: result.url.path },
                { label: 'Query', value: result.url.query ?? 'none' },
                { label: 'Fragment', value: result.url.fragment ?? 'none' },
                ...(result.url.credentials !== null
                  ? [{ label: 'Username', value: result.url.credentials }]
                  : []),
              ].map((row) => (
                <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">{row.label}</dt>
                  <dd className="break-all font-mono text-sm text-fg">{row.value}</dd>
                </div>
              ))}
            </dl>
          </ToolPanel>

          {result.url.params.length > 0 && (
            <ToolPanel title="Query parameters" description="Names and values are shown decoded.">
              <div className="flex flex-col divide-y divide-line">
                {result.url.params.map((param, index) => (
                  <div key={`${param.name}-${index}`} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                    <span className="font-mono text-sm font-medium text-fg">{param.name}</span>
                    <span className="break-all font-mono text-sm text-muted">{param.value === '' ? '(empty)' : param.value}</span>
                  </div>
                ))}
              </div>
            </ToolPanel>
          )}
        </>
      )}
    </div>
  )
}

export default UrlParserTool
