import { describe, expect, it } from 'vitest'
import { parseUrl } from './logic'

describe('parseUrl', () => {
  it('breaks a full URL into its parts', () => {
    const result = parseUrl('https://www.etoolzen.com/tools/merge-pdf?ref=home&page=2#how-to')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const u = result.url
    expect(u.protocol).toBe('https')
    expect(u.hostname).toBe('www.etoolzen.com')
    expect(u.port).toBeNull()
    expect(u.portWasExplicit).toBe(false)
    expect(u.path).toBe('/tools/merge-pdf')
    expect(u.fragment).toBe('how-to')
  })

  it('decodes query parameters, including repeated names', () => {
    const result = parseUrl('https://example.com/search?q=a%20b&q=c&empty=')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.url.params).toEqual([
      { name: 'q', value: 'a b' },
      { name: 'q', value: 'c' },
      { name: 'empty', value: '' },
    ])
  })

  it('distinguishes an explicit port from the scheme default', () => {
    const explicit = parseUrl('https://example.com:8443/x')
    expect(explicit.ok && explicit.url.port === '8443' && explicit.url.portWasExplicit).toBe(true)

    const implicit = parseUrl('https://example.com/x')
    expect(implicit.ok && implicit.url.schemeDefaultPort).toBe(443)
  })

  it('reports http default port 80 and https 443', () => {
    const http = parseUrl('http://example.com/')
    const https = parseUrl('https://example.com/')
    expect(http.ok && http.url.schemeDefaultPort).toBe(80)
    expect(https.ok && https.url.schemeDefaultPort).toBe(443)
  })

  it('rejects a URL with no scheme and says what to add', () => {
    const result = parseUrl('example.com/tools')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('scheme')
    expect(result.error).toContain('https://')
  })

  it('rejects garbage with a friendly message', () => {
    const result = parseUrl('https:// exa mple.com')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('not a valid URL')
  })

  it('rejects empty input', () => {
    expect(parseUrl('   ').ok).toBe(false)
  })

  it('keeps a null query and fragment when absent', () => {
    const result = parseUrl('https://example.com/plain')
    expect(result.ok && result.url.query === null && result.url.fragment === null).toBe(true)
  })
})
