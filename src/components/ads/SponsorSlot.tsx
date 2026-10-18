import { activeSponsorships, type Sponsorship } from './sponsorships'

export interface SponsorSlotProps {
  placement: Sponsorship['placements'][number]
  /** Injectable for tests; defaults to the shipped campaign list. */
  campaigns?: Sponsorship[]
  /** Injectable for tests; defaults to today. */
  today?: string
}

/**
 * Sponsored placement.
 *
 * Separate from AdSlot on purpose: sponsorships are owner-negotiated campaigns
 * with their own rules, and they must never be confused with programmatic ad
 * inventory. Renders nothing unless a valid, in-window campaign exists — there
 * is no placeholder state, because an empty "Sponsored" box would be a lie
 * about an agreement that does not exist.
 */
export function SponsorSlot({ placement, campaigns, today }: SponsorSlotProps) {
  const sponsors = activeSponsorships([placement], today, campaigns)
  if (sponsors.length === 0) return null

  return (
    <aside className="flex flex-col gap-4" aria-label="Sponsored">
      {sponsors.map((sponsor) => (
        <a
          key={`${sponsor.name}-${sponsor.targetUrl}`}
          href={sponsor.targetUrl}
          target="_blank"
          // rel="sponsored" marks paid links for search engines; noopener
          // keeps the sponsor's page from controlling this tab.
          rel="sponsored noopener noreferrer"
          className="tz-card block p-4 transition-colors hover:border-brand/40"
        >
          <span className="mb-3 block text-[10px] font-semibold uppercase tracking-widest text-muted">
            Sponsored
          </span>
          <img
            src={sponsor.imageUrl}
            alt={sponsor.name}
            className="w-full rounded-lg"
            loading="lazy"
            decoding="async"
          />
          <span className="mt-3 block text-sm font-medium text-fg">{sponsor.name}</span>
        </a>
      ))}
    </aside>
  )
}

export default SponsorSlot
