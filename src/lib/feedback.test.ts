import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  FEEDBACK_KINDS,
  secondsUntilNextSubmit,
  submitFeedback,
  validateFeedback,
  validateToolRequest,
} from './feedback'

const CATEGORY_IDS = ['pdf', 'image', 'text', 'developer']

describe('validateFeedback', () => {
  it('accepts a complete message', () => {
    const problems = validateFeedback({
      kind: 'broken',
      message: 'The merge button does nothing when I click it.',
    })
    expect(problems).toEqual([])
  })

  it('requires a known kind and a real message', () => {
    const problems = validateFeedback({ kind: 'nope' as never, message: 'too short' })
    expect(problems.some((problem) => problem.includes('kind'))).toBe(true)
    expect(problems.some((problem) => problem.includes('at least 10'))).toBe(true)
  })

  it('caps runaway messages', () => {
    const problems = validateFeedback({ kind: 'broken', message: 'x'.repeat(2001) })
    expect(problems.some((problem) => problem.includes('under 2000'))).toBe(true)
  })

  it('validates the optional email but allows leaving it out', () => {
    expect(validateFeedback({ kind: 'broken', message: 'x'.repeat(20), email: '' }).length).toBe(0)
    expect(
      validateFeedback({ kind: 'broken', message: 'x'.repeat(20), email: 'not-an-email' }).length,
    ).toBe(1)
    expect(
      validateFeedback({ kind: 'broken', message: 'x'.repeat(20), email: 'a@b.co' }).length,
    ).toBe(0)
  })

  it('knows all four feedback kinds', () => {
    expect(FEEDBACK_KINDS.map((kind) => kind.id)).toEqual([
      'broken',
      'wrong-result',
      'usability',
      'suggestion',
    ])
  })
})

describe('validateToolRequest', () => {
  const good = {
    name: 'HEIC to JPG converter',
    description: 'Convert iPhone HEIC photos to JPG so older software can read them.',
    categoryId: 'image',
  }

  it('accepts a complete request', () => {
    expect(validateToolRequest(good, CATEGORY_IDS)).toEqual([])
  })

  it('rejects unknown categories and thin descriptions', () => {
    const problems = validateToolRequest({ ...good, categoryId: 'quantum', description: 'short' }, CATEGORY_IDS)
    expect(problems.some((problem) => problem.includes('category'))).toBe(true)
    expect(problems.some((problem) => problem.includes('at least 20'))).toBe(true)
  })

  it('enforces the name length bounds', () => {
    expect(validateToolRequest({ ...good, name: 'ab' }, CATEGORY_IDS).length).toBe(1)
    expect(validateToolRequest({ ...good, name: 'x'.repeat(121) }, CATEGORY_IDS).length).toBe(1)
  })
})

describe('secondsUntilNextSubmit', () => {
  it('is zero with no stored timestamp', () => {
    expect(secondsUntilNextSubmit()).toBe(0)
  })
})

describe('submitFeedback', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })

  it('refuses honestly when no endpoint is configured', async () => {
    const outcome = await submitFeedback({ kind: 'broken' })
    expect(outcome).toEqual({ delivered: false, reason: 'unconfigured' })
  })

  it('posts the payload and stamps the throttle when configured', async () => {
    vi.stubEnv('VITE_FEEDBACK_ENDPOINT', 'https://feedback.etoolzen.com/collect')
    vi.resetModules()
    const module = await import('./feedback')
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })))
    vi.stubGlobal('fetch', fetchMock)
    const outcome = await module.submitFeedback({ kind: 'broken', toolId: 'merge-pdf' })
    expect(outcome).toEqual({ delivered: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toEqual({ kind: 'broken', toolId: 'merge-pdf' })
    expect(module.secondsUntilNextSubmit()).toBeGreaterThan(0)
  })

  it('throttles a second immediate submission', async () => {
    vi.stubEnv('VITE_FEEDBACK_ENDPOINT', 'https://feedback.etoolzen.com/collect')
    vi.resetModules()
    const module = await import('./feedback')
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))))
    await module.submitFeedback({ kind: 'broken' })
    const second = await module.submitFeedback({ kind: 'broken' })
    expect(second).toMatchObject({ delivered: false, reason: 'throttled' })
  })

  it('reports failure without throwing when the endpoint errors', async () => {
    vi.stubEnv('VITE_FEEDBACK_ENDPOINT', 'https://feedback.etoolzen.com/collect')
    vi.resetModules()
    const module = await import('./feedback')
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(null, { status: 500 }))))
    const outcome = await module.submitFeedback({ kind: 'broken' })
    expect(outcome).toEqual({ delivered: false, reason: 'failed' })
  })
})
