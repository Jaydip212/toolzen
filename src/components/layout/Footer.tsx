import { Link } from 'react-router-dom'
import { categories, categoryRoute } from '@/data/categories'
import { Logo } from '@/components/ui/Logo'

const footerCategories = ['pdf', 'image', 'text', 'developer', 'calculator'] as const

const platformLinks = [
  { label: 'All Tools', to: '/tools' },
  { label: 'About', to: '/about' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="tz-container py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Every Tool. One Place. A free online tools platform for documents, images, files,
              text and everyday digital tasks — no sign-up required.
            </p>
            <p className="mt-4 text-sm font-medium text-fg">
              All TOOLZEN tools are free. Supported by advertising.
            </p>
          </div>

          <nav aria-label="Tool categories">
            <h2 className="text-sm font-semibold text-fg">Categories</h2>
            <ul className="mt-4 space-y-2.5">
              {footerCategories.map((id) => {
                const category = categories.find((item) => item.id === id)
                if (!category) return null
                return (
                  <li key={id}>
                    <Link
                      to={categoryRoute(id)}
                      className="text-sm text-muted transition-colors hover:text-fg"
                    >
                      {category.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <nav aria-label="Platform">
            <h2 className="text-sm font-semibold text-fg">Platform</h2>
            <ul className="mt-4 space-y-2.5">
              {platformLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted transition-colors hover:text-fg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} TOOLZEN. All rights reserved.</p>
          <p>
            Files are processed in your browser wherever possible. See our{' '}
            <Link to="/privacy" className="font-medium text-brand hover:underline">
              Privacy Policy
            </Link>{' '}
            for details.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
