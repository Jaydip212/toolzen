import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Form'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { OutputArea, SegmentedControl, ToolPanel } from '@/tools/shared'
import { formatNumber } from '@/lib/utils'
import {
  UrlError,
  URL_MODES,
  buildQuery,
  countEscapes,
  decodeComponent,
  decodeUri,
  describeChange,
  encodeComponent,
  encodeUri,
  parseQuery,
  queryToObject,
  type UrlMode,
} from './logic'

type Direction = 'encode' | 'decode'

export function UrlEncoderDecoderTool() {
  const [mode, setMode] = useState<UrlMode>('component')
  const [direction, setDirection] = useState<Direction>('encode')
  const [input, setInput] = useState('')

  const result = useMemo(() => {
    if (input === '') return { value: '', error: null as string | null }
    try {
      if (direction === 'encode') {
        return {
          value: mode === 'uri' ? encodeUri(input) : encodeComponent(input),
          error: null as string | null,
        }
      }
      return {
        value: mode === 'uri' ? decodeUri(input) : decodeComponent(input),
        error: null as string | null,
      }
    } catch (error) {
      return { value: '', error: error instanceof UrlError ? error.message : String(error) }
    }
  }, [input, mode, direction])

  const pairs = useMemo(() => (mode === 'query' ? parseQuery(input) : []), [input, mode])
  const rebuilt = useMemo(() => buildQuery(pairs), [pairs])
  const asObject = useMemo(() => queryToObject(pairs), [pairs])

  const isQuery = mode === 'query'
  const description = URL_MODES.find((entry) => entry.value === mode)?.description ?? ''

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel title="What to do" description={description}>
        <div className="flex flex-wrap items-center gap-4">
          <SegmentedControl
            label="Mode"
            value={mode}
            onChange={setMode}
            options={URL_MODES.map((entry) => ({ value: entry.value, label: entry.label, title: entry.description }))}
          />
          {!isQuery && (
            <SegmentedControl
              label="Direction"
              size="sm"
              value={direction}
              onChange={setDirection}
              options={[
                { value: 'encode', label: 'Encode' },
                { value: 'decode', label: 'Decode' },
              ]}
            />
          )}
        </div>
      </ToolPanel>

      <Textarea
        label={isQuery ? 'URL or query string' : direction === 'encode' ? 'Text to encode' : 'Percent-encoded text'}
        rows={6}
        value={input}
        placeholder={
          isQuery
            ? 'https://example.com/search?q=hello%20world&page=2'
            : direction === 'encode'
              ? 'a value with spaces & symbols'
              : 'a%20value%20with%20spaces'
        }
        className={direction === 'decode' || isQuery ? 'font-mono text-xs' : undefined}
        spellCheck={false}
        onChange={(event) => setInput(event.target.value)}
      />

      {result.error && <ErrorState title="That is not valid percent-encoding" message={result.error} />}

      {!isQuery && !result.error && input !== '' && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Input length" value={formatNumber(input.length)} hint="characters" />
            <StatTile label="Output length" value={formatNumber(result.value.length)} hint="characters" />
            <StatTile label="Escapes" value={countEscapes(result.value)} hint="%XX sequences" />
            <StatTile
              label="Change"
              value={result.value.length - input.length === 0 ? '—' : `${result.value.length - input.length > 0 ? '+' : ''}${result.value.length - input.length}`}
              hint="characters"
            />
          </div>

          <OutputArea
            label={direction === 'encode' ? 'Encoded' : 'Decoded'}
            value={result.value}
            filename={direction === 'encode' ? 'encoded.txt' : 'decoded.txt'}
            mimeType="text/plain"
            rows={6}
          />

          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
            <Icon name="info" size={14} className="mt-0.5 shrink-0" />
            {describeChange(input, result.value)}
          </p>
        </>
      )}

      {isQuery && pairs.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Parameters" value={pairs.length} />
            <StatTile label="Unique keys" value={Object.keys(asObject).length} />
            <StatTile label="Escapes" value={countEscapes(input)} />
            <StatTile label="Rebuilt length" value={formatNumber(rebuilt.length)} hint="characters" />
          </div>

          <ToolPanel
            title="Parameters"
            description="Decoded in order. Repeated keys are kept as separate rows."
            actions={
              <Button variant="ghost" size="sm" onClick={() => setInput(rebuilt)}>
                Replace input with rebuilt query
              </Button>
            }
          >
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-2/60">
                    <th scope="col" className="px-3 py-2 text-left font-medium text-muted">Key</th>
                    <th scope="col" className="px-3 py-2 text-left font-medium text-muted">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {pairs.map((pair, index) => (
                    <tr key={`${pair.key}:${index}`} className="border-b border-line last:border-b-0">
                      <td className="px-3 py-2 align-top font-mono text-xs text-fg">{pair.key}</td>
                      <td className="break-all px-3 py-2 align-top font-mono text-xs text-muted">
                        {pair.value === '' ? <span className="italic">(empty)</span> : pair.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ToolPanel>

          <ToolPanel title="Rebuilt query string" description="Every key and value re-encoded with encodeURIComponent.">
            <OutputArea
              label="Query"
              value={rebuilt}
              filename="query.txt"
              mimeType="text/plain"
              rows={3}
            />
          </ToolPanel>

          <ToolPanel title="As an object" description="Repeated keys become an array.">
            <pre className="overflow-auto rounded-xl border border-line bg-surface-2/40 p-3 font-mono text-xs text-fg">
              {JSON.stringify(asObject, null, 2)}
            </pre>
          </ToolPanel>

          {Object.keys(asObject).some((key) => Array.isArray(asObject[key])) && (
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" />
              <span>
                Repeated keys are shown as arrays. Note that most server frameworks differ here —
                some keep the last value, some keep the first. <Badge variant="outline">array form shown</Badge>
              </span>
            </p>
          )}
        </>
      )}

      {isQuery && pairs.length === 0 && input.trim() !== '' && (
        <EmptyState
          icon="link"
          title="No parameters found"
          description="That input has no query string. Paste a URL with a ? in it, or a bare key=value list such as a=1&b=2."
        />
      )}

      {input === '' && (
        <EmptyState
          icon="link"
          title="Paste something to encode or decode"
          description="Component mode escapes everything that is not unreserved, which is what you want for a single value. Full URL mode leaves the URL structure intact."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setMode('query')
                setInput('https://example.com/search?q=hello%20world&page=2&tag=a&tag=b')
              }}
            >
              Try a query string
            </Button>
          }
        />
      )}
    </div>
  )
}

export default UrlEncoderDecoderTool
