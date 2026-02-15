interface PerformanceRatingProps {
  rating: number
}

export function PerformanceRating({ rating }: PerformanceRatingProps) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const progress = (rating / 100) * circumference
  const color = rating >= 80 ? '#22c55e' : rating >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex justify-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="70" cy="70" r={radius} fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>{rating}</span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
      </div>
    </div>
  )
}
