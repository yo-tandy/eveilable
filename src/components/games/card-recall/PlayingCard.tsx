export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'

export interface PlayingCardData {
  suit: Suit
  rank: Rank
}

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
  spades: '\u2660',
}

const isRed = (suit: Suit) => suit === 'hearts' || suit === 'diamonds'

interface PlayingCardProps {
  card: PlayingCardData
  size?: 'sm' | 'md' | 'lg'
  selected?: boolean
  selectionOrder?: number
  faceDown?: boolean
  correct?: boolean | null
  onClick?: () => void
  disabled?: boolean
  className?: string
}

const SIZE_CLASSES = {
  sm: 'w-16 h-24 text-xs',
  md: 'w-24 h-36 text-sm',
  lg: 'w-32 h-48 text-base',
} as const

const CENTER_SIZES = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-5xl',
} as const

export function PlayingCard({
  card,
  size = 'md',
  selected = false,
  selectionOrder,
  faceDown = false,
  correct = null,
  onClick,
  disabled = false,
  className = '',
}: PlayingCardProps) {
  const symbol = SUIT_SYMBOL[card.suit]
  const red = isRed(card.suit)
  const colorClass = red ? 'text-red-600' : 'text-ink'

  const ringClass =
    correct === true ? 'ring-2 ring-green-500 ring-offset-2' :
    correct === false ? 'ring-2 ring-red-500 ring-offset-2' :
    selected ? 'ring-2 ring-violet-500 ring-offset-2' :
    ''

  if (faceDown) {
    return (
      <div
        className={`${SIZE_CLASSES[size]} rounded-2xl relative overflow-hidden
          bg-gradient-to-br from-violet-600 to-purple-800 border border-violet-400/50
          shadow-lg ${className}`}
      >
        {/* Crosshatch pattern */}
        <div
          className="absolute inset-2 rounded-xl border border-white/20"
          style={{
            background: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 4px,
              rgba(255,255,255,0.08) 4px,
              rgba(255,255,255,0.08) 5px
            ), repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 4px,
              rgba(255,255,255,0.08) 4px,
              rgba(255,255,255,0.08) 5px
            )`,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/30 display text-[28px]">🃏</div>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${SIZE_CLASSES[size]} rounded-2xl relative
        bg-white/90 backdrop-blur-sm border border-white/50
        shadow-lg transition-all duration-150
        ${ringClass}
        ${onClick && !disabled ? 'cursor-pointer hover:shadow-xl hover:scale-[1.03] active:scale-[0.98]' : ''}
        ${disabled ? 'opacity-60 cursor-default' : ''}
        ${className}`}
    >
      {/* Top-left corner */}
      <div className={`absolute top-1.5 left-2 leading-tight font-bold ${colorClass}`}>
        <div className={size === 'sm' ? 'text-[10px]' : 'text-xs'}>{card.rank}</div>
        <div className={size === 'sm' ? 'text-[10px] -mt-0.5' : 'text-xs -mt-0.5'}>{symbol}</div>
      </div>

      {/* Center pip */}
      <div className={`absolute inset-0 flex items-center justify-center ${colorClass} ${CENTER_SIZES[size]}`}>
        {symbol}
      </div>

      {/* Bottom-right corner (rotated) */}
      <div className={`absolute bottom-1.5 right-2 leading-tight font-bold rotate-180 ${colorClass}`}>
        <div className={size === 'sm' ? 'text-[10px]' : 'text-xs'}>{card.rank}</div>
        <div className={size === 'sm' ? 'text-[10px] -mt-0.5' : 'text-xs -mt-0.5'}>{symbol}</div>
      </div>

      {/* Selection order badge */}
      {selectionOrder != null && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-violet-600 text-white rounded-full
          flex items-center justify-center text-xs font-bold shadow-md z-10">
          {selectionOrder}
        </div>
      )}

      {/* Correct/incorrect icon */}
      {correct === true && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 text-white rounded-full
          flex items-center justify-center text-xs font-bold shadow-md z-10">
          ✓
        </div>
      )}
      {correct === false && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full
          flex items-center justify-center text-xs font-bold shadow-md z-10">
          ✗
        </div>
      )}
    </button>
  )
}
