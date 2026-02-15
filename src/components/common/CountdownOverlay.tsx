import { useState, useEffect } from 'react'

interface CountdownOverlayProps {
  onComplete: () => void
}

export function CountdownOverlay({ onComplete }: CountdownOverlayProps) {
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
    <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
      <span
        key={count}
        className="text-7xl font-bold text-brand-600 animate-pulse"
      >
        {count === 0 ? 'Go!' : count}
      </span>
    </div>
  )
}
