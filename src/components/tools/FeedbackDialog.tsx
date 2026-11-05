import { useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Input, Select, Textarea } from '@/components/ui/Form'
import { buttonClasses } from '@/components/ui/Button'
import {
  FEEDBACK_KINDS,
  submitFeedback,
  validateFeedback,
  type FeedbackKind,
} from '@/lib/feedback'

/**
 * Lightweight feedback panel on a tool page.
 *
 * Validation is real; delivery depends on deployment configuration, and the
 * states are honest about that. Nothing is stored beyond the throttle stamp,
 * and the only fields that leave the browser are the ones the visitor typed.
 */
export function FeedbackDialog({ toolId, toolName }: { toolId: string; toolName: string }) {
  const [kind, setKind] = useState<FeedbackKind>('broken')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [problems, setProblems] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'unconfigured' | 'error' | 'throttled'>('idle')
  const [waitSeconds, setWaitSeconds] = useState(0)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const found = validateFeedback({ kind, message, email: email || undefined })
    setProblems(found)
    if (found.length > 0) return

    setStatus('sending')
    const outcome = await submitFeedback({
      kind: 'tool-feedback',
      feedbackKind: kind,
      toolId,
      message: message.trim(),
      ...(email.trim() !== '' ? { email: email.trim() } : {}),
    })
    if (outcome.delivered) {
      setStatus('sent')
      setMessage('')
      setEmail('')
    } else if (outcome.reason === 'unconfigured') {
      setStatus('unconfigured')
    } else if (outcome.reason === 'throttled') {
      setWaitSeconds(outcome.waitSeconds)
      setStatus('throttled')
    } else {
      setStatus('error')
    }
  }

  return (
    <details className="tz-card group px-5 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-fg">
        Something wrong with this tool?
        <Icon
          name="chevron-down"
          size={17}
          className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
        />
      </summary>

      {status === 'sent' ? (
        <p className="mt-4 text-sm leading-relaxed text-fg" role="status">
          Thanks — the report was sent. There is no reply unless you left an email, but every
          report is read.
        </p>
      ) : status === 'unconfigured' ? (
        <div className="mt-4 text-sm leading-relaxed text-muted" role="status">
          <p>
            Feedback delivery is not configured on this deployment yet, so the report was{' '}
            <strong className="text-fg">not sent</strong> — the form stays honest rather than
            pretending.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3" noValidate>
          <Select
            value={kind}
            onChange={(event) => setKind(event.target.value as FeedbackKind)}
            aria-label="What kind of feedback?"
            label="What is it about?"
          >
            {FEEDBACK_KINDS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </Select>

          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            label={`What happened with ${toolName}?`}
            placeholder="Describe what you did and what went wrong. Do not paste confidential documents."
            aria-label="Feedback message"
          />

          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            label="Email (optional)"
            hint="Only used to reply. Leave it empty to report anonymously."
            aria-label="Email address, optional"
          />

          {problems.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-danger" role="alert">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}

          {status === 'throttled' && (
            <p className="text-sm text-muted" role="status">
              One submission per minute, please — try again in {waitSeconds}s.
            </p>
          )}
          {status === 'error' && (
            <p className="text-sm text-danger" role="alert">
              The report could not be delivered. This failure is shown, never hidden — please try
              again later.
            </p>
          )}

          <div>
            <button type="submit" disabled={status === 'sending'} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
              {status === 'sending' ? 'Sending…' : 'Send feedback'}
            </button>
          </div>
        </form>
      )}
    </details>
  )
}

export default FeedbackDialog
