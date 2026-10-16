import { useMemo, useState } from 'react'
import { Textarea } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CopyButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { StatTile } from '@/components/tools/StatTile'
import { useToast } from '@/components/ui/Toast'
import { formatNumber } from '@/lib/utils'
import { analyzeText, formatDuration } from './logic'

const SAMPLE = `TOOLZEN brings everyday utilities together in one place. Paste your own text here, or clear this sample and start writing.

Every count updates as you type — nothing is uploaded, and there is no button to press.`

export function WordCounterTool() {
  const [text, setText] = useState('')
  const { toast } = useToast()

  const stats = useMemo(() => analyzeText(text), [text])
  const hasText = text.trim().length > 0

  function loadSample() {
    setText(SAMPLE)
    toast({ title: 'Sample text loaded', variant: 'info' })
  }

  function clear() {
    setText('')
  }

  return (
    <div className="flex flex-col gap-5">
      <Textarea
        label="Your text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Start typing or paste your text here…"
        rows={12}
        spellCheck={false}
        containerClassName="flex-1"
      />

      <div className="flex flex-wrap items-center gap-2">
        <CopyButton
          value={[
            `Words: ${stats.words}`,
            `Characters: ${stats.characters}`,
            `Characters (no spaces): ${stats.charactersNoSpaces}`,
            `Sentences: ${stats.sentences}`,
            `Paragraphs: ${stats.paragraphs}`,
            `Reading time: ${formatDuration(stats.readingMinutes)}`,
          ].join('\n')}
          label="Copy summary"
          disabled={!hasText}
        />
        <Button variant="outline" onClick={loadSample}>
          <Icon name="pilcrow" size={16} />
          Load sample
        </Button>
        <Button variant="ghost" onClick={clear} disabled={!text}>
          <Icon name="trash" size={16} />
          Clear
        </Button>
      </div>

      {hasText ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatTile label="Words" value={formatNumber(stats.words)} />
          <StatTile label="Characters" value={formatNumber(stats.characters)} />
          <StatTile label="No spaces" value={formatNumber(stats.charactersNoSpaces)} />
          <StatTile label="Sentences" value={formatNumber(stats.sentences)} />
          <StatTile label="Paragraphs" value={formatNumber(stats.paragraphs)} />
          <StatTile
            label="Reading time"
            value={formatDuration(stats.readingMinutes)}
            hint="at 200 words / minute"
          />
          <StatTile
            label="Speaking time"
            value={formatDuration(stats.speakingMinutes)}
            hint="at 130 words / minute"
          />
          <StatTile
            label="Avg. word length"
            value={stats.words > 0 ? (stats.charactersNoSpaces / stats.words).toFixed(1) : '0'}
            hint="characters per word"
          />
        </div>
      ) : (
        <EmptyState
          icon="type"
          title="No text yet"
          description="Start typing above, paste your text, or load the sample to see the counts in action."
        />
      )}
    </div>
  )
}

export default WordCounterTool
