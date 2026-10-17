import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  ApiError,
  MAX_BODY_BYTES,
  byteLength,
  buildHeaders,
  defaultContentType,
  describeStatus,
  formatBody,
  sendRequest,
  toHeaderPairs,
  validateUrl,
  type HeaderPair,
} from './logic'

describe('validateUrl', () => {
  it('rejects an empty value', () => {
    expect(validateUrl('')).toBe('Enter a URL.')
    expect(validateUrl('   ')).toBe('Enter a URL.')
  })

  it('rejects a value that is not a URL', () => {
    expect(validateUrl('not a url')).toMatch(/not a valid URL/)
  })

  it('rejects non-http schemes', () => {
    expect(validateUrl('ftp://example.com')).toMatch(/Only http and https/)
    expect(validateUrl('file:///etc/passwd')).toMatch(/Only http and https/)
  })

  it('accepts http and https URLs', () => {
    expect(validateUrl('https://example.com/api')).toBeNull()
    expect(validateUrl('  http://localhost:3000/x  ')).toBeNull()
  })
})

describe('buildHeaders', () => {
  it('skips disabled rows', () => {
    const pairs: HeaderPair[] = [
      { key: 'Accept', value: 'application/json', enabled: true },
      { key: 'X-Debug', value: '1', enabled: false },
    ]
    expect(buildHeaders(pairs)).toEqual({ Accept: 'application/json' })
  })

  it('skips blank keys but keeps blank values', () => {
    const pairs: HeaderPair[] = [
      { key: '   ', value: 'x', enabled: true },
      { key: 'X-Empty', value: '', enabled: true },
    ]
    expect(buildHeaders(pairs)).toEqual({ 'X-Empty': '' })
  })

  it('trims keys', () => {
    expect(buildHeaders([{ key: '  Accept ', value: 'a', enabled: true }])).toEqual({ Accept: 'a' })
  })
})

describe('toHeaderPairs', () => {
  it('converts a Headers object into sorted rows', () => {
    const headers = new Headers()
    headers.set('X-Zeta', 'z')
    headers.set('Accept', 'application/json')
    const pairs = toHeaderPairs(headers)
    expect(pairs.map((p) => p.key)).toEqual(['accept', 'x-zeta'])
    expect(pairs.every((p) => p.enabled)).toBe(true)
  })
})

describe('defaultContentType', () => {
  it('maps each body type', () => {
    expect(defaultContentType('json')).toBe('application/json')
    expect(defaultContentType('form')).toBe('application/x-www-form-urlencoded')
    expect(defaultContentType('text')).toBe('text/plain')
  })
})

describe('formatBody', () => {
  it('pretty-prints JSON', () => {
    const result = formatBody('{"a":1,"b":[2,3]}')
    expect(result.isJson).toBe(true)
    expect(result.text).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}')
  })

  it('leaves non-JSON untouched and flags it', () => {
    expect(formatBody('hello world')).toEqual({ text: 'hello world', isJson: false })
  })

  it('treats an empty body as non-JSON without changing it', () => {
    expect(formatBody('   ')).toEqual({ text: '   ', isJson: false })
  })
})

describe('byteLength', () => {
  it('counts UTF-8 bytes, not characters', () => {
    expect(byteLength('abc')).toBe(3)
    // "é" is two bytes in UTF-8; the euro sign is three.
    expect(byteLength('é')).toBe(2)
    expect(byteLength('€')).toBe(3)
  })
})

describe('describeStatus', () => {
  it('describes common codes', () => {
    expect(describeStatus(200)).toMatch(/Success/)
    expect(describeStatus(301)).toMatch(/Redirect/)
    expect(describeStatus(404)).toMatch(/Not found/)
    expect(describeStatus(429)).toMatch(/Too many requests/)
    expect(describeStatus(500)).toMatch(/Server error/)
  })

  it('falls back for an unusual code', () => {
    expect(describeStatus(418)).toBe('The server returned this status.')
  })
})

describe('sendRequest', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects an invalid URL before touching the network', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    await expect(
      sendRequest({ method: 'GET', url: 'nope', headers: [], bodyType: 'json', body: '' }),
    ).rejects.toBeInstanceOf(ApiError)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('omits credentials and sends no body for GET', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"ok":true}', {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
      }),
    )

    const result = await sendRequest({
      method: 'GET',
      url: 'https://example.com/api',
      headers: [],
      bodyType: 'json',
      body: '{"ignored":true}',
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [, init] = fetchSpy.mock.calls[0]
    expect(init?.credentials).toBe('omit')
    expect(init?.method).toBe('GET')
    expect(init?.body).toBeUndefined()
    expect(result.status).toBe(200)
    expect(result.ok).toBe(true)
    expect(result.body).toBe('{"ok":true}')
    expect(result.contentType).toBe('application/json')
  })

  it('adds a content type for a body-bearing request when none is set', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 201 }))

    await sendRequest({
      method: 'POST',
      url: 'https://example.com/api',
      headers: [],
      bodyType: 'json',
      body: '{"a":1}',
    })

    const [, init] = fetchSpy.mock.calls[0]
    expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    expect(init?.body).toBe('{"a":1}')
  })

  it('does not override a content type the user set', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }))

    await sendRequest({
      method: 'POST',
      url: 'https://example.com/api',
      headers: [{ key: 'content-type', value: 'application/vnd.custom+json', enabled: true }],
      bodyType: 'json',
      body: '{"a":1}',
    })

    const [, init] = fetchSpy.mock.calls[0]
    const headers = init?.headers as Record<string, string>
    expect(headers['content-type']).toBe('application/vnd.custom+json')
    expect(headers['Content-Type']).toBeUndefined()
  })

  it('explains CORS honestly when fetch rejects', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(
      sendRequest({
        method: 'GET',
        url: 'https://example.com/api',
        headers: [],
        bodyType: 'json',
        body: '',
      }),
    ).rejects.toThrow(/CORS/)
  })

  it('reports a cancellation when the signal aborts', async () => {
    const controller = new AbortController()
    controller.abort()
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('Aborted', 'AbortError'))

    await expect(
      sendRequest(
        { method: 'GET', url: 'https://example.com/api', headers: [], bodyType: 'json', body: '' },
        controller.signal,
      ),
    ).rejects.toThrow(/cancelled/)
  })

  it('truncates an oversized response body', async () => {
    const huge = 'a'.repeat(MAX_BODY_BYTES + 1000)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(huge, { status: 200 }))

    const result = await sendRequest({
      method: 'GET',
      url: 'https://example.com/api',
      headers: [],
      bodyType: 'json',
      body: '',
    })

    expect(result.truncated).toBe(true)
    expect(result.sizeBytes).toBe(MAX_BODY_BYTES + 1000)
    expect(result.body.length).toBe(MAX_BODY_BYTES)
  })
})
