import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SponsorSlot } from './SponsorSlot'
import { SPONSORSHIPS, activeSponsorships, validateSponsorship, type Sponsorship } from './sponsorships'

const GOOD: Sponsorship = {
  name: 'Example Corp',
  imageUrl: 'https://cdn.example.com/logo.png',
  targetUrl: 'https://example.com/',
  start: '2026-01-01',
  end: '2026-12-31',
  placements: ['home'],
}

describe('validateSponsorship', () => {
  it('accepts a complete, safe campaign', () => {
    expect(validateSponsorship(GOOD)).toEqual([])
  })

  it('refuses non-https targets and unsafe schemes', () => {
    expect(validateSponsorship({ ...GOOD, targetUrl: 'http://example.com/' })).toContain(
      'targetUrl must be an https URL',
    )
    expect(validateSponsorship({ ...GOOD, targetUrl: 'javascript:alert(1)' })).toContain(
      'targetUrl must be an https URL',
    )
    expect(validateSponsorship({ ...GOOD, imageUrl: 'data:image/png;base64,x' })).toContain(
      'imageUrl must be a site path or https URL',
    )
  })

  it('requires ISO dates in the right order', () => {
    expect(validateSponsorship({ ...GOOD, start: '2026/01/01' })).toContain(
      'start must be an ISO date (YYYY-MM-DD)',
    )
    expect(validateSponsorship({ ...GOOD, start: '2026-12-31', end: '2026-01-01' })).toContain(
      'end is before start',
    )
  })

  it('requires a name and at least one placement', () => {
    expect(validateSponsorship({ ...GOOD, name: '   ' })).toContain('name is empty')
    expect(validateSponsorship({ ...GOOD, placements: [] })).toContain('no placements selected')
  })
})

describe('activeSponsorships', () => {
  it('returns only valid campaigns inside their window', () => {
    const list = [
      GOOD,
      { ...GOOD, name: 'Past', end: '2025-12-31' },
      { ...GOOD, name: 'Future', start: '2027-01-01' },
    ]
    const active = activeSponsorships(['home'], '2026-06-15', list)
    expect(active.map((sponsor) => sponsor.name)).toEqual(['Example Corp'])
  })

  it('treats the window as inclusive on both ends', () => {
    const list = [GOOD]
    expect(activeSponsorships(['home'], '2026-01-01', list)).toHaveLength(1)
    expect(activeSponsorships(['home'], '2026-12-31', list)).toHaveLength(1)
    expect(activeSponsorships(['home'], '2027-01-01', list)).toHaveLength(0)
  })

  it('honours the requested placement', () => {
    expect(activeSponsorships(['category'], '2026-06-15', [GOOD])).toEqual([])
  })

  it('drops campaigns that fail validation', () => {
    const broken = { ...GOOD, targetUrl: 'javascript:alert(1)' }
    expect(activeSponsorships(['home'], '2026-06-15', [broken])).toEqual([])
  })
})

describe('SponsorSlot', () => {
  it('renders nothing when no campaign is active', () => {
    const { container } = render(<SponsorSlot placement="home" today="2026-06-15" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a clearly-labelled sponsored link for a live campaign', () => {
    render(<SponsorSlot placement="home" today="2026-06-15" campaigns={[GOOD]} />)
    expect(screen.getByText('Sponsored')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /example corp/i })
    expect(link).toHaveAttribute('href', 'https://example.com/')
    expect(link).toHaveAttribute('rel', 'sponsored noopener noreferrer')
    expect(link).toHaveAttribute('target', '_blank')
    const image = screen.getByAltText('Example Corp')
    expect(image).toHaveAttribute('src', 'https://cdn.example.com/logo.png')
  })

  it('does not render a campaign aimed at another placement', () => {
    const { container } = render(
      <SponsorSlot placement="category" today="2026-06-15" campaigns={[GOOD]} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('ships with an empty campaign list, so nothing can render by accident', () => {
    expect(SPONSORSHIPS).toEqual([])
  })
})
