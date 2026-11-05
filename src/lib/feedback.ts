/**
 * Feedback and tool-request plumbing.
 *
 * Delivery is optional by design: with VITE_FEEDBACK_ENDPOINT configured the
 * payload is POSTed there; without it, submission is refused honestly at the
 * UI level ("delivery not configured") rather than pretending a message was
 * sent. Nothing is stored client-side beyond a throttle timestamp.
 *
 * Privacy: the email field is optional and used only to reply. The payload
 * never includes page contents, file data or anything the visitor did in a
 * tool — only what the visitor typed into the form.
 */

export type FeedbackKind = 'broken' | 'wrong-result' | 'usability' | 'suggestion'

export const FEEDBACK_KINDS: { id: FeedbackKind; label: string }[] = [
  { id: 'broken', label: 'The tool does not work' },
  { id: 'wrong-result', label: 'The result was wrong' },
  { id: 'usability', label: 'Something was confusing' },
  { id: 'suggestion', label: 'I have a suggestion' },
]

export interface FeedbackInput {
  kind: FeedbackKind
  message: string
  toolId?: string
  email?: string
}

export interface ToolRequestInput {
  name: string
  description: string
  categoryId: string
  email?: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MESSAGE_MIN = 10
const MESSAGE_MAX = 2000
const NAME_MIN = 3
const NAME_MAX = 120
const DESCRIPTION_MIN = 20
const DESCRIPTION_MAX = 2000

/** Reasons a feedback message cannot be accepted yet. */
export function validateFeedback(input: FeedbackInput): string[] {
  const problems: string[] = []
  if (!FEEDBACK_KINDS.some((entry) => entry.id === input.kind)) problems.push('Choose what kind of feedback this is.')
  const message = input.message.trim()
  if (message.length < MESSAGE_MIN) problems.push(`Tell us a little more — at least ${MESSAGE_MIN} characters.`)
  if (message.length > MESSAGE_MAX) problems.push(`Keep the message under ${MESSAGE_MAX} characters.`)
  if (input.email !== undefined && input.email.trim() !== '' && !EMAIL.test(input.email.trim())) {
    problems.push('That email address does not look right — leave it empty if you prefer not to share one.')
  }
  return problems
}

/** Reasons a tool request cannot be accepted yet. */
export function validateToolRequest(input: ToolRequestInput, categoryIds: string[]): string[] {
  const problems: string[] = []
  const name = input.name.trim()
  if (name.length < NAME_MIN) problems.push(`Give the tool a name — at least ${NAME_MIN} characters.`)
  if (name.length > NAME_MAX) problems.push(`Keep the name under ${NAME_MAX} characters.`)
  const description = input.description.trim()
  if (description.length < DESCRIPTION_MIN) {
    problems.push(`Describe what it should do — at least ${DESCRIPTION_MIN} characters.`)
  }
  if (description.length > DESCRIPTION_MAX) problems.push(`Keep the description under ${DESCRIPTION_MAX} characters.`)
  if (!categoryIds.includes(input.categoryId)) problems.push('Pick a category for the tool.')
  if (input.email !== undefined && input.email.trim() !== '' && !EMAIL.test(input.email.trim())) {
    problems.push('That email address does not look right — leave it empty if you prefer not to share one.')
  }
  return problems
}

// --- Client-side throttle ---------------------------------------------------
// A courtesy, not security: real rate limiting belongs on the endpoint that
// receives the submissions. This only stops a double-click burst.

const THROTTLE_KEY = 'toolzen:last-feedback'
const THROTTLE_MS = 60_000

export function secondsUntilNextSubmit(now: number = Date.now()): number {
  try {
    const last = Number(window.localStorage.getItem(THROTTLE_KEY) ?? 0)
    const remaining = Math.ceil((last + THROTTLE_MS - now) / 1000)
    return Number.isFinite(remaining) && remaining > 0 ? remaining : 0
  } catch {
    return 0
  }
}

function stampThrottle(now: number): void {
  try {
    window.localStorage.setItem(THROTTLE_KEY, String(now))
  } catch {
    // Storage unavailable — the throttle simply does not persist.
  }
}

export type SubmitOutcome =
  | { delivered: true }
  | { delivered: false; reason: 'unconfigured' }
  | { delivered: false; reason: 'throttled'; waitSeconds: number }
  | { delivered: false; reason: 'failed' }

/**
 * POST a validated payload to the configured endpoint. Never throws.
 * `payload` must already be allow-listed by the caller — the validated form
 * fields and a kind tag, nothing else.
 */
export async function submitFeedback(
  payload: Record<string, unknown>,
  now: number = Date.now(),
): Promise<SubmitOutcome> {
  const endpoint = import.meta.env.VITE_FEEDBACK_ENDPOINT ?? ''
  if (endpoint === '') return { delivered: false, reason: 'unconfigured' }

  const wait = secondsUntilNextSubmit(now)
  if (wait > 0) return { delivered: false, reason: 'throttled', waitSeconds: wait }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) return { delivered: false, reason: 'failed' }
    stampThrottle(now)
    return { delivered: true }
  } catch {
    return { delivered: false, reason: 'failed' }
  }
}
