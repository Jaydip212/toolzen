import { Suspense } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getTool, relatedTools } from '@/data/registry'
import { categoryName, categoryRoute } from '@/data/categories'
import { getToolComponent } from '@/tools/ToolRenderer'
import {
  breadcrumbSchema,
  compactSchemas,
  faqSchema,
  howToSchema,
  softwareApplicationSchema,
  speakableSchema,
} from '@/lib/schema'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { AdSlot } from '@/components/ads/AdSlot'
import { Seo } from '@/components/seo/Seo'
import { ToolCard } from '@/components/tools/ToolCard'
import { PageShell } from '@/components/layout/PageShell'
import { NotFound } from './NotFound'

/** Placeholder shown while a tool's code chunk is downloading. */
function ToolWorkspaceFallback() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading tool…</span>
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-56 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  )
}

/** Detail row used in the tool information table. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-40 shrink-0 text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="text-sm text-fg">{value}</dd>
    </div>
  )
}

export function ToolPage() {
  const { toolId = '' } = useParams()
  const tool = getTool(toolId)

  if (!tool) return <NotFound />

  const ToolComponent = getToolComponent(tool.id)
  const isAvailable = tool.status === 'live' && Boolean(ToolComponent)
  const primaryCategory = tool.categories[0]
  const related = relatedTools(tool, 4)

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: categoryName(primaryCategory), path: categoryRoute(primaryCategory) },
    { name: tool.name, path: tool.route },
  ]

  return (
    <>
      <Seo
        title={`${tool.name} — Free Online Tool`}
        description={tool.description}
        path={tool.route}
        // Tools that do not work yet are not promoted to search engines.
        noindex={!isAvailable}
        jsonLd={compactSchemas([
          softwareApplicationSchema(tool),
          breadcrumbSchema(breadcrumbs),
          isAvailable && howToSchema(tool),
          isAvailable && tool.faqs && tool.faqs.length > 0 && faqSchema(tool.faqs),
          isAvailable && speakableSchema(tool.route, ['#tool-summary', '#how-to-use']),
        ])}
      />

      <PageShell>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
            <li>
              <Link to="/" className="transition-colors hover:text-fg">
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <Icon name="chevron-right" size={14} />
            </li>
            <li>
              <Link
                to={categoryRoute(primaryCategory)}
                className="transition-colors hover:text-fg"
              >
                {categoryName(primaryCategory)}
              </Link>
            </li>
            <li aria-hidden="true">
              <Icon name="chevron-right" size={14} />
            </li>
            <li aria-current="page" className="font-medium text-fg">
              {tool.name}
            </li>
          </ol>
        </nav>

        {/* Tool header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Icon name={tool.icon} size={24} />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tool.name}</h1>
              {isAvailable ? (
                <Badge variant="success">Available</Badge>
              ) : (
                <Badge variant="outline">Coming soon</Badge>
              )}
            </div>
            <p
              id="tool-summary"
              className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base"
            >
              {tool.description}
            </p>
          </div>
        </header>

        <AdSlot placement="tool-top" className="mt-8" />

        {/* Working area */}
        <section className="mt-8" aria-label={`${tool.name} workspace`}>
          {isAvailable && ToolComponent ? (
            <div className="tz-card p-5 sm:p-6">
              <Suspense fallback={<ToolWorkspaceFallback />}>
                <ToolComponent />
              </Suspense>
            </div>
          ) : tool.status === 'live' && !ToolComponent ? (
            <ErrorState
              title="This tool is temporarily unavailable"
              message="The tool is registered but its implementation could not be loaded. Please try again later."
            />
          ) : (
            <div className="tz-card flex flex-col items-center gap-4 p-8 text-center sm:p-12">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted">
                <Icon name="lightbulb" size={22} />
              </span>
              <div>
                <h2 className="text-lg font-semibold">This tool is in development</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
                  {tool.name} is on the TOOLZEN roadmap and is not available yet. We publish tools
                  only once they genuinely work, so nothing here is a placeholder button.
                </p>
              </div>
              <dl className="w-full max-w-md text-left">
                <div className="flex justify-between gap-4 border-b border-line py-2 text-sm">
                  <dt className="text-muted">Accepts</dt>
                  <dd className="text-right font-medium">{tool.inputFormat}</dd>
                </div>
                <div className="flex justify-between gap-4 py-2 text-sm">
                  <dt className="text-muted">Produces</dt>
                  <dd className="text-right font-medium">{tool.outputFormat}</dd>
                </div>
              </dl>
              <Link to="/tools" className={buttonClasses({ variant: 'secondary', size: 'md' })}>
                Browse available tools
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>
          )}
        </section>

        {/* How to use */}
        {isAvailable && tool.instructions && tool.instructions.length > 0 && (
          <section className="mt-10" aria-labelledby="how-to-use">
            <h2 id="how-to-use" className="text-lg font-semibold tracking-tight">
              How to use {tool.name}
            </h2>
            <ol className="mt-4 flex flex-col gap-3">
              {tool.instructions.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-relaxed text-muted">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Tool-specific FAQ — direct answers for snippets, voice and AI answers. */}
        {isAvailable && tool.faqs && tool.faqs.length > 0 && (
          <section className="mt-10" aria-labelledby="tool-faq">
            <h2 id="tool-faq" className="text-lg font-semibold tracking-tight">
              {tool.name} — frequently asked questions
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              {tool.faqs.map((faq) => (
                <details key={faq.question} className="tz-card group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-fg">
                    {faq.question}
                    <Icon
                      name="chevron-down"
                      size={17}
                      className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Tool details */}
        <section className="mt-10" aria-labelledby="tool-details">
          <h2 id="tool-details" className="text-lg font-semibold tracking-tight">
            Tool details
          </h2>
          <dl className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface px-5">
            <DetailRow label="Category" value={categoryName(primaryCategory)} />
            <DetailRow label="Accepts" value={tool.inputFormat} />
            <DetailRow label="Produces" value={tool.outputFormat} />
            <DetailRow
              label="Processing"
              value={
                tool.processingMode === 'client'
                  ? 'In your browser — files and text never leave your device'
                  : tool.processingMode === 'network'
                    ? 'In your browser, with a direct request to a public API sent from your device'
                    : tool.processingMode === 'ai'
                      ? 'Sent to a TOOLZEN server, then to an AI provider — this is the only mode where your text leaves your device'
                      : 'On a TOOLZEN server with temporary storage'
              }
            />
            {tool.maxFileSize && <DetailRow label="Maximum size" value={tool.maxFileSize} />}
            <DetailRow label="Cost" value="Free — no account required" />
          </dl>
          {tool.privacyNote && (
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted">
              <Icon name="shield" size={14} className="mt-0.5 shrink-0" />
              {tool.privacyNote}
            </p>
          )}
        </section>

        <AdSlot placement="tool-bottom" className="mt-10" />

        {/* Related tools */}
        {related.length > 0 && (
          <section className="mt-12" aria-labelledby="related-tools">
            <h2 id="related-tools" className="text-lg font-semibold tracking-tight">
              Related tools
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ToolCard key={item.id} tool={item} />
              ))}
            </div>
          </section>
        )}

        <div className="mt-12">
          <Link to="/tools" className={buttonClasses({ variant: 'outline', size: 'md' })}>
            <Icon name="arrow-left" size={16} />
            Back to all tools
          </Link>
        </div>
      </PageShell>
    </>
  )
}

export default ToolPage
