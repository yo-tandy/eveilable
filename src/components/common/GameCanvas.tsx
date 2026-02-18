import { useRef, useState, useEffect, createContext, useContext } from 'react'

interface GameDimensions {
  width: number
  height: number
  size: number // the smaller of width/height (square)
}

const GameDimensionsContext = createContext<GameDimensions>({ width: 0, height: 0, size: 0 })

export function useGameDimensions() {
  return useContext(GameDimensionsContext)
}

interface GameCanvasProps {
  children: React.ReactNode
}

export function GameCanvas({ children }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState<GameDimensions>({ width: 0, height: 0, size: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        const size = Math.min(width, height)
        setDimensions({ width, height, size })
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <GameDimensionsContext.Provider value={dimensions}>
      <div
        ref={containerRef}
        className="relative w-full mx-auto"
        style={{
          maxWidth: '800px',
          aspectRatio: '1',
        }}
      >
        {dimensions.size > 0 && (
          <div
            className="absolute inset-0 m-auto bg-white rounded-2xl overflow-hidden"
            style={{
              width: dimensions.size,
              height: dimensions.size,
              boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
            }}
          >
            {children}
          </div>
        )}
      </div>
    </GameDimensionsContext.Provider>
  )
}
