import type { LucideIcon } from 'lucide-react'
import { HelpCircle } from 'lucide-react'

type CardPhase = 'memorize' | 'blink' | 'reveal' | 'feedback'

interface CardGridProps {
  icons: LucideIcon[]
  phase: CardPhase
  onCardClick?: (index: number) => void
  /** Index of the card that was swapped (shown during feedback) */
  correctIndex?: number
  /** Index the user clicked (shown during feedback) */
  selectedIndex?: number
}

export function CardGrid({
  icons,
  phase,
  onCardClick,
  correctIndex,
  selectedIndex,
}: CardGridProps) {
  const count = icons.length
  // Responsive grid: 4→2x2, 5-6→3x2, 7-8→4x2
  const cols = count <= 4 ? 2 : count <= 6 ? 3 : 4

  return (
    <div
      className="grid gap-4 justify-center mx-auto"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        maxWidth: cols * 140,
      }}
    >
      {icons.map((Icon, i) => {
        const isBlink = phase === 'blink'
        const isClickable = phase === 'reveal'
        const isFeedback = phase === 'feedback'

        // Feedback styling
        let borderColor = 'border-gray-200'
        let bgColor = 'bg-white'
        if (isFeedback && correctIndex !== undefined) {
          if (i === correctIndex && i === selectedIndex) {
            // User picked the correct card
            borderColor = 'border-green-400'
            bgColor = 'bg-green-50'
          } else if (i === selectedIndex && i !== correctIndex) {
            // User picked wrong card
            borderColor = 'border-red-400'
            bgColor = 'bg-red-50'
          } else if (i === correctIndex) {
            // Highlight the correct one the user missed
            borderColor = 'border-green-400'
            bgColor = 'bg-green-50'
          }
        }

        return (
          <button
            key={i}
            onClick={() => isClickable && onCardClick?.(i)}
            disabled={!isClickable}
            className={`
              aspect-square rounded-2xl border-2 flex items-center justify-center
              transition-all duration-150
              ${borderColor} ${bgColor}
              ${isClickable ? 'cursor-pointer hover:border-brand-400 hover:shadow-md active:scale-95' : ''}
              ${isBlink ? 'bg-gray-100' : ''}
            `}
          >
            {isBlink ? (
              <HelpCircle size={36} className="text-gray-300" />
            ) : (
              <Icon size={44} className="text-gray-700" />
            )}
          </button>
        )
      })}
    </div>
  )
}
