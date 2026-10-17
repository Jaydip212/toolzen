import {
  CertificateLookupError,
  crtShUrl,
  daysUntil,
  dedupeCertificates,
  formatCertificateDate,
  isWildcard,
  lookupCertificates,
  parseCertificate,
  parseDistinguishedName,
  sortByExpiry,
  summariseCertificates,
  validityOf,
  type Certificate,
  type CertificateSummary,
  type CertificateValidity,
} from '@/lib/certificates'

export {
  CertificateLookupError,
  crtShUrl,
  daysUntil,
  dedupeCertificates,
  formatCertificateDate,
  isWildcard,
  lookupCertificates,
  parseCertificate,
  parseDistinguishedName,
  sortByExpiry,
  summariseCertificates,
  validityOf,
  type Certificate,
  type CertificateSummary,
  type CertificateValidity,
}

/** A certificate plus the figures the table needs. */
export interface CertificateRow {
  certificate: Certificate
  validity: CertificateValidity
  /** Days until expiry; negative when already expired. */
  remainingDays: number | null
  notBefore: string
  notAfter: string
  issuerLabel: string
}

/** Convert certificates into display rows, most relevant first. */
export function toRows(certificates: Certificate[], now: Date = new Date()): CertificateRow[] {
  return sortByExpiry(certificates).map((certificate) => ({
    certificate,
    validity: validityOf(certificate, now),
    remainingDays: daysUntil(certificate.notAfter, now),
    notBefore: formatCertificateDate(certificate.notBefore),
    notAfter: formatCertificateDate(certificate.notAfter),
    issuerLabel:
      certificate.issuer.commonName ??
      certificate.issuer.organisation ??
      (certificate.issuer.raw === '' ? 'Unknown issuer' : certificate.issuer.raw),
  }))
}

/** A short badge label and tone for a validity state. */
export function validityBadge(validity: CertificateValidity): {
  label: string
  variant: 'success' | 'danger' | 'warning' | 'neutral'
} {
  switch (validity) {
    case 'valid':
      return { label: 'Valid', variant: 'success' }
    case 'expired':
      return { label: 'Expired', variant: 'danger' }
    case 'not-yet-valid':
      return { label: 'Not yet valid', variant: 'warning' }
    default:
      return { label: 'Unknown', variant: 'neutral' }
  }
}

/** Every distinct hostname covered by the certificate set, sorted. */
export function uniqueNames(certificates: Certificate[]): string[] {
  const names = new Set<string>()
  for (const certificate of certificates) {
    for (const name of certificate.names) names.add(name)
    if (certificate.names.length === 0 && certificate.commonName !== '') {
      names.add(certificate.commonName.toLowerCase())
    }
  }
  return Array.from(names).sort()
}

/** Escape one CSV field per RFC 4180. */
function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

/** A CSV export of the certificate list. */
export function toCsv(certificates: Certificate[]): string {
  const header = ['common_name', 'names', 'issuer', 'not_before', 'not_after', 'serial_number']
  const lines = [header.join(',')]
  for (const certificate of sortByExpiry(certificates)) {
    lines.push(
      [
        certificate.commonName,
        certificate.names.join(' '),
        certificate.issuer.raw,
        certificate.notBefore ?? '',
        certificate.notAfter ?? '',
        certificate.serialNumber,
      ]
        .map(csvField)
        .join(','),
    )
  }
  return lines.join('\n')
}

/**
 * A plain-English headline for the lookup.
 *
 * Deliberately careful: crt.sh reports certificates that were *issued*, which
 * is not the same as the one currently served.
 */
export function headline(domain: string, summary: CertificateSummary): string {
  if (summary.total === 0) {
    return `No certificates were found in the public transparency logs for ${domain}.`
  }
  const parts = [`${summary.unique} certificate${summary.unique === 1 ? '' : 's'} issued for ${domain}`]
  if (summary.valid > 0) parts.push(`${summary.valid} still valid`)
  if (summary.expired > 0) parts.push(`${summary.expired} expired`)
  if (summary.expiringSoon > 0) parts.push(`${summary.expiringSoon} expiring within 30 days`)
  return `${parts.join(', ')}.`
}

/** A note about what this data does and does not prove. */
export function dataCaveat(): string {
  return (
    'Certificate Transparency logs record certificates that a public CA has issued, including ones ' +
    'that were never deployed and ones that have since been revoked. They do not show which ' +
    'certificate your browser actually receives today, and they cannot see certificates from a ' +
    'private CA. For the live chain, use your browser’s padlock panel or `openssl s_client`.'
  )
}
