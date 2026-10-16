import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categories, categoryRoute } from '@/data/categories'
import { featuredTools, liveTools, platformStats, recentlyAddedTools } from '@/data/registry'
import { SITE_DEFINITION, SITE_TAGLINE } from '@/lib/site'
import { compactSchemas, faqSchema, speakableSchema } from '@/lib/schema'
import type { FaqEntry } from '@/types/tool'
import { buttonClasses } from '@/components/ui/Button'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Input } from '@/components/ui/Form'
import { Badge } from '@/components/ui/Badge'
import { AdSlot } from '@/components/ads/AdSlot'
import { Seo } from '@/components/seo/Seo'
import { CategoryCard } from '@/components/tools/CategoryCard'
import { ToolCard } from '@/components/tools/ToolCard'

const reasons: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'zap',
    title: 'Free, with no catch',
    body: 'Every tool is free to use. There are no subscriptions, no premium tiers and no paywalled features — advertising keeps the lights on.',
  },
  {
    icon: 'shield',
    title: 'Privacy by default',
    body: 'Wherever technically possible, files and text are processed inside your browser, so they never leave your device.',
  },
  {
    icon: 'users',
    title: 'No account required',
    body: 'Open a tool and use it. You never need to sign up, hand over an email address or remember another password.',
  },
  {
    icon: 'circle-check',
    title: 'Only real, working tools',
    body: 'We publish a tool once it genuinely works. Anything unfinished is clearly labelled as coming soon, never as a fake button.',
  },
]

const faqs: FaqEntry[] = [
  {
    question: 'What is TOOLZEN?',
    answer: SITE_DEFINITION,
  },
  {
    question: 'Are TOOLZEN tools really free?',
    answer:
      'Yes. Every tool on TOOLZEN is free to use, with no subscription, no premium tier and no feature held back behind a payment. The platform is funded by advertising.',
  },
  {
    question: 'Do I need to create an account?',
    answer:
      'No. You can use every public tool without signing up, without an email address and without a password.',
  },
  {
    question: 'Are my files uploaded to your servers?',
    answer:
      'It depends on the tool, and each tool page states which applies. Text and image tools run entirely in your browser. Tools that need server processing say so explicitly, and their temporary files are deleted after processing.',
  },
  {
    question: 'Which TOOLZEN tools work right now?',
    answer:
      'The Word Counter, Character Counter and Case Converter are available today. Every other tool is listed with a "Coming soon" label until it genuinely works.',
  },
  {
    question: 'Why are some tools marked as coming soon?',
    answer:
      'Because we only publish tools that genuinely work. Listing a tool that does nothing would waste your time, so planned tools are clearly labelled until they are ready.',
  },
  {
    question: 'How long do you keep my files?',
    answer:
      'Files processed in your browser are never uploaded, so there is nothing to keep. Files processed on a server are stored temporarily outside the public web root and deleted automatically after processing.',
  },
  {
    question: 'Does TOOLZEN work on my phone?',
    answer:
      'Yes. Every page is built mobile-first and works on phones, tablets and desktop computers.',
  },
]

