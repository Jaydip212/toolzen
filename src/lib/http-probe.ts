/**
 * HTTP header helpers shared by the Security Headers Checker and the HTTP
 * Header Viewer.
 *
 * Two very different sources feed these tools:
 *
 * 1. A live `fetch` from the browser. Browsers deliberately hide almost every
 *    response header from JavaScript unless the server opts in with
 *    `Access-Control-Expose-Headers`. So a live probe can confirm the status
 *    code and the handful of CORS-safelisted headers, and nothing more.
 * 2. Pasted raw headers — the output of `curl -I`, `httpie`, or the browser's
 *    own Network panel. This is complete, and is the honest way to audit
 *    security headers without a server-side proxy.
 *
 * Both tools say which of the two they are showing.
 */

export interface HeaderPair {
  name: string
  value: string
}

/** Response headers a browser always exposes to cross-origin JavaScript. */
export const CORS_SAFELISTED_HEADERS: ReadonlySet<string> = new Set([
  'cache-control',
  'content-language',
  'content-length',
  'content-type',
  'expires',
  'last-modified',
  'pragma',
])

export interface ParsedHeaderBlock {
  /** The `HTTP/1.1 200 OK` line, or `null` when the block had no status line. */
  statusLine: string | null
  status: number | null
  headers: HeaderPair[]
}

export interface ParsedHeaders {
  blocks: ParsedHeaderBlock[]
  /** Headers from the last block — the final response after any redirects. */
  headers: HeaderPair[]
  status: number | null
  statusLine: string | null
}

const STATUS_LINE = /^HTTP\/[\d.]+\s+(\d{3})\b(.*)$/i
const HEADER_LINE = /^([!#$%&'*+\-.^_`|~0-9A-Za-z]+):[ \t]*(.*)$/

/**
 * Parse pasted raw HTTP headers.
 *
 * Handles `curl -I` output, several responses separated by blank lines (a
 * redirect chain), header folding onto continuation lines, and CRLF endings.
 * The last block wins because that is the response the browser would render.
 */
export function parseHeaderBlock(text: string): ParsedHeaders {
  const blocks: ParsedHeaderBlock[] = []
  let current: ParsedHeaderBlock | null = null

  const startBlock = (): ParsedHeaderBlock => {
    const block: ParsedHeaderBlock = { statusLine: null, status: null, headers: [] }
    blocks.push(block)
    return block
  }

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '')
    if (line === '') {
      // A blank line terminates the current block; anything after it is a new one.
      current = null
      continue
    }

    const status = STATUS_LINE.exec(line)
    if (status) {
      current = startBlock()
      current.statusLine = line.trim()
      current.status = Number(status[1])
      continue
    }

    if (!current) current = startBlock()

    const header = HEADER_LINE.exec(line)
    if (header) {
      current.headers.push({ name: header[1], value: header[2].trim() })
      continue
    }

    // Continuation of the previous header (obsolete line folding).
    const previous = current.headers[current.headers.length - 1]
    if (previous) {
      previous.value = `${previous.value} ${line.trim()}`.trim()
    }
  }

  const usable = blocks.filter((block) => block.headers.length > 0 || block.status !== null)
  const last = usable[usable.length - 1]

  return {
    blocks: usable,
    headers: last?.headers ?? [],
    status: last?.status ?? null,
    statusLine: last?.statusLine ?? null,
  }
}

/** Case-insensitive header lookup. Returns `null` when the header is absent. */
export function getHeader(headers: HeaderPair[], name: string): string | null {
  const wanted = name.toLowerCase()
  for (const header of headers) {
    if (header.name.toLowerCase() === wanted) return header.value
  }
  return null
}

/** True when the browser exposed nothing beyond the CORS-safelisted headers. */
export function isCorsLimited(headers: HeaderPair[]): boolean {
  if (headers.length === 0) return true
  return headers.every((header) => CORS_SAFELISTED_HEADERS.has(header.name.toLowerCase()))
}

/** Serialise headers back to the `name: value` form used by `curl -I`. */
export function serializeHeaders(headers: HeaderPair[]): string {
  return headers.map((header) => `${header.name}: ${header.value}`).join('\n')
}

/** A single audit finding for one security header. */
export interface HeaderFinding {
  id: string
  name: string
  /** How much this header matters, 0–10. Informational headers use 0. */
  weight: number
  /** What the header does, in plain English. */
  protects: string
  status: 'pass' | 'warn' | 'fail' | 'absent' | 'info'
  /** The value that was found, or `null` when the header was missing. */
  value: string | null
  /** A specific, actionable note about this header's value. */
  note: string
}

