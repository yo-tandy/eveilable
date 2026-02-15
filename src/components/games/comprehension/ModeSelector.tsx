import { BookOpen, Timer } from 'lucide-react'

interface ModeSelectorProps {
  onSelect: (mode: 'complete' | 'race') => void
  error: string | null
}

export function ModeSelector({ onSelect, error }: ModeSelectorProps) {
  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Mode</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}. Tap a mode to retry.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => onSelect('complete')}
          className="p-6 rounded-2xl border-2 border-gray-200 hover:border-brand-500 hover:bg-brand-50 transition-colors text-left"
        >
          <BookOpen size={32} className="text-brand-600 mb-3" />
          <h3 className="text-lg font-bold">Complete the Tasks</h3>
          <p className="text-gray-500 mt-1">
            Work at your own pace. Time is recorded but not enforced.
          </p>
        </button>

        <button
          onClick={() => onSelect('race')}
          className="p-6 rounded-2xl border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-colors text-left"
        >
          <Timer size={32} className="text-orange-600 mb-3" />
          <h3 className="text-lg font-bold">Race the Clock</h3>
          <p className="text-gray-500 mt-1">
            Beat the clock. Reading and questions are timed with countdown timers.
          </p>
        </button>
      </div>
    </div>
  )
}
