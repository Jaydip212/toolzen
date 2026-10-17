/**
 * Cron expression help.
 *
 * Validation and "next run" calculation use `cron-parser`; the plain-English
 * description uses `cronstrue`. Both are mature libraries, so the answers are
 * the real ones rather than a hand-rolled approximation.
 */
import { CronExpressionParser } from 'cron-parser'
import cronstrue from 'cronstrue'

export interface CronField {
  name: string
  value: string
  explanation: string
}

/** Preset expressions offered in the UI. */
export const CRON_PRESETS = [
  { expression: '* * * * *', label: 'Every minute' },
  { expression: '*/5 * * * *', label: 'Every 5 minutes' },
  { expression: '0 * * * *', label: 'Every hour, on the hour' },
  { expression: '0 9 * * MON-FRI', label: 'Weekdays at 09:00' },
  { expression: '0 0 * * *', label: 'Every day at midnight' },
  { expression: '0 0 1 * *', label: 'First day of every month' },
  { expression: '0 12 * * 0', label: 'Every Sunday at noon' },
  { expression: '30 2 * * 0', label: 'Sundays at 02:30' },
  { expression: '0 0 1 1 *', label: 'Once a year, on 1 January' },
  { expression: '0 */6 * * *', label: 'Every 6 hours' },
] as const

/** Time zones offered in the UI. UTC is the safe default for servers. */
export const CRON_TIMEZONES = [
  { id: 'UTC', label: 'UTC' },
  { id: 'America/New_York', label: 'New York' },
  { id: 'America/Los_Angeles', label: 'Los Angeles' },
  { id: 'Europe/London', label: 'London' },
  { id: 'Europe/Berlin', label: 'Berlin' },
  { id: 'Asia/Kolkata', label: 'Kolkata' },
  { id: 'Asia/Tokyo', label: 'Tokyo' },
  { id: 'Australia/Sydney', label: 'Sydney' },
] as const

const FIELD_NAMES_5 = ['Minute', 'Hour', 'Day of month', 'Month', 'Day of week']
const FIELD_NAMES_6 = ['Second', 'Minute', 'Hour', 'Day of month', 'Month', 'Day of week']

const MONTH_NAMES: Record<string, string> = {
  '1': 'January', '2': 'February', '3': 'March', '4': 'April', '5': 'May', '6': 'June',
  '7': 'July', '8': 'August', '9': 'September', '10': 'October', '11': 'November', '12': 'December',
  JAN: 'January', FEB: 'February', MAR: 'March', APR: 'April', MAY: 'May', JUN: 'June',
  JUL: 'July', AUG: 'August', SEP: 'September', OCT: 'October', NOV: 'November', DEC: 'December',
}

const DAY_NAMES: Record<string, string> = {
  '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday', '4': 'Thursday',
  '5': 'Friday', '6': 'Saturday', '7': 'Sunday',
  SUN: 'Sunday', MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday',
  FRI: 'Friday', SAT: 'Saturday',
}

/** Explain a single field value in plain English. */
function explainField(value: string, fieldName: string): string {
  const translate = (token: string): string => {
    const upper = token.toUpperCase()
    if (fieldName === 'Month' && upper in MONTH_NAMES) return MONTH_NAMES[upper]
    if (fieldName === 'Day of week' && upper in DAY_NAMES) return DAY_NAMES[upper]
    return token
  }

  if (value === '*') return 'every value'
  if (value === '?') return 'no specific value'

  if (value.startsWith('*/')) {
    return `every ${value.slice(2)} ${fieldName.toLowerCase().replace(/s$/, '')}s`
  }

  if (value.includes(',')) {
    return `any of ${value
      .split(',')
      .map((part) => translate(part.trim()))
      .join(', ')}`
  }

  if (value.includes('/')) {
    const [range, step] = value.split('/')
    if (range.includes('-')) {
      const [from, to] = range.split('-')
      return `every ${step} from ${translate(from)} to ${translate(to)}`
    }
    if (range === '*') return `every ${step}`
    return `every ${step}, starting at ${translate(range)}`
  }

  if (value.includes('-')) {
    const [from, to] = value.split('-')
    return `from ${translate(from)} to ${translate(to)}`
  }

  return `at ${translate(value)}`
}

/** Break an expression into its fields with explanations. */
export function parseCronFields(expression: string): CronField[] {
  const parts = expression.trim().split(/\s+/).filter((part) => part !== '')
  const names = parts.length === 6 ? FIELD_NAMES_6 : FIELD_NAMES_5

  if (parts.length !== 5 && parts.length !== 6) return []

  return parts.map((value, index) => ({
    name: names[index] ?? `Field ${index + 1}`,
    value,
    explanation: explainField(value, names[index] ?? ''),
  }))
}

/** How many fields the expression has. */
export function countFields(expression: string): number {
  return expression.trim().split(/\s+/).filter((part) => part !== '').length
}

/** Validate an expression. Returns an error message, or `null` when valid. */
export function validateCron(expression: string, timezone = 'UTC'): string | null {
  const trimmed = expression.trim()
  if (trimmed === '') return 'Enter a cron expression.'

  const fields = countFields(trimmed)
  if (fields !== 5 && fields !== 6) {
    return `A cron expression has 5 fields (minute hour day month weekday) or 6 with seconds, but this one has ${fields}.`
  }

  try {
    CronExpressionParser.parse(trimmed, { tz: timezone })
    return null
  } catch (error) {
    return error instanceof Error ? error.message : 'The expression could not be parsed.'
  }
}

/** A plain-English description of the schedule. */
export function describeCron(expression: string): { description: string | null; error: string | null } {
  const trimmed = expression.trim()
  if (trimmed === '') return { description: null, error: null }

  try {
    return { description: cronstrue.toString(trimmed, { use24HourTimeFormat: true }), error: null }
  } catch (error) {
    return {
      description: null,
      error: error instanceof Error ? error.message : 'The expression could not be described.',
    }
  }
}

export interface NextRunsResult {
  runs: Date[]
  error: string | null
}

/**
 * The next `count` times the schedule fires, starting from `from`.
 * The expression's own field count decides whether seconds are meaningful.
 */
export function nextRuns(
  expression: string,
  count = 5,
  from: Date = new Date(),
  timezone = 'UTC',
): NextRunsResult {
  const invalid = validateCron(expression, timezone)
  if (invalid) return { runs: [], error: invalid }

  const wanted = Math.min(50, Math.max(1, Math.round(count)))

  try {
    const iterator = CronExpressionParser.parse(expression.trim(), {
      currentDate: from,
      tz: timezone,
    })
    const runs: Date[] = []
    for (let i = 0; i < wanted; i += 1) {
      runs.push(iterator.next().toDate())
    }
    return { runs, error: null }
  } catch (error) {
    return {
      runs: [],
      error: error instanceof Error ? error.message : 'The next runs could not be calculated.',
    }
  }
}
