import type { GameType, DifficultyParams, Trial } from '../types/game'

const DIVIDED_ATTENTION_TABLE: DifficultyParams[] = Array.from({ length: 20 }, (_, i) => {
  const level = i + 1
  return {
    level,
    flashDurationMs: Math.round(600 - (level - 1) * (450 / 19)),    // 600ms -> 150ms
    peripheralDistance: 0.25 + (level - 1) * (0.20 / 19),           // 25% -> 45% of container
    distractorCount: Math.round((level - 1) * (6 / 19)),            // 0 -> 6
    distractorSimilarity: 0.3 + (level - 1) * (0.5 / 19),          // 0.3 -> 0.8
  }
})

const DOUBLE_DECISION_TABLE: DifficultyParams[] = Array.from({ length: 20 }, (_, i) => {
  const level = i + 1
  return {
    level,
    flashDurationMs: Math.round(800 - (level - 1) * (600 / 19)),    // 800ms -> 200ms
    peripheralDistance: 0.30 + (level - 1) * (0.15 / 19),           // 30% -> 45%
    distractorCount: Math.round((level - 1) * (6 / 19)),            // 0 -> 6
    distractorSimilarity: 0.3 + (level - 1) * (0.5 / 19),
  }
})

const ICON_SWAP_TABLE: DifficultyParams[] = Array.from({ length: 20 }, (_, i) => {
  const level = i + 1
  const cardCount = level < 6 ? 4 : level < 10 ? 5 : level < 14 ? 6 : level < 18 ? 7 : 8
  return {
    level,
    flashDurationMs: 0,
    peripheralDistance: 0,
    distractorCount: 0,
    distractorSimilarity: 0,
    memorizeTimeMs: Math.round(3000 - (level - 1) * (2500 / 19)),   // 3000ms -> 500ms
    blinkDurationMs: Math.round(400 - (level - 1) * (190 / 19)),    // 400ms -> 210ms
    cardCount,                                                        // 4 -> 8
    iconPoolSize: Math.round(12 + (level - 1) * (28 / 19)),         // 12 -> 40
  }
})

export function getDifficultyParams(level: number, gameType: GameType): DifficultyParams {
  const clamped = Math.max(1, Math.min(20, level))
  const table =
    gameType === 'double-decision' ? DOUBLE_DECISION_TABLE :
    gameType === 'icon-swap' ? ICON_SWAP_TABLE :
    DIVIDED_ATTENTION_TABLE
  return table[clamped - 1]
}

/**
 * Compute next difficulty level based on trial history.
 * Level up: 3 consecutive correct OR >80% accuracy over last 10 trials.
 * Level down: 2 consecutive incorrect OR <50% accuracy over last 10 trials.
 */
export function computeNextLevel(
  currentLevel: number,
  trials: Trial[],
  consecutiveCorrect: number,
  consecutiveIncorrect: number,
): number {
  // Check consecutive streaks first
  if (consecutiveCorrect >= 3) {
    return Math.min(20, currentLevel + 1)
  }
  if (consecutiveIncorrect >= 2) {
    return Math.max(1, currentLevel - 1)
  }

  // Check rolling window accuracy
  if (trials.length >= 10) {
    const recent = trials.slice(-10)
    const accuracy = recent.filter((t) => t.correct).length / recent.length
    if (accuracy > 0.8) {
      return Math.min(20, currentLevel + 1)
    }
    if (accuracy < 0.5) {
      return Math.max(1, currentLevel - 1)
    }
  }

  return currentLevel
}
