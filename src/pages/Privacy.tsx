import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'
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

export function Privacy() {
  return (
    <>
      <Seo
        title="Privacy Policy"
        description="How TOOLZEN handles your data: what is processed in your browser, what is processed on a server, and how long files are kept."
        path="/privacy"
      />

      <PageShell className="max-w-3xl">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-muted">Last updated: {LAST_UPDATED}</p>
          <p className="mt-4 text-base leading-relaxed text-muted">
            This policy explains what TOOLZEN does with your data. It is written to be read, not to
            hide behind. If something here is unclear, that is a problem we want to fix.
          </p>
        </header>

        <Section id="summary" title="The short version">
          <ul className="flex flex-col gap-2">
            <li className="flex gap-2">
              <Icon name="check" size={16} className="mt-0.5 shrink-0 text-success" />
              <span>
                You do not need an account to use any public tool, so we do not ask for your name,
                email address or phone number.
              </span>
            </li>
            <li className="flex gap-2">
              <Icon name="check" size={16} className="mt-0.5 shrink-0 text-success" />
              <span>
                Most tools run entirely in your browser. In those cases your text, images and files
                never leave your device.
              </span>
            </li>
            <li className="flex gap-2">
              <Icon name="check" size={16} className="mt-0.5 shrink-0 text-success" />
              <span>
                When a tool does need a server, its page says so before you upload anything, and
                temporary files are deleted after processing.
              </span>
            </li>
            <li className="flex gap-2">
              <Icon name="check" size={16} className="mt-0.5 shrink-0 text-success" />
              <span>We do not sell your data, and we do not log the contents of your files.</span>
            </li>
          </ul>
        </Section>

        <Section id="local-vs-server" title="Local processing versus server processing">
          <p>
            Every tool page states which processing mode applies, using one of the following three
            labels:
          </p>
          <p>
            <strong className="text-fg">In your browser.</strong> The tool runs entirely on your own
            device using your browser&rsquo;s built-in capabilities. Nothing is transmitted to
            TOOLZEN or to any third party, because there is no upload at all.
          </p>
          <p>
            <strong className="text-fg">On a TOOLZEN server with temporary storage.</strong> The
            tool needs more compute than a browser can reasonably provide. Your file is uploaded
            over an encrypted connection, processed, and then deleted automatically. Server files
            are stored outside the public web root, are given randomised identifiers, and are never
            exposed through public URLs.
          </p>
          <p>
            <strong className="text-fg">Sent to an AI provider.</strong> The seven AI tools cannot
            run in a browser, because producing new text needs a language model and a key that
            ships to a browser is a key anyone can take. Your text is sent to TOOLZEN&rsquo;s server,
            forwarded to a third-party AI provider to produce the result, and returned to you.
            Nothing is retained by TOOLZEN after the response. See the section below.
          </p>
          <p>
            We do not claim that everything is processed locally. Where a server is involved, we say
            so plainly.
          </p>
        </Section>

        <Section id="ai-tools" title="The AI tools, specifically">
          <p>
            The AI tools are the only part of TOOLZEN where your text leaves your device. That is a
            real difference from every other tool here, so it is worth stating exactly what happens:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Your text is sent over an encrypted connection to TOOLZEN&rsquo;s serverless function.
            </li>
            <li>
              That function forwards the text to a third-party AI provider and returns the reply. The
              provider&rsquo;s own privacy terms apply to that transfer, and its retention policy is
              outside our control.
            </li>
            <li>
              TOOLZEN does not write your text to a database, a log or a file, and does not use it to
              train anything. The function holds it in memory only for the length of the request.
            </li>
            <li>
              Your provider API key is never sent to the browser. It exists only in the server
              environment, and no response contains it.
            </li>
          </ul>
          <p>
            Because of this, do not paste contracts, medical records, credentials or anything else
            confidential into an AI tool here. For that material, use a tool on this site that runs
            in your browser — most of them do.
          </p>
        </Section>

        <Section id="file-retention" title="File retention">
          <p>
            Files processed in your browser are never uploaded, so there is nothing for us to
            retain. Files processed on a server are kept only for as long as it takes to produce
            your result, plus a short grace period so a failed download can be retried. After that
            window they are deleted automatically. We do not keep copies, and we do not use your
            files for any other purpose.
          </p>
          <p>
            Text sent to an AI tool is not stored at all: it is forwarded, answered, and discarded.
          </p>
        </Section>

        <Section id="what-we-collect" title="What we do collect">
          <p>
            We collect as little as possible. At present, the platform does not require accounts and
            does not run third-party analytics. Standard server and CDN logs may record technical
            request data such as IP address, user agent and timestamps for security and reliability
            purposes. These logs are not used to profile you and do not contain the contents of your
            files.
          </p>
        </Section>

        <Section id="advertising" title="Advertising">
          <p>
            TOOLZEN is funded by advertising. Advertisement slots are kept separate from tool
            functionality, and ad code never has access to your files or your input. If and when an
            advertising network is integrated, that network may set its own cookies or identifiers
            under its own privacy policy, and we will update this page before that happens. Ad slots
            are disabled by default and are only enabled after the required provider approvals.
          </p>
        </Section>

        <Section id="security" title="Security">
          <p>
            Production traffic is served over HTTPS. Server-side processing uses strict validation
            of file types and sizes, randomised file identifiers, storage outside publicly
            accessible directories, protection against path traversal, and automatic deletion of
            temporary files. Access to any stored data is restricted and audited.
          </p>
        </Section>

        <Section id="your-rights" title="Your choices">
          <p>
            Because we do not hold accounts or store your files, there is usually nothing to
            request, correct or delete. If you believe we hold data about you, you can ask us to
            explain what and why, and we will respond.
          </p>
        </Section>

        <Section id="changes" title="Changes to this policy">
          <p>
            We will update this page whenever our practices change, and we will change the
            &ldquo;last updated&rdquo; date above. Material changes will be highlighted on the
            homepage.
          </p>
        </Section>

        <Section id="contact" title="Contact">
          <p>
            A dedicated contact channel for privacy questions will be published alongside the
            production launch. Until then, this policy describes the intended behaviour of the
            platform as it is built.
          </p>
        </Section>

        <p className="mt-10 text-sm text-muted">
          See also our{' '}
          <Link to="/terms" className="font-medium text-brand hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      </PageShell>
    </>
  )
}

export default Privacy
