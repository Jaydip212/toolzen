import { useState } from 'react'
import { Input, Select, Textarea } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { CopyButton } from '@/components/ui/CopyButton'
import { ErrorState } from '@/components/ui/ErrorState'
import { Spinner } from '@/components/ui/Spinner'
import { StatTile } from '@/components/tools/StatTile'
import { OutputArea, ToolPanel } from '@/tools/shared'
import { formatBytes, formatNumber } from '@/lib/utils'
import {
  ApiError,
  HTTP_METHODS,
  describeStatus,
  formatBody,
  sendRequest,
  validateUrl,
  type ApiResponse,
  type BodyType,
  type HeaderPair,
  type HttpMethod,
} from './logic'

const DEFAULT_HEADERS: HeaderPair[] = [
  { key: 'Accept', value: 'application/json', enabled: true },
  { key: '', value: '', enabled: true },
]

export function ApiRequestTesterTool() {
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [url, setUrl] = useState('')
  const [headers, setHeaders] = useState<HeaderPair[]>(DEFAULT_HEADERS)
  const [bodyType, setBodyType] = useState<BodyType>('json')
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const urlError = url.trim() === '' ? null : validateUrl(url)
  const bodyAllowed = method !== 'GET' && method !== 'HEAD'
  const formatted = response ? formatBody(response.body) : null

  function updateHeader(index: number, patch: Partial<HeaderPair>) {
    setHeaders((current) =>
      current.map((header, position) => (position === index ? { ...header, ...patch } : header)),
    )
  }

  async function handleSend() {
    setError(null)
    setResponse(null)
    setBusy(true)
    try {
      const result = await sendRequest({ method, url, headers, bodyType, body })
      setResponse(result)
    } catch (thrown) {
      setError(thrown instanceof ApiError ? thrown.message : 'The request failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* CORS is the single biggest source of confusion here, so it is stated up front. */}
      <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/8 p-4 text-sm">
        <Icon name="alert-triangle" size={18} className="mt-0.5 shrink-0 text-warning" />
        <div>
          <p className="font-medium text-fg">Requests run from your browser, so CORS applies</p>
          <p className="mt-1 leading-relaxed text-muted">
            The request goes straight from your device to the target server — TOOLZEN has no proxy
            and never sees your request. That also means the server must allow cross-origin calls.
            If it does not send an <code className="font-mono">Access-Control-Allow-Origin</code>{' '}
            header, the browser will block the response and this tool cannot work around it. Public
            APIs that are designed for browser use, such as{' '}
            <code className="font-mono">api.github.com</code>, will work.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Method"
          value={method}
          containerClassName="w-32"
          onChange={(event) => setMethod(event.target.value as HttpMethod)}
        >
          {HTTP_METHODS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Input
          label="URL"
          value={url}
          containerClassName="min-w-72 flex-1"
          placeholder="https://api.github.com/repos/facebook/react"
          error={urlError ?? undefined}
          className="font-mono text-xs"
          spellCheck={false}
          onChange={(event) => setUrl(event.target.value)}
        />
        <Button onClick={handleSend} disabled={busy || url.trim() === '' || Boolean(urlError)}>
          {busy ? <Spinner size={16} label="Sending" /> : <Icon name="zap" size={16} />}
          {busy ? 'Sending…' : 'Send request'}
        </Button>
      </div>

      <ToolPanel
        title="Request headers"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHeaders((current) => [...current, { key: '', value: '', enabled: true }])}
          >
            <Icon name="plus" size={16} />
            Add header
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          {headers.map((header, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2">
              <input
                type="checkbox"
                checked={header.enabled}
                aria-label={`Enable header ${index + 1}`}
                onChange={(event) => updateHeader(index, { enabled: event.target.checked })}
                className="h-4 w-4 shrink-0 cursor-pointer rounded border-line accent-brand"
              />
              <Input
                value={header.key}
                placeholder="Header name"
                containerClassName="min-w-40 flex-1"
                className="font-mono text-xs"
                aria-label={`Header ${index + 1} name`}
                onChange={(event) => updateHeader(index, { key: event.target.value })}
              />
              <Input
                value={header.value}
                placeholder="Value"
                containerClassName="min-w-48 flex-[2]"
                className="font-mono text-xs"
                aria-label={`Header ${index + 1} value`}
                onChange={(event) => updateHeader(index, { value: event.target.value })}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove header ${index + 1}`}
                onClick={() => setHeaders((current) => current.filter((_, position) => position !== index))}
              >
                <Icon name="trash" size={16} />
              </Button>
            </div>
          ))}
        </div>
      </ToolPanel>

      {bodyAllowed && (
        <ToolPanel title="Request body">
          <div className="flex flex-col gap-3">
            <Select
              label="Body type"
              value={bodyType}
              containerClassName="max-w-xs"
              hint="Sets Content-Type unless you have already set one."
              onChange={(event) => setBodyType(event.target.value as BodyType)}
            >
              <option value="json">JSON</option>
              <option value="text">Plain text</option>
              <option value="form">Form URL-encoded</option>
            </Select>
            <Textarea
              label="Body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={bodyType === 'json' ? '{\n  "key": "value"\n}' : 'key=value&other=value'}
              rows={7}
              spellCheck={false}
              className="font-mono text-xs"
            />
          </div>
        </ToolPanel>
      )}

      {error && <ErrorState title="The request could not be completed" message={error} />}

      {response && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={response.ok ? 'success' : 'danger'}>
              {response.status} {response.statusText}
            </Badge>
            <span className="text-sm text-muted">{describeStatus(response.status)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Status" value={formatNumber(response.status)} />
            <StatTile label="Time" value={`${response.timeMs.toFixed(0)} ms`} />
            <StatTile label="Size" value={formatBytes(response.sizeBytes)} />
            <StatTile
              label="Content type"
              value={response.contentType.split(';')[0] || '—'}
            />
          </div>

          {response.truncated && (
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" />
              The response body was larger than 512 KB and has been cut short for display. The size
              above is the full length.
            </p>
          )}

          <ToolPanel
            title="Response headers"
            description={`${response.headers.length} header${response.headers.length === 1 ? '' : 's'} returned. Browsers only expose a subset — CORS-safelisted headers.`}
          >
            {response.headers.length === 0 ? (
              <p className="rounded-xl border border-line bg-surface-2/30 p-4 text-sm text-muted">
                No headers were exposed to the browser. This is normal for cross-origin responses
                that do not send <code className="font-mono">Access-Control-Expose-Headers</code>.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-line">
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {response.headers.map((header) => (
                      <tr key={header.key} className="border-b border-line last:border-b-0">
                        <td className="w-1/3 px-3 py-2 align-top font-mono text-xs text-muted">
                          {header.key}
                        </td>
                        <td className="break-all px-3 py-2 align-top font-mono text-xs text-fg">
                          {header.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ToolPanel>

          <ToolPanel
            title="Response body"
            description={formatted?.isJson ? 'Valid JSON, pretty-printed.' : 'Raw response text.'}
            actions={
              <div className="flex gap-2">
                <CopyButton value={response.body} label="Copy raw" />
                <CopyButton
                  value={formatted?.text ?? response.body}
                  label={formatted?.isJson ? 'Copy formatted' : 'Copy'}
                />
              </div>
            }
          >
            <OutputArea
              value={formatted?.text ?? response.body}
              rows={14}
              placeholder="The response body was empty."
              label="Body"
              filename="response.txt"
            />
          </ToolPanel>
        </>
      )}

      {!response && !error && !busy && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted">
            <Icon name="globe" size={22} />
          </span>
          <p className="text-base font-semibold">Send a request to see the response</p>
          <p className="max-w-lg text-sm text-muted">
            Enter a URL and press Send. You will get the status, timing, response headers and body —
            all fetched directly from your browser.
          </p>
          <Button
            variant="secondary"
            onClick={() => setUrl('https://api.github.com/repos/facebook/react')}
          >
            Use a public example URL
          </Button>
        </div>
      )}
    </div>
  )
}

export default ApiRequestTesterTool
