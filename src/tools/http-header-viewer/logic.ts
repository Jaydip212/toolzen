import { parseHeaderBlock, type HeaderPair } from '@/lib/http-probe'

export { parseHeaderBlock, type HeaderPair }

/** Header-name prefixes that describe the same thing, used to group the list. */
const GROUPS: Array<{ id: string; label: string; matches: (name: string) => boolean }> = [
  {
    id: 'cors',
    label: 'Cross-origin (CORS)',
    matches: (name) => name.startsWith('access-control-'),
  },
  {
    id: 'security',
    label: 'Security',
    matches: (name) =>
      /^(strict-transport-security|content-security-policy|x-frame-options|x-content-type-options|referrer-policy|permissions-policy|cross-origin-|x-xss-protection|expect-ct|public-key-pins)/.test(
        name,
      ),
  },
  {
    id: 'caching',
    label: 'Caching',
    matches: (name) => /^(cache-control|expires|etag|last-modified|age|vary|pragma|surrogate-control)/.test(name),
  },
  {
    id: 'content',
    label: 'Content',
    matches: (name) => /^(content-type|content-length|content-encoding|content-language|content-disposition|content-range)/.test(name),
  },
  {
    id: 'cookies',
    label: 'Cookies',
    matches: (name) => name.startsWith('set-cookie'),
  },
  {
    id: 'routing',
    label: 'Routing and server',
    matches: (name) => /^(server|date|location|connection|keep-alive|transfer-encoding|via|x-powered-by|x-cache|cf-ray|alt-svc|x-served-by)/.test(name),
  },
]

export interface HeaderGroup {
  id: string
  label: string
  headers: HeaderPair[]
}

/**
 * Group headers into readable buckets.
 *
 * Anything unrecognised lands in a final `other` group, so no header is ever
 * hidden from the user.
 */
export function groupHeaders(headers: HeaderPair[]): HeaderGroup[] {
  const groups: HeaderGroup[] = GROUPS.map((group) => ({ id: group.id, label: group.label, headers: [] }))
  const other: HeaderGroup = { id: 'other', label: 'Other', headers: [] }

  for (const header of headers) {
    const name = header.name.toLowerCase()
    const group = GROUPS.find((candidate) => candidate.matches(name))
    if (group) {
      groups.find((entry) => entry.id === group.id)?.headers.push(header)
    } else {
      other.headers.push(header)
    }
  }

  const populated = groups.filter((group) => group.headers.length > 0)
  if (other.headers.length > 0) populated.push(other)
  return populated
}

/** Sort alphabetically, case-insensitively, without mutating the input. */
export function sortHeaders(headers: HeaderPair[]): HeaderPair[] {
  return [...headers].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
}

/** Keep headers whose name or value contains the query, case-insensitively. */
export function filterHeaders(headers: HeaderPair[], query: string): HeaderPair[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return headers
  return headers.filter(
    (header) =>
      header.name.toLowerCase().includes(needle) || header.value.toLowerCase().includes(needle),
  )
}

/** A `{ name: value }` object, ready to copy into code. */
export function headersToObject(headers: HeaderPair[]): Record<string, string> {
  const object: Record<string, string> = {}
  for (const header of headers) {
    const existing = object[header.name]
    // Repeated headers (set-cookie) are joined the way HTTP allows.
    object[header.name] = existing === undefined ? header.value : `${existing}, ${header.value}`
  }
  return object
}

/** Pretty-printed JSON of the header object. */
export function headersToJson(headers: HeaderPair[]): string {
  return JSON.stringify(headersToObject(headers), null, 2)
}

/** A `curl` command that reproduces a request with these headers. */
export function headersToCurl(url: string, headers: HeaderPair[]): string {
  const target = url.trim() === '' ? 'https://example.com' : url.trim()
  const parts = [`curl -sSI ${shellQuote(target)}`]
  for (const header of headers) {
    // Only send request headers, never response-only ones such as content-length.
    if (/^(content-length|content-encoding|transfer-encoding|connection|date|server)$/i.test(header.name)) continue
    parts.push(`  -H ${shellQuote(`${header.name}: ${header.value}`)}`)
  }
  return parts.join(' \\\n')
}

/** Quote a value for a POSIX shell when it contains anything special. */
export function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:=@-]+$/.test(value)) return value
  return `'${value.replace(/'/g, `'\\''`)}'`
}

/** A one-line summary of the response, e.g. `200 OK — 12 headers`. */
export function summariseResponse(status: number | null, headers: HeaderPair[]): string {
  const count = `${headers.length} header${headers.length === 1 ? '' : 's'}`
  if (status === null) return `${count} parsed`
  return `${status} — ${count}`
}
