import { Link } from 'react-router-dom'
import { Seo } from '@/components/seo/Seo'
import { PageShell } from '@/components/layout/PageShell'
import { Icon } from '@/components/ui/Icon'
import { GUIDES } from '@/data/guides'

const GROUP_ORDER = ['PDF', 'Images', 'Data', 'Security', 'Calculators'] as const

export function Guides() {
  return (
    <>
      <Seo
        title="Guides — TOOLZEN"
        description="Plain-language, step-by-step guides for the everyday tasks TOOLZEN's tools solve: merging PDFs, choosing image formats, converting CSV to JSON and more."
        path="/guides"
      />

      <PageShell>
        <header className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Guides</h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Short, honest walkthroughs for the tasks our tools solve — including the trade-offs
            nobody mentions, like why a PDF sometimes will not shrink. Every guide describes what
            the tools actually do.
          </p>
        </header>

        {GROUP_ORDER.map((group) => {
          const guides = GUIDES.filter((guide) => guide.group === group)
          if (guides.length === 0) return null
          return (
            <section key={group} className="mt-12" aria-labelledby={`group-${group}`}>
              <h2 id={`group-${group}`} className="text-lg font-semibold tracking-tight">
                {group}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {guides.map((guide) => (
                  <Link
                    key={guide.slug}
                    to={`/guides/${guide.slug}`}
                    className="tz-card tz-card-interactive group flex flex-col p-5"
                  >
                    <h3 className="text-sm font-semibold tracking-tight text-fg group-hover:text-brand">
                      {guide.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                      {guide.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-brand">
                      Read the guide
                      <Icon name="arrow-right" size={13} />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </PageShell>
    </>
  )
}

export default Guides
