/**
 * Certificate Transparency lookups via crt.sh.
 *
 * A browser cannot read a server's live TLS chain — the handshake happens
 * below the JavaScript API. What it *can* read is the public Certificate
 * Transparency log, which records every certificate a public CA has issued for
 * a name. crt.sh publishes that log as JSON with `Access-Control-Allow-Origin:
 * *`, so this works entirely from the page.
 *
 * The distinction matters and the UI states it: these are certificates that
 * were *issued*, not necessarily the one currently served.
 */

export interface CertificateIssuer {
  commonName: string | null
  organisation: string | null
  country: string | null
  /** The raw `issuer_name` string, kept for display and copying. */
  raw: string
}

export type CertificateValidity = 'valid' | 'expired' | 'not-yet-valid' | 'unknown'

export interface Certificate {
  /** crt.sh row id. */
  id: number
  commonName: string
  /** Every name on the certificate, split from crt.sh's newline-separated field. */
  names: string[]
  issuer: CertificateIssuer
  /** ISO timestamp, or `null` when crt.sh returned something unparseable. */
  notBefore: string | null
  notAfter: string | null
  serialNumber: string
}

export interface CrtShEntry {
  issuer_ca_id?: number
  issuer_name?: string
  common_name?: string
  name_value?: string
  id?: number
  not_before?: string
  not_after?: string
  serial_number?: string
  result_count?: number
}

/** Build the crt.sh query URL for a domain. `%25.` is the SQL wildcard `%.`. */
export function crtShUrl(domain: string, includeSubdomains = true): string {
  const pattern = includeSubdomains ? `%.${domain}` : domain
  return `https://crt.sh/?q=${encodeURIComponent(pattern)}&output=json`
}

/**
 * Split a Distinguished Name into its components.
 *
 * crt.sh gives `C=US, O=SSL Corporation, CN=Cloudflare TLS Issuing ECC CA 3`.
 * Commas inside a value are possible in theory, so this only splits on a comma
 * that is followed by `KEY=` — which is how real DNs are formatted.
 */
export function parseDistinguishedName(raw: string): CertificateIssuer {
  const issuer: CertificateIssuer = { commonName: null, organisation: null, country: null, raw }
  if (raw.trim() === '') return issuer

  const parts = raw.split(/,\s*(?=[A-Za-z]{1,3}=)/)
  for (const part of parts) {
    const match = /^([A-Za-z]{1,3})=(.*)$/.exec(part.trim())
    if (!match) continue
    const key = match[1].toUpperCase()
    const value = match[2].trim()
    if (key === 'CN') issuer.commonName = value
    else if (key === 'O') issuer.organisation = value
    else if (key === 'C') issuer.country = value
  }
  return issuer
}

/** Turn one crt.sh row into a certificate, or `null` when it is unusable. */
export function parseCertificate(entry: CrtShEntry): Certificate | null {
  const commonName = (entry.common_name ?? '').trim()
  const serial = (entry.serial_number ?? '').trim()
  const id = typeof entry.id === 'number' ? entry.id : 0

  const names = (entry.name_value ?? '')
    .split('\n')
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name !== '')

  // A row with no name and no serial carries nothing usable.
  if (commonName === '' && serial === '' && names.length === 0) return null

  return {
    id,
    commonName: commonName || (names[0] ?? ''),
    names: Array.from(new Set(names)),
    issuer: parseDistinguishedName(entry.issuer_name ?? ''),
    notBefore: normaliseTimestamp(entry.not_before ?? ''),
    notAfter: normaliseTimestamp(entry.not_after ?? ''),
    serialNumber: serial,
  }
}

/**
 * crt.sh returns `2026-09-26T22:49:11` with no timezone, meaning UTC.
 * Append `Z` so `Date` parses it as UTC rather than local time.
 */
