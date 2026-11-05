import { Link, useParams } from 'react-router-dom'
import { Seo } from '@/components/seo/Seo'
import { PageShell } from '@/components/layout/PageShell'
import { Icon } from '@/components/ui/Icon'
import { ToolCard } from '@/components/tools/ToolCard'
import { getTool } from '@/data/registry'
import { GUIDES, getGuide } from '@/data/guides'
import { breadcrumbSchema, compactSchemas, faqSchema } from '@/lib/schema'
import { NotFound } from './NotFound'

export function GuidePage() {
  const { slug = '' } = useParams()
  const guide = getGuide(slug)

  if (!guide) return <NotFound />

  const tools = guide.toolIds
    .map((id) => getTool(id))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool) && tool!.status === 'live')

  const jsonLd = compactSchemas([
    faqSchema(guide.faqs),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Guides', path: '/guides' },
      { name: guide.title, path: `/guides/${guide.slug}` },
    ]),
  ])

  const others = GUIDES.filter((other) => other.slug !== guide.slug).slice(0, 3)

  return (
    <>
      <Seo title={`${guide.title} — TOOLZEN`} description={guide.description} path={`/guides/${guide.slug}`} jsonLd={jsonLd} />

      <PageShell className="max-w-3xl">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <li>
              <Link to="/" className="transition-colors hover:text-fg">
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <Icon name="chevron-right" size={14} />
            </li>
            <li>
              <Link to="/guides" className="transition-colors hover:text-fg">
                Guides
              </Link>
            </li>
            <li aria-hidden="true">
              <Icon name="chevron-right" size={14} />
            </li>
            <li aria-current="page" className="font-medium text-fg">
              {guide.title}
            </li>
          </ol>
        </nav>

        <header className="mt-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{guide.title}</h1>
          <p className="mt-4 text-base leading-relaxed text-muted">{guide.intro}</p>
        </header>

        <section className="mt-10" aria-labelledby="guide-steps">
          <h2 id="guide-steps" className="text-xl font-semibold tracking-tight">
            Step by step
          </h2>
          <ol className="mt-4 flex flex-col gap-4">
            {guide.steps.map((step, index) => (
              <li key={step.title} className="tz-card flex gap-4 p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-fg">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {guide.sections && guide.sections.length > 0 && (
          <section className="mt-10" aria-labelledby="guide-sections">
            <h2 id="guide-sections" className="text-xl font-semibold tracking-tight">
              Worth knowing
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              {guide.sections.map((section) => (
                <div key={section.title} className="tz-card p-5">
                  <h3 className="text-sm font-semibold text-fg">{section.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{section.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {tools.length > 0 && (
          <section className="mt-10" aria-labelledby="guide-tools">
            <h2 id="guide-tools" className="text-xl font-semibold tracking-tight">
              Tools used in this guide
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-10" aria-labelledby="guide-faqs">
          <h2 id="guide-faqs" className="text-xl font-semibold tracking-tight">
            Frequently asked
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {guide.faqs.map((faq) => (
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

        <section className="mt-12" aria-labelledby="more-guides">
          <h2 id="more-guides" className="text-lg font-semibold tracking-tight">
            More guides
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  to={`/guides/${other.slug}`}
                  className="text-sm font-medium text-brand transition-colors hover:underline"
                >
                  {other.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </PageShell>
    </>
  )
}

export default GuidePage
