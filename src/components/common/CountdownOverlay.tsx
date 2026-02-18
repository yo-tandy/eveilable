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
    <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}>
      <span
        key={count}
        className="text-7xl font-bold text-gray-800 animate-pulse"
      >
        {count === 0 ? 'Go!' : count}
      </span>
    </div>
  )
}
