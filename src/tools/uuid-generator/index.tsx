import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { Checkbox, Input } from '@/components/ui/Form'
import { ErrorState } from '@/components/ui/ErrorState'
import { CopyButton } from '@/components/ui/CopyButton'
import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton, ToolPanel } from '@/tools/shared'
import {
  NIL_UUID,
  collisionNote,
  describeVersion,
  formatUuid,
  generateBatch,
  parseUuid,
} from './logic'

export function UuidGeneratorTool() {
  const [count, setCount] = useState(5)
  const [uppercase, setUppercase] = useState(false)
  const [braces, setBraces] = useState(false)
  const [hyphens, setHyphens] = useState(true)
  const [seed, setSeed] = useState(0)
  const [inspect, setInspect] = useState('')

  const options = { uppercase, braces, hyphens }

  const values = useMemo(
    () => generateBatch(count, options),
    // `seed` is the regenerate trigger; the options are the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, uppercase, braces, hyphens, seed],
  )

  const parsed = useMemo(() => (inspect.trim() === '' ? null : parseUuid(inspect)), [inspect])

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="Generate UUIDs"
        description="Version 4, from crypto.getRandomValues. Nothing leaves the page."
        actions={
          <Button size="sm" onClick={() => setSeed((value) => value + 1)}>
            <Icon name="refresh" size={16} />
            Generate again
          </Button>
        }
      >
        <div className="flex flex-wrap items-end gap-4">
          <Input
            label="How many"
            type="number"
            min={1}
            max={1000}
            value={count}
            containerClassName="w-32"
            onChange={(event) => setCount(Math.max(1, Math.min(1000, Number(event.target.value) || 1)))}
          />
          <Checkbox label="Uppercase" checked={uppercase} onChange={(event) => setUppercase(event.target.checked)} />
          <Checkbox label="Wrap in braces" checked={braces} onChange={(event) => setBraces(event.target.checked)} />
          <Checkbox label="Keep hyphens" checked={hyphens} onChange={(event) => setHyphens(event.target.checked)} />
        </div>
      </ToolPanel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Generated" value={values.length} />
        <StatTile label="Version" value="4" hint="random" />
        <StatTile label="Random bits" value="122" />
        <StatTile label="Format" value={<span className="text-base">{hyphens ? '8-4-4-4-12' : '32 hex'}</span>} />
      </div>

      <ToolPanel
        title="Result"
        description="Click any value to copy it."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton value={values.join('\n')} label="Copy all" />
            <DownloadButton filename="uuids.txt" text={values.join('\n')} mimeType="text/plain" label="Download" />
          </div>
        }
      >
        <ul className="flex flex-col gap-1.5">
          {values.map((value, index) => (
            <li
              key={`${value}:${index}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-2/30 px-3 py-1.5"
            >
              <code className="select-all break-all font-mono text-xs text-fg">{value}</code>
              <CopyButton value={value} label="" />
            </li>
          ))}
        </ul>
      </ToolPanel>

      <ToolPanel
        title="Inspect a UUID"
        description="Paste one to check its shape, version and variant."
      >
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="UUID"
            value={inspect}
            containerClassName="min-w-72 flex-1"
            placeholder="3f2504e0-4f89-41d3-9a0c-0305e82c3301"
            className="font-mono text-xs"
            spellCheck={false}
            onChange={(event) => setInspect(event.target.value)}
          />
          <Button variant="ghost" size="sm" onClick={() => setInspect(NIL_UUID)}>
            Try the nil UUID
          </Button>
        </div>

        {parsed?.error && <ErrorState title="That is not a UUID" message={parsed.error} />}

        {parsed?.valid && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Version" value={parsed.version ?? '—'} />
              <StatTile label="Variant" value={<span className="text-base">{parsed.variant}</span>} />
              <StatTile label="Nil" value={parsed.isNil ? 'Yes' : 'No'} />
              <StatTile label="Max" value={parsed.isMax ? 'Yes' : 'No'} />
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2/30 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="brand">normalised</Badge>
                <code className="break-all font-mono text-xs text-fg">{parsed.normalized}</code>
                <CopyButton value={parsed.normalized} label="" />
              </div>
              <p className="text-sm leading-relaxed text-muted">{describeVersion(parsed.version)}</p>
            </div>
          </>
        )}
      </ToolPanel>

      <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface-2/40 p-4 text-xs leading-relaxed text-muted">
        <Icon name="info" size={16} className="mt-0.5 shrink-0" />
        <p>{collisionNote()}</p>
      </div>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        The all-zero UUID is a real, reserved value meaning “no UUID”, not a valid identifier. It is
        accepted here so you can recognise it.{' '}
        <Badge variant="outline">{formatUuid('3f2504e0-4f89-41d3-9a0c-0305e82c3301', options)}</Badge>
      </p>
    </div>
  )
}

export default UuidGeneratorTool
