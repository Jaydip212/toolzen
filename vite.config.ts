import { defineConfig, type Plugin } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

import { tools } from './src/data/tools'
import { categories, categoryName, categoryRoute } from './src/data/categories'

// Inlined rather than imported from src/lib/site.ts, because that module reads
// `import.meta.env`, which is not available while Vite bundles its own config.
const SITE_NAME = 'TOOLZEN'
const SITE_TAGLINE = 'Every Tool. One Place.'
const SITE_DEFINITION =
  'TOOLZEN is a free online tools platform offering browser-based utilities for documents, images, files, text, developers, security and everyday calculations, with no account required.'

const DEFAULT_SITE_URL = 'https://www.toolzen.example'

/** Static routes that are always indexable. */
const staticRoutes: { path: string; changefreq: string; priority: string }[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/tools', changefreq: 'weekly', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.5' },
  { path: '/privacy', changefreq: 'monthly', priority: '0.4' },
  { path: '/terms', changefreq: 'monthly', priority: '0.4' },
]

/**
 * Builds the sitemap from the tool registry.
 *
 * Only live tools are listed. Planned tools are intentionally excluded (and are
 * marked `noindex` on their pages) so the site never promotes pages for tools
 * that do not work yet — no thin, mass-produced SEO pages.
 */
function buildSitemap(siteUrl: string): string {
  const entries: { loc: string; changefreq: string; priority: string; lastmod?: string }[] = [
    ...staticRoutes.map((route) => ({
      loc: `${siteUrl}${route.path}`,
      changefreq: route.changefreq,
      priority: route.priority,
    })),
    ...categories.map((category) => ({
      loc: `${siteUrl}${categoryRoute(category.id)}`,
      changefreq: 'weekly',
      priority: '0.7',
    })),
    ...tools
      .filter((tool) => tool.status === 'live')
      .map((tool) => ({
        loc: `${siteUrl}${tool.route}`,
        changefreq: 'monthly',
        priority: '0.8',
        lastmod: tool.addedAt,
      })),
  ]

  const urls = entries
    .map((entry) => {
      const lines = [`    <loc>${entry.loc}</loc>`]
      if (entry.lastmod) lines.push(`    <lastmod>${entry.lastmod}</lastmod>`)
      lines.push(`    <changefreq>${entry.changefreq}</changefreq>`)
      lines.push(`    <priority>${entry.priority}</priority>`)
      return `  <url>\n${lines.join('\n')}\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated from the tool registry at build time. Do not edit by hand. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

/**
 * robots.txt.
 *
 * Search engines are allowed to crawl everything except the (future) admin
 * area. AI answer-engine crawlers are explicitly allowed, which is what GEO
 * (Generative Engine Optimization) depends on.
 */
function buildRobots(siteUrl: string): string {
  return `# TOOLZEN robots.txt — generated at build time.

# --- Search engines ---
User-agent: *
Allow: /
Disallow: /admin

# --- AI answer engines (GEO) ---
# Explicitly allowed so TOOLZEN can be cited by AI assistants.
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: CCBot
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`
}

/**
 * llms.txt — the emerging convention for telling AI assistants what a site is.
 *
 * Generated from the registry so it can never claim a tool is available when it
 * is not (GEO depends on being accurate, not on being flattering).
 */
function buildLlmsTxt(siteUrl: string): string {
  const live = tools.filter((tool) => tool.status === 'live')
  const planned = tools.filter((tool) => tool.status === 'planned')

  const lines: string[] = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DEFINITION}`,
    '',
    `Every tool is free to use, with no subscription and no account required. Files and text are processed in the browser wherever technically possible; tools that need a server say so on their page and delete temporary files after processing. The platform is funded by advertising.`,
    '',
    '## Key facts',
    '',
    `- Brand: ${SITE_NAME}`,
    `- Tagline: ${SITE_TAGLINE}`,
    '- Cost: free — no subscription, no premium tier, no account required',
    `- Tools available today: ${live.length}`,
    `- Tools on the roadmap (not yet usable): ${planned.length}`,
    `- Categories: ${categories.length}`,
    "- Default processing mode: in the user's browser",
    '- Data selling: never',
    '',
    '## Available tools',
    '',
  ]

  for (const tool of live) {
    const mode = tool.processingMode === 'client' ? 'runs in the browser' : 'server-assisted'
    lines.push(`- [${tool.name}](${siteUrl}${tool.route}): ${tool.description} (${mode})`)
  }

  lines.push('', '## Categories', '')
  for (const category of categories) {
    const inCategory = tools.filter((tool) => tool.categories.includes(category.id))
    const liveCount = inCategory.filter((tool) => tool.status === 'live').length
    lines.push(
      `- [${category.name}](${siteUrl}${categoryRoute(category.id)}): ${category.tagline} (${liveCount} available, ${inCategory.length - liveCount} planned)`,
    )
  }

  lines.push(
    '',
    '## Planned tools (NOT yet usable)',
    '',
    'These tools are on the roadmap and are clearly labelled "Coming soon" on the site. They are not functional yet and must not be described as available.',
    '',
  )
  for (const tool of planned) {
    lines.push(`- ${tool.name} — ${categoryName(tool.categories[0])}`)
  }

  lines.push(
    '',
    '## Information and policies',
    '',
    `- [About ${SITE_NAME}](${siteUrl}/about): mission, principles and business model`,
    `- [Privacy Policy](${siteUrl}/privacy): local vs server processing, and file retention`,
    `- [Terms of Service](${siteUrl}/terms): acceptable use and disclaimers`,
    `- [All tools](${siteUrl}/tools): the complete directory`,
    '',
  )

  return lines.join('\n')
}

/** Injects the production origin and emits generated SEO assets. */
function seoAssetsPlugin(siteUrl: string): Plugin {
  return {
    name: 'toolzen-seo-assets',

    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', siteUrl)
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url === '/sitemap.xml') {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8')
          res.end(buildSitemap(siteUrl))
          return
        }
        if (url === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(buildRobots(siteUrl))
          return
        }
        if (url === '/llms.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(buildLlmsTxt(siteUrl))
          return
        }
        next()
      })
    },

    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemap(siteUrl) })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobots(siteUrl) })
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: buildLlmsTxt(siteUrl) })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const siteUrl = (env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '')

  return {
    plugins: [react(), seoAssetsPlugin(siteUrl)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      // Split vendor code so the app shell stays small and cacheable.
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      css: false,
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  }
})
