import { Car, Truck, Target, Star, Circle, Square, Triangle, Hexagon, Diamond, Plus } from 'lucide-react'
import { useGameDimensions } from '../../common/GameCanvas'
import { calculatePeripheralPositions } from '../../../utils/geometry'
import type { DifficultyParams } from '../../../types/game'

interface StimulusDisplayProps {
  centralType: string
  peripheralPosition: number
  distractorPositions: number[]
  showStimulus: boolean
  difficultyParams: DifficultyParams
}

const CENTRAL_ICONS: Record<string, typeof Car> = {
  car: Car,
  truck: Truck,
}

const PERIPHERAL_ICON = Target

const DISTRACTOR_ICONS = [Star, Circle, Square, Triangle, Hexagon, Diamond]

const POSITION_COUNT = 8
const ICON_SIZE = 32

export function StimulusDisplay({
  centralType,
  peripheralPosition,
  distractorPositions,
  showStimulus,
  difficultyParams,
}: StimulusDisplayProps) {
  const { size } = useGameDimensions()
  const positions = calculatePeripheralPositions(POSITION_COUNT, difficultyParams.peripheralDistance, size)

  const CentralIcon = CENTRAL_ICONS[centralType]

  return (
    <div className="absolute inset-0">
      {/* Fixation cross - always visible */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: size / 2 - 16,
          top: size / 2 - 16,
          width: 32,
          height: 32,
        }}
      >
        <Plus size={24} className="text-gray-400" strokeWidth={1.5} />
      </div>

      {showStimulus && (
        <>
          {/* Central stimulus */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: size / 2 - 24,
              top: size / 2 - 24,
              width: 48,
              height: 48,
            }}
          >
            {CentralIcon && <CentralIcon size={40} className="text-brand-700" />}
          </div>

          {/* Peripheral target */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: positions[peripheralPosition].x - ICON_SIZE / 2,
              top: positions[peripheralPosition].y - ICON_SIZE / 2,
              width: ICON_SIZE,
              height: ICON_SIZE,
            }}
          >
            <PERIPHERAL_ICON size={ICON_SIZE - 4} className="text-brand-600" />
          </div>

          {/* Distractors */}
          {distractorPositions.map((posIndex, i) => {
            const DistractorIcon = DISTRACTOR_ICONS[i % DISTRACTOR_ICONS.length]
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
                <DistractorIcon size={ICON_SIZE - 8} className="text-gray-500" />
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
