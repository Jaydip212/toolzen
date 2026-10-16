import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CopyButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { Input, Textarea } from '@/components/ui/Form'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StatTile } from '@/components/tools/StatTile'
import { formatNumber } from '@/lib/utils'
import { analyzeCharacters } from './logic'

export function CharacterCounterTool() {
  const [text, setText] = useState('')
  const [limitInput, setLimitInput] = useState('')

  const stats = useMemo(() => analyzeCharacters(text), [text])
  const limit = Number.parseInt(limitInput, 10)
  const hasLimit = Number.isFinite(limit) && limit > 0
  const overLimit = hasLimit && stats.characters > limit
  const remaining = hasLimit ? limit - stats.characters : 0
  const hasText = text.length > 0

  return (
    <div className="flex flex-col gap-5">
      <Textarea
        label="Your text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Start typing or paste your text here…"
        rows={10}
        spellCheck={false}
      />

      {hasLimit && (
        <div className="flex flex-col gap-2">
          <ProgressBar
            value={Math.min((stats.characters / limit) * 100, 100)}
            tone={overLimit ? 'danger' : 'brand'}
            label="Characters used against the limit"
          />
          <p className={overLimit ? 'text-xs text-danger' : 'text-xs text-muted'}>
            {overLimit
              ? `${formatNumber(Math.abs(remaining))} characters over the limit`
              : `${formatNumber(remaining)} characters remaining`}
          </p>
        </div>
      )}

      <Input
        label="Character limit"
        type="number"
        min={1}
        inputMode="numeric"
        value={limitInput}
        onChange={(event) => setLimitInput(event.target.value)}
        placeholder="e.g. 280"
        hint="Optional. Leave blank for no limit."
        containerClassName="w-44"
      />

      <div className="flex flex-wrap items-center gap-2">
        <CopyButton
          value={[
            `Characters: ${stats.characters}`,
            `Characters (no spaces): ${stats.charactersNoSpaces}`,
            `Letters: ${stats.letters}`,
            `Digits: ${stats.digits}`,
            `Punctuation: ${stats.punctuation}`,
            `Whitespace: ${stats.whitespace}`,
            `Lines: ${stats.lines}`,
          ].join('\n')}
          label="Copy summary"
          disabled={!hasText}
        />
        <Button variant="ghost" onClick={() => setText('')} disabled={!text}>
          <Icon name="trash" size={16} />
          Clear
        </Button>
      </div>

      {hasText ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatTile label="Characters" value={formatNumber(stats.characters)} />
          <StatTile label="No spaces" value={formatNumber(stats.charactersNoSpaces)} />
          <StatTile label="Letters" value={formatNumber(stats.letters)} />
          <StatTile label="Digits" value={formatNumber(stats.digits)} />
          <StatTile label="Punctuation" value={formatNumber(stats.punctuation)} />
          <StatTile label="Whitespace" value={formatNumber(stats.whitespace)} />
          <StatTile label="Lines" value={formatNumber(stats.lines)} />
        </div>
      ) : (
        <EmptyState
          icon="pilcrow"
          title="No text yet"
          description="Type or paste text above to see a full character breakdown. Set a limit to track how much room you have left."
        />
      )}
    </div>
  )
}

export default CharacterCounterTool
