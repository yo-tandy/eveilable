export interface Position {
  x: number
  y: number
}

/**
 * Calculate N equidistant positions on a circle around the center.
 * @param count Number of positions (typically 8)
 * @param distance Distance from center as fraction of container size (0-0.5)
 * @param containerSize Width/height of the square container
 * @returns Array of {x, y} positions in pixels
 */
export function calculatePeripheralPositions(
  count: number,
  distance: number,
  containerSize: number,
): Position[] {
  const center = containerSize / 2
  const radius = distance * containerSize
  const positions: Position[] = []

  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2 // start from top
    positions.push({
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    })
  }

  return positions
}

/**
 * Check if a tap position is within tolerance of a target position.
 */
export function isPositionHit(
  tap: Position,
  target: Position,
  tolerance: number,
): boolean {
  const dx = tap.x - target.x
  const dy = tap.y - target.y
  return Math.sqrt(dx * dx + dy * dy) <= tolerance
}
