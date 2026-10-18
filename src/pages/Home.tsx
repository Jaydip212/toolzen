import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categories, categoryRoute } from '@/data/categories'
import { getTool, platformStats, recentlyAddedTools } from '@/data/registry'
import type { Tool } from '@/types/tool'
import { SITE_DEFINITION } from '@/lib/site'
import { compactSchemas, faqSchema, speakableSchema } from '@/lib/schema'
import type { FaqEntry } from '@/types/tool'
import { buttonClasses } from '@/components/ui/Button'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Input } from '@/components/ui/Form'
import { Badge } from '@/components/ui/Badge'
import { AdSlot } from '@/components/ads/AdSlot'
import { SponsorSlot } from '@/components/ads/SponsorSlot'
import { Seo } from '@/components/seo/Seo'
import { CategoryCard } from '@/components/tools/CategoryCard'
import { ToolCard } from '@/components/tools/ToolCard'

/**
 * The eight tools shown in the Popular section. ids, not names — each is
 * resolved through the registry, so a renamed or unshipped tool silently
 * drops out instead of rendering a dead card.
 */
const POPULAR_TOOL_IDS = [
  'merge-pdf',
  'compress-pdf',
  'pdf-to-jpg',
  'image-compressor',
  'image-resizer',
  'json-formatter',
  'qr-code-generator',
  'word-counter',
]

/** The tools shown in the hero's decorative-but-functional side panel. */
const HERO_VISUAL_IDS = ['merge-pdf', 'image-compressor', 'qr-code-generator', 'word-counter']

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
      '92 tools are available today, across PDF, images, documents, text, developer, security, calculation, QR code and productivity categories. The full directory on the All Tools page always reflects the current state.',
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

/** Look up a set of registry ids, keeping only tools that are live today. */
function toolsByIds(ids: string[]): Tool[] {
  return ids
    .map((id) => getTool(id))
    .filter((tool): tool is Tool => tool !== undefined && tool.status === 'live')
}

/**
 * The hero's side panel: four real tools as small cards. They are links, not
 * a mock-up — the fastest tools to reach are one click away from the first
 * screen. Rendering is skipped if none of the ids resolve.
 */
function HeroVisual({ availableCount }: { availableCount: number }) {
  const tiles = toolsByIds(HERO_VISUAL_IDS)
  if (tiles.length === 0) return null

  return (
    <div className="relative hidden lg:block">
      <div aria-hidden="true" className="absolute -inset-8 rounded-3xl bg-brand-soft/40 blur-2xl" />

      <div className="relative grid grid-cols-2 gap-4">
        {tiles.map((tool) => (
          <Link
            key={tool.id}
            to={tool.route}
            className="tz-card group flex flex-col gap-3 p-5 transition-colors hover:border-brand/40"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Icon name={tool.icon} size={19} />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight text-fg">
                {tool.name}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted">
                Runs in your browser
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="relative mt-4 flex items-center justify-end gap-2 pr-1">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted">
          <Icon name="circle-check" size={13} className="text-brand" />
          {availableCount} tools available today
        </span>
      </div>
    </div>
  )
}

export function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const stats = platformStats()
  const popular = toolsByIds(POPULAR_TOOL_IDS)
  const recent = recentlyAddedTools(4)

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
        <div className="tz-container relative py-16 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <Badge variant="brand" className="mb-5">
                <Icon name="sparkles" size={13} />
                100+ free online tools
              </Badge>

              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Every Tool You Need.
                <span className="block text-brand">One Simple Place.</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                Compress PDFs, edit images, convert files, and simplify everyday digital tasks with
                free online tools.
              </p>

              <form onSubmit={submitSearch} className="mt-8 max-w-xl" role="search">
                <Input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="What do you want to do today?"
                  aria-label="Search tools"
                  leading={<Icon name="search" size={18} />}
                  className="h-12 text-base"
                />
              </form>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to="/tools" className={buttonClasses({ variant: 'primary', size: 'lg' })}>
                  <Icon name="grid" size={18} />
                  Explore All Tools
                </Link>
                <Link
                  to={categoryRoute('pdf')}
                  className={buttonClasses({ variant: 'outline', size: 'lg' })}
                >
                  Explore PDF Tools
                  <Icon name="arrow-right" size={18} />
                </Link>
              </div>

              <p className="mt-6 text-xs text-muted">
                {stats.total} tools mapped across {categories.length} categories · {stats.live}{' '}
                available today · all free
              </p>
            </div>

            <HeroVisual availableCount={stats.live} />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Popular tools                                                     */}
      {/* ---------------------------------------------------------------- */}
      {popular.length > 0 && (
        <section className="tz-container mt-16" aria-labelledby="popular-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="max-w-2xl">
              <h2 id="popular-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Popular tools
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                The tools people reach for most — merge a PDF, shrink an image, format some JSON.
              </p>
            </div>
            <Link
              to="/tools"
              className="text-sm font-medium text-brand transition-colors hover:underline"
            >
              View all tools →
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      <SponsorSlot placement="home" />

      {/* ---------------------------------------------------------------- */}
      {/* Categories                                                        */}
      {/* ---------------------------------------------------------------- */}
      <section className="tz-container mt-16" aria-labelledby="categories-heading">
        <div className="max-w-2xl">
          <h2 id="categories-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Explore categories
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
      {/* Why TOOLZEN                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section className="tz-container mt-20" aria-labelledby="why-heading">
        <div className="max-w-2xl">
          <h2 id="why-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Why TOOLZEN?
          </h2>
          <p id="toolzen-definition" className="mt-4 text-base leading-relaxed text-fg">
            {SITE_DEFINITION}
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

      <AdSlot placement="homepage-banner" className="tz-container mt-16" />

      {/* ---------------------------------------------------------------- */}
      {/* FAQ                                                               */}
      {/* ---------------------------------------------------------------- */}
      <section className="tz-container mt-16" aria-labelledby="faq-heading">
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
      <section className="tz-container mb-4 mt-16">
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
              Explore All Tools
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
