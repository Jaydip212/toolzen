import { useState } from 'react'
import { Input, Select } from '@/components/ui/Form'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import { COMMON_TIME_ZONES, convertTimeZone } from '@/lib/phase7/time-zones'

export function TimeZoneConverter() {
  const [local, setLocal] = useState('2026-07-15T12:00')
  const [fromZone, setFromZone] = useState('Asia/Kolkata')
  const [toZone, setToZone] = useState('America/New_York')

  const result = convertTimeZone({ local, fromZone, toZone })

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="When and where" description="Daylight saving is handled by your browser's time-zone database, not a fixed offset table.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input type="datetime-local" value={local} onChange={(event) => setLocal(event.target.value)} label="Local date and time" aria-label="Local date and time" />
          <Select value={fromZone} onChange={(event) => setFromZone(event.target.value)} label="From zone" aria-label="Source time zone">
            {COMMON_TIME_ZONES.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
          </Select>
          <Select value={toZone} onChange={(event) => setToZone(event.target.value)} label="To zone" aria-label="Target time zone">
            {COMMON_TIME_ZONES.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
          </Select>
        </div>
      </ToolPanel>

      {!result.ok ? (
        <ErrorState title="Cannot convert that time" message={result.error} />
      ) : (
        <ToolPanel title="Result">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile label={`In ${toZone}`} value={result.result.local} />
            <StatTile label="UTC instant" value={result.result.instant.replace('T', ' ').replace('.000Z', ' UTC')} />
            <StatTile label={`${fromZone} offset`} value={result.result.fromOffset} />
            <StatTile label={`${toZone} offset`} value={result.result.toOffset} />
          </div>
          {result.result.dstAdjusted && (
            <p className="mt-4 text-sm text-muted" role="status">
              That wall-clock time does not exist in {fromZone} because of a daylight-saving jump;
              the conversion used the instant the browser resolved.
            </p>
          )}
        </ToolPanel>
      )}
    </div>
  )
}

export default TimeZoneConverter
