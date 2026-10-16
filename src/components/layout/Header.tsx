import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from './ThemeToggle'
import { ToolSearch } from './ToolSearch'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'All Tools', to: '/tools' },
  { label: 'PDF Tools', to: '/category/pdf' },
  { label: 'Image Tools', to: '/category/image' },
  { label: 'Developer Tools', to: '/category/developer' },
  { label: 'About', to: '/about' },
]

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Close the mobile menu after any navigation.
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Cmd/Ctrl+K opens search from anywhere in the app.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'text-fg' : 'text-muted hover:text-fg',
    )

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="tz-container flex h-16 items-center gap-3">
          <Link
            to="/"
            className="rounded-lg py-1 transition-opacity hover:opacity-90"
            aria-label="TOOLZEN home"
          >
            <Logo />
          </Link>

          <nav className="ml-4 hidden items-center gap-0.5 lg:flex" aria-label="Main">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-3 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              aria-label="Search tools"
            >
              <Icon name="search" size={17} />
              <span className="hidden sm:inline">Search</span>
              <kbd className="ml-1 hidden rounded border border-line px-1.5 py-0.5 text-[10px] font-medium lg:inline">
                ⌘K
              </kbd>
            </button>

            <ThemeToggle />

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:bg-surface-2 hover:text-fg lg:hidden"
            >
              <Icon name={menuOpen ? 'x' : 'menu'} size={18} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="border-t border-line bg-surface lg:hidden">
            <nav className="tz-container flex flex-col py-3" aria-label="Mobile">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive ? 'bg-surface-2 text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      <ToolSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}

export default Header