export function normaliseTimestamp(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const withZone = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(trimmed) ? trimmed : `${trimmed}Z`
  const parsed = new Date(withZone)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

/**
 * Deduplicate crt.sh rows.
 *
 * The log returns one row per *log entry*, and the same certificate can appear
 * in several logs — the `result_count` field says how many. Serial number plus
 * issuer plus expiry identifies a certificate uniquely.
 */
export function dedupeCertificates(certificates: Certificate[]): Certificate[] {
  const seen = new Set<string>()
  const unique: Certificate[] = []
  for (const certificate of certificates) {
    const key = `${certificate.serialNumber}|${certificate.issuer.raw}|${certificate.notAfter ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(certificate)
  }
  return unique
}

/** Sort newest-expiring first, so the certificate in use today is near the top. */
export function sortByExpiry(certificates: Certificate[]): Certificate[] {
  return [...certificates].sort((a, b) => {
    const left = a.notAfter ? Date.parse(a.notAfter) : 0
    const right = b.notAfter ? Date.parse(b.notAfter) : 0
    return right - left
  })
}

/** Whole days between now and a timestamp. Negative when the date has passed. */
export function daysUntil(iso: string | null, now: Date = new Date()): number | null {
  if (iso === null) return null
  const target = Date.parse(iso)
  if (Number.isNaN(target)) return null
  return Math.round((target - now.getTime()) / 86_400_000)
}

/** Whether a certificate is currently inside its validity window. */
export function validityOf(certificate: Certificate, now: Date = new Date()): CertificateValidity {
  if (certificate.notBefore === null || certificate.notAfter === null) return 'unknown'
  const start = Date.parse(certificate.notBefore)
  const end = Date.parse(certificate.notAfter)
  if (Number.isNaN(start) || Number.isNaN(end)) return 'unknown'
  if (now.getTime() < start) return 'not-yet-valid'
  if (now.getTime() > end) return 'expired'
  return 'valid'
}

/** True when any name on the certificate is a wildcard. */
export function isWildcard(certificate: Certificate): boolean {
  return certificate.names.some((name) => name.startsWith('*.'))
}

export interface CertificateSummary {
  /** Rows returned by crt.sh, including duplicates across logs. */
  total: number
  /** Distinct certificates after deduplication. */
  unique: number
  valid: number
  expired: number
  notYetValid: number
  /** Valid certificates expiring within 30 days. */
  expiringSoon: number
  wildcard: number
  issuers: Array<{ name: string; count: number }>
  /** The certificate with the latest expiry that is still valid. */
  newest: Certificate | null
}

/** Aggregate a set of certificates into the figures shown above the table. */
export function summariseCertificates(
  certificates: Certificate[],
  now: Date = new Date(),
): CertificateSummary {
  const issuerCounts = new Map<string, number>()
  let valid = 0
  let expired = 0
  let notYetValid = 0
  let expiringSoon = 0
  let wildcard = 0
  let newest: Certificate | null = null

  for (const certificate of certificates) {
    const issuerName = certificate.issuer.commonName ?? certificate.issuer.organisation ?? 'Unknown issuer'
    issuerCounts.set(issuerName, (issuerCounts.get(issuerName) ?? 0) + 1)

    if (isWildcard(certificate)) wildcard += 1

    const validity = validityOf(certificate, now)
    if (validity === 'valid') {
      valid += 1
      const remaining = daysUntil(certificate.notAfter, now)
      if (remaining !== null && remaining <= 30) expiringSoon += 1
      if (newest === null) {
        newest = certificate
      } else {
        const current = certificate.notAfter ? Date.parse(certificate.notAfter) : 0
        const best = newest.notAfter ? Date.parse(newest.notAfter) : 0
        if (current > best) newest = certificate
      }
    } else if (validity === 'expired') {
      expired += 1
    } else if (validity === 'not-yet-valid') {
      notYetValid += 1
    }
  }

  const issuers = Array.from(issuerCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  return {
    total: certificates.length,
    unique: certificates.length,
    valid,
    expired,
    notYetValid,
    expiringSoon,
    wildcard,
    issuers,
    newest,
  }
}

/** Render a date as `26 Sep 2026` in a stable, locale-independent form. */
export function formatCertificateDate(iso: string | null): string {
  if (iso === null) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

export class CertificateLookupError extends Error {}

/**
 * Fetch and parse the certificate log for a domain.
 *
 * crt.sh can be slow for large domains, so the caller supplies a signal and is
 * expected to abort after a sensible timeout.
 */
export async function lookupCertificates(
  domain: string,
  options: { includeSubdomains?: boolean; signal?: AbortSignal } = {},
): Promise<{ certificates: Certificate[]; url: string }> {
  const url = crtShUrl(domain, options.includeSubdomains ?? true)

  let response: Response
  try {
    response = await fetch(url, { signal: options.signal, credentials: 'omit' })
  } catch (failure) {
    if (options.signal?.aborted) {
      throw new CertificateLookupError('The lookup timed out or was cancelled. crt.sh can be slow for large domains — try again, or disable subdomain matching.')
    }
    const message = failure instanceof Error ? failure.message : String(failure)
    throw new CertificateLookupError(
      `Could not reach crt.sh: ${message}. The service may be down or blocked on this network.`,
    )
  }

  if (response.status === 404) {
    return { certificates: [], url }
  }
  if (!response.ok) {
    throw new CertificateLookupError(`crt.sh answered with HTTP ${response.status}. Try again in a moment.`)
  }

  const text = await response.text()
  if (text.trim() === '' || text.trim() === '[]') {
    return { certificates: [], url }
  }

  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch {
    throw new CertificateLookupError(
      'crt.sh returned something that is not JSON — it sometimes serves an error page when overloaded. Try again.',
    )
  }

  if (!Array.isArray(payload)) {
    throw new CertificateLookupError('crt.sh returned an unexpected response shape.')
  }

  const certificates: Certificate[] = []
  for (const entry of payload) {
    if (typeof entry !== 'object' || entry === null) continue
    const parsed = parseCertificate(entry as CrtShEntry)
    if (parsed) certificates.push(parsed)
  }

  return { certificates: dedupeCertificates(certificates), url }
}
