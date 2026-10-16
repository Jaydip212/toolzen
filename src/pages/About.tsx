import { Link } from 'react-router-dom'
import { platformStats } from '@/data/registry'
import { SITE_DEFINITION, SITE_TAGLINE } from '@/lib/site'
import { breadcrumbSchema, compactSchemas, speakableSchema } from '@/lib/schema'
import { buttonClasses } from '@/components/ui/Button'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Seo } from '@/components/seo/Seo'
import { PageShell } from '@/components/layout/PageShell'

/** Date the factual content on this page was last checked. */
const LAST_REVIEWED = '17 October 2026'

const principles: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'zap',
    title: 'Free for everyone',
    body: 'No subscriptions, no premium tiers, no paywalled features. Advertising funds the platform so the tools can stay open to all.',
  },
  {
    icon: 'shield',
    title: 'Privacy-conscious by design',
    body: 'We process data in the browser whenever the technology allows, and we are explicit on every tool page about which processing mode applies.',
  },
  {
    icon: 'circle-check',
    title: 'Honest about what works',
    body: 'A tool is published only when it genuinely functions. Unfinished work is labelled as coming soon — never presented as a working feature.',
  },
  {
    icon: 'layers',
    title: 'Built to grow',
    body: 'A modular tool registry and a reusable tool-page architecture let us add new utilities without rebuilding the platform.',
  },
]

export function About() {
  const stats = platformStats()

  return (
    <>
      <Seo
        title="About"
        description="TOOLZEN is a free online tools platform for documents, images, files, text and everyday digital tasks. Learn about our mission, principles and business model."
        path="/about"
        jsonLd={compactSchemas([
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' },
          ]),
          speakableSchema('/about', ['#toolzen-about-definition']),
        ])}
      />

      <PageShell className="max-w-4xl">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">About TOOLZEN</h1>
          <p className="mt-3 text-sm text-muted">Last reviewed: {LAST_REVIEWED}</p>
          <p id="toolzen-about-definition" className="mt-4 text-base leading-relaxed text-fg">
            {SITE_DEFINITION}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            TOOLZEN exists to make everyday digital work fast, simple and accessible. Instead of
            hunting for a different website for every small task, you get one place with a growing
            set of focused, genuinely working utilities.
          </p>
        </header>

        <section className="mt-10" aria-labelledby="key-facts">
          <h2 id="key-facts" className="text-xl font-semibold tracking-tight">
            Key facts
          </h2>
          <dl className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface px-5">
            {[
              { label: 'Name', value: 'TOOLZEN' },
              { label: 'Tagline', value: SITE_TAGLINE },
              { label: 'What it is', value: 'A free online tools platform' },
              { label: 'Cost', value: 'Free — no subscription and no paid-only features' },
              { label: 'Account required', value: 'No' },
              { label: 'Default processing', value: "In the user's browser" },
              { label: 'Business model', value: 'Advertising, with possible direct sponsorship' },
              { label: 'Data selling', value: 'Never' },
              { label: 'Platforms', value: 'Any modern web browser on desktop, tablet or phone' },
            ].map((fact) => (
              <div
                key={fact.label}
                className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:gap-4"
              >
                <dt className="w-44 shrink-0 text-xs font-medium uppercase tracking-wide text-muted">
                  {fact.label}
                </dt>
                <dd className="text-sm text-fg">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12" aria-labelledby="mission">
          <h2 id="mission" className="text-xl font-semibold tracking-tight">
            Our mission
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Most people do not need a heavyweight desktop application to count the words in a
            document or convert an image. They need a tool that opens instantly, does one job well
            and respects their privacy. TOOLZEN is built around that idea: small, dependable
            utilities, presented clearly, free to use, on any device.
          </p>
        </section>

        <section className="mt-12" aria-labelledby="principles">
          <h2 id="principles" className="text-xl font-semibold tracking-tight">
            What we stand for
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {principles.map((item) => (
              <div key={item.title} className="tz-card p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icon name={item.icon} size={19} />
                </span>
                <h3 className="mt-4 text-sm font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="business-model">
          <h2 id="business-model" className="text-xl font-semibold tracking-tight">
            How TOOLZEN stays free
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Running a platform costs money, so TOOLZEN is supported by advertising. Advertisements
            are kept in reserved spaces that never overlap upload controls, processing buttons or
            download links, and they are never disguised as part of a tool. We do not ask you to
            click them, and we do not show fabricated advertisements.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            In the future we may also offer direct sponsorship placements. What we will not do is
            put core functionality behind a paywall — the tools remain free.
          </p>
        </section>

        <section className="mt-12" aria-labelledby="status">
          <h2 id="status" className="text-xl font-semibold tracking-tight">
            Where the platform stands today
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="tz-card p-5">
              <p className="text-2xl font-semibold tabular-nums">{stats.live}</p>
              <p className="mt-1 text-sm text-muted">tools available now</p>
            </div>
            <div className="tz-card p-5">
              <p className="text-2xl font-semibold tabular-nums">{stats.total}</p>
              <p className="mt-1 text-sm text-muted">tools mapped in the directory</p>
            </div>
            <div className="tz-card p-5">
              <p className="text-2xl font-semibold tabular-nums">12</p>
              <p className="mt-1 text-sm text-muted">tool categories</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            We are building TOOLZEN in phases: foundation first, then document, image, developer and
            security tools, followed by platform infrastructure and finally monetisation. The
            directory lists every planned tool with an honest status, so you always know what is
            ready and what is still to come.
          </p>
        </section>

        <section className="mt-12" aria-labelledby="contact">
          <h2 id="contact" className="text-xl font-semibold tracking-tight">
            Get in touch
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Found a bug, spotted something inaccurate, or want to suggest a tool? We would like to
            hear about it. A dedicated contact channel will be published alongside the production
            launch.
          </p>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/tools" className={buttonClasses({ variant: 'primary', size: 'lg' })}>
            <Icon name="grid" size={18} />
            Browse all tools
          </Link>
          <Link to="/privacy" className={buttonClasses({ variant: 'outline', size: 'lg' })}>
            Read our Privacy Policy
          </Link>
        </div>
      </PageShell>
    </>
  )
}

export default About
