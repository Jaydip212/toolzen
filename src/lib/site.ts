/**
 * Single source of truth for site-wide identity.
 *
 * These values are used by the SEO layer, structured data (SEO/AEO/GEO) and
 * `llms.txt`, so keeping them here avoids the name and description drifting
 * between pages.
 */

export const SITE_NAME = 'TOOLZEN'

/** Primary tagline, used in titles and structured data. */
export const SITE_TAGLINE = 'Every Tool. One Place.'

/**
 * One-sentence definition of the entity.
 * Written to be directly quotable by answer engines and AI assistants.
 */
export const SITE_DEFINITION =
  'TOOLZEN is a free online tools platform offering browser-based utilities for documents, images, files, text, developers, security and everyday calculations, with no account required.'

export const SITE_DESCRIPTION =
  'Free online tools to simplify your documents, images, files and everyday digital tasks. No sign-up required.'

/** Canonical production origin, without a trailing slash. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://www.etoolzen.com').replace(
  /\/$/,
  '',
)

/** Build an absolute URL for a path within the site. */
export function absoluteUrl(path = '/'): string {
  const normalised = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${normalised}`
}

/** Default social sharing image (1200x630). */
export const OG_IMAGE_PATH = '/og-image.png'

/** Square brand logo used in structured data. */
export const LOGO_PATH = '/logo.png'
