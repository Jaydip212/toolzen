/**
 * The browser half of the AI tools.
 *
 * The browser never holds a provider key. It sends a task name and an input to
 * TOOLZEN's own endpoint, which holds the key and talks to the provider. That
 * is the one place on the platform where text leaves the device, so every
 * failure here is reported as a sentence rather than a silent empty result.
 */

import { requestError, taskById, type AiTaskId } from './ai-tasks'

/** A failure with a code the UI can branch on. */
export class AiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'AiError'
    this.code = code
  }
}

export interface AiStatus {
  configured: boolean
  model: string | null
}

/**
 * Whether the deployment has a key.
 *
 * A network failure is treated as "not configured" rather than thrown, because
 * from the visitor's side the two are the same: the tool cannot run, and it
 * must say so instead of offering a button that does nothing.
 */
export async function probeAi(signal?: AbortSignal): Promise<AiStatus> {
  try {
    const response = await fetch('/api/ai', { method: 'GET', signal, headers: { Accept: 'application/json' } })
    if (!response.ok) return { configured: false, model: null }
    const body = (await response.json()) as { configured?: unknown; model?: unknown }
    return {
      configured: body.configured === true,
      model: typeof body.model === 'string' ? body.model : null,
    }
  } catch {
    return { configured: false, model: null }
  }
}

/** Run one task and return its text. Throws AiError with a readable message. */
export async function runAiTask(
  taskId: AiTaskId,
  input: string,
  options: Record<string, string>,
  question = '',
  signal?: AbortSignal,
): Promise<string> {
  const task = taskById(taskId)
  if (!task) throw new AiError('unknown_task', 'That task is not available.')

  // Checked here as well as on the server, so an over-long paste is caught
  // before it is uploaded.
  const problem = requestError(task, input, question)
  if (problem) throw new AiError('bad_request', problem)

  let response: Response
  try {
    response = await fetch('/api/ai', {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ task: taskId, input, options, question }),
    })
  } catch (cause) {
    if (cause instanceof Error && cause.name === 'AbortError') {
      throw new AiError('cancelled', 'The request was cancelled.')
    }
    throw new AiError('network_error', 'The request could not be sent. Check your connection and try again.')
  }

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    // A non-JSON reply means the endpoint was not reached at all — a static
    // host without the function, for instance.
    body = null
  }

  if (!response.ok) {
    const record = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
    const message =
      typeof record.message === 'string' && record.message !== ''
        ? record.message
        : 'The AI request failed. Nothing was produced.'
    const code = typeof record.error === 'string' ? record.error : 'request_failed'
    throw new AiError(code, message)
  }

  const text = typeof body === 'object' && body !== null ? (body as { text?: unknown }).text : undefined
  if (typeof text !== 'string' || text.trim() === '') {
    throw new AiError('empty_reply', 'The AI returned nothing. Try again, or shorten the input.')
  }
  return text
}
