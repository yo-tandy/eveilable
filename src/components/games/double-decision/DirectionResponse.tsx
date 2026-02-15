import { ArrowLeft, ArrowRight } from 'lucide-react'

interface DirectionResponseProps {
  onSelect: (direction: string) => void
}

export function DirectionResponse({ onSelect }: DirectionResponseProps) {
  return (
    <div className="flex gap-4 justify-center">
      <button
        onClick={() => onSelect('left')}
        className="flex flex-col items-center gap-2 px-8 py-4 rounded-xl border-2 border-gray-200 hover:border-brand-500 hover:bg-brand-50 transition-colors min-w-[100px]"
      >
        <ArrowLeft size={32} className="text-gray-700" />
        <span className="text-sm font-medium">Left</span>
      </button>
      <button
        onClick={() => onSelect('right')}
        className="flex flex-col items-center gap-2 px-8 py-4 rounded-xl border-2 border-gray-200 hover:border-brand-500 hover:bg-brand-50 transition-colors min-w-[100px]"
      >
        <ArrowRight size={32} className="text-gray-700" />
        <span className="text-sm font-medium">Right</span>
      </button>
    </div>
  )
}