const HSTS_MIN_MAX_AGE = 15_552_000 // 180 days, the common recommendation.

function evaluateHsts(value: string | null): Pick<HeaderFinding, 'status' | 'note'> {
  if (value === null) {
    return {
      status: 'absent',
      note: 'Missing. Without HSTS the first request can be downgraded to plain HTTP. Add `max-age=31536000; includeSubDomains`.',
    }
  }
  const maxAge = /max-age\s*=\s*(\d+)/i.exec(value)
  if (!maxAge) {
    return { status: 'warn', note: 'Present but has no `max-age`, so browsers ignore it.' }
  }
  const seconds = Number(maxAge[1])
  if (seconds === 0) {
    return { status: 'warn', note: '`max-age=0` removes the HSTS pin — this is how HSTS is switched off.' }
  }
  if (seconds < HSTS_MIN_MAX_AGE) {
    const days = Math.round(seconds / 86400)
    return {
      status: 'warn',
      note: `Max-age is only ${days} day${days === 1 ? '' : 's'}. Use at least 180 days (15552000) once you are confident in HTTPS.`,
    }
  }
  if (!/includeSubDomains/i.test(value)) {
    return { status: 'warn', note: 'Good max-age, but `includeSubDomains` is missing, so subdomains stay unprotected.' }
  }
  if (!/preload/i.test(value)) {
    return { status: 'pass', note: 'Well configured. Adding `preload` lets browsers ship the rule built in.' }
  }
  return { status: 'pass', note: 'Well configured, including subdomains and preload.' }
}

function evaluateCsp(value: string | null): Pick<HeaderFinding, 'status' | 'note'> {
  if (value === null) {
    return {
      status: 'fail',
      note: 'Missing. A Content-Security-Policy is the main defence against cross-site scripting. Start with `default-src \'self\'`.',
    }
  }
  if (/unsafe-eval/i.test(value)) {
    return { status: 'warn', note: 'Present, but it allows `unsafe-eval`, which re-enables a common script-injection route.' }
  }
  if (/script-src[^;]*unsafe-inline/i.test(value) || (!/script-src/i.test(value) && /default-src[^;]*unsafe-inline/i.test(value))) {
    return { status: 'warn', note: 'Present, but inline scripts are allowed. Prefer nonces or hashes over `unsafe-inline`.' }
  }
  if (!/default-src|script-src/i.test(value)) {
    return { status: 'warn', note: 'Present, but there is no `default-src` or `script-src` directive to restrict scripts.' }
  }
  return { status: 'pass', note: 'Present and does not allow `unsafe-eval` or inline scripts.' }
}

function evaluateFrameOptions(value: string | null, csp: string | null): Pick<HeaderFinding, 'status' | 'note'> {
  const cspCoversFrames = csp !== null && /frame-ancestors/i.test(csp)
  if (value === null) {
    if (cspCoversFrames) {
      return { status: 'pass', note: 'Not set, but the Content-Security-Policy sets `frame-ancestors`, which supersedes it.' }
    }
    return {
      status: 'absent',
      note: 'Missing. Without it the page can be framed by another site, which enables clickjacking. Use `DENY` or `SAMEORIGIN`.',
    }
  }
  const normalised = value.trim().toLowerCase()
  if (normalised === 'deny' || normalised === 'sameorigin') {
    return { status: 'pass', note: `Set to \`${value.trim()}\`.` }
  }
  if (normalised.startsWith('allow-from')) {
    return { status: 'warn', note: '`ALLOW-FROM` is obsolete and ignored by modern browsers. Use a CSP `frame-ancestors` directive instead.' }
  }
  return { status: 'warn', note: 'Unrecognised value. Use `DENY` or `SAMEORIGIN`.' }
}

const SAFE_REFERRER_POLICIES = new Set([
  'no-referrer',
  'no-referrer-when-downgrade',
  'origin',
  'origin-when-cross-origin',
  'same-origin',
  'strict-origin',
  'strict-origin-when-cross-origin',
])

function evaluateReferrerPolicy(value: string | null): Pick<HeaderFinding, 'status' | 'note'> {
  if (value === null) {
    return {
      status: 'absent',
      note: 'Missing. Browsers fall back to `strict-origin-when-cross-origin`, which is safe, but stating it explicitly is auditable.',
    }
  }
  const policy = value.trim().toLowerCase().split(',')[0].trim()
  if (policy === 'unsafe-url') {
    return { status: 'fail', note: '`unsafe-url` sends the full URL — including query strings — to every site you link to.' }
  }
  if (SAFE_REFERRER_POLICIES.has(policy)) {
    return { status: 'pass', note: `Set to \`${policy}\`.` }
  }
  return { status: 'warn', note: 'Unrecognised policy name.' }
}

