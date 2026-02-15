import { Car, SignpostBig } from 'lucide-react'
import { useGameDimensions } from '../../common/GameCanvas'
import { calculatePeripheralPositions } from '../../../utils/geometry'
import type { DifficultyParams } from '../../../types/game'

interface RoadSceneProps {
  direction: string // 'left' | 'right'
  signPosition: number
  distractorPositions: number[]
  showStimulus: boolean
  difficultyParams: DifficultyParams
}

const POSITION_COUNT = 8
const ICON_SIZE = 32

export function RoadScene({
  direction,
  signPosition,
  distractorPositions,
  showStimulus,
  difficultyParams,
}: RoadSceneProps) {
  const { size } = useGameDimensions()
  const positions = calculatePeripheralPositions(POSITION_COUNT, difficultyParams.peripheralDistance, size)

  return (
    <div className="absolute inset-0">
      {/* Road background */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto"
        style={{ width: size * 0.6, height: size * 0.15 }}>
        <div className="w-full h-full bg-gray-300 rounded relative">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 border-t-2 border-dashed border-white" />
        </div>
      </div>

      {showStimulus && (
        <>
          {/* Central car */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: size / 2 - 24,
              top: size / 2 - 24,
              width: 48,
              height: 48,
              transform: direction === 'left' ? 'scaleX(-1)' : 'none',
            }}
          >
            <Car size={40} className="text-brand-700" />
          </div>

          {/* Peripheral sign target */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: positions[signPosition].x - ICON_SIZE / 2,
              top: positions[signPosition].y - ICON_SIZE / 2,
              width: ICON_SIZE,
              height: ICON_SIZE,
            }}
          >
            <SignpostBig size={ICON_SIZE - 4} className="text-emerald-600" />
          </div>

          {/* Distractor signs */}
          {distractorPositions.map((posIndex) => {
            const opacity = 0.3 + difficultyParams.distractorSimilarity * 0.5
            return (
              <div
                key={posIndex}
                className="absolute flex items-center justify-center"
                style={{
                  left: positions[posIndex].x - ICON_SIZE / 2,
                  top: positions[posIndex].y - ICON_SIZE / 2,
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                  opacity,
                }}
              >
                <SignpostBig size={ICON_SIZE - 8} className="text-gray-400" />
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
