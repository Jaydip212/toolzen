import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Seo } from '@/components/seo/Seo'
import { PageShell } from '@/components/layout/PageShell'

const LAST_UPDATED = '17 October 2026'

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="mt-10" aria-labelledby={id}>
      <h2 id={id} className="text-xl font-semibold tracking-tight">
        {title}
      </h2>
      <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  )
}

export function Terms() {
  return (
    <>
      <Seo
        title="Terms of Service"
        description="The terms that govern your use of TOOLZEN's free online tools."
        path="/terms"
      />

      <PageShell className="max-w-3xl">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Terms of Service</h1>
          <p className="mt-3 text-sm text-muted">Last updated: {LAST_UPDATED}</p>
          <p className="mt-4 text-base leading-relaxed text-muted">
            These terms govern your use of TOOLZEN. By using the platform you agree to them. They
            are written in plain language on purpose.
          </p>
        </header>

        <Section id="service" title="1. The service">
          <p>
            TOOLZEN provides free online utilities for working with documents, images, files, text
            and related everyday tasks. Every tool is free to use, and no account is required for
            public tools.
          </p>
          <p>
            We may add, change, suspend or remove tools at any time. We aim to keep the platform
            available, but we do not guarantee uninterrupted or error-free operation.
          </p>
        </Section>

        <Section id="acceptable-use" title="2. Acceptable use">
          <p>You agree not to use TOOLZEN to:</p>
          <ul className="ml-5 flex list-disc flex-col gap-1.5">
            <li>upload or process content you do not have the right to use;</li>
            <li>infringe anyone&rsquo;s copyright, trademark or other rights;</li>
            <li>
              attempt to bypass security controls, gain unauthorised access to systems or data, or
              use our tools for unauthorised security testing;
            </li>
            <li>
              process unlawful content, including material that is illegal in your jurisdiction;
            </li>
            <li>
              overload, disrupt or reverse engineer the platform, or use it to distribute malware;
            </li>
            <li>scrape or automate access in a way that degrades the service for others.</li>
          </ul>
          <p>
            Server-side tools may be subject to rate limits and fair-use quotas so they remain
            available to everyone.
          </p>
        </Section>

        <Section id="your-content" title="3. Your content">
          <p>
            You keep all rights to the content you process with TOOLZEN. We do not claim ownership
            of your files or text, and we do not use them for any purpose other than producing the
            result you asked for.
          </p>
          <p>
            You are responsible for making sure you have the right to process the content you
            submit, and for keeping your own backups of anything important. Tools that modify files
            produce a new result — always check it before relying on it.
          </p>
        </Section>

        <Section id="no-warranty" title="4. No warranty">
          <p>
            TOOLZEN is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without
            warranties of any kind, whether express or implied, including fitness for a particular
            purpose or accuracy of results.
          </p>
          <p>
            Calculators and estimators produce estimates for general information only. They are not
            professional financial, legal, medical or tax advice, and you should not rely on them
            for decisions that require a qualified professional.
          </p>
        </Section>

        <Section id="liability" title="5. Limitation of liability">
          <p>
            To the fullest extent permitted by law, TOOLZEN is not liable for any indirect,
            incidental or consequential loss arising from your use of the platform, including lost
            data, lost profits or business interruption. Because the service is provided free of
            charge, our total liability to you is limited to the amount you paid to use it.
          </p>
        </Section>

        <Section id="advertising" title="6. Advertising and sponsorship">
          <p>
            TOOLZEN is funded by advertising and, in future, direct sponsorship. Advertisements are
            displayed in clearly separated slots and never interfere with tool controls. We do not
            ask you to click advertisements and we do not place deceptive ads. Advertisements may be
            supplied by third parties under their own terms.
          </p>
        </Section>

        <Section id="intellectual-property" title="7. Intellectual property">
          <p>
            The TOOLZEN name, logo, interface design and original content are our property. You may
            not copy, redistribute or present them as your own. Third-party open-source libraries
            used by the platform remain under their respective licences.
          </p>
        </Section>

        <Section id="privacy" title="8. Privacy">
          <p>
            Our{' '}
            <Link to="/privacy" className="font-medium text-brand hover:underline">
              Privacy Policy
            </Link>{' '}
            explains how data is handled and forms part of these terms.
          </p>
        </Section>

        <Section id="changes" title="9. Changes to these terms">
          <p>
            We may update these terms as the platform evolves. The &ldquo;last updated&rdquo; date
            above will change when we do. Continued use of TOOLZEN after a change means you accept
            the updated terms.
          </p>
        </Section>

        <Section id="contact" title="10. Contact">
          <p>
            A dedicated contact channel for legal questions will be published alongside the
            production launch.
          </p>
        </Section>

        <p className="mt-10 text-sm text-muted">
          See also our{' '}
          <Link to="/privacy" className="font-medium text-brand hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </PageShell>
    </>
  )
}

export default Terms
