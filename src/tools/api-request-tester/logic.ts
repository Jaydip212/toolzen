/**
 * HTTP request helpers for the API Request Tester.
 *
 * Requests are made from the browser with `fetch`, which means the target
 * server must allow cross-origin requests (CORS). There is no TOOLZEN proxy —
 * so when a server does not send the right CORS headers the request genuinely
 * cannot be made, and the tool says exactly that instead of pretending.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

export type BodyType = 'json' | 'text' | 'form'

export interface HeaderPair {
  key: string
  value: string
  enabled: boolean
}

export interface ApiRequestInput {
  method: HttpMethod
  url: string
  headers: HeaderPair[]
  bodyType: BodyType
  body: string
}

export interface ApiResponse {
  ok: boolean
  status: number
  statusText: string
  headers: HeaderPair[]
  body: string
  contentType: string
  /** Round-trip time in milliseconds. */
  timeMs: number
  /** Byte length of the response body. */
  sizeBytes: number
  /** True when the response body was too large to display in full. */
  truncated: boolean
}

export class ApiError extends Error {}

/** Largest response body kept for display, so a huge download cannot freeze the tab. */
export const MAX_BODY_BYTES = 512 * 1024

/** Validate a URL, returning an error message or `null`. */
export function validateUrl(url: string): string | null {
  const trimmed = url.trim()
  if (trimmed === '') return 'Enter a URL.'
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return 'That is not a valid URL. Include the scheme, for example https://example.com/api.'
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'Only http and https URLs can be requested.'
  }
  return null
}

/** Build a header record from the editable rows, skipping blanks and disabled rows. */
export function buildHeaders(pairs: HeaderPair[]): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const pair of pairs) {
    if (!pair.enabled) continue
    const key = pair.key.trim()
    if (key === '') continue
    headers[key] = pair.value
  }
  return headers
}

/** Convert response headers into editable rows. */
export function toHeaderPairs(headers: Headers): HeaderPair[] {
  const pairs: HeaderPair[] = []
  headers.forEach((value, key) => {
    pairs.push({ key, value, enabled: true })
  })
  return pairs.sort((a, b) => a.key.localeCompare(b.key))
}

/** Apply the content type for the chosen body format, unless already set. */
export function defaultContentType(bodyType: BodyType): string {
  if (bodyType === 'json') return 'application/json'
  if (bodyType === 'form') return 'application/x-www-form-urlencoded'
  return 'text/plain'
}

/** Pretty-print a body when it is JSON; otherwise return it unchanged. */
export function formatBody(text: string): { text: string; isJson: boolean } {
  const trimmed = text.trim()
  if (trimmed === '') return { text, isJson: false }
  try {
    return { text: JSON.stringify(JSON.parse(trimmed), null, 2), isJson: true }
  } catch {
    return { text, isJson: false }
  }
}

/** Byte length of a string as UTF-8. */
export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length
}

/**
 * Send the request.
 *
 * Throws `ApiError` with a specific, honest explanation when the browser
 * blocks the request — most commonly because of CORS or a network failure.
 */
export async function sendRequest(
  input: ApiRequestInput,
  signal?: AbortSignal,
): Promise<ApiResponse> {
  const urlError = validateUrl(input.url)
  if (urlError) throw new ApiError(urlError)

  const headers = buildHeaders(input.headers)
  const hasBody = input.method !== 'GET' && input.method !== 'HEAD'

  if (hasBody && input.body.trim() !== '') {
    const hasContentType = Object.keys(headers).some(
      (key) => key.toLowerCase() === 'content-type',
    )
    if (!hasContentType) headers['Content-Type'] = defaultContentType(input.bodyType)
  }

  const started = performance.now()
  let response: Response

  try {
    response = await fetch(input.url.trim(), {
      method: input.method,
      headers,
      body: hasBody && input.body.trim() !== '' ? input.body : undefined,
      signal,
      // Never send cookies: the tool must not act as the user.
      credentials: 'omit',
      redirect: 'follow',
    })
  } catch (error) {
    if (signal?.aborted) throw new ApiError('The request was cancelled.')
    const message = error instanceof Error ? error.message : String(error)
    throw new ApiError(
      `The request could not be made: ${message}. ` +
        'The most common cause is CORS — the server did not send an Access-Control-Allow-Origin header for this page, ' +
        'so the browser blocked the response. A private or internal address, or a server that is offline, will also fail this way. ' +
        'TOOLZEN does not proxy requests, so this cannot be worked around here.',
    )
  }

  const timeMs = performance.now() - started
  const rawBody = await response.text()
  const size = byteLength(rawBody)
  const truncated = size > MAX_BODY_BYTES
  const body = truncated ? rawBody.slice(0, MAX_BODY_BYTES) : rawBody

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: toHeaderPairs(response.headers),
    body,
    contentType: response.headers.get('content-type') ?? '',
    timeMs,
    sizeBytes: size,
    truncated,
  }
}

/** A plain-English note about a status code. */
export function describeStatus(status: number): string {
  if (status >= 200 && status < 300) return 'Success — the request worked.'
  if (status === 301 || status === 302 || status === 307 || status === 308) {
    return 'Redirect — the resource has moved.'
  }
  if (status === 304) return 'Not modified — the cached copy is still current.'
  if (status === 400) return 'Bad request — the server could not understand the request.'
  if (status === 401) return 'Unauthorised — authentication is required.'
  if (status === 403) return 'Forbidden — the server refused to authorise the request.'
  if (status === 404) return 'Not found — no resource exists at that URL.'
  if (status === 405) return 'Method not allowed — the server does not accept this HTTP method here.'
  if (status === 429) return 'Too many requests — the server is rate-limiting you.'
  if (status >= 500) return 'Server error — the problem is on the server side.'
  return 'The server returned this status.'
}
