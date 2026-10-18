/**
 * The AI endpoint.
 *
 * This is the only part of TOOLZEN that runs on a server, and it exists for
 * one reason: the provider key must never reach a browser. Everything else
 * about the platform stays client-side.
 *
 * What it deliberately does not do:
 *
 *  - It does not accept a system message or a prompt from the client. The
 *    client names a task; the prompts live in `src/lib/ai-tasks.ts`. Without
 *    that rule, anyone could use TOOLZEN's key as a free general-purpose
 *    language-model proxy.
 *  - It does not echo the key, log it, or include it in an error.
 *  - It does not answer when it has not been configured. It says so, and the
 *    browser shows that sentence rather than a fabricated result.
 *
 * Configuration (server-side only, never VITE_-prefixed):
 *
 *   AI_PROVIDER_API_KEY   required — the provider's secret key
 *   AI_PROVIDER_BASE_URL  optional — defaults to https://api.openai.com/v1
 *   AI_PROVIDER_MODEL     optional — defaults to gpt-4o-mini
 *   AI_ALLOWED_ORIGIN     optional — if set, only this origin may call it
 */

import { requestError, resolveOptions, taskById } from '../src/lib/ai-tasks'

/** The request shape Vercel hands a Node function. */
interface ApiRequest {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
  socket?: { remoteAddress?: string }
}

/** The response shape Vercel hands a Node function. */
interface ApiResponse {
  status(code: number): ApiResponse
  json(body: unknown): void
  setHeader(name: string, value: string): void
  end(): void
}

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'

/** How long to wait for the provider before giving up. */
const PROVIDER_TIMEOUT_MS = 30_000

/** Requests allowed per address in the window below. */
const RATE_LIMIT = 12
const RATE_WINDOW_MS = 10 * 60 * 1000

/**
 * A best-effort rate limiter.
 *
 * Serverless instances are short-lived and not shared, so this cannot be a
 * guarantee — it stops a single client hammering one warm instance, which is
 * the realistic abuse case. A deployment that needs a hard guarantee should
 * put a real limiter in front of this function.
 */
const seen = new Map<string, number[]>()

function rateLimited(address: string, now: number): boolean {
  const recent = (seen.get(address) ?? []).filter((time) => now - time < RATE_WINDOW_MS)
  recent.push(now)
  seen.set(address, recent)

  // Keep the map from growing without bound on a long-lived instance.
  if (seen.size > 5_000) {
    for (const [key, times] of seen) {
      if (times.every((time) => now - time >= RATE_WINDOW_MS)) seen.delete(key)
    }
  }
  return recent.length > RATE_LIMIT
}

function clientAddress(req: ApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded
  if (typeof first === 'string' && first !== '') return first.split(',')[0].trim()
  return req.socket?.remoteAddress ?? 'unknown'
}

function configuration() {
  const key = process.env.AI_PROVIDER_API_KEY?.trim() ?? ''
  const baseUrl = (process.env.AI_PROVIDER_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, '')
  const model = process.env.AI_PROVIDER_MODEL?.trim() || DEFAULT_MODEL
  return { key, baseUrl, model, configured: key !== '' }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  const { key, baseUrl, model, configured } = configuration()

  // A health check the browser uses to decide whether to show the form or an
  // explanation. It never reveals whether a key exists beyond a boolean.
  if (req.method === 'GET') {
    res.status(200).json({ configured, model: configured ? model : null })
    return
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    res.status(405).json({ error: 'method_not_allowed', message: 'Use POST to run a task.' })
    return
  }

  if (!configured) {
    res.status(503).json({
      error: 'not_configured',
      message:
        'The AI backend has not been configured on this deployment. No API key is set, so nothing was sent to any provider. The site owner needs to set AI_PROVIDER_API_KEY in the hosting environment.',
    })
    return
  }

  const allowedOrigin = process.env.AI_ALLOWED_ORIGIN?.trim()
  if (allowedOrigin) {
    const origin = req.headers.origin
    const value = Array.isArray(origin) ? origin[0] : origin
    if (value !== allowedOrigin) {
      res.status(403).json({ error: 'forbidden_origin', message: 'This endpoint only accepts requests from the TOOLZEN site.' })
      return
    }
  }

  if (rateLimited(clientAddress(req), Date.now())) {
    res.status(429).json({
      error: 'rate_limited',
      message: 'That is a lot of requests in a short time. Wait a few minutes and try again.',
    })
    return
  }

  const body = req.body
  if (typeof body !== 'object' || body === null) {
    res.status(400).json({ error: 'bad_request', message: 'The request body must be JSON.' })
    return
  }

  const { task: taskId, input, question, options } = body as {
    task?: unknown
    input?: unknown
    question?: unknown
    options?: unknown
  }

  if (typeof taskId !== 'string') {
    res.status(400).json({ error: 'bad_request', message: 'A task id is required.' })
    return
  }

  const task = taskById(taskId)
  if (!task) {
    res.status(400).json({ error: 'unknown_task', message: 'That is not a task this endpoint offers.' })
    return
  }

  if (typeof input !== 'string') {
    res.status(400).json({ error: 'bad_request', message: 'The input must be a string.' })
    return
  }

  const asked = typeof question === 'string' ? question : ''
  const problem = requestError(task, input, asked)
  if (problem) {
    res.status(400).json({ error: 'bad_request', message: problem })
    return
  }

  // Only values the task itself offers survive, so an option cannot smuggle
  // an instruction into the prompt.
  const chosen = resolveOptions(task, typeof options === 'object' && options !== null ? (options as Record<string, unknown>) : {})

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: task.system },
          { role: 'user', content: task.prompt(input, chosen, asked) },
        ],
        max_tokens: task.maxOutput,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      // The provider's own message can contain the key in rare cases, so only
      // its status and a short, known-safe description are passed on.
      const detail = response.status === 401 || response.status === 403 ? 'the provider rejected the API key' : 'the provider refused the request'
      res.status(502).json({
        error: 'provider_error',
        message: `The AI provider returned ${response.status}: ${detail}. Nothing was charged to you, and no result was produced.`,
      })
      return
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const text = payload.choices?.[0]?.message?.content?.trim() ?? ''

    if (text === '') {
      res.status(502).json({
        error: 'empty_reply',
        message: 'The AI provider returned an empty reply. Try again, or shorten the input.',
      })
      return
    }

    res.status(200).json({ text, model })
  } catch (cause) {
    const aborted = cause instanceof Error && cause.name === 'AbortError'
    res.status(504).json({
      error: aborted ? 'timeout' : 'network_error',
      message: aborted
        ? 'The AI provider took too long to answer. Try a shorter input.'
        : 'The AI provider could not be reached. Check the deployment’s network access and try again.',
    })
  } finally {
    clearTimeout(timer)
  }
}