function evaluateNosniff(value: string | null): Pick<HeaderFinding, 'status' | 'note'> {
  if (value === null) {
    return {
      status: 'absent',
      note: 'Missing. Without `nosniff` a browser may execute an uploaded file as script if it guesses the wrong type.',
    }
  }
  if (value.trim().toLowerCase() === 'nosniff') {
    return { status: 'pass', note: 'Set to `nosniff`.' }
  }
  return { status: 'warn', note: 'The only valid value is `nosniff`.' }
}

/**
 * Audit the security headers in a set of response headers.
 *
 * Returns one finding per header, in a stable order, plus an overall score
 * expressed as the share of available weight that passed.
 */
export function analyzeSecurityHeaders(headers: HeaderPair[]): {
  findings: HeaderFinding[]
  score: number
  passed: number
  warnings: number
  failed: number
  graded: number
} {
  const csp = getHeader(headers, 'content-security-policy')
  const findings: HeaderFinding[] = []

  const add = (
    id: string,
    name: string,
    weight: number,
    protects: string,
    evaluation: Pick<HeaderFinding, 'status' | 'note'>,
  ) => {
    findings.push({
      id,
      name,
      weight,
      protects,
      value: getHeader(headers, name),
      status: evaluation.status,
      note: evaluation.note,
    })
  }

  add('hsts', 'Strict-Transport-Security', 10, 'Forces browsers to use HTTPS for this site, blocking downgrade attacks.', evaluateHsts(getHeader(headers, 'strict-transport-security')))
  add('csp', 'Content-Security-Policy', 10, 'Restricts where scripts, styles and frames may load from, which blunts cross-site scripting.', evaluateCsp(csp))
  add('frame', 'X-Frame-Options', 8, 'Stops other sites embedding this page in a frame, which prevents clickjacking.', evaluateFrameOptions(getHeader(headers, 'x-frame-options'), csp))
  add('nosniff', 'X-Content-Type-Options', 6, 'Stops the browser guessing a file type and executing something it should not.', evaluateNosniff(getHeader(headers, 'x-content-type-options')))
  add('referrer', 'Referrer-Policy', 5, 'Controls how much of the current URL leaks to other sites through the Referer header.', evaluateReferrerPolicy(getHeader(headers, 'referrer-policy')))
  add('permissions', 'Permissions-Policy', 4, 'Switches off browser features (camera, microphone, geolocation) the page does not need.', getHeader(headers, 'permissions-policy') === null
    ? { status: 'absent', note: 'Missing. Not fatal, but denying unused features reduces the damage a compromised script can do.' }
    : { status: 'pass', note: 'Present.' })
  add('coop', 'Cross-Origin-Opener-Policy', 3, 'Isolates this page from cross-origin windows, blocking several cross-window attacks.', (() => {
    const value = getHeader(headers, 'cross-origin-opener-policy')
    if (value === null) return { status: 'absent' as const, note: 'Missing. Recommended value: `same-origin`.' }
    return /same-origin/i.test(value)
      ? { status: 'pass' as const, note: `Set to \`${value.trim()}\`.` }
      : { status: 'warn' as const, note: 'Use `same-origin` for full isolation.' }
  })())
  add('corp', 'Cross-Origin-Resource-Policy', 3, 'Stops other origins embedding your resources, which mitigates side-channel leaks.', (() => {
    const value = getHeader(headers, 'cross-origin-resource-policy')
    if (value === null) return { status: 'absent' as const, note: 'Missing. Use `same-origin` or `same-site` on resources that need protection.' }
    return /same-origin|same-site/i.test(value)
      ? { status: 'pass' as const, note: `Set to \`${value.trim()}\`.` }
      : { status: 'warn' as const, note: 'Use `same-origin` or `same-site`.' }
  })())
  add('xss', 'X-XSS-Protection', 0, 'A legacy header. Modern browsers removed their XSS auditor, so this is only checked to make sure it is not re-enabling it.', (() => {
    const value = getHeader(headers, 'x-xss-protection')
    if (value === null) return { status: 'info' as const, note: 'Absent, which is correct. The header is obsolete.' }
    if (/^\s*0/.test(value)) return { status: 'info' as const, note: 'Explicitly disabled with `0`, which is the recommended setting.' }
    return { status: 'warn' as const, note: '`1` re-enables a removed browser feature and can itself introduce vulnerabilities. Remove it or set it to `0`.' }
  })())

  const graded = findings.filter((finding) => finding.weight > 0)
  const earned = graded.reduce((total, finding) => {
    if (finding.status === 'pass') return total + finding.weight
    if (finding.status === 'warn') return total + finding.weight * 0.5
    return total
  }, 0)
  const available = graded.reduce((total, finding) => total + finding.weight, 0)

  return {
    findings,
    score: available === 0 ? 0 : Math.round((earned / available) * 100),
    passed: graded.filter((finding) => finding.status === 'pass').length,
    warnings: graded.filter((finding) => finding.status === 'warn').length,
    failed: graded.filter((finding) => finding.status === 'fail' || finding.status === 'absent').length,
    graded: graded.length,
  }
}

