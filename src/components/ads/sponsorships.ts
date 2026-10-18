/**
 * Direct sponsorship configuration.
 *
 * Sponsorships are owner-supplied campaigns, entered here — not in environment
 * variables, because a logo URL and a date window are data, not secrets. The
 * list ships EMPTY: TOOLZEN renders no sponsor card, label or link until the
 * owner adds a real campaign, and nothing in this module invents names,
 * logos, dates or performance numbers.
 *
 * A campaign renders only while `today` falls inside [start, end]. Both bounds
 * are inclusive; end-of-day is handled by comparing ISO date strings.
 */

export interface Sponsorship {
  /** The sponsor's name. Used as the visible label and the image alt text. */
  name: string
  /** Logo or banner image, served from this site ("/x.png") or https://. */
  imageUrl: string
  /** Destination URL. Must be https; anything else is refused. */
  targetUrl: string
  /** ISO date (YYYY-MM-DD) the campaign starts, inclusive. */
  start: string
  /** ISO date (YYYY-MM-DD) the campaign ends, inclusive. */
  end: string
  /** Where the card may appear. */
  placements: ('home' | 'category')[]
}

/**
 * Owner-supplied campaigns. Intentionally empty in the repository — add real
 * agreements here, never placeholders that could ship by accident.
 */
export const SPONSORSHIPS: Sponsorship[] = []

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const SAFE_URL = /^https:\/\/[^\s"'>]+$/i

/** Every reason a campaign is unusable, for the owner-facing diagnostics. */
export function validateSponsorship(sponsor: Sponsorship): string[] {
  const problems: string[] = []
  if (sponsor.name.trim() === '') problems.push('name is empty')
  if (!SAFE_URL.test(sponsor.imageUrl)) problems.push('imageUrl must be a site path or https URL')
  if (!SAFE_URL.test(sponsor.targetUrl)) problems.push('targetUrl must be an https URL')
  if (!ISO_DATE.test(sponsor.start)) problems.push('start must be an ISO date (YYYY-MM-DD)')
  if (!ISO_DATE.test(sponsor.end)) problems.push('end must be an ISO date (YYYY-MM-DD)')
  if (ISO_DATE.test(sponsor.start) && ISO_DATE.test(sponsor.end) && sponsor.end < sponsor.start) {
    problems.push('end is before start')
  }
  if (sponsor.placements.length === 0) problems.push('no placements selected')
  return problems
}

/** Campaigns that are valid and inside their date window today. */
export function activeSponsorships(
  placements: Sponsorship['placements'],
  today: string = new Date().toISOString().slice(0, 10),
  list: Sponsorship[] = SPONSORSHIPS,
): Sponsorship[] {
  return list.filter(
    (sponsor) =>
      validateSponsorship(sponsor).length === 0 &&
      sponsor.placements.some((placement) => placements.includes(placement)) &&
      sponsor.start <= today &&
      today <= sponsor.end,
  )
}
