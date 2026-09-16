import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ExternalLink } from 'lucide-react'
import type { CategoryConfig } from '../../config/games'

interface GameCardProps {
  category: CategoryConfig
  icon: LucideIcon
  title: string
  description: string
  /** Small stamp in the corner of the art panel, e.g. "LV 7" or "B2". */
  badge?: string
  /** Router path (internal) or absolute href (external, opens a new tab). */
  to: string
  external?: boolean
  /** 0-based position in its grid, used to alternate the sticker tilt. */
  index?: number
  /** Optional row under the description, e.g. level pips. */
  footer?: ReactNode
  /** Compact horizontal layout for list pages. */
  variant?: 'tile' | 'row'
}

const TILTS = ['tilt-a', 'tilt-b', 'tilt-c']

/** A game as a tilted sticker: patterned art panel, display title, one-line blurb. */
export function GameCard({
  category,
  icon: Icon,
  title,
  description,
  badge,
  to,
  external = false,
  index = 0,
  footer,
  variant = 'tile',
}: GameCardProps) {
  const tilt = TILTS[index % TILTS.length]
  const className = `sticker sticker-lift ${tilt} block text-ink no-underline ${
    variant === 'tile' ? 'p-4' : 'p-3'
  }`

  const body =
    variant === 'tile' ? (
      <>
        <div className={`art ${category.art} h-24 mb-3.5`}>
          {badge && <span className="art-badge">{badge}</span>}
          <Icon size={44} strokeWidth={2.4} aria-hidden="true" />
        </div>
        <h3 className="display text-[22px] leading-tight mb-1 flex items-center gap-2">
          {title}
          {external && <ExternalLink size={16} className="text-ink-3" aria-hidden="true" />}
        </h3>
        <p className="text-sm text-ink-2 leading-snug">{description}</p>
        {footer && <div className="mt-3">{footer}</div>}
      </>
    ) : (
      <div className="flex items-center gap-4">
        <div className={`art ${category.art} w-16 h-16 shrink-0`}>
          <Icon size={30} strokeWidth={2.4} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="display text-xl leading-tight flex items-center gap-2">
            {title}
            {external && <ExternalLink size={15} className="text-ink-3" aria-hidden="true" />}
          </h3>
          <p className="text-sm text-ink-2 leading-snug">{description}</p>
        </div>
        {badge && <span className="chip">{badge}</span>}
      </div>
    )

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={className}>
        {body}
      </a>
    )
  }
  return (
    <Link to={to} className={className}>
      {body}
    </Link>
  )
}
