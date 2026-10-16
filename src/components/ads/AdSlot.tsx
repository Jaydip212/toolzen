import { cn } from '@/lib/utils'

/**
 * Advertisement slot.
 *
 * Deliberately isolated from all tool functionality: no tool imports this
 * module, and this module imports nothing from the tools.
 *
 * Behaviour:
 *  - Ads are OFF by default. Nothing is rendered unless `VITE_ADS_ENABLED` is
 *    exactly "true".
 *  - With ads enabled but no publisher id, an honest, clearly-labelled
 *    "reserved space" placeholder is shown so layouts can be reviewed. It is
 *    never disguised as a real advertisement.
 *  - With ads enabled and a publisher id, an AdSense-ready container is
 *    rendered. The AdSense loader script is intentionally NOT injected here;
 *    it is added in Phase 5 once the account is approved.
 */

const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED === 'true'
const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT ?? ''

export type AdPlacement =
  | 'homepage-banner'
  | 'category'
  | 'tool-top'
  | 'tool-bottom'
  | 'sidebar'

const placementLabels: Record<AdPlacement, string> = {
  'homepage-banner': 'Homepage banner',
  category: 'Category page',
  'tool-top': 'Tool page — top',
  'tool-bottom': 'Tool page — bottom',
  sidebar: 'Sidebar',
}

export interface AdSlotProps {
  placement: AdPlacement
  /** Minimum height reserved for the slot, in pixels. */
  minHeight?: number
  className?: string
}

export function AdSlot({ placement, minHeight = 96, className }: AdSlotProps) {
  if (!ADS_ENABLED) return null

  const wrapperClass = cn(
    'w-full overflow-hidden rounded-2xl border border-dashed border-line',
    className,
  )

  // Enabled, but no publisher id configured: show reserved space only.
  if (!ADSENSE_CLIENT) {
    return (
      <div
        className={cn(wrapperClass, 'flex items-center justify-center bg-surface-2/50')}
        style={{ minHeight }}
        data-ad-placement={placement}
        aria-hidden="true"
      >
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Ad space reserved · {placementLabels[placement]}
        </span>
      </div>
    )
  }

  // Enabled with a publisher id: an AdSense-ready container.
  return (
    <div className={wrapperClass} data-ad-placement={placement}>
      <ins
        className="adsbygoogle block"
        style={{ display: 'block', minHeight }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={placement}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}

export default AdSlot
