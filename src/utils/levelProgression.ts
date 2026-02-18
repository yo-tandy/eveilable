import type { LanguageLevel, LanguageSubLevel, LanguageLevelConfig } from '../types/user'

const CEFR_ORDER: LanguageLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const SUB_ORDER: LanguageSubLevel[] = ['novice', 'well-placed', 'advanced']

interface ProgressionResult {
  changed: boolean
  newConfig: LanguageLevelConfig
  direction?: 'up' | 'down'
}

/**
 * Check if the user should advance or regress based on recent scores.
 * - Upgrade: 3 consecutive sessions with overallScore >= 8
 * - Downgrade: 2 consecutive sessions with overallScore <= 4
 * Capped at C2-advanced (top) and A1-novice (bottom).
 */
export function checkLevelProgression(
  current: LanguageLevelConfig,
  recentScores: number[],
): ProgressionResult {
  const noChange: ProgressionResult = { changed: false, newConfig: current }

  if (recentScores.length === 0) return noChange

  // Check for upgrade: last 3 scores all >= 8
  if (recentScores.length >= 3) {
    const last3 = recentScores.slice(-3)
    if (last3.every((s) => s >= 8)) {
      const next = stepUp(current)
      if (next) {
        return { changed: true, newConfig: next, direction: 'up' }
      }
    }
  }

  // Check for downgrade: last 2 scores all <= 4
  if (recentScores.length >= 2) {
    const last2 = recentScores.slice(-2)
    if (last2.every((s) => s <= 4)) {
      const prev = stepDown(current)
      if (prev) {
        return { changed: true, newConfig: prev, direction: 'down' }
      }
    }
  }

  return noChange
}

function stepUp(config: LanguageLevelConfig): LanguageLevelConfig | null {
  const cefrIdx = CEFR_ORDER.indexOf(config.cefr)
  const subIdx = SUB_ORDER.indexOf(config.sub)

  if (subIdx < SUB_ORDER.length - 1) {
    // Move to next sub-level within same CEFR
    return { cefr: config.cefr, sub: SUB_ORDER[subIdx + 1] }
  }

  if (cefrIdx < CEFR_ORDER.length - 1) {
    // Move to novice of next CEFR level
    return { cefr: CEFR_ORDER[cefrIdx + 1], sub: 'novice' }
  }

  // Already at C2-advanced, can't go higher
  return null
}

function stepDown(config: LanguageLevelConfig): LanguageLevelConfig | null {
  const cefrIdx = CEFR_ORDER.indexOf(config.cefr)
  const subIdx = SUB_ORDER.indexOf(config.sub)

  if (subIdx > 0) {
    // Move to previous sub-level within same CEFR
    return { cefr: config.cefr, sub: SUB_ORDER[subIdx - 1] }
  }

  if (cefrIdx > 0) {
    // Move to advanced of previous CEFR level
    return { cefr: CEFR_ORDER[cefrIdx - 1], sub: 'advanced' }
  }

  // Already at A1-novice, can't go lower
  return null
}
