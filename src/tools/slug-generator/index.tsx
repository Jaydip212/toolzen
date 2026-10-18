import { useMemo, useState } from 'react'
import { Checkbox, Input, Textarea } from '@/components/ui/Form'
import { CopyButton } from '@/components/ui/CopyButton'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import { slugify, slugStats } from './logic'

const SAMPLE = `10 Tips for Better Sleep
Café Culture: A Guide!
2026 Product Roadmap???`

export function SlugGeneratorTool() {
  const [input, setInput] = useState(SAMPLE)
  const [separator, setSeparator] = useState<'-' | '_' | '.'>('-')
  const [lowercase, setLowercase] = useState(true)
  const [maxLength, setMaxLength] = useState('')

  const cap = maxLength.trim() === '' ? null : Math.max(1, Number(maxLength) || 0)
  const options = { separator, lowercase, maxLength: cap }

  const slug = useMemo(() => slugify(input, options), [input, separator, lowercase, cap])
  const stats = useMemo(() => slugStats(input, options), [input, separator, lowercase, cap])

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel
        title="The text"
        description="Accents are transliterated (é → e). Scripts with no latin alphabet are dropped rather than mangled."
        actions={
          <button
            type="button"
            onClick={() => setInput(SAMPLE)}
            className="text-xs font-medium text-brand transition-colors hover:underline"
          >
            Load sample
          </button>
        }
      >
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={5}
          placeholder="Type a title — or one title per line for a batch…"
          aria-label="Text to slugify"
        />
      </ToolPanel>

      <ToolPanel title="Options">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            value={separator}
            onChange={(event) => setSeparator((event.target.value || '-')[0] as '-' | '_' | '.')}
            maxLength={1}
            aria-label="Word separator"
            label="Separator"
            hint="One character: -, _ or ."
          />
          <Input
            value={maxLength}
            onChange={(event) => setMaxLength(event.target.value.replace(/[^0-9]/g, ''))}
            inputMode="numeric"
            aria-label="Maximum length"
            label="Max length"
            hint="Empty means no limit"
            placeholder="e.g. 60"
          />
          <Checkbox
            checked={lowercase}
            onChange={(event) => setLowercase(event.target.checked)}
            label="Lowercase"
          />
        </div>
      </ToolPanel>

      <ToolPanel
        title="Slug"
        actions={slug !== '' && <CopyButton value={slug} label="Copy slug" size="sm" />}
      >
        {slug !== '' ? (
          <p className="break-all rounded-xl border border-line bg-surface-2/50 p-4 font-mono text-base text-fg">
            {slug}
          </p>
        ) : (
          <p className="rounded-xl border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
            Nothing to slug yet — the input has no latin letters or digits.
          </p>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <StatTile label="Lines with text" value={String(stats.lines)} />
          <StatTile label="Usable slugs" value={String(stats.slugs)} />
        </div>
      </ToolPanel>
    </div>
  )
}

export default SlugGeneratorTool
