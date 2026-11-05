import { useState } from 'react'
import type { FormEvent } from 'react'
import { Seo } from '@/components/seo/Seo'
import { PageShell } from '@/components/layout/PageShell'
import { Input, Select, Textarea } from '@/components/ui/Form'
import { buttonClasses } from '@/components/ui/Button'
import { categories } from '@/data/categories'
import type { ToolCategoryId } from '@/types/tool'
import { submitFeedback, validateToolRequest } from '@/lib/feedback'

/**
 * Tool request page.
 *
 * Anyone can suggest a utility — no account, and an email address is optional.
 * Submission delivery follows the same honest rule as tool feedback: when the
 * deployment has no feedback endpoint configured, the form validates fully and
 * then says plainly that it could not send, instead of faking a confirmation.
 * Requests are suggestions only; nothing is implemented automatically.
 */
export function Suggest() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<ToolCategoryId>(categories[0]!.id)
  const [email, setEmail] = useState('')
  const [problems, setProblems] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'unconfigured' | 'error' | 'throttled'>('idle')
  const [waitSeconds, setWaitSeconds] = useState(0)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const found = validateToolRequest(
      { name, description, categoryId, email: email || undefined },
      categories.map((category) => category.id),
    )
    setProblems(found)
    if (found.length > 0) return

    setStatus('sending')
    const outcome = await submitFeedback({
      kind: 'tool-request',
      name: name.trim(),
      description: description.trim(),
      categoryId,
      ...(email.trim() !== '' ? { email: email.trim() } : {}),
    })
    if (outcome.delivered) {
      setStatus('sent')
      setName('')
      setDescription('')
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
    <>
      <Seo
        title="Suggest a tool — TOOLZEN"
        description="Suggest a utility you want TOOLZEN to build. Free, anonymous if you prefer, and read by a human."
        path="/suggest"
      />

      <PageShell className="max-w-2xl">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Suggest a tool</h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Tell us what TOOLZEN is missing. Requests are read by a human; nothing is implemented
            automatically, and no promise of a date is made. No account needed, and the email
            address is optional.
          </p>
        </header>

        {status === 'sent' ? (
          <div className="mt-8 rounded-2xl border border-line bg-surface-2/50 p-6" role="status">
            <h2 className="text-lg font-semibold tracking-tight">Request received</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your suggestion was delivered. Thanks — this is how the roadmap grows. If you left an
              email, you may hear back; if not, check the All Tools page from time to time.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" noValidate>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              label="Tool name"
              placeholder="e.g. HEIC to JPG converter"
              aria-label="Tool name"
              required
            />

            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              label="What should it do?"
              placeholder="Describe the input, the output, and anything the tool must get right."
              aria-label="Tool description"
              required
            />

            <Select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value as ToolCategoryId)}
              label="Suggested category"
              aria-label="Suggested category"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>

            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              label="Email (optional)"
              hint="Only used if we have a question about your request. Anonymous requests are welcome."
              aria-label="Email address, optional"
            />

            {problems.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-danger" role="alert">
                {problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            )}

            {status === 'unconfigured' && (
              <div className="rounded-xl border border-dashed border-line bg-surface-2/50 p-4 text-sm leading-relaxed text-muted" role="status">
                Your request was validated, but feedback delivery is not configured on this
                deployment yet, so it was <strong className="text-fg">not sent</strong> — this page
                says so rather than showing a fake confirmation.
              </div>
            )}
            {status === 'throttled' && (
              <p className="text-sm text-muted" role="status">
                One submission per minute, please — try again in {waitSeconds}s.
              </p>
            )}
            {status === 'error' && (
              <p className="text-sm text-danger" role="alert">
                The request could not be delivered. Please try again later.
              </p>
            )}

            <div>
              <button type="submit" disabled={status === 'sending'} className={buttonClasses({ variant: 'primary', size: 'md' })}>
                {status === 'sending' ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </form>
        )}
      </PageShell>
    </>
  )
}

export default Suggest
