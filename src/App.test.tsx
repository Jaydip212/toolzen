import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

function renderAt(path: string) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

describe('App routing', () => {
  it('renders the homepage hero at /', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Every Tool You Need/i)
  })

  it('renders a working tool page at /tools/word-counter', () => {
    renderAt('/tools/word-counter')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Word Counter')
    // The tool workspace is actually mounted, not just described.
    expect(screen.getByLabelText('Your text')).toBeInTheDocument()
  })

  it('shows a coming-soon notice for a planned tool instead of a fake control', () => {
    renderAt('/tools/merge-pdf')
    expect(screen.getByText('This tool is in development')).toBeInTheDocument()
    expect(screen.queryByLabelText('Your text')).not.toBeInTheDocument()
  })

  it('renders a category page at /category/pdf', () => {
    renderAt('/category/pdf')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('PDF Tools')
  })

  it('renders the all-tools directory at /tools', () => {
    renderAt('/tools')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('All Tools')
  })

  it('defaults the directory to tools that are available now', () => {
    renderAt('/tools')
    expect(screen.getByRole('heading', { name: /available now/i })).toBeInTheDocument()
    // The roadmap must not pad the default view.
    expect(screen.queryByRole('heading', { name: /coming soon/i })).not.toBeInTheDocument()
  })

  it('searches the whole roadmap when a query is present', () => {
    renderAt('/tools?q=json')
    // The URL query prefills the search box...
    expect(screen.getByDisplayValue('json')).toBeInTheDocument()
    // ...and planned matches are shown rather than hidden by the status filter.
    expect(screen.getByRole('heading', { name: /coming soon/i })).toBeInTheDocument()
  })

  it('renders the 404 page for an unknown route', () => {
    renderAt('/this-route-does-not-exist')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/could not find that page/i)
  })
})
