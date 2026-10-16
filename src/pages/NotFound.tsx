import { Link } from 'react-router-dom'
import { buttonClasses } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Seo } from '@/components/seo/Seo'
import { PageShell } from '@/components/layout/PageShell'

export function NotFound() {
  return (
    <>
      <Seo
        title="Page not found"
        description="The page you were looking for does not exist on TOOLZEN."
        path="/404"
        noindex
      />
      <PageShell>
        <div className="flex flex-col items-center py-16 text-center sm:py-24">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Icon name="search" size={26} />
          </span>
          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-brand">404</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            We could not find that page
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
            The link may be out of date, or the tool you are looking for may not be published yet.
            You can search the directory or start from the homepage.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/tools" className={buttonClasses({ variant: 'primary', size: 'lg' })}>
              <Icon name="grid" size={18} />
              Browse all tools
            </Link>
            <Link to="/" className={buttonClasses({ variant: 'outline', size: 'lg' })}>
              <Icon name="home" size={18} />
              Go to homepage
            </Link>
          </div>
        </div>
      </PageShell>
    </>
  )
}

export default NotFound
