import { afterEach, describe, expect, it, vi } from 'vitest'
import { analyticsEnabled, trackEvent } from './analytics'

describe('analyticsEnabled', () => {
  it('is off unless an endpoint is configured', () => {
    // The test environment defines no VITE_ANALYTICS_ENDPOINT.
    expect(analyticsEnabled()).toBe(false)
  })
})

describe('trackEvent without configuration', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('never calls fetch', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    trackEvent('tool_open', { toolId: 'merge-pdf' })
    trackEvent('search_performed')
    trackEvent('category_view', { categoryId: 'pdf' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not throw even when fetch itself is unavailable', () => {
    vi.stubGlobal('fetch', undefined)
    expect(() => trackEvent('tool_open')).not.toThrow()
  })
})

describe('trackEvent with an endpoint configured', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  async function loadWithEndpoint(): Promise<typeof import('./analytics')> {
    // The module was already evaluated without an endpoint via the static
    // import, so drop it from the registry before stubbing the environment.
    vi.resetModules()
    vi.stubEnv('VITE_ANALYTICS_ENDPOINT', 'https://stats.etoolzen.com/collect')
    const module = await import('./analytics')
    return module
  }

  it('sends only the event, the path and allow-listed context', async () => {
    const module = await loadWithEndpoint()
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })))
    vi.stubGlobal('fetch', fetchMock)
    module.trackEvent('tool_open', { toolId: 'merge-pdf' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.method).toBe('POST')
    const body = JSON.parse(String(init.body))
    expect(body).toEqual({ event: 'tool_open', path: '/', toolId: 'merge-pdf' })
  })

  it('omits context fields that were not provided', async () => {
    const module = await loadWithEndpoint()
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })))
    vi.stubGlobal('fetch', fetchMock)
    module.trackEvent('search_performed')
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const body = JSON.parse(String(init.body))
    expect(body).toEqual({ event: 'search_performed', path: '/' })
    expect(body.query).toBeUndefined()
  })

  it('swallows a rejected request silently', async () => {
    const module = await loadWithEndpoint()
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    expect(() => module.trackEvent('tool_open')).not.toThrow()
    // Give the rejected promise a tick to settle.
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

  it('swallows a synchronous fetch failure', async () => {
    const module = await loadWithEndpoint()
    vi.stubGlobal('fetch', vi.fn(() => {
      throw new Error('blocked by an extension')
    }))
    expect(() => module.trackEvent('tool_open')).not.toThrow()
  })
})
