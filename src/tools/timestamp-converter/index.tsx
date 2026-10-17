import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Form'
import { ErrorState } from '@/components/ui/ErrorState'
import { CopyButton } from '@/components/ui/CopyButton'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import {
  convertTimestamp,
  formatLocal,
  formatOffset,
  localTimezone,
  nowSnapshot,
  parseDateInput,
  toDatetimeLocal,
} from './logic'

export function TimestampConverterTool() {
  const [input, setInput] = useState('')
  const [now, setNow] = useState(() => new Date())

  // A live clock, so "now" is genuinely now.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const parsed = useMemo(() => parseDateInput(input), [input])

  const conversion = useMemo(() => {
    if (!parsed.date) return null
    try {
      return convertTimestamp(parsed.date.getTime(), 'milliseconds', now)
    } catch {
      return null
    }
  }, [parsed.date, now])

  const snapshot = nowSnapshot(now)

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="Convert a timestamp or date"
        description="Accepts Unix seconds, Unix milliseconds, ISO 8601 and a plain date. The unit is inferred from the magnitude."
      >
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Timestamp or date"
            value={input}
            containerClassName="min-w-72 flex-1"
            placeholder="1700000000, 1700000000000, 2026-10-17T09:00:00Z"
            className="font-mono text-xs"
            spellCheck={false}
            onChange={(event) => setInput(event.target.value)}
          />
          <Button variant="ghost" size="sm" onClick={() => setInput(String(Math.floor(now.getTime() / 1000)))}>
            Use now
          </Button>
          {input !== '' && (
            <Button variant="ghost" size="sm" onClick={() => setInput('')}>
              Clear
            </Button>
          )}
        </div>
      </ToolPanel>

      {parsed.error && <ErrorState title="Could not read that value" message={parsed.error} />}

      {conversion && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Detected as"
              value={<span className="text-base">{parsed.kind === 'unix' ? `Unix ${parsed.unit}` : parsed.kind === 'datetime-local' ? 'local time' : 'ISO 8601'}</span>}
            />
            <StatTile label="Unix seconds" value={<span className="font-mono text-base">{conversion.seconds}</span>} />
            <StatTile label="Unix milliseconds" value={<span className="font-mono text-base">{conversion.milliseconds}</span>} />
            <StatTile label="Relative" value={<span className="text-base">{conversion.relative}</span>} />
          </div>

          <ToolPanel
            title="Every representation"
            description="Copy whichever form the receiving system wants."
            actions={<CopyButton value={conversion.iso} label="Copy ISO" />}
          >
            <ul className="flex flex-col gap-2">
              {[
                { label: 'ISO 8601 (UTC)', value: conversion.iso },
                { label: 'UTC', value: conversion.utc },
                { label: `Local (${conversion.timezone})`, value: conversion.local },
                { label: 'Unix seconds', value: String(conversion.seconds) },
                { label: 'Unix milliseconds', value: String(conversion.milliseconds) },
                { label: 'datetime-local value', value: toDatetimeLocal(new Date(conversion.milliseconds)) },
              ].map((row) => (
                <li
                  key={row.label}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface-2/30 px-3 py-2"
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">{row.label}</span>
                  <div className="flex items-center gap-2">
                    <code className="break-all font-mono text-xs text-fg">{row.value}</code>
                    <CopyButton value={row.value} label="" />
                  </div>
                </li>
              ))}
            </ul>
          </ToolPanel>
        </>
      )}

      <ToolPanel
        title="Right now"
        description="Updates every second, from your device clock."
        actions={<Badge variant="outline">{localTimezone()} · UTC{formatOffset(now)}</Badge>}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Unix seconds" value={<span className="font-mono text-base">{snapshot.seconds}</span>} />
          <StatTile label="Unix milliseconds" value={<span className="font-mono text-base">{snapshot.milliseconds}</span>} />
          <StatTile label="UTC" value={<span className="font-mono text-xs">{snapshot.utc}</span>} />
          <StatTile label="Local" value={<span className="font-mono text-xs">{formatLocal(now)}</span>} />
        </div>
      </ToolPanel>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        Unix time is the number of seconds since 1970-01-01T00:00:00Z, ignoring leap seconds. Values
        from before 1970 are negative. A bare number below 100,000,000,000 is read as seconds — above
        that, as milliseconds — which covers every realistic value of either.
      </p>
    </div>
  )
}

export default TimestampConverterTool
