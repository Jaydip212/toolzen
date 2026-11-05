import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { Logo } from '@/components/ui/Logo'
import { categories, categoryRoute } from '@/data/categories'
import { categoryStats } from '@/data/registry'
import { ThemeToggle } from './ThemeToggle'
import { ToolSearch } from './ToolSearch'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'All Tools', to: '/tools' },
  { label: 'Guides', to: '/guides' },
  { label: 'About', to: '/about' },
]

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const categoryRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  // Close both menus after any navigation.
  useEffect(() => {
    setMenuOpen(false)
    setCategoriesOpen(false)
  }, [location.pathname])

  // Close the category dropdown on outside click or Escape.
  useEffect(() => {
    if (!categoriesOpen) return
    function onPointerDown(event: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setCategoriesOpen(false)
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setCategoriesOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [categoriesOpen])

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

            <div className="relative" ref={categoryRef}>
              <button
                type="button"
                onClick={() => setCategoriesOpen((open) => !open)}
                aria-expanded={categoriesOpen}
                aria-controls="category-menu"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  categoriesOpen ? 'text-fg' : 'text-muted hover:text-fg',
                )}
              >
                Categories
                <Icon
                  name="chevron-down"
                  size={14}
                  className={cn('transition-transform duration-200', categoriesOpen && 'rotate-180')}
                />
              </button>

              {categoriesOpen && (
                <div
                  id="category-menu"
                  className="tz-scroll absolute left-0 top-full z-50 mt-2 max-h-[70vh] w-80 overflow-auto rounded-2xl border border-line bg-surface p-2 shadow-pop animate-fade-in"
                >
                  <nav aria-label="All categories" className="grid gap-0.5">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        to={categoryRoute(category.id)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                          <Icon name={category.icon} size={15} />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                          {category.name}
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-muted">
                          {categoryStats(category.id).live}
                        </span>
                      </Link>
                    ))}
                  </nav>
                </div>
              )}
            </div>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm text-muted transition-colors hover:border-brand/40 hover:text-fg"
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
          <div id="mobile-menu" className="tz-scroll max-h-[75vh] overflow-auto border-t border-line bg-surface lg:hidden animate-fade-in">
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
              <p className="tz-eyebrow mt-4 px-3 pb-1">Categories</p>
              <div className="grid grid-cols-2 gap-1">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={categoryRoute(category.id)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                  >
                    <Icon name={category.icon} size={14} className="shrink-0 text-brand" />
                    <span className="truncate">{category.shortName}</span>
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        )}
      </header>

      <ToolSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}

export default Header
