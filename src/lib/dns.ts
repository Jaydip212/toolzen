/**
 * DNS-over-HTTPS lookups.
 *
 * Browsers cannot send raw DNS packets, but they can `fetch` a JSON API. Both
 * Google and Cloudflare publish a DoH endpoint that returns DNS answers as
 * JSON and sends `Access-Control-Allow-Origin: *`, so a lookup works entirely
 * from the page. Nothing is proxied by TOOLZEN.
 */

export type DnsRecordType =
  | 'A'
  | 'AAAA'
  | 'CNAME'
  | 'MX'
  | 'NS'
  | 'TXT'
  | 'SOA'
  | 'CAA'
  | 'SRV'
  | 'PTR'

export interface DnsRecordTypeInfo {
  value: DnsRecordType
  label: string
  description: string
}

export const DNS_RECORD_TYPES: DnsRecordTypeInfo[] = [
  { value: 'A', label: 'A', description: 'IPv4 address of the host' },
  { value: 'AAAA', label: 'AAAA', description: 'IPv6 address of the host' },
  { value: 'CNAME', label: 'CNAME', description: 'Canonical name — an alias pointing at another host' },
  { value: 'MX', label: 'MX', description: 'Mail exchangers, with a priority per record' },
  { value: 'NS', label: 'NS', description: 'Authoritative name servers for the zone' },
  { value: 'TXT', label: 'TXT', description: 'Free-form text — SPF, DKIM, DMARC and site verification live here' },
  { value: 'SOA', label: 'SOA', description: 'Start of authority: primary server, contact and timers' },
  { value: 'CAA', label: 'CAA', description: 'Which certificate authorities may issue certificates' },
  { value: 'SRV', label: 'SRV', description: 'Service location: host and port for a named service' },
  { value: 'PTR', label: 'PTR', description: 'Reverse DNS — the name behind an IP address' },
]

export type DohProviderId = 'google' | 'cloudflare'

export interface DohProvider {
  id: DohProviderId
  label: string
  endpoint: string
  note: string
}

export const DOH_PROVIDERS: DohProvider[] = [
  {
    id: 'google',
    label: 'Google Public DNS',
    endpoint: 'https://dns.google/resolve',
    note: 'Operated by Google. Widely available and fast.',
  },
  {
    id: 'cloudflare',
    label: 'Cloudflare 1.1.1.1',
    endpoint: 'https://cloudflare-dns.com/dns-query',
    note: 'Operated by Cloudflare. Logs are kept for 24 hours then deleted, per their policy.',
  },
]

/** Numeric DNS type codes, as returned by the DoH JSON API. */
const TYPE_NAMES: Record<number, string> = {
  1: 'A',
  2: 'NS',
  5: 'CNAME',
  6: 'SOA',
  12: 'PTR',
  15: 'MX',
  16: 'TXT',
  28: 'AAAA',
  33: 'SRV',
  257: 'CAA',
}

export interface DnsAnswer {
  name: string
  /** Numeric type code from the wire format. */
  typeCode: number
  /** Human-readable type name, e.g. `A` or `MX`. */
  type: string
  ttl: number
  data: string
}

export interface DnsResult {
  status: number
  statusText: string
  answers: DnsAnswer[]
  authority: DnsAnswer[]
  /** True when the resolver truncated the answer set. */
  truncated: boolean
  /** True when the resolver marked the answer as DNSSEC-authenticated. */
  authenticated: boolean
  provider: DohProviderId
}

export class DnsError extends Error {}

/**
 * Strip the parts of user input that are not the hostname.
 *
 * Accepts `https://www.example.com/path?x=1`, `example.com.` and
 * `user@example.com` and reduces each to `www.example.com` / `example.com`.
 */
export function normalizeDomain(input: string): string {
  let value = input.trim()
  if (value === '') return ''

  // Drop a scheme if one was pasted.
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
  // Drop any credentials, path, query or fragment.
  value = value.replace(/^[^/@]*@/, '')
  value = value.split(/[/?#]/)[0]
  // Drop a port.
  value = value.replace(/:\d+$/, '')
  // Drop the trailing root dot.
  value = value.replace(/\.$/, '')

  return value.toLowerCase()
}

const LABEL = /^[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?$/i

/**
 * Validate a hostname.
 *
 * Deliberately strict: a label must be 1–63 characters of letters, digits,
 * hyphens or underscores and may not start or end with a hyphen. This rejects
 * whitespace, unicode lookalikes and anything that is not a DNS name.
 */
export function validateDomain(input: string): string | null {
  const domain = normalizeDomain(input)
  if (domain === '') return 'Enter a domain name, for example example.com.'
  if (domain.length > 253) return 'That domain name is too long (the limit is 253 characters).'
  // Check this before the TLD rule so a private address gets the accurate message.
  if (isPrivateHost(domain)) {
    return 'Private and loopback hostnames are not looked up. Use a public domain name.'
  }

  const labels = domain.split('.')
  if (labels.length < 2) {
    return 'Enter a full domain name with a dot, for example example.com.'
  }
  for (const label of labels) {
    if (label === '') return 'The domain contains an empty label (a doubled dot).'
    if (label.length > 63) return `The label “${label}” is longer than the 63-character limit.`
    if (!LABEL.test(label)) {
      return `“${label}” is not a valid domain label. Use letters, digits and hyphens only.`
    }
  }
  if (!/^[a-z]{2,}$/i.test(labels[labels.length - 1])) {
    return 'The last part of the domain must be a top-level domain such as .com or .org.'
  }
  return null
}

/** True for loopback, link-local and RFC 1918 / RFC 4193 private addresses. */
export function isPrivateHost(host: string): boolean {
  const value = host.trim().toLowerCase().replace(/^\[|\]$/g, '')
  if (value === '' ) return false
  if (value === 'localhost' || value.endsWith('.localhost') || value.endsWith('.local')) return true

  // IPv4 literal.
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(value)
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])]
    if (a === 10) return true
    if (a === 127) return true
    if (a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true
    return false
  }

  // IPv6 literal.
  if (value.includes(':')) {
    if (value === '::1' || value === '::') return true
    if (/^f[cd][0-9a-f]{2}:/.test(value)) return true // fc00::/7 unique local
    if (/^fe[89ab][0-9a-f]:/.test(value)) return true // fe80::/10 link local
    return false
  }

  return false
}

