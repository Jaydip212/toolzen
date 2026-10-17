import { useMemo, useState } from 'react'
import { Select, Textarea } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatTile } from '@/components/tools/StatTile'
import { OutputArea, SegmentedControl, ToolPanel } from '@/tools/shared'
import { formatNumber } from '@/lib/utils'
import { decodeEntities, encodeEntities, entityStats, type EncodeMode } from './logic'

type Direction = 'encode' | 'decode'

const SAMPLE = `TOOLZEN — free tools for everyone.

"Smart quotes", <angles>, & ampersands, © 2026, ½ of a pie, café, naïve, €25.`

const MODES: { value: EncodeMode; label: string; hint: string }[] = [
  {
    value: 'minimal',
    label: 'Minimal',
    hint: 'Escape only the five characters that must be escaped: & < > " \'.',
  },
  {
    value: 'named',
    label: 'Named entities',
    hint: 'Use a named entity where one exists (© becomes &copy;), and a numeric reference otherwise.',
  },
  {
    value: 'numeric',
    label: 'Numeric (non-ASCII)',
    hint: 'Leave ASCII alone and use numeric references for everything above code point 127.',
  },
  {
    value: 'all',
    label: 'Every character',
    hint: 'Replace every single character with a numeric reference. Useful for obfuscation.',
  },
]

export function HtmlEntityEncoderTool() {
  const [direction, setDirection] = useState<Direction>('encode')
  const [mode, setMode] = useState<EncodeMode>('named')
  const [input, setInput] = useState('')

  const output = useMemo(
    () => (direction === 'encode' ? encodeEntities(input, mode) : decodeEntities(input)),
    [input, direction, mode],
  )

  const stats = useMemo(() => entityStats(output), [output])
  const hasInput = input.length > 0
  const selectedMode = MODES.find((item) => item.value === mode)

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel title="Direction and mode">
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface-2/30 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <SegmentedControl
              label="Direction"
              value={direction}
              onChange={setDirection}
              options={[
                { value: 'encode', label: 'Encode', title: 'Turn characters into HTML entities.' },
                { value: 'decode', label: 'Decode', title: 'Turn HTML entities back into characters.' },
              ]}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setInput(SAMPLE)}>
                <Icon name="pilcrow" size={16} />
                Load sample
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setInput('')} disabled={!input}>
                <Icon name="trash" size={16} />
                Clear
              </Button>
            </div>
          </div>

          {direction === 'encode' && (
            <Select
              label="Encoding mode"
              value={mode}
              containerClassName="max-w-md"
              hint={selectedMode?.hint}
              onChange={(event) => setMode(event.target.value as EncodeMode)}
            >
              {MODES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          )}

          {direction === 'decode' && (
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" />
              Named entities and numeric references such as <code>&amp;#169;</code> and{' '}
              <code>&amp;#xA9;</code> are both decoded. Anything that is not a recognised entity is
              left exactly as written, so nothing is silently dropped.
            </p>
          )}
        </div>
      </ToolPanel>

      <Textarea
        label={direction === 'encode' ? 'Text to encode' : 'Entities to decode'}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={
          direction === 'encode'
            ? 'Paste the text you want to escape…'
            : 'Paste text containing HTML entities, for example &amp;lt;div&amp;gt;…'
        }
        rows={8}
        spellCheck={false}
        className="font-mono text-xs"
      />

      {hasInput ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Characters" value={formatNumber(stats.characters)} />
            <StatTile label="Entities found" value={formatNumber(stats.entities)} />
            <StatTile label="Distinct entities" value={formatNumber(stats.distinctEntities)} />
            <StatTile label="Non-ASCII" value={formatNumber(stats.nonAscii)} />
          </div>

          <OutputArea
            label={direction === 'encode' ? 'Encoded HTML' : 'Decoded text'}
            value={output}
            filename={direction === 'encode' ? 'encoded.txt' : 'decoded.txt'}
            rows={8}
          />
        </>
      ) : (
        <EmptyState
          icon="code"
          title="Nothing to convert yet"
          description="Paste some text above, or load the sample to see how each encoding mode behaves."
          action={
            <Button variant="secondary" onClick={() => setInput(SAMPLE)}>
              Load sample
            </Button>
          }
        />
      )}
    </div>
  )
}

export default HtmlEntityEncoderTool
