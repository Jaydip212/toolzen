import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { isFavorite, toggleFavorite } from '@/lib/usage'

/**
 * Favourite toggle for a tool.
 *
 * A pressed star, persisted in this browser only. No account, no server, and
 * the label always says which state a screen reader will announce.
 */
export function FavoriteButton({ toolId, toolName }: { toolId: string; toolName: string }) {
  const [favorite, setFavorite] = useState(false)

  // Read once on mount; the star is not reactive to other tabs and that is fine.
  useEffect(() => {
    setFavorite(isFavorite(toolId))
  }, [toolId])

  function handleClick() {
    setFavorite(toggleFavorite(toolId))
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={favorite}
      aria-label={
        favorite ? `Remove ${toolName} from favourites` : `Add ${toolName} to favourites`
      }
      title={favorite ? 'Remove from favourites' : 'Add to favourites'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
        favorite
          ? 'border-brand/50 bg-brand-soft text-brand'
          : 'border-line text-muted hover:border-brand/40 hover:text-brand'
      }`}
    >
      <Icon name="star" size={17} />
    </button>
  )
}

export default FavoriteButton
