interface TimerProps {
  totalSeconds: number
  elapsedSeconds: number
  variant: 'countdown' | 'elapsed'
}

export function Timer({ totalSeconds, elapsedSeconds, variant }: TimerProps) {
  const remaining = Math.max(0, totalSeconds - elapsedSeconds)
  const displaySeconds = variant === 'countdown' ? remaining : elapsedSeconds
  const minutes = Math.floor(displaySeconds / 60)
  const seconds = displaySeconds % 60
  const progress = variant === 'countdown'
    ? remaining / totalSeconds
    : Math.min(elapsedSeconds / totalSeconds, 1)
  const isUrgent = variant === 'countdown' && remaining <= 10

  return (
    <div className="text-center mb-4">
      <div className={`text-2xl font-mono font-bold ${isUrgent ? 'text-red-600' : 'text-gray-700'}`}>
        {minutes}:{String(seconds).padStart(2, '0')}
      </div>
      {variant === 'countdown' && (
        <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-red-500' : 'bg-brand-500'}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}
