import type { LanguageSubLevel, LanguageLevelConfig } from '../types/user'
import { levelOrderOf } from './levelScale'

const SUB_ORDER: LanguageSubLevel[] = ['novice', 'well-placed', 'advanced']

interface ProgressionResult {
  changed: boolean
  newConfig: LanguageLevelConfig
  direction?: 'up' | 'down'
}

/**
 * Check if the user should advance or regress based on recent scores.
 * - Upgrade: last 2 sessions with overallScore >= 8
 * - Downgrade: last 2 sessions with overallScore <= 4
 * Capped at the top and bottom of the language's scale (C2 / HSK9 advanced, A1 / HSK1 novice).
 */
export function checkLevelProgression(
  current: LanguageLevelConfig,
  recentScores: number[],
): ProgressionResult {
  const noChange: ProgressionResult = { changed: false, newConfig: current }

  if (recentScores.length < 2) return noChange

  const last2 = recentScores.slice(-2)

  // Upgrade: last 2 scores all >= 8
  if (last2.every((s) => s >= 8)) {
    const next = stepUp(current)
    if (next) {
      return { changed: true, newConfig: next, direction: 'up' }
    }
  }

  // Downgrade: last 2 scores all <= 4
  if (last2.every((s) => s <= 4)) {
    const prev = stepDown(current)
    if (prev) {
      return { changed: true, newConfig: prev, direction: 'down' }
    }
  }

  return noChange
}

function stepUp(config: LanguageLevelConfig): LanguageLevelConfig | null {
  const order = levelOrderOf(config.cefr)
  const cefrIdx = order.indexOf(config.cefr)
  const subIdx = SUB_ORDER.indexOf(config.sub)

  if (subIdx < SUB_ORDER.length - 1) {
    // Move to next sub-level within same CEFR
    return { cefr: config.cefr, sub: SUB_ORDER[subIdx + 1] }
  }

  if (cefrIdx < order.length - 1) {
    // Move to novice of next level
    return { cefr: order[cefrIdx + 1], sub: 'novice' }
  }

  // Already at the top of the scale, can't go higher
  return null
}

function stepDown(config: LanguageLevelConfig): LanguageLevelConfig | null {
  const order = levelOrderOf(config.cefr)
  const cefrIdx = order.indexOf(config.cefr)
  const subIdx = SUB_ORDER.indexOf(config.sub)

  if (subIdx > 0) {
    // Move to previous sub-level within same CEFR
    return { cefr: config.cefr, sub: SUB_ORDER[subIdx - 1] }
  }

  if (cefrIdx > 0) {
    // Move to advanced of previous level
    return { cefr: order[cefrIdx - 1], sub: 'advanced' }
  }

  // Already at the bottom of the scale, can't go lower
  return null
}
