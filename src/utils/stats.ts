export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

export function stddev(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  const squaredDiffs = values.map((v) => (v - m) ** 2)
  return Math.sqrt(mean(squaredDiffs))
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(idx)
  const upper = Math.ceil(idx)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower)
}

/** Clamp value to [min, max]. */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  const clamped = Math.max(Math.min(value, Math.max(inMin, inMax)), Math.min(inMin, inMax))
  return outMin + ((clamped - inMin) / (inMax - inMin)) * (outMax - outMin)
}

/**
 * Compute slope of a simple linear regression on y values.
 * X values are assumed to be equally spaced (0, 1, 2, ...).
 */
export function linearRegressionSlope(values: number[]): number {
  const n = values.length
  if (n < 2) return 0
  const xMean = (n - 1) / 2
  const yMean = mean(values)

  let numerator = 0
  let denominator = 0
  for (let i = 0; i < n; i++) {
    const xDiff = i - xMean
    numerator += xDiff * (values[i] - yMean)
    denominator += xDiff * xDiff
  }

  return denominator === 0 ? 0 : numerator / denominator
}