/** A plain-English grade for a 0–100 header score. */
export function gradeSecurityScore(score: number): { label: string; tone: string } {
  if (score >= 90) return { label: 'Strong', tone: 'text-success' }
  if (score >= 70) return { label: 'Reasonable', tone: 'text-success' }
  if (score >= 45) return { label: 'Weak', tone: 'text-warning' }
  return { label: 'Poor', tone: 'text-danger' }
}

export interface ProbeResult {
  requestedUrl: string
  finalUrl: string
  status: number
  statusText: string
  headers: HeaderPair[]
  redirected: boolean
  timeMs: number
  /** True when the browser exposed only the CORS-safelisted headers. */
  corsLimited: boolean
}

export class ProbeError extends Error {}

/** Validate a URL for probing. Returns an error message, or `null`. */
export function validateProbeUrl(input: string): string | null {
  const trimmed = input.trim()
  if (trimmed === '') return 'Enter a URL.'
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return 'That is not a valid URL. Include the scheme, for example https://example.com.'
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'Only http and https URLs can be requested.'
  }
  return null
}

/**
 * Fetch a URL and report whatever the browser is willing to reveal.
 *
 * A `HEAD` request is used first because it has no body; if the server rejects
 * `HEAD` (some do, with 405) the call retries with `GET` and discards the body.
 */
export async function probeUrl(input: string, signal?: AbortSignal): Promise<ProbeResult> {
  const error = validateProbeUrl(input)
  if (error) throw new ProbeError(error)

  const requestedUrl = input.trim()
  const started = performance.now()

  const attempt = async (method: 'HEAD' | 'GET'): Promise<Response> =>
    fetch(requestedUrl, {
      method,
      signal,
      credentials: 'omit',
      redirect: 'follow',
      cache: 'no-store',
      headers: { Accept: 'text/html,application/xhtml+xml,*/*;q=0.8' },
    })

  let response: Response
  try {
    response = await attempt('HEAD')
    if (response.status === 405 || response.status === 501) {
      response = await attempt('GET')
    }
  } catch (failure) {
    if (signal?.aborted) throw new ProbeError('The request was cancelled.')
    const message = failure instanceof Error ? failure.message : String(failure)
    throw new ProbeError(
      `The browser could not read that URL: ${message}. ` +
        'Almost always this is CORS: the site does not send Access-Control-Allow-Origin, so JavaScript is not allowed to see the response. ' +
        'TOOLZEN has no server proxy, so for those sites paste the raw headers from `curl -I https://example.com` instead — that path is complete and works everywhere.',
    )
  }

  const headers: HeaderPair[] = []
  response.headers.forEach((value, name) => {
    headers.push({ name, value })
  })
  headers.sort((a, b) => a.name.localeCompare(b.name))

  return {
    requestedUrl,
    finalUrl: response.url || requestedUrl,
    status: response.status,
    statusText: response.statusText,
    headers,
    redirected: response.redirected,
    timeMs: Math.round(performance.now() - started),
    corsLimited: isCorsLimited(headers),
  }
}

/** A short note about an HTTP status code. */
export function describeHttpStatus(status: number): string {
  if (status >= 200 && status < 300) return 'Success'
  if (status === 301 || status === 302 || status === 307 || status === 308) return 'Redirect'
  if (status === 304) return 'Not modified'
  if (status === 400) return 'Bad request'
  if (status === 401) return 'Unauthorised'
  if (status === 403) return 'Forbidden'
  if (status === 404) return 'Not found'
  if (status === 405) return 'Method not allowed'
  if (status === 429) return 'Too many requests'
  if (status >= 500) return 'Server error'
  return 'Response'
}
