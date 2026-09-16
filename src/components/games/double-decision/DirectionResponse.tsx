import { ArrowLeft, ArrowRight } from 'lucide-react'

interface DirectionResponseProps {
  onSelect: (direction: string) => void
}

export function DirectionResponse({ onSelect }: DirectionResponseProps) {
  return (
    <div className="flex gap-4 justify-center">
      <button
        onClick={() => onSelect('left')}
        className="flex flex-col items-center gap-2 px-8 py-4 sticker-sm sticker-lift min-w-[100px]"
      >
        <ArrowLeft size={32} className="text-ink" />
        <span className="display text-base">Left</span>
      </button>
      <button
        onClick={() => onSelect('right')}
        className="flex flex-col items-center gap-2 px-8 py-4 sticker-sm sticker-lift min-w-[100px]"
      >
        <ArrowRight size={32} className="text-ink" />
        <span className="display text-base">Right</span>
      </button>
    </div>
  )
}
