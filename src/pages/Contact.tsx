import { Seo } from '@/components/seo/Seo'
import { PageShell } from '@/components/layout/PageShell'
import { Icon, type IconName } from '@/components/ui/Icon'
import { CONTACT_EMAIL, CONTACT_NOTE, CONTACT_URL } from '@/data/site-contact'

const SAFE_URL = /^https:\/\/[^\s"'<]+$/i

const channels: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'shield',
    title: 'Privacy questions',
    body: 'Questions about how files and text are handled are answered in the Privacy Policy, which documents every processing mode the platform uses.',
  },
  {
    icon: 'alert-triangle',
    title: 'Report a broken tool',
    body: 'If a tool fails or produces a wrong result, describe what you did and what went wrong. Do not attach confidential documents — use a redacted sample.',
  },
  {
    icon: 'briefcase',
    title: 'Advertising and sponsorship',
    body: 'Advertising and direct sponsorship enquiries are welcome. TOOLZEN runs conventional, clearly-labelled placements and no intrusive formats.',
  },
]

export function Contact() {
  const email = CONTACT_EMAIL && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CONTACT_EMAIL) ? CONTACT_EMAIL : null
  const url = CONTACT_URL && SAFE_URL.test(CONTACT_URL) ? CONTACT_URL : null
  const hasContact = email !== null || url !== null

  return (
    <>
      <Seo
        title="Contact TOOLZEN"
        description="How to reach the TOOLZEN team about broken tools, privacy questions, advertising and sponsorship."
        path="/contact"
      />

      <PageShell className="max-w-3xl">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Contact</h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            TOOLZEN is a small, independent project. There is no support desk and no ticket system —
            but broken tools, privacy questions and partnership enquiries all reach a human.
          </p>
        </header>

        {hasContact ? (
          <section className="mt-8" aria-labelledby="reach-heading">
            <h2 id="reach-heading" className="text-xl font-semibold tracking-tight">
              How to reach us
            </h2>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-fg">
              {email && (
                <li className="flex items-center gap-2">
                  <Icon name="mail" size={16} className="shrink-0 text-brand" />
                  <a className="font-medium underline decoration-line hover:decoration-brand" href={`mailto:${email}`}>
                    {email}
                  </a>
                </li>
              )}
              {url && (
                <li className="flex items-center gap-2">
                  <Icon name="external-link" size={16} className="shrink-0 text-brand" />
                  <a
                    className="font-medium underline decoration-line hover:decoration-brand"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {url.replace(/^https:\/\//, '')}
                  </a>
                </li>
              )}
            </ul>
            {CONTACT_NOTE && <p className="mt-4 text-sm leading-relaxed text-muted">{CONTACT_NOTE}</p>}
          </section>
        ) : (
          <section
            className="mt-8 rounded-2xl border border-dashed border-line bg-surface-2/50 p-6"
            aria-labelledby="placeholder-heading"
          >
            <h2 id="placeholder-heading" className="text-lg font-semibold tracking-tight">
              Contact details are not published yet
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              The owner of this deployment has not supplied a contact address, so TOOLZEN will not
              pretend one exists. This block is replaced by real contact details as soon as they are
              configured — the site never invents an email address, form, company address or phone
              number.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              If you operate this deployment, add the details in{' '}
              <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">src/data/site-contact.ts</code>.
            </p>
          </section>
        )}

        <section className="mt-10" aria-labelledby="before-heading">
          <h2 id="before-heading" className="text-xl font-semibold tracking-tight">
            What to include
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {channels.map((channel) => (
              <div key={channel.title} className="tz-card p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icon name={channel.icon} size={17} />
                </span>
                <h3 className="mt-3 text-sm font-semibold">{channel.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{channel.body}</p>
              </div>
            ))}
          </div>
        </section>
      </PageShell>
    </>
  )
}

export default Contact
