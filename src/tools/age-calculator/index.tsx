import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import { ageBetween, formatDate, parseDateInput, summariseAge } from './logic'

/** Today as a `YYYY-MM-DD` value, in the viewer's own timezone. */
function todayValue(): string {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function AgeCalculatorTool() {
  const [birthInput, setBirthInput] = useState('1990-05-15')
  const [referenceInput, setReferenceInput] = useState(() => todayValue())

  const parsedBirth = useMemo(() => parseDateInput(birthInput), [birthInput])
  const parsedReference = useMemo(() => parseDateInput(referenceInput), [referenceInput])

  const age = useMemo(() => {
    if (!parsedBirth || !parsedReference) return { error: null, value: null }
    try {
      return { error: null, value: ageBetween(parsedBirth, parsedReference) }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Those dates could not be used.', value: null }
    }
  }, [parsedBirth, parsedReference])

  const error =
    age.error ??
    (birthInput.trim() !== '' && !parsedBirth ? 'The date of birth is not a valid date.' : null) ??
    (referenceInput.trim() !== '' && !parsedReference ? 'The reference date is not a valid date.' : null)

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="Two dates"
        description="Age is measured on the calendar, so 31 January to 1 March is 1 month and 1 day."
        actions={
          <Button variant="ghost" size="sm" onClick={() => setReferenceInput(todayValue())}>
            Use today
          </Button>
        }
      >
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Date of birth"
            type="date"
            value={birthInput}
            containerClassName="w-48"
            onChange={(event) => setBirthInput(event.target.value)}
          />
          <Input
            label="Age at"
            type="date"
            value={referenceInput}
            containerClassName="w-48"
            onChange={(event) => setReferenceInput(event.target.value)}
          />
        </div>
      </ToolPanel>

      {error && <ErrorState title="Check the dates" message={error} />}

      {age.value && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Age"
              value={
                <span className="tabular-nums">
                  {age.value.years}
                  <span className="text-sm font-normal text-muted">y</span> {age.value.months}
                  <span className="text-sm font-normal text-muted">m</span> {age.value.days}
                  <span className="text-sm font-normal text-muted">d</span>
                </span>
              }
              hint={summariseAge(age.value)}
            />
            <StatTile
              label="Total days lived"
              value={<span className="tabular-nums">{age.value.totalDays.toLocaleString('en-US')}</span>}
              hint={`${age.value.totalWeeks.toLocaleString('en-US')} weeks · ${age.value.totalHours.toLocaleString('en-US')} hours`}
            />
            <StatTile
              label="Total months"
              value={<span className="tabular-nums">{age.value.totalMonths.toLocaleString('en-US')}</span>}
              hint="whole months, not days divided by 30"
            />
            <StatTile
              label="Born on a"
              value={<span className="text-base">{age.value.bornOn}</span>}
              hint={parsedBirth ? formatDate(parsedBirth) : undefined}
            />
          </div>

          <ToolPanel
            title="Next birthday"
            description="A 29 February birthday falls on 28 February in a non-leap year."
            actions={
              age.value.isBirthday ? (
                <Badge variant="success">Today</Badge>
              ) : (
                <Badge variant="outline">{age.value.daysToNextBirthday} days away</Badge>
              )
            }
          >
            <p className="text-sm text-fg">
              {age.value.isBirthday
                ? 'That birthday is today.'
                : `${formatDate(age.value.nextBirthday)} — ${age.value.daysToNextBirthday.toLocaleString('en-US')} day${
                    age.value.daysToNextBirthday === 1 ? '' : 's'
                  } from the reference date.`}
            </p>
          </ToolPanel>

          <ToolPanel title="How this was worked out">
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-xs leading-relaxed text-muted">
              <li>
                Whole months are counted first, then the leftover days are measured from the clamped month
                anniversary — 31 January plus one month is 28 February.
              </li>
              <li>
                A reference date landing on the last day of its month counts as a whole month, which is what makes
                a 29 February birthday come due on 28 February.
              </li>
              <li>Dates are read in your own timezone, and the time of day is ignored.</li>
            </ul>
          </ToolPanel>
        </>
      )}
    </div>
  )
}

export default AgeCalculatorTool
