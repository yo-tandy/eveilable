import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface CountdownOverlayProps {
  onComplete: () => void
}

export function CountdownOverlay({ onComplete }: CountdownOverlayProps) {
  const { t } = useTranslation()
  const [count, setCount] = useState(3)

  useEffect(() => {
    if (count === 0) {
      onComplete()
      return
    }

    const timer = setTimeout(() => {
      setCount((c) => c - 1)
    }, 800)

    return () => clearTimeout(timer)
  }, [count, onComplete])

  return (
    <div className="overlay" aria-live="assertive">
      <span
        key={count}
        className="pop-in display text-[96px] leading-none bg-sun border-3 border-ink rounded-3xl px-8 py-2 shadow-[6px_6px_0_#1b1a2e]"
      >
        {count === 0 ? t('common.go') : count}
      </span>
    </div>
  )
}