export function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const stats = platformStats()
  const featured = featuredTools(6)
  const recent = recentlyAddedTools(4)
  const available = liveTools()

  // Citable facts for answer engines and AI assistants. Every value is derived
  // from the registry, so nothing here can drift or be invented.
  const facts = useMemo(
    () => [
      { label: 'Tagline', value: SITE_TAGLINE },
      { label: 'Available today', value: String(stats.live) },
      { label: 'On the roadmap', value: String(stats.total - stats.live) },
      { label: 'Categories', value: String(categories.length) },
      { label: 'Cost', value: 'Free' },
      { label: 'Account required', value: 'No' },
      { label: 'Default processing', value: 'In your browser' },
      { label: 'Data selling', value: 'Never' },
    ],
    [stats.live, stats.total],
  )

  const jsonLd = useMemo(
    () =>
      compactSchemas([
        faqSchema(faqs),
        speakableSchema('/', ['#toolzen-definition', '#faq-heading']),
      ]),
    [],
  )

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    navigate(query.trim() ? `/tools?q=${encodeURIComponent(query.trim())}` : '/tools')
  }

  return (
    <>
      <Seo
        title="TOOLZEN — Every Tool. One Place."
        description="Free online tools to simplify your documents, images, files and everyday digital tasks. No sign-up required."
        path="/"
        jsonLd={jsonLd}
      />

      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-soft/60 to-transparent"
        />
        <div className="tz-container relative py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="brand" className="mb-5">
              <Icon name="sparkles" size={13} />
              Free forever · No account needed
            </Badge>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Every Tool You Need.
              <span className="block text-brand">One Simple Place.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              Free online tools to simplify your documents, images, files, and everyday digital
              tasks.
            </p>

            <form onSubmit={submitSearch} className="mx-auto mt-8 max-w-xl" role="search">
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search for a tool, e.g. “word counter”…"
                aria-label="Search tools"
                leading={<Icon name="search" size={18} />}
                className="h-12 text-base"
              />
            </form>

            {available.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  Available now
                </span>
                {available.map((tool) => (
                  <Link
                    key={tool.id}
                    to={tool.route}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:border-brand/40 hover:text-brand"
                  >
                    <Icon name={tool.icon} size={13} />
                    {tool.name}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/tools" className={buttonClasses({ variant: 'primary', size: 'lg' })}>
                <Icon name="grid" size={18} />
                Browse All Tools
              </Link>
              <Link
                to={categoryRoute('pdf')}
                className={buttonClasses({ variant: 'outline', size: 'lg' })}
              >
                Explore PDF Tools
                <Icon name="arrow-right" size={18} />
              </Link>
            </div>

            <p className="mt-5 text-xs text-muted">
              {stats.total} tools mapped across 12 categories · {stats.live} available today · all
              free
            </p>
          </div>
        </div>
      </section>

      <AdSlot placement="homepage-banner" className="tz-container mt-10" />

      {/* ---------------------------------------------------------------- */}
      {/* Definition and key facts (AEO / GEO)                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="tz-container mt-16" aria-labelledby="what-is-toolzen">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <div>
            <h2 id="what-is-toolzen" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              What is TOOLZEN?
            </h2>
            <p id="toolzen-definition" className="mt-4 text-base leading-relaxed text-fg">
              {SITE_DEFINITION}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
              TOOLZEN is built around a simple idea: most everyday digital tasks — counting words,
              converting an image, checking a file hash — should not require installing software,
              creating an account or uploading your data to a stranger. Every tool states plainly
              whether it runs in your browser or on a server, so you always know what happens to
              your files.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
              The platform is organised into {categories.length} categories covering PDF and document
              work, images, text, file conversion, developer utilities, defensive security,
              calculations, QR codes, colour and design, productivity and AI assistance. It is free
              to use and funded by advertising.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 self-start sm:gap-4">
            {facts.map((fact) => (
              <div key={fact.label} className="rounded-xl border border-line bg-surface-2/50 p-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  {fact.label}
                </dt>
                <dd className="mt-1 text-base font-semibold text-fg">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Categories                                                        */}
      {/* ---------------------------------------------------------------- */}
      <section className="tz-container mt-16" aria-labelledby="categories-heading">
        <div className="max-w-2xl">
          <h2 id="categories-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Browse by category
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            Twelve focused collections covering documents, media, code, security, calculations and
            everyday productivity.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Featured tools                                                    */}
      {/* ---------------------------------------------------------------- */}
      {featured.length > 0 && (
        <section className="tz-container mt-16" aria-labelledby="featured-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="featured-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Featured tools
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                Hand-picked tools that are ready to use right now.
              </p>
            </div>
            <Link
              to="/tools"
              className="text-sm font-medium text-brand transition-colors hover:underline"
            >
              View all tools →
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Recently added                                                    */}
      {/* ---------------------------------------------------------------- */}
      {recent.length > 0 && (
        <section className="tz-container mt-16" aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Recently added
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            The newest tools to arrive on TOOLZEN, ordered by the date they were published.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Why TOOLZEN                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section className="tz-container mt-20" aria-labelledby="why-heading">
        <div className="max-w-2xl">
          <h2 id="why-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Why TOOLZEN?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            A tools platform should get out of your way. These four principles shape every decision
            we make.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason) => (
            <div key={reason.title} className="tz-card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon name={reason.icon} size={19} />
              </span>
              <h3 className="mt-4 text-sm font-semibold tracking-tight">{reason.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{reason.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Privacy and security                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="tz-container mt-20" aria-labelledby="privacy-heading">
        <div className="tz-card overflow-hidden">
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-2">
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon name="shield" size={22} />
              </span>
              <h2 id="privacy-heading" className="mt-4 text-2xl font-semibold tracking-tight">
                Privacy and security
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Privacy is a product requirement, not a marketing line. We keep your data on your
                device whenever the technology allows it, and we tell you plainly when a tool needs
                a server.
              </p>
              <Link
                to="/privacy"
                className={buttonClasses({ variant: 'secondary', size: 'md', className: 'mt-6' })}
              >
                Read the Privacy Policy
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>

            <ul className="flex flex-col gap-4">
              {[
                {
                  icon: 'cpu' as IconName,
                  title: 'Browser-first processing',
                  body: 'Text, image and calculation tools run locally, so nothing is transmitted.',
                },
                {
                  icon: 'trash' as IconName,
                  title: 'Temporary files are deleted',
                  body: 'Server-processed uploads are removed automatically once your result is ready.',
                },
                {
                  icon: 'eye-off' as IconName,
                  title: 'No content logging',
                  body: 'We do not log the contents of your documents or the text you enter.',
                },
                {
                  icon: 'lock' as IconName,
                  title: 'Encrypted in transit',
                  body: 'Production traffic is served over HTTPS, and access controls protect stored data.',
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                    <Icon name={item.icon} size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* FAQ                                                               */}
      {/* ---------------------------------------------------------------- */}
      <section className="tz-container mt-20" aria-labelledby="faq-heading">
        <div className="max-w-2xl">
          <h2 id="faq-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Frequently asked questions
          </h2>
        </div>

        <div className="mt-8 flex max-w-3xl flex-col gap-3">
          {faqs.map((faq) => (
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

      {/* ---------------------------------------------------------------- */}
      {/* Closing call to action                                            */}
      {/* ---------------------------------------------------------------- */}
      <section className="tz-container mt-20">
        <div className="rounded-2xl border border-line bg-gradient-to-br from-brand-soft to-accent-soft p-8 text-center sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to get something done?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Jump straight into a tool, or browse the full directory to see everything TOOLZEN
            offers.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/tools" className={buttonClasses({ variant: 'primary', size: 'lg' })}>
              <Icon name="grid" size={18} />
              Browse All Tools
            </Link>
            <Link to="/about" className={buttonClasses({ variant: 'outline', size: 'lg' })}>
              Learn about TOOLZEN
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
