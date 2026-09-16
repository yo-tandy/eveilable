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
  const [maxSize, setMaxSize] = useState(800)

  // Track viewport height to cap canvas size
  useEffect(() => {
    function updateMaxSize() {
      // Leave room for header/controls (~160px) above/below the canvas
      const vh = window.innerHeight
      const vw = window.innerWidth
      setMaxSize(Math.min(800, vh - 160, vw))
    }
    updateMaxSize()
    window.addEventListener('resize', updateMaxSize)
    return () => window.removeEventListener('resize', updateMaxSize)
  }, [])

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
          maxWidth: `${maxSize}px`,
          aspectRatio: '1',
        }}
      >
        {dimensions.size > 0 && (
          <div
            className="absolute inset-0 m-auto sticker overflow-hidden"
            style={{ width: dimensions.size, height: dimensions.size }}
          >
            {children}
          </div>
        )}
      </div>
    </GameDimensionsContext.Provider>
  )
}
