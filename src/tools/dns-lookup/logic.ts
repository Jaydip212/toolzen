import {
  DNS_RECORD_TYPES,
  DOH_PROVIDERS,
  classifyTxtRecord,
  cleanTxtRecord,
  normalizeDomain,
  queryDns,
  splitPriority,
  validateDomain,
  type DnsAnswer,
  type DnsRecordType,
  type DnsResult,
  type DohProviderId,
} from '@/lib/dns'

export {
  DNS_RECORD_TYPES,
  DOH_PROVIDERS,
  classifyTxtRecord,
  cleanTxtRecord,
  normalizeDomain,
  queryDns,
  splitPriority,
  validateDomain,
  type DnsAnswer,
  type DnsRecordType,
  type DnsResult,
  type DohProviderId,
}

/** Record types fetched by "Look up everything" — the ones that answer a real question. */
export const BULK_TYPES: DnsRecordType[] = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'CAA']

/** Format a TTL in seconds as something a human can read. */
export function formatTtl(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—'
  if (seconds === 0) return '0s'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) {
    const minutes = Math.round(seconds / 60)
    return `${minutes}m`
  }
  if (seconds < 86400) {
    const hours = Math.round(seconds / 3600)
    return `${hours}h`
  }
  const days = Math.round(seconds / 86400)
  return `${days}d`
}

/** A row ready for the results table. */
export interface DisplayRecord {
  type: string
  name: string
  /** The value with quotes stripped and priorities split out. */
  value: string
  /** Mail priority for MX, or `null`. */
  priority: number | null
  ttl: string
  /** A plain-English label for well-known TXT records. */
  note: string | null
}

/** Convert one DNS answer into a display row. */
export function toDisplayRecord(answer: DnsAnswer): DisplayRecord {
  let value = answer.data
  let priority: number | null = null
  let note: string | null = null

  if (answer.type === 'MX') {
    const split = splitPriority(answer.data)
    priority = split.priority
    value = split.target
  } else if (answer.type === 'TXT') {
    value = cleanTxtRecord(answer.data)
    note = classifyTxtRecord(answer.data)
  } else if (answer.type === 'SRV') {
    value = answer.data
  }

  return {
    type: answer.type,
    name: answer.name.replace(/\.$/, ''),
    value,
    priority,
    ttl: formatTtl(answer.ttl),
    note,
  }
}

/** All display rows for a result, sorted by type then value. */
export function toDisplayRecords(result: DnsResult): DisplayRecord[] {
  return result.answers
    .map(toDisplayRecord)
    .sort((a, b) => a.type.localeCompare(b.type) || a.value.localeCompare(b.value))
}

/** Group display rows by record type, preserving the canonical type order. */
export function groupByType(records: DisplayRecord[]): Array<{ type: string; records: DisplayRecord[] }> {
  const order = DNS_RECORD_TYPES.map((entry) => entry.value as string)
  const buckets = new Map<string, DisplayRecord[]>()
  for (const record of records) {
    const bucket = buckets.get(record.type)
    if (bucket) bucket.push(record)
    else buckets.set(record.type, [record])
  }
  const rank = (type: string): number => {
    const index = order.indexOf(type)
    // Unknown types sort after every known one.
    return index === -1 ? order.length : index
  }
  return Array.from(buckets.entries())
    .sort((a, b) => rank(a[0]) - rank(b[0]))
    .map(([type, entries]) => ({ type, records: entries }))
}

/** One line per record, in zone-file style, for copying. */
export function toZoneText(domain: string, result: DnsResult): string {
  const name = normalizeDomain(domain)
  return result.answers
    .map((answer) => {
      const record = toDisplayRecord(answer)
      const priority = record.priority === null ? '' : `${record.priority} `
      return `${record.name || name}.\t${answer.ttl}\tIN\t${record.type}\t${priority}${record.value}`
    })
    .join('\n')
}

/** A short sentence describing what a result means. */
export function describeResult(domain: string, type: DnsRecordType, result: DnsResult): string {
  const name = normalizeDomain(domain)

  if (result.status !== 0) return result.statusText
  if (result.answers.length === 0) {
    return `No ${type} records exist for ${name}. That is a valid answer — the name resolves, but not to this record type.`
  }

  const count = result.answers.length
  const noun = `${count} ${type} record${count === 1 ? '' : 's'}`
  if (type === 'TXT') {
    const special = result.answers.filter((answer) => classifyTxtRecord(answer.data) !== null)
    if (special.length > 0) {
      return `${noun}, ${special.length} of which look like mail or verification records.`
    }
  }
  return `${noun} found for ${name}.`
}

/** True when every answer in the set has the same TTL. */
export function uniformTtl(result: DnsResult): number | null {
  if (result.answers.length === 0) return null
  const first = result.answers[0].ttl
  return result.answers.every((answer) => answer.ttl === first) ? first : null
}
