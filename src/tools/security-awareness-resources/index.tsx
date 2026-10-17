import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Form'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import { cn } from '@/lib/utils'
import {
  PHISHING_EXAMPLES,
  RESOURCES,
  TOPICS,
  answeredCount,
  countByTopic,
  filterResources,
  scoreQuiz,
  type Resource,
  type ResourceTopic,
} from './logic'

type Audience = Resource['audience'] | 'all'

const AUDIENCE_LABEL: Record<Resource['audience'], string> = {
  everyone: 'Everyone',
  business: 'Small business',
  technical: 'Technical',
}

export function SecurityAwarenessResourcesTool() {
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState<ResourceTopic | 'all'>('all')
  const [audience, setAudience] = useState<Audience>('all')

  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)

  const counts = useMemo(() => countByTopic(RESOURCES), [])
  const filtered = useMemo(
    () => filterResources(RESOURCES, { query, topic, audience }),
    [query, topic, audience],
  )
  const answered = answeredCount(answers)
  const result = useMemo(() => scoreQuiz(answers), [answers])

  function answer(id: string, isPhishing: boolean) {
    setAnswers((previous) => ({ ...previous, [id]: isPhishing }))
  }

  function resetQuiz() {
    setAnswers({})
    setSubmitted(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="Where to read more"
        description="Every link goes to the publisher's own site. Nothing here is an affiliate link, and no page is re-hosted."
      >
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Search"
            value={query}
            containerClassName="min-w-56 flex-1"
            placeholder="phishing, passwords, OWASP…"
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            label="Audience"
            value={audience}
            containerClassName="min-w-40"
            onChange={(event) => setAudience(event.target.value as Audience)}
          >
            <option value="all">Any audience</option>
            <option value="everyone">Everyone</option>
            <option value="business">Small business</option>
            <option value="technical">Technical</option>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTopic('all')}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              topic === 'all'
                ? 'border-brand bg-brand-soft text-brand'
                : 'border-line text-muted hover:border-brand/50',
            )}
          >
            All · {RESOURCES.length}
          </button>
          {TOPICS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTopic(entry.id)}
              title={entry.description}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                topic === entry.id
                  ? 'border-brand bg-brand-soft text-brand'
                  : 'border-line text-muted hover:border-brand/50',
              )}
            >
              {entry.label} · {counts[entry.id]}
            </button>
          ))}
        </div>
      </ToolPanel>

      {filtered.length === 0 ? (
        <EmptyState
          icon="book-open"
          title="Nothing matches those filters"
          description="Try a broader search, or clear the topic and audience filters."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('')
                setTopic('all')
                setAudience('all')
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((resource) => (
            <li key={resource.url}>
              <a
                href={resource.url}
                target="_blank"
                rel="noreferrer noopener"
                className="flex h-full flex-col gap-2 rounded-2xl border border-line bg-surface-2/30 p-4 transition-colors hover:border-brand/60 hover:bg-surface-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-fg">{resource.title}</h3>
                  <Icon name="external-link" size={14} className="mt-0.5 shrink-0 text-muted" />
                </div>
                <p className="text-xs font-medium text-brand">{resource.publisher}</p>
                <p className="flex-1 text-sm leading-relaxed text-muted">{resource.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="outline">{TOPICS.find((entry) => entry.id === resource.topic)?.label}</Badge>
                  <Badge variant="neutral">{AUDIENCE_LABEL[resource.audience]}</Badge>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}

      <ToolPanel
        title="Spot the phishing"
        description="Six messages. Decide whether each one is genuine or a phishing attempt, then reveal the tells."
        actions={
          answered > 0 ? (
            <Button variant="ghost" size="sm" onClick={resetQuiz}>
              Start again
            </Button>
          ) : undefined
        }
      >
        {submitted && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Correct" value={`${result.correct}/${result.total}`} />
            <StatTile label="Answered" value={answered} hint={`of ${PHISHING_EXAMPLES.length}`} />
            <StatTile
              label="Missed"
              value={result.missed.length}
              hint={result.missed.length === 0 ? 'none' : 'see below'}
            />
            <StatTile label="Verdict" value={<span className="text-sm">{result.verdict}</span>} />
          </div>
        )}

        <ul className="flex flex-col gap-3">
          {PHISHING_EXAMPLES.map((example) => {
            const chosen = answers[example.id]
            const wasRight = chosen !== undefined && chosen === example.isPhishing
            const show = submitted || chosen !== undefined

            return (
              <li key={example.id} className="rounded-2xl border border-line bg-surface-2/30 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{example.channel === 'sms' ? 'SMS' : 'Email'}</Badge>
                  <span className="font-mono text-xs text-muted">{example.from}</span>
                  {chosen !== undefined && (
                    <Badge variant={wasRight ? 'success' : 'danger'}>
                      {wasRight ? 'Correct' : 'Not quite'}
                    </Badge>
                  )}
                </div>

                <p className="mt-2 text-sm font-medium text-fg">{example.subject}</p>
                <p className="mt-1.5 whitespace-pre-line rounded-xl bg-surface px-3 py-2 text-sm leading-relaxed text-muted">
                  {example.body}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={chosen === true ? 'primary' : 'secondary'}
                    onClick={() => answer(example.id, true)}
                  >
                    Phishing
                  </Button>
                  <Button
                    size="sm"
                    variant={chosen === false ? 'primary' : 'secondary'}
                    onClick={() => answer(example.id, false)}
                  >
                    Genuine
                  </Button>
                </div>

                {show && (
                  <div className="mt-3 rounded-xl border border-line bg-surface p-3">
                    <p className="text-sm font-medium text-fg">
                      {example.isPhishing ? 'This one is phishing.' : 'This one is genuine.'}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{example.explanation}</p>
                    {example.signals.length > 0 && (
                      <ul className="mt-2 flex flex-col gap-1">
                        {example.signals.map((signal) => (
                          <li key={signal} className="flex items-start gap-2 text-xs text-muted">
                            <Icon name="circle-x" size={12} className="mt-0.5 shrink-0 text-danger" />
                            {signal}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setSubmitted(true)} disabled={answered === 0}>
            Reveal all explanations
          </Button>
          {!submitted && answered > 0 && (
            <span className="text-xs text-muted">
              {answered} of {PHISHING_EXAMPLES.length} answered — you can reveal the rest at any time.
            </span>
          )}
        </div>
      </ToolPanel>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        These messages are written for training. Any resemblance to a real brand is deliberate — the
        whole point is that a familiar logo is not evidence. If you receive something similar for
        real, report it to the organisation it claims to come from, using a contact route you look
        up yourself.
      </p>
    </div>
  )
}

export default SecurityAwarenessResourcesTool
