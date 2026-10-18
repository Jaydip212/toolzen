/**
 * Schema.org builders for TOOLZEN.
 *
 * Three layers of discoverability are served here:
 *  - SEO: Organization / WebSite / BreadcrumbList / SoftwareApplication
 *  - AEO: FAQPage / HowTo / Speakable (direct answers for snippets and voice)
 *  - GEO: consistent entity facts and citable statements for AI assistants
 *
 * Every builder returns a plain object that can be passed to `<Seo jsonLd>`.
 */
import type { FaqEntry, Tool } from '@/types/tool'
import {
  LOGO_PATH,
  SITE_DEFINITION,
  SITE_NAME,
  SITE_TAGLINE,
  absoluteUrl,
} from './site'

export type { FaqEntry }

export interface BreadcrumbEntry {
  name: string
  path: string
}

/** Site-wide publisher identity. */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${absoluteUrl('/')}#organization`,
    name: SITE_NAME,
    alternateName: `${SITE_NAME} — ${SITE_TAGLINE}`,
    url: absoluteUrl('/'),
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(LOGO_PATH),
      width: 512,
      height: 512,
    },
    description: SITE_DEFINITION,
    slogan: SITE_TAGLINE,
    knowsAbout: [
      'online tools',
      'PDF utilities',
      'image conversion',
      'text analysis',
      'developer utilities',
      'cybersecurity tools',
      'file conversion',
      'productivity software',
    ],
  }
}

/** The site itself, with the sitelinks search box action. */
export function webSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${absoluteUrl('/')}#website`,
    name: SITE_NAME,
    alternateName: SITE_TAGLINE,
    url: absoluteUrl('/'),
    description: SITE_DEFINITION,
    inLanguage: 'en',
    publisher: { '@id': `${absoluteUrl('/')}#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${absoluteUrl('/tools')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/** Breadcrumb trail for a page. */
export function breadcrumbSchema(items: BreadcrumbEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

/** Question/answer pairs, eligible for rich results and AI answer boxes. */
export function faqSchema(faqs: FaqEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}

/** Step-by-step instructions, eligible for HowTo rich results. */
export function howToSchema(tool: Tool) {
  const steps = tool.instructions ?? []
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to use ${tool.name}`,
    description: tool.description,
    totalTime: 'PT1M',
    tool: [{ '@type': 'HowToTool', name: SITE_NAME }],
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: `Step ${index + 1}`,
      text: step,
      url: `${absoluteUrl(tool.route)}#how-to-use`,
    })),
  }
}

/** The tool as a free software application. */
export function softwareApplicationSchema(tool: Tool) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    url: absoluteUrl(tool.route),
    applicationCategory: 'UtilitiesApplication',
    applicationSubCategory: 'Online tool',
    operatingSystem: 'Any (web browser)',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    softwareHelp: absoluteUrl(tool.route),
    publisher: { '@id': `${absoluteUrl('/')}#organization` },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    // Honest feature list: processing mode comes straight from the registry.
    featureList:
      tool.processingMode === 'client'
        ? ['Runs entirely in the browser', 'No upload', 'No account required']
        : tool.processingMode === 'ai'
          ? ['AI-generated output', 'Text is sent to an AI provider', 'No account required']
          : ['Server-assisted processing', 'Temporary files deleted after processing', 'No account required'],
  }
}

/**
 * Speakable markup points voice assistants at the passages worth reading
 * aloud. Selectors must exist on the page.
 */
export function speakableSchema(path: string, cssSelectors: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name: SITE_NAME,
    inLanguage: 'en',
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: cssSelectors,
    },
  }
}

/** Convenience: drop empty entries so `jsonLd` never receives null blocks. */
export function compactSchemas(
  schemas: (Record<string, unknown> | null | undefined | false)[],
): Record<string, unknown>[] {
  return schemas.filter(Boolean) as Record<string, unknown>[]
}
