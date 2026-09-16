import { useTranslation } from 'react-i18next'

interface PerformanceRatingProps {
  rating: number
}

/** Score stamped on a sun-coloured badge with a dashed inner ring. */
export function PerformanceRating({ rating }: PerformanceRatingProps) {
  const { t } = useTranslation()
  const radius = 78
  const circumference = 2 * Math.PI * radius
  const progress = (rating / 100) * circumference

  return (
    <div className="flex justify-center">
      <div className="relative w-48 h-48 pop-in -rotate-6">
        <svg className="w-full h-full" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="92" fill="#1b1a2e" transform="translate(6 6)" />
          <circle cx="100" cy="100" r="92" fill="#ffc531" stroke="#1b1a2e" strokeWidth="4" />
          <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(27,26,46,.18)" strokeWidth="8" />
          <circle
            cx="100" cy="100" r={radius} fill="none"
            stroke="#1b1a2e" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            transform="rotate(-90 100 100)"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="display text-[64px] leading-none">{rating}</span>
          <span className="display text-xs tracking-[.14em] uppercase">{t('stats.score')}</span>
        </div>
      </div>
    </div>
  )
}
