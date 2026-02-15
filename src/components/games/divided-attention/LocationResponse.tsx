import { calculatePeripheralPositions } from '../../../utils/geometry'

interface LocationResponseProps {
  onSelect: (positionIndex: number) => void
  containerSize: number
  peripheralDistance: number
}

const POSITION_COUNT = 8
const ZONE_SIZE = 48

export function LocationResponse({ onSelect, containerSize, peripheralDistance }: LocationResponseProps) {
  const positions = calculatePeripheralPositions(POSITION_COUNT, peripheralDistance, containerSize)

  return (
    <div className="absolute inset-0 pointer-events-none">
      {positions.map((pos, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className="absolute pointer-events-auto rounded-full border-2 border-dashed border-gray-300 hover:border-brand-500 hover:bg-brand-50/50 transition-colors flex items-center justify-center"
          style={{
            left: pos.x - ZONE_SIZE / 2,
            top: pos.y - ZONE_SIZE / 2,
            width: ZONE_SIZE,
            height: ZONE_SIZE,
          }}
          aria-label={`Position ${index + 1}`}
        >
          <span className="text-xs text-gray-400 font-medium">{index + 1}</span>
        </button>
      ))}
    </div>
  )
}
