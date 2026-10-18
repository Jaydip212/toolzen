/**
 * The HTTP status codes worth having at your fingertips, as a static dataset.
 *
 * Curated rather than exhaustive — codes nobody ships (WebDAV's 207, Cloudflare's
 * 530) would dilute the reference. Every entry carries a plain-language note
 * about what usually causes it, which is the part people actually forget.
 */

export type StatusClass = 'informational' | 'success' | 'redirection' | 'client-error' | 'server-error'

export interface StatusCode {
  code: number
  name: string
  statusClass: StatusClass
  /** What it means in practice, one or two sentences. */
  meaning: string
}

export const CLASS_LABELS: Record<StatusClass, string> = {
  informational: '1xx — Informational',
  success: '2xx — Success',
  redirection: '3xx — Redirection',
  'client-error': '4xx — Client error',
  'server-error': '5xx — Server error',
}

export const STATUS_CODES: StatusCode[] = [
  { code: 100, name: 'Continue', statusClass: 'informational', meaning: 'The client should keep going — the initial request was fine and the body can follow.' },
  { code: 101, name: 'Switching Protocols', statusClass: 'informational', meaning: 'The server agrees to change protocol, e.g. upgrading to a WebSocket.' },
  { code: 200, name: 'OK', statusClass: 'success', meaning: 'The standard success response. The body holds whatever was requested.' },
  { code: 201, name: 'Created', statusClass: 'success', meaning: 'A new resource exists now. A well-behaved API points at it in the Location header.' },
  { code: 202, name: 'Accepted', statusClass: 'success', meaning: 'The request is queued but not finished — common for background jobs.' },
  { code: 204, name: 'No Content', statusClass: 'success', meaning: 'Success with nothing to send back. Typical after a DELETE or PUT.' },
  { code: 206, name: 'Partial Content', statusClass: 'success', meaning: 'A range request was honoured — how video seeking and resumable downloads work.' },
  { code: 301, name: 'Moved Permanently', statusClass: 'redirection', meaning: 'The resource lives somewhere else for good. Browsers and caches remember.' },
  { code: 302, name: 'Found', statusClass: 'redirection', meaning: 'A temporary redirect. Clients should keep using the original URL.' },
  { code: 304, name: 'Not Modified', statusClass: 'redirection', meaning: 'The cached copy is still fresh — the whole point of ETags and If-None-Match.' },
  { code: 307, name: 'Temporary Redirect', statusClass: 'redirection', meaning: 'Like 302 but the method must not change. A POST stays a POST.' },
  { code: 308, name: 'Permanent Redirect', statusClass: 'redirection', meaning: 'Like 301 but the method must not change.' },
  { code: 400, name: 'Bad Request', statusClass: 'client-error', meaning: 'The request itself is malformed — bad syntax, an unparsable body, a missing field.' },
  { code: 401, name: 'Unauthorized', statusClass: 'client-error', meaning: 'Who are you? Credentials are missing or wrong. The name is misleading; it means unauthenticated.' },
  { code: 402, name: 'Payment Required', statusClass: 'client-error', meaning: 'Reserved for future use. Sometimes repurposed by APIs to signal an exhausted quota.' },
  { code: 403, name: 'Forbidden', statusClass: 'client-error', meaning: 'The server knows who you are and still refuses. Re-authenticating will not help.' },
  { code: 404, name: 'Not Found', statusClass: 'client-error', meaning: 'No resource at this URL — or the server won’t say whether there is.' },
  { code: 405, name: 'Method Not Allowed', statusClass: 'client-error', meaning: 'That URL exists, but not for this verb. The Allow header lists what is accepted.' },
  { code: 408, name: 'Request Timeout', statusClass: 'client-error', meaning: 'The client took too long to send the request. Often a stalled upload.' },
  { code: 409, name: 'Conflict', statusClass: 'client-error', meaning: 'The request collides with current state — an edit to a record someone else already changed.' },
  { code: 410, name: 'Gone', statusClass: 'client-error', meaning: 'Like 404, but deliberate and permanent. Crawlers should stop asking.' },
  { code: 413, name: 'Content Too Large', statusClass: 'client-error', meaning: 'The body exceeds the server’s limit.' },
  { code: 415, name: 'Unsupported Media Type', statusClass: 'client-error', meaning: 'The Content-Type is one the endpoint does not handle.' },
  { code: 418, name: "I'm a teapot", statusClass: 'client-error', meaning: 'An April Fools’ joke from 1998 that refused to die. Some APIs use it playfully.' },
  { code: 422, name: 'Unprocessable Content', statusClass: 'client-error', meaning: 'The syntax is fine but the semantics are not — a well-formed payload that fails validation.' },
  { code: 425, name: 'Too Early', statusClass: 'client-error', meaning: 'The server will not risk processing a request that might be replayed.' },
  { code: 428, name: 'Precondition Required', statusClass: 'client-error', meaning: 'The server demands a conditional header — If-Match — to prevent lost updates.' },
  { code: 429, name: 'Too Many Requests', statusClass: 'client-error', meaning: 'Rate limited. Retry-After says when to come back.' },
  { code: 451, name: 'Unavailable For Legal Reasons', statusClass: 'client-error', meaning: 'Blocked by legal demand. The number nods to Fahrenheit 451.' },
  { code: 500, name: 'Internal Server Error', statusClass: 'server-error', meaning: 'Something broke on the server and the handler couldn’t say what. The classic.' },
  { code: 501, name: 'Not Implemented', statusClass: 'server-error', meaning: 'The server does not support this feature at all — not a bug, a boundary.' },
  { code: 502, name: 'Bad Gateway', statusClass: 'server-error', meaning: 'A proxy or gateway got an invalid answer from the machine behind it.' },
  { code: 503, name: 'Service Unavailable', statusClass: 'server-error', meaning: 'Temporarily overloaded or down for maintenance. Often what you see during deploys.' },
  { code: 504, name: 'Gateway Timeout', statusClass: 'server-error', meaning: 'The proxy waited too long for the backend — frequently a slow database or an upstream API.' },
  { code: 507, name: 'Insufficient Storage', statusClass: 'server-error', meaning: 'The server ran out of room to complete the request.' },
]

/** Filter the dataset by a free-text query against code, name and meaning. */
export function searchStatusCodes(query: string): StatusCode[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return STATUS_CODES
  return STATUS_CODES.filter(
    (entry) =>
      String(entry.code).includes(needle) ||
      entry.name.toLowerCase().includes(needle) ||
      entry.meaning.toLowerCase().includes(needle),
  )
}

/** Look up one code exactly, or null. */
export function statusCodeByCode(code: number): StatusCode | null {
  return STATUS_CODES.find((entry) => entry.code === code) ?? null
}
