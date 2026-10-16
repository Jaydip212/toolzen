import { useEffect } from 'react'
import { OG_IMAGE_PATH, SITE_NAME, absoluteUrl } from '@/lib/site'

export interface SeoProps {
  /** Page title without the site suffix. */
  title: string
  description?: string
  /** In-app path used to build the canonical URL, e.g. `/tools/word-counter`. */
  path?: string
  /** Set to true for pages that must not be indexed (e.g. 404). */
  noindex?: boolean
  /** Structured data blocks for this page (see `src/lib/schema.ts`). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

const JSON_LD_ID = 'toolzen-page-jsonld'

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

function upsertJsonLd(data: SeoProps['jsonLd']) {
  document.getElementById(JSON_LD_ID)?.remove()
  if (!data) return
  const script = document.createElement('script')
  script.id = JSON_LD_ID
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

/**
 * Declarative document head management for the current route.
 *
 * Emits a unique title, meta description, canonical URL, Open Graph and Twitter
 * tags, and page-level JSON-LD. Site-wide Organization/WebSite schema lives in
 * `index.html` under a different id so it survives route changes.
 */
export function Seo({ title, description, path, noindex = false, jsonLd }: SeoProps) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
    document.title = fullTitle

    const canonical = absoluteUrl(path ?? '/')
    const image = absoluteUrl(OG_IMAGE_PATH)

    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:image', image)
    upsertMeta('property', 'og:image:width', '1200')
    upsertMeta('property', 'og:image:height', '630')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:image', image)
    upsertCanonical(canonical)

    if (description) {
      upsertMeta('name', 'description', description)
      upsertMeta('property', 'og:description', description)
      upsertMeta('name', 'twitter:description', description)
    }

    upsertJsonLd(jsonLd)
  }, [title, description, path, noindex, jsonLd])

  return null
}

export default Seo
