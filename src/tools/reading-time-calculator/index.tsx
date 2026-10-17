import { useMemo, useState } from 'react'
import { Input, Textarea } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import { SegmentedControl } from '@/tools/shared'
import { CopyButton } from '@/components/ui/CopyButton'
import {
  RATES,
  analyse,
  easeBandFor,
  estimatePages,
  formatDuration,
  speakingTime,
} from './logic'

const SAMPLE = `The old lighthouse had been dark for eleven years, and the village had quietly stopped looking at it.

Nobody could agree on when the light went out. Some said the winter the keeper left; others insisted it was the spring after, when the fog came in and nobody thought to check the lamp. Either way, by the time the coastguard wrote his report, the question had become academic.

What the village did agree on was the sound. On still nights you could hear the mechanism grinding, a low mechanical complaint that carried further than any shout. Children claimed it counted. Adults said it was only rust.`

export function ReadingTimeCalculatorTool() {
  const [text, setText] = useState(SAMPLE)
  const [rateId, setRateId] = useState('silent')
  const [wordsPerPageInput, setWordsPerPageInput] = useState('275')

  const rate = RATES.find((entry) => entry.id === rateId) ?? RATES[0]
  const wordsPerPage = Number(wordsPerPageInput)

  const stats = useMemo(() => {
    try {
      return { error: null, value: analyse(text, rate.wpm) }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'That text could not be measured.', value: null }
    }
  }, [text, rate.wpm, wordsPerPage])

  const pages = useMemo(() => {
    if (!stats.value || stats.value.words === 0) return null
    try {
      return estimatePages(stats.value.words, wordsPerPage)
    } catch {
      return null
    }
  }, [stats.value, wordsPerPage])

  const words = stats.value?.words ?? 0
  const speechSeconds = useMemo(() => speakingTime(words), [words])
  const ease = stats.value?.readingEase ?? null
  const grade = stats.value?.gradeLevel ?? null

  const summary = stats.value
    ? [
        `Words: ${stats.value.words}`,
        `Reading time: ${formatDuration(stats.value.seconds)}`,
        `Speaking time: ${formatDuration(speechSeconds)}`,
        `Sentences: ${stats.value.sentences}`,
        `Reading ease: ${ease ?? '—'}`,
        `Grade level: ${grade ?? '—'}`,
      ].join('\n')
    : ''

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="Paste your text"
        description="Everything is measured in your browser. Nothing is uploaded."
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setText(SAMPLE)}>
              Use a sample
            </Button>
            {text !== '' && (
              <Button variant="ghost" size="sm" onClick={() => setText('')}>
                Clear
              </Button>
            )}
          </>
        }
      >
        <Textarea
          label="Text"
          value={text}
          rows={10}
          spellCheck={false}
          placeholder="Paste an article, a script, an email — anything you want timed."
          onChange={(event) => setText(event.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-muted">
            {words.toLocaleString('en-US')} words · {text.length.toLocaleString('en-US')} characters
          </span>
        </div>
      </ToolPanel>

      {stats.error && <ErrorState title="That text could not be measured" message={stats.error} />}

      <ToolPanel
        title="Reading speed"
        description="Published averages, not a promise about any individual reader."
        actions={<CopyButton value={summary} label="Copy summary" />}
      >
        <SegmentedControl
          label="Reading rate"
          value={rateId}
          onChange={setRateId}
          size="sm"
          options={RATES.map((entry) => ({ value: entry.id, label: entry.label, title: `${entry.wpm} wpm` }))}
        />
        <p className="text-xs text-muted">
          {rate.wpm} words per minute — {rate.note}
        </p>

        {stats.value && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Reading time"
              value={<span className="tabular-nums">{formatDuration(stats.value.seconds)}</span>}
              hint={`${stats.value.minutes.toFixed(2)} minutes exactly`}
            />
            <StatTile
              label="Speaking time"
              value={<span className="tabular-nums">{formatDuration(speechSeconds)}</span>}
              hint="at 150 words per minute"
            />
            <StatTile
              label="Words per minute"
              value={<span className="tabular-nums">{rate.wpm}</span>}
              hint="the rate used above"
            />
            <StatTile
              label="Sentences"
              value={<span className="tabular-nums">{stats.value.sentences.toLocaleString('en-US')}</span>}
              hint={`${stats.value.paragraphs} paragraph${stats.value.paragraphs === 1 ? '' : 's'}`}
            />
          </div>
        )}
      </ToolPanel>

      {stats.value && words > 0 && (
        <ToolPanel
          title="The text itself"
          description="Counts, pages and a readability score — useful for knowing whether to cut it down."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Characters"
              value={<span className="tabular-nums">{stats.value.characters.toLocaleString('en-US')}</span>}
              hint={`${stats.value.charactersNoSpaces.toLocaleString('en-US')} without spaces`}
            />
            <StatTile
              label="Pages"
              value={<span className="tabular-nums">{pages ?? '—'}</span>}
              hint="at the page length below"
            />
            <StatTile
              label="Average sentence"
              value={
                <span className="tabular-nums">
                  {(words / Math.max(stats.value.sentences, 1)).toFixed(1)}
                </span>
              }
              hint="words per sentence"
            />
            <StatTile
              label="Syllables"
              value={<span className="tabular-nums">{stats.value.syllables.toLocaleString('en-US')}</span>}
              hint={`${(stats.value.syllables / Math.max(words, 1)).toFixed(2)} per word`}
            />
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="Words per page"
              type="number"
              inputMode="numeric"
              step="1"
              value={wordsPerPageInput}
              containerClassName="w-40"
              hint="275 is a common single-spaced page."
              onChange={(event) => setWordsPerPageInput(event.target.value)}
            />
          </div>

          {ease !== null && grade !== null && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={ease >= 60 ? 'success' : ease >= 30 ? 'warning' : 'danger'}>
                  Reading ease {ease}
                </Badge>
                <Badge variant="outline">Grade {grade}</Badge>
              </div>
              <p className="text-xs leading-relaxed text-muted">{easeBandFor(ease).label}</p>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-brand"
                  style={{ width: `${Math.min(Math.max(((ease + 10) / 120) * 100, 0), 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted">
                <span>harder</span>
                <span>0</span>
                <span>60</span>
                <span>100 easier</span>
              </div>
            </div>
          )}
        </ToolPanel>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2/30 p-3">
        <p className="text-xs leading-relaxed text-muted">
          <strong className="text-fg">Where the numbers come from.</strong> The 238 words-per-minute silent
          figure is an average from a 2019 meta-analysis of reading research; 183 words per minute is a typical
          adult reading aloud. Real rates vary by a factor of three or more between people and between texts.
        </p>
        <p className="text-xs leading-relaxed text-muted">
          <strong className="text-fg">The readability score is an estimate.</strong> Syllables are counted by a
          vowel-group rule, not a dictionary, so unusual words and names can shift the score a little. Treat it
          as a signal, not a measurement.
        </p>
      </div>
    </div>
  )
}

export default ReadingTimeCalculatorTool
