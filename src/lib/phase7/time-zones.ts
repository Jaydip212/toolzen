/**
 * Time-zone conversion with the standard Intl API.
 *
 * A local wall-clock time is not an instant until a zone is attached. This
 * module finds the zone's UTC offset at that instant (DST-aware), resolves
 * the true instant, then formats it in the target zone. No hardcoded offset
 * tables — the runtime's ICU data stays correct as rules change.
 */

export const COMMON_TIME_ZONES = [
  'UTC',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Australia/Sydney',
  'Pacific/Auckland',
]

const LOCAL_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

function zoneParts(instant: Date, zone: string): Record<string, number> {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant)
  const values: Record<string, number> = {}
  for (const part of parts) {
    if (part.type !== 'literal') values[part.type] = Number(part.value)
  }
  return values
}

/** Offset in minutes of a zone at a given instant, via the zone's own clock. */
export function zoneOffsetMinutes(instant: Date, zone: string): number {
  const p = zoneParts(instant, zone)
  const asUtc = Date.UTC(p.year!, p.month! - 1, p.day!, p.hour!, p.minute!, p.second!)
  return Math.round((asUtc - instant.getTime()) / 60_000)
}

export function formatOffset(minutes: number): string {
  if (minutes === 0) return 'UTC+00:00'
  const sign = minutes > 0 ? '+' : '-'
  const absolute = Math.abs(minutes)
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0')
  const mins = String(absolute % 60).padStart(2, '0')
  return `UTC${sign}${hours}:${mins}`
}

export interface ZoneConversion {
  /** Formatted local time in the target zone, e.g. "2026-07-01 14:30". */
  local: string
  /** The resolved instant, as an ISO string. */
  instant: string
  fromOffset: string
  toOffset: string
  /** True when the wall-clock time was ambiguous or nonexistent due to DST. */
  dstAdjusted: boolean
}

export function convertTimeZone(input: {
  local: string
  fromZone: string
  toZone: string
}): { ok: true; result: ZoneConversion } | { ok: false; error: string } {
  const match = LOCAL_TIME.exec(input.local.trim())
  if (!match) return { ok: false, error: 'Enter a date and time in YYYY-MM-DDTHH:mm format.' }
  const [, y, mo, d, h, mi] = match
  const year = Number(y)
  const month = Number(mo)
  const day = Number(d)
  const hour = Number(h)
  const minute = Number(mi)
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute)
  // Date.UTC silently rolls invalid dates over (Feb 30 -> March 2). Check it.
  const check = new Date(wallAsUtc)
  if (
    Number.isNaN(wallAsUtc) ||
    check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day || check.getUTCHours() !== hour || check.getUTCMinutes() !== minute
  ) {
    return { ok: false, error: 'That is not a real calendar date and time.' }
  }

  let fromOffset = 0
  let toOffset = 0
  let instant = new Date(wallAsUtc)
  try {
    // Two passes: the offset at the guessed instant, then the offset at the
    // corrected instant — DST boundaries can shift the answer by an hour.
    for (let pass = 0; pass < 2; pass += 1) {
      fromOffset = zoneOffsetMinutes(instant, input.fromZone)
      instant = new Date(wallAsUtc - fromOffset * 60_000)
    }
    fromOffset = zoneOffsetMinutes(instant, input.fromZone)
    instant = new Date(wallAsUtc - fromOffset * 60_000)
    toOffset = zoneOffsetMinutes(instant, input.toZone)
  } catch {
    return { ok: false, error: 'One of those time zones is not recognised.' }
  }

  const target = zoneParts(instant, input.toZone)
  const local = `${target.year}-${String(target.month).padStart(2, '0')}-${String(target.day).padStart(2, '0')} ${String(target.hour).padStart(2, '0')}:${String(target.minute).padStart(2, '0')}`
  // If the resolved instant maps back to a different wall time in the source
  // zone, the input was in a DST spring-forward gap.
  const back = zoneParts(instant, input.fromZone)
  const dstAdjusted =
    back.month !== Number(match[2]) || back.day !== Number(match[3]) ||
    back.hour !== Number(match[4]) || back.minute !== Number(match[5])

  return {
    ok: true,
    result: {
      local,
      instant: instant.toISOString(),
      fromOffset: formatOffset(fromOffset),
      toOffset: formatOffset(toOffset),
      dstAdjusted,
    },
  }
}
