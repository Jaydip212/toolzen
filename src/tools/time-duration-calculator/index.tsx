import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import { CopyButton } from '@/components/ui/CopyButton'
import {
  DURATION_UNITS,
  addToClock,
  formatClock,
  formatHuman,
  formatRate,
  parseClock,
  parseDuration,
  rateFor,
  subtractFromClock,
  toAllUnits,
} from './logic'

export function TimeDurationCalculatorTool() {
  const [durationInput, setDurationInput] = useState('2h 30m')
  const [clockInput, setClockInput] = useState('09:00')
  const [itemsInput, setItemsInput] = useState('60')

  const parsed = useMemo(() => parseDuration(durationInput), [durationInput])
  const seconds = parsed.ok ? parsed.seconds : 0

  const clock = useMemo(() => parseClock(clockInput), [clockInput])

  const items = Number(itemsInput)
  const rate = parsed.ok ? rateFor(seconds, items) : null

  const units = toAllUnits(seconds)

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="A duration"
        description="Reads 2h 30m, 90m, 1.5h, 02:30:45 and comma-separated mixtures. A bare number is refused rather than guessed at."
        actions={
          <Button variant="ghost" size="sm" onClick={() => setDurationInput('')}>
            Clear
          </Button>
        }
      >
        <Input
          label="Duration"
          value={durationInput}
          spellCheck={false}
          containerClassName="max-w-md"
          placeholder="2h 30m"
          className="font-mono text-sm"
          onChange={(event) => setDurationInput(event.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          {['45m', '1h', '1h 30m', '2h 15m', '8h', '1d 4h'].map((preset) => (
            <Button key={preset} variant="ghost" size="sm" onClick={() => setDurationInput(preset)}>
              {preset}
            </Button>
          ))}
        </div>
      </ToolPanel>

      {!parsed.ok && <ErrorState title="That duration could not be read" message={parsed.error} />}

      {parsed.ok && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="In words"
              value={<span className="text-base font-medium">{formatHuman(seconds)}</span>}
              hint={`${seconds.toLocaleString('en-US')} seconds`}
            />
            <StatTile
              label="Clock form"
              value={<span className="font-mono tabular-nums">{formatClock(Math.floor(seconds / 60))}</span>}
              hint="hours and minutes"
            />
            <StatTile
              label="Days"
              value={<span className="tabular-nums">{(seconds / 86_400).toLocaleString('en-US', { maximumFractionDigits: 3 })}</span>}
              hint="a day is 24 hours"
            />
          </div>

          <ToolPanel
            title="Every unit"
            description="The same duration, converted. Only the rounding differs between rows."
            actions={<CopyButton value={units.map((row) => `${row.label}: ${row.value}`).join('\n')} label="Copy all" />}
          >
            <ul className="flex flex-col gap-2">
              {units.map((row) => (
                <li
                  key={row.unit}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface-2/30 px-3 py-2"
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">{row.label}</span>
                  <code className="font-mono text-xs tabular-nums text-fg">{row.value}</code>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted">
              Week is {DURATION_UNITS[DURATION_UNITS.length - 1].divisor.toLocaleString('en-US')} seconds. Nothing
              here uses a variable-length month.
            </p>
          </ToolPanel>

          <ToolPanel
            title="Add to a clock time"
            description="The duration is added to a start time, with the day roll shown when it crosses midnight."
          >
            <div className="flex flex-wrap items-end gap-3">
              <Input
                label="Start time"
                value={clockInput}
                spellCheck={false}
                containerClassName="w-36"
                className="font-mono"
                placeholder="09:00"
                onChange={(event) => setClockInput(event.target.value)}
              />
            </div>
            {!clock.ok && <ErrorState title="That time could not be read" message={clock.error} />}
            {clock.ok && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                <StatTile
                  label="End time"
                  value={<span className="font-mono tabular-nums">{addToClock(clock.minutes, seconds).label}</span>}
                  hint={
                    addToClock(clock.minutes, seconds).crossesMidnight
                      ? 'crosses into the next day'
                      : 'same day'
                  }
                />
                <StatTile
                  label="Start time, working back"
                  value={<span className="font-mono tabular-nums">{subtractFromClock(clock.minutes, seconds).label}</span>}
                  hint="the same duration subtracted"
                />
              </div>
            )}
          </ToolPanel>

          <ToolPanel
            title="How many fit in the duration"
            description="Useful for batches, calls, deliveries — anything with a fixed time per item."
          >
            <div className="flex flex-wrap items-end gap-3">
              <Input
                label="Items in this duration"
                type="number"
                inputMode="decimal"
                value={itemsInput}
                step="any"
                containerClassName="w-48"
                onChange={(event) => setItemsInput(event.target.value)}
              />
            </div>
            {rate ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatTile
                  label="Per item"
                  value={<span className="tabular-nums">{formatRate(rate.secondsPerItem)}s</span>}
                  hint="seconds each"
                />
                <StatTile
                  label="Per hour"
                  value={<span className="tabular-nums">{formatRate(rate.itemsPerHour)}</span>}
                  hint="items"
                />
                <StatTile
                  label="Per minute"
                  value={<span className="tabular-nums">{formatRate(rate.itemsPerMinute)}</span>}
                  hint="items"
                />
              </div>
            ) : (
              <p className="text-xs text-muted">
                Enter how many items fit in this duration — more than zero — to see the rate.
              </p>
            )}
          </ToolPanel>
        </>
      )}
    </div>
  )
}

export default TimeDurationCalculatorTool
