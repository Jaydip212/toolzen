import { useMemo, useState } from 'react'
import { Checkbox, Input, Textarea } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { OutputArea, ToolPanel } from '@/tools/shared'
import { cn, formatNumber } from '@/lib/utils'
import {
  MAX_MATCHES,
  REGEX_CHEATSHEET,
  REGEX_FLAGS,
  highlightMatches,
  normalizeFlags,
  replaceWithRegex,
  testRegex,
} from './logic'

const SAMPLE_PATTERN = '(?<user>[\\w.+-]+)@(?<domain>[\\w-]+\\.[\\w.]+)'
const SAMPLE_TEXT = `Reach us at hello@toolzen.example or support@toolzen.example.
Invalid addresses like not-an-email@ and @example.com should not match.
A third one: jaydip@example.co.uk`

export function RegexTesterTool() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [input, setInput] = useState('')
  const [replacement, setReplacement] = useState('')
  const [showReplace, setShowReplace] = useState(false)

  const result = useMemo(() => testRegex(pattern, flags, input), [pattern, flags, input])
  const segments = useMemo(
    () => highlightMatches(input, result.matches),
    [input, result.matches],
  )
  const replaceResult = useMemo(
    () => (showReplace ? replaceWithRegex(pattern, flags, input, replacement) : null),
    [showReplace, pattern, flags, input, replacement],
  )

  const hasInput = input.length > 0

  function toggleFlag(flag: string, enabled: boolean) {
    const next = enabled
      ? normalizeFlags(flags + flag)
      : normalizeFlags(flags.split('').filter((item) => item !== flag).join(''))
    setFlags(next)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <Input
          label="Regular expression"
          value={pattern}
          containerClassName="min-w-72 flex-1"
          placeholder="e.g. \\b\\w+@\\w+\\.\\w+\\b"
          className="font-mono"
          spellCheck={false}
          onChange={(event) => setPattern(event.target.value)}
        />
        <Button variant="outline" size="sm" onClick={() => { setPattern(SAMPLE_PATTERN); setInput(SAMPLE_TEXT); setFlags('g') }}>
          <Icon name="pilcrow" size={16} />
          Load sample
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setPattern(''); setInput(''); setReplacement('') }}
          disabled={!pattern && !input}
        >
          <Icon name="trash" size={16} />
          Clear
        </Button>
      </div>

      <ToolPanel title="Flags">
        <div className="grid gap-x-6 gap-y-3 rounded-2xl border border-line bg-surface-2/30 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {REGEX_FLAGS.map((item) => (
            <Checkbox
              key={item.flag}
              label={`${item.label} — ${item.description}`}
              checked={flags.includes(item.flag)}
              onChange={(event) => toggleFlag(item.flag, event.target.checked)}
            />
          ))}
        </div>
      </ToolPanel>

      <Textarea
        label="Test text"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Paste the text you want to test the pattern against…"
        rows={8}
        spellCheck={false}
        className="font-mono text-xs"
      />

      {result.error && <ErrorState title="That pattern is not valid" message={result.error} />}

      {pattern !== '' && !result.error && hasInput && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Matches"
              value={formatNumber(result.matches.length)}
              hint={result.truncated ? `capped at ${formatNumber(MAX_MATCHES)}` : undefined}
            />
            <StatTile
              label="Capture groups"
              value={formatNumber(result.matches[0]?.groups.length ?? 0)}
              hint="in the first match"
            />
            <StatTile
              label="Named groups"
              value={formatNumber(Object.keys(result.matches[0]?.namedGroups ?? {}).length)}
              hint="in the first match"
            />
            <StatTile label="Time" value={`${result.durationMs.toFixed(1)} ms`} />
          </div>

          <ToolPanel title="Highlighted matches" description="Where the pattern matched in your text.">
            <div className="tz-scroll max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-surface-2/40 p-3 font-mono text-xs leading-relaxed text-fg">
              {segments.map((segment, index) =>
                segment.matchIndex === null ? (
                  <span key={index}>{segment.text}</span>
                ) : (
                  <mark
                    key={index}
                    className={cn(
                      'rounded px-0.5',
                      segment.matchIndex % 2 === 0
                        ? 'bg-brand/25 text-fg'
                        : 'bg-success/25 text-fg',
                    )}
                  >
                    {segment.text}
                  </mark>
                ),
              )}
            </div>
          </ToolPanel>

          {result.matches.length === 0 ? (
            <p className="flex items-center gap-2 rounded-2xl border border-line bg-surface-2/30 p-4 text-sm text-muted">
              <Icon name="info" size={16} className="shrink-0" />
              The pattern is valid but did not match anything in this text.
            </p>
          ) : (
            <ToolPanel title="Match details" description="Each match with its position and groups.">
              <div className="tz-scroll max-h-96 overflow-auto rounded-xl border border-line">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-surface-2">
                    <tr className="border-b border-line">
                      <th scope="col" className="px-3 py-2 text-left font-medium text-muted">#</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-muted">Index</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-muted">Match</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-muted">Groups</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.matches.map((match, index) => (
                      <tr key={`${match.index}-${index}`} className="border-b border-line last:border-b-0">
                        <td className="px-3 py-2 align-top tabular-nums text-muted">{index + 1}</td>
                        <td className="px-3 py-2 align-top tabular-nums text-muted">{match.index}</td>
                        <td className="px-3 py-2 align-top">
                          <code className="break-all font-mono text-xs text-fg">
                            {match.value === '' ? '(empty match)' : match.value}
                          </code>
                        </td>
                        <td className="px-3 py-2 align-top">
                          {match.groups.length === 0 && !match.namedGroups ? (
                            <span className="text-xs text-muted">—</span>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              {match.groups.map((group, groupIndex) => (
                                <span key={groupIndex} className="text-xs">
                                  <span className="text-muted">${groupIndex + 1}</span>{' '}
                                  <code className="font-mono text-fg">
                                    {group === undefined ? '(no match)' : group}
                                  </code>
                                </span>
                              ))}
                              {match.namedGroups &&
                                Object.entries(match.namedGroups).map(([name, value]) => (
                                  <span key={name} className="text-xs">
                                    <span className="text-muted">{name}</span>{' '}
                                    <code className="font-mono text-fg">
                                      {value === undefined ? '(no match)' : value}
                                    </code>
                                  </span>
                                ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ToolPanel>
          )}

          <ToolPanel
            title="Replace"
            description="Substitute the matches using $1, $2 or $& in the replacement."
            actions={
              <Checkbox
                label="Enable replace"
                checked={showReplace}
                onChange={(event) => setShowReplace(event.target.checked)}
              />
            }
          >
            {showReplace && replaceResult ? (
              <div className="flex flex-col gap-4">
                <Input
                  label="Replacement"
                  value={replacement}
                  placeholder="e.g. [redacted] or $<user>@$<domain>"
                  className="font-mono"
                  spellCheck={false}
                  onChange={(event) => setReplacement(event.target.value)}
                />
                {replaceResult.error && (
                  <ErrorState title="Replacement failed" message={replaceResult.error} />
                )}
                <OutputArea
                  label={`Result — ${formatNumber(replaceResult.count)} replacement${replaceResult.count === 1 ? '' : 's'}`}
                  value={replaceResult.output}
                  filename="regex-replaced.txt"
                  rows={8}
                />
                {!flags.includes('g') && (
                  <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
                    <Icon name="info" size={14} className="mt-0.5 shrink-0" />
                    Only the first match is replaced because the <code>g</code> flag is off.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">
                Turn on “Enable replace” to substitute matches.
              </p>
            )}
          </ToolPanel>
        </>
      )}

      {pattern === '' && (
        <EmptyState
          icon="terminal"
          title="Enter a pattern to begin"
          description="Type a regular expression and some test text. Matches are highlighted as you type, and capture groups are listed individually."
          action={
            <Button
              variant="secondary"
              onClick={() => { setPattern(SAMPLE_PATTERN); setInput(SAMPLE_TEXT); setFlags('g') }}
            >
              Load sample
            </Button>
          }
        />
      )}

      <ToolPanel title="Quick reference" description="The tokens you will reach for most often.">
        <div className="grid gap-x-6 gap-y-2 rounded-2xl border border-line bg-surface-2/30 p-4 sm:grid-cols-2">
          {REGEX_CHEATSHEET.map((part) => (
            <div key={part.token} className="flex items-baseline gap-3 text-sm">
              <code className="shrink-0 rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-fg">
                {part.token}
              </code>
              <span className="text-muted">{part.meaning}</span>
            </div>
          ))}
        </div>
      </ToolPanel>

      {result.truncated && (
        <div className="flex items-start gap-2 text-xs text-muted">
          <Badge variant="warning">Capped</Badge>
          <span>
            Only the first {formatNumber(MAX_MATCHES)} matches are shown, so the page stays
            responsive.
          </span>
        </div>
      )}
    </div>
  )
}

export default RegexTesterTool
