import { useMemo, useState } from 'react'
import { Input, Select } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { CopyButton } from '@/components/ui/CopyButton'
import { ToolPanel } from '@/tools/shared'
import { formatNumber } from '@/lib/utils'
import {
  CRON_PRESETS,
  CRON_TIMEZONES,
  describeCron,
  nextRuns,
  parseCronFields,
  validateCron,
} from './logic'

export function CronExpressionHelperTool() {
  const [expression, setExpression] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [runCount, setRunCount] = useState(5)

  const error = useMemo(() => validateCron(expression, timezone), [expression, timezone])
  const description = useMemo(() => describeCron(expression), [expression])
  const fields = useMemo(() => parseCronFields(expression), [expression])
  const runs = useMemo(
    () => (error ? { runs: [], error } : nextRuns(expression, runCount, new Date(), timezone)),
    [expression, runCount, timezone, error],
  )

  const hasExpression = expression.trim() !== ''

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <Input
          label="Cron expression"
          value={expression}
          containerClassName="min-w-64 flex-1"
          placeholder="*/15 9-17 * * MON-FRI"
          className="font-mono"
          spellCheck={false}
          onChange={(event) => setExpression(event.target.value)}
        />
        <Select
          label="Time zone"
          value={timezone}
          containerClassName="min-w-40"
          onChange={(event) => setTimezone(event.target.value)}
        >
          {CRON_TIMEZONES.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.label}
            </option>
          ))}
        </Select>
      </div>

      <ToolPanel title="Common schedules" description="Click one to try it.">
        <div className="flex flex-wrap gap-2">
          {CRON_PRESETS.map((preset) => (
            <button
              key={preset.expression}
              type="button"
              onClick={() => setExpression(preset.expression)}
              className="flex flex-col items-start gap-1 rounded-xl border border-line bg-surface-2/40 px-3 py-2 text-left transition-colors hover:border-brand/60 hover:bg-surface-2"
            >
              <code className="font-mono text-xs text-fg">{preset.expression}</code>
              <span className="text-xs text-muted">{preset.label}</span>
            </button>
          ))}
        </div>
      </ToolPanel>

      {hasExpression && error && (
        <ErrorState title="That expression is not valid" message={error} />
      )}

      {hasExpression && !error && (
        <>
          <div className="flex flex-col gap-2 rounded-2xl border border-brand/30 bg-brand-soft p-4">
            <span className="text-xs font-medium uppercase tracking-wide text-brand">
              In plain English
            </span>
            <p className="text-base font-medium text-fg">{description.description}</p>
            <p className="text-xs text-muted">
              Times shown in {CRON_TIMEZONES.find((zone) => zone.id === timezone)?.label ?? timezone}
            </p>
          </div>

          <ToolPanel
            title="Field breakdown"
            description={`${fields.length} field${fields.length === 1 ? '' : 's'} — cron reads left to right.`}
          >
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-2/60">
                    <th scope="col" className="px-3 py-2 text-left font-medium text-muted">Field</th>
                    <th scope="col" className="px-3 py-2 text-left font-medium text-muted">Value</th>
                    <th scope="col" className="px-3 py-2 text-left font-medium text-muted">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr key={field.name} className="border-b border-line last:border-b-0">
                      <td className="px-3 py-2 text-muted">{field.name}</td>
                      <td className="px-3 py-2">
                        <code className="font-mono text-xs text-fg">{field.value}</code>
                      </td>
                      <td className="px-3 py-2 text-muted">{field.explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ToolPanel>

          <ToolPanel
            title="Next runs"
            description="The next times this schedule fires, calculated from now."
            actions={
              <div className="flex items-center gap-2">
                <label htmlFor="run-count" className="text-xs text-muted">
                  How many
                </label>
                <input
                  id="run-count"
                  type="number"
                  min={1}
                  max={50}
                  value={runCount}
                  onChange={(event) => setRunCount(Number(event.target.value))}
                  className="h-8 w-16 rounded-lg border border-line bg-surface px-2 text-sm text-fg"
                />
                <CopyButton
                  value={runs.runs
                    .map((run) => `${run.toISOString()}  (${run.toString()})`)
                    .join('\n')}
                  label="Copy all"
                />
              </div>
            }
          >
            {runs.error ? (
              <ErrorState title="Could not calculate the next runs" message={runs.error} />
            ) : (
              <ol className="flex flex-col gap-2">
                {runs.runs.map((run, index) => (
                  <li
                    key={run.toISOString()}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-2/30 px-3 py-2 text-sm"
                  >
                    <Badge variant="neutral">{formatNumber(index + 1)}</Badge>
                    <span className="font-medium text-fg">{run.toString()}</span>
                    <code className="text-xs text-muted">{run.toISOString()}</code>
                  </li>
                ))}
              </ol>
            )}
          </ToolPanel>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
            <Icon name="info" size={14} className="mt-0.5 shrink-0" />
            Cron has no concept of time zones of its own — the scheduler's zone decides when a job
            actually runs. Some schedulers also accept a 6th leading field for seconds, and some
            accept <code>?</code> for “no specific value”; both are handled here.
          </p>
        </>
      )}

      {!hasExpression && (
        <EmptyState
          icon="clock"
          title="Enter a cron expression"
          description="Type a schedule or pick one of the presets above. You will get a plain-English description, a field-by-field breakdown and the next times it fires."
          action={
            <Button variant="secondary" onClick={() => setExpression('0 9 * * MON-FRI')}>
              Try “weekdays at 09:00”
            </Button>
          }
        />
      )}
    </div>
  )
}

export default CronExpressionHelperTool