/** Turn a numeric DNS status code into an explanation. */
export function describeDnsStatus(status: number): string {
  switch (status) {
    case 0:
      return 'NOERROR — the query succeeded.'
    case 1:
      return 'FORMERR — the resolver could not understand the query.'
    case 2:
      return 'SERVFAIL — the name servers failed to answer, often because of a broken zone.'
    case 3:
      return 'NXDOMAIN — the domain does not exist.'
    case 4:
      return 'NOTIMP — the resolver does not support this query type.'
    case 5:
      return 'REFUSED — the resolver refused to answer, usually because of a policy block.'
    default:
      return `The resolver returned status ${status}.`
  }
}

function toAnswers(raw: unknown): DnsAnswer[] {
  if (!Array.isArray(raw)) return []
  const answers: DnsAnswer[] = []
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue
    const record = entry as Record<string, unknown>
    const typeCode = typeof record.type === 'number' ? record.type : 0
    answers.push({
      name: typeof record.name === 'string' ? record.name : '',
      typeCode,
      type: TYPE_NAMES[typeCode] ?? `TYPE${typeCode}`,
      ttl: typeof record.TTL === 'number' ? record.TTL : 0,
      data: typeof record.data === 'string' ? record.data : '',
    })
  }
  return answers
}

export interface QueryOptions {
  provider?: DohProviderId
  signal?: AbortSignal
}

/**
 * Resolve one record type through a DoH provider.
 *
 * Throws `DnsError` with a plain explanation when the resolver is unreachable
 * or returns something that is not DNS JSON.
 */
export async function queryDns(
  name: string,
  type: DnsRecordType,
  options: QueryOptions = {},
): Promise<DnsResult> {
  const error = validateDomain(name)
  if (error) throw new DnsError(error)

  const domain = normalizeDomain(name)
  const providerId = options.provider ?? 'google'
  const provider = DOH_PROVIDERS.find((entry) => entry.id === providerId) ?? DOH_PROVIDERS[0]

  const url = `${provider.endpoint}?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`

  let response: Response
  try {
    response = await fetch(url, {
      signal: options.signal,
      headers: { accept: 'application/dns-json' },
      credentials: 'omit',
      cache: 'no-store',
    })
  } catch (failure) {
    if (options.signal?.aborted) throw new DnsError('The lookup was cancelled.')
    const message = failure instanceof Error ? failure.message : String(failure)
    throw new DnsError(
      `Could not reach ${provider.label}: ${message}. ` +
        'The resolver may be blocked on this network. Try the other provider.',
    )
  }

  if (!response.ok) {
    throw new DnsError(`${provider.label} answered with HTTP ${response.status}. Try again, or switch provider.`)
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new DnsError(`${provider.label} did not return JSON. The endpoint may have changed.`)
  }

  if (typeof payload !== 'object' || payload === null) {
    throw new DnsError(`${provider.label} returned an unexpected response shape.`)
  }

  const body = payload as Record<string, unknown>
  const status = typeof body.Status === 'number' ? body.Status : 2

  return {
    status,
    statusText: describeDnsStatus(status),
    answers: toAnswers(body.Answer),
    authority: toAnswers(body.Authority),
    truncated: body.TC === true,
    authenticated: body.AD === true,
    provider: provider.id,
  }
}

/**
 * Split an MX or SRV record into priority and target.
 *
 * The wire format is `10 mail.example.com.` for MX and
 * `10 5 5060 sip.example.com.` for SRV.
 */
export function splitPriority(data: string): { priority: number | null; target: string } {
  const match = /^(\d+)\s+(.+)$/.exec(data.trim())
  if (!match) return { priority: null, target: data.trim() }
  return { priority: Number(match[1]), target: match[2].trim() }
}

/** Strip the quotes TXT records are wrapped in and join their chunks. */
export function cleanTxtRecord(data: string): string {
  const chunks = data.match(/"([^"]*)"/g)
  if (!chunks) return data.trim()
  return chunks.map((chunk) => chunk.slice(1, -1)).join('')
}

/**
 * Recognise the common TXT record purposes so the UI can label them.
 * Returns `null` when the record is not one of the well-known kinds.
 */
export function classifyTxtRecord(data: string): string | null {
  const value = cleanTxtRecord(data)
  if (/^v=spf1\b/i.test(value)) return 'SPF — which servers may send mail for this domain'
  if (/^v=DMARC1\b/i.test(value)) return 'DMARC — the policy for mail that fails SPF and DKIM'
  if (/^v=DKIM1\b/i.test(value) || /\bp=[A-Za-z0-9+/=]{20,}/.test(value)) return 'DKIM — a public key used to verify signed mail'
  if (/^google-site-verification=/i.test(value)) return 'Google site verification'
  if (/^MS=/i.test(value)) return 'Microsoft 365 domain verification'
  if (/^facebook-domain-verification=/i.test(value)) return 'Meta domain verification'
  if (/^apple-domain-verification=/i.test(value)) return 'Apple domain verification'
  if (/^stripe-verification=/i.test(value)) return 'Stripe domain verification'
  if (/^atlassian-domain-verification=/i.test(value)) return 'Atlassian domain verification'
  return null
}
