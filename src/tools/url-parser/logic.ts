/**
 * URL parsing on top of the standard URL API.
 *
 * The API does the parsing; this module only adds the things it doesn't
 * expose directly: whether the port was written explicitly, the scheme's
 * default port, and query parameters as a decoded list.
 */

export interface ParsedUrl {
  protocol: string
  schemeDefaultPort: number | null
  host: string
  hostname: string
  port: string | null
  portWasExplicit: boolean
  origin: string
  path: string
  query: string | null
  params: { name: string; value: string }[]
  fragment: string | null
  credentials: string | null
}

const DEFAULT_PORTS: Record<string, number> = {
  'http:': 80,
  'https:': 443,
  'ftp:': 21,
  'ws:': 80,
  'wss:': 443,
}

/**
 * Parse a URL into its parts. Returns a plain error string rather than the
 * URL API's technical one, because "Invalid URL" tells the user nothing.
 */
export function parseUrl(input: string): { ok: true; url: ParsedUrl } | { ok: false; error: string } {
  const trimmed = input.trim()
  if (trimmed === '') return { ok: false, error: 'Enter a URL to parse.' }
  if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return { ok: false, error: 'The URL needs a scheme, e.g. https:// — try adding it at the front.' }
  }
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, error: 'That is not a valid URL. Check for missing slashes or stray spaces.' }
  }

  const schemeDefaultPort = DEFAULT_PORTS[parsed.protocol] ?? null
  const port = parsed.port === '' ? null : parsed.port

  const params: { name: string; value: string }[] = []
  for (const [name, value] of new URL(trimmed).searchParams) params.push({ name, value })

  return {
    ok: true,
    url: {
      protocol: parsed.protocol.replace(/:$/, ''),
      schemeDefaultPort,
      host: parsed.host,
      hostname: parsed.hostname,
      port,
      portWasExplicit: port !== null,
      origin: parsed.origin,
      path: parsed.pathname,
      query: parsed.search === '' ? null : parsed.search.slice(1),
      params,
      fragment: parsed.hash === '' ? null : parsed.hash.slice(1),
      credentials: parsed.username === '' && parsed.password === '' ? null : parsed.username,
    },
  }
}
