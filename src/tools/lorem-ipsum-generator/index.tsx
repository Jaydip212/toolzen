import { useMemo, useState } from 'react'
import { Checkbox, Input, Select } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { StatTile } from '@/components/tools/StatTile'
import { OutputArea, ToolPanel } from '@/tools/shared'
import { formatNumber } from '@/lib/utils'
import {
  DEFAULT_LOREM_OPTIONS,
  clampCount,
  generateLorem,
  loremStats,
  type LoremLength,
  type LoremOptions,
  type LoremUnit,
} from './logic'

export function LoremIpsumGeneratorTool() {
  const [options, setOptions] = useState<LoremOptions>(DEFAULT_LOREM_OPTIONS)
  // Bumping this re-runs the generator, so "Generate again" gives new text.
  const [seed, setSeed] = useState(0)

  const text = useMemo(() => {
    void seed
    return generateLorem(options)
  }, [options, seed])

  const stats = useMemo(() => loremStats(text), [text])

  function update<K extends keyof LoremOptions>(key: K, value: LoremOptions[K]) {
    setOptions((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel title="What to generate">
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface-2/30 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Unit"
              value={options.unit}
              onChange={(event) => update('unit', event.target.value as LoremUnit)}
            >
              <option value="paragraphs">Paragraphs</option>
              <option value="sentences">Sentences</option>
              <option value="words">Words</option>
            </Select>
            <Input
              label="How many"
              type="number"
              min={1}
              max={options.unit === 'words' ? 1000 : options.unit === 'sentences' ? 200 : 50}
              value={options.count}
              hint={`1–${options.unit === 'words' ? 1000 : options.unit === 'sentences' ? 200 : 50}`}
              onChange={(event) => update('count', Number(event.target.value))}
              onBlur={() => update('count', clampCount(options.count, options.unit))}
            />
            <Select
              label="Sentence length"
              value={options.length}
              disabled={options.unit === 'words'}
              hint={options.unit === 'words' ? 'Not used for single words.' : undefined}
              onChange={(event) => update('length', event.target.value as LoremLength)}
            >
              <option value="short">Short (4–8 words)</option>
              <option value="medium">Medium (8–16 words)</option>
              <option value="long">Long (16–28 words)</option>
            </Select>
          </div>

          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Checkbox
              label="Start with “Lorem ipsum dolor sit amet…”"
              hint="Use the canonical opening rather than random words."
              checked={options.startWithLorem}
              onChange={(event) => update('startWithLorem', event.target.checked)}
            />
            <Checkbox
              label="Wrap paragraphs in <p> tags"
              hint="Output ready to paste into HTML."
              checked={options.htmlParagraphs}
              disabled={options.unit !== 'paragraphs'}
              onChange={(event) => update('htmlParagraphs', event.target.checked)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setSeed((value) => value + 1)}>
              <Icon name="refresh" size={16} />
              Generate again
            </Button>
            <Button
              variant="ghost"
              onClick={() => setOptions(DEFAULT_LOREM_OPTIONS)}
              disabled={JSON.stringify(options) === JSON.stringify(DEFAULT_LOREM_OPTIONS)}
            >
              Reset options
            </Button>
          </div>
        </div>
      </ToolPanel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Paragraphs" value={formatNumber(stats.paragraphs)} />
        <StatTile label="Sentences" value={formatNumber(stats.sentences)} />
        <StatTile label="Words" value={formatNumber(stats.words)} />
        <StatTile label="Characters" value={formatNumber(stats.characters)} />
      </div>

      <OutputArea
        label="Generated text"
        value={text}
        filename={options.htmlParagraphs ? 'lorem.html' : 'lorem.txt'}
        mimeType={options.htmlParagraphs ? 'text/html;charset=utf-8' : undefined}
        rows={14}
      />

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        Lorem ipsum is scrambled Latin filler text. It carries no meaning, which is exactly why it
        is used for layout — readers focus on the design rather than the words.
      </p>
    </div>
  )
}

export default LoremIpsumGeneratorTool
