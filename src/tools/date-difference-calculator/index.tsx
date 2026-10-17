import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import { SegmentedControl } from '@/tools/shared'
import {
  UNITS,
  addBusinessDays,
  describeDifference,
  difference,
  formatDate,
  inUnit,
  isApproximate,
  nextMilestone,
  parseDateInput,
  subtractBusinessDays,
  today,
} from './logic'
import type { UnitKey } from './logic'

export function DateDifferenceCalculatorTool() {
  const [fromInput, setFromInput] = useState('2023-01-01')
  const [toInput, setToInput] = useState(() => {
    const now = today()
    const pad = (value: number) => String(value).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  })
  const [unit, setUnit] = useState<UnitKey>('days')
  const [businessDays, setBusinessDays] = useState('10')

  const from = useMemo(() => parseDateInput(fromInput), [fromInput])
  const to = useMemo(() => parseDateInput(toInput), [toInput])

  const diff = useMemo(() => {
    if (!from || !to) return { error: null, value: null }
    try {
      return { error: null, value: difference(from, to) }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Those dates could not be used.', value: null }
    }
  }, [from, to])

  const error =
    diff.error ??
    (fromInput.trim() !== '' && !from ? 'The start date is not a valid date.' : null) ??
    (toInput.trim() !== '' && !to ? 'The end date is not a valid date.' : null)

  const count = Number(businessDays)
  const countValid = Number.isFinite(count) && Number.isInteger(count) && count !== 0
  const milestone = diff.value ? nextMilestone(diff.value.totalDays) : null

  const swap = () => {
    setFromInput(toInput)
    setToInput(fromInput)
  }

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="Two dates"
        description="Counts the end date but not the start date, which is how payment terms and delivery estimates work."
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={swap}
            disabled={fromInput === '' || toInput === ''}
          >
            Swap
          </Button>
        }
      >
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="From"
            type="date"
            value={fromInput}
            containerClassName="w-48"
            onChange={(event) => setFromInput(event.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={toInput}
            containerClassName="w-48"
            onChange={(event) => setToInput(event.target.value)}
          />
        </div>
      </ToolPanel>

      {error && <ErrorState title="Check the dates" message={error} />}

      {diff.value && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Total days"
              value={<span className="tabular-nums">{diff.value.totalDays.toLocaleString('en-US')}</span>}
              hint={`${diff.value.weeks.toLocaleString('en-US')} whole weeks`}
            />
            <StatTile
              label="Weekdays"
              value={<span className="tabular-nums">{diff.value.businessDays.toLocaleString('en-US')}</span>}
              hint="Monday to Friday, end date counted"
            />
            <StatTile
              label="Weekend days"
              value={<span className="tabular-nums">{diff.value.weekendDays.toLocaleString('en-US')}</span>}
              hint="Saturdays and Sundays in the range"
            />
            <StatTile
              label="29 Februaries"
              value={<span className="tabular-nums">{diff.value.leapDays.toLocaleString('en-US')}</span>}
              hint="leap days crossed"
            />
          </div>

          <ToolPanel title="On the calendar" actions={diff.value.reverse ? <Badge variant="warning">Reversed</Badge> : null}>
            <p className="text-sm text-fg">{describeDifference(diff.value)}</p>
          </ToolPanel>

          <ToolPanel
            title="Expressed in another unit"
            description="Days and weeks are exact. Months and years are averages — 30 days is not the same as one month."
          >
            <SegmentedControl
              label="Unit"
              value={unit}
              onChange={setUnit}
              size="sm"
              options={UNITS.map((entry) => ({ value: entry.value, label: entry.label }))}
            />
            <p className="text-2xl font-semibold tabular-nums text-fg">
              {inUnit(diff.value.totalDays, unit).toLocaleString('en-US')}{' '}
              <span className="text-sm font-normal text-muted">{unit}</span>
            </p>
            {isApproximate(unit) && (
              <p className="text-xs text-muted">
                Using an average of 30.436875 days per month and 365.2425 days per year. The calendar breakdown
                above is the exact figure.
              </p>
            )}
            {milestone && (
              <p className="text-xs text-muted">
                Next milestone: {milestone.label} —{' '}
                {(milestone.days - diff.value.totalDays).toLocaleString('en-US')} days away.
              </p>
            )}
          </ToolPanel>

          <ToolPanel
            title="Weekday maths"
            description="Add or subtract working days from the start date, skipping Saturdays and Sundays."
          >
            <div className="flex flex-wrap items-end gap-3">
              <Input
                label="Working days"
                type="number"
                inputMode="numeric"
                step="1"
                value={businessDays}
                containerClassName="w-40"
                onChange={(event) => setBusinessDays(event.target.value)}
              />
            </div>
            {from && countValid ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                <StatTile
                  label={`${count} working days after`}
                  value={<span className="text-base">{formatDate(addBusinessDays(from, count))}</span>}
                  hint={fromInput}
                />
                <StatTile
                  label={`${count} working days before`}
                  value={<span className="text-base">{formatDate(subtractBusinessDays(from, count))}</span>}
                  hint={fromInput}
                />
              </div>
            ) : (
              <p className="text-xs text-muted">Enter a whole number of working days, positive or negative.</p>
            )}
            <p className="text-xs text-muted">
              Public holidays are not subtracted — only Saturdays and Sundays. Check them against your own
              calendar.
            </p>
          </ToolPanel>
        </>
      )}
    </div>
  )
}

export default DateDifferenceCalculatorTool
