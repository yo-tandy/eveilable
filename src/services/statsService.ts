import { mean, median, stddev, mapRange, linearRegressionSlope } from '../utils/stats'
import type { Trial } from '../types/game'

export interface SessionStats {
  totalTrials: number
  correctTrials: number
  accuracy: number
  averageResponseTimeMs: number
  medianResponseTimeMs: number
  responseTimeStdDev: number
  correctAvgTime: number
  incorrectAvgTime: number
  fastestCorrectTime: number
  slowestCorrectTime: number
  difficultyProgression: number[]
  finalDifficulty: number
}

export function computeSessionStats(trials: Trial[]): SessionStats {
  if (trials.length === 0) {
    return {
      totalTrials: 0, correctTrials: 0, accuracy: 0,
      averageResponseTimeMs: 0, medianResponseTimeMs: 0, responseTimeStdDev: 0,
      correctAvgTime: 0, incorrectAvgTime: 0, fastestCorrectTime: 0, slowestCorrectTime: 0,
      difficultyProgression: [], finalDifficulty: 1,
    }
  }

  const correctTrials = trials.filter((t) => t.correct)
  const incorrectTrials = trials.filter((t) => !t.correct)
  const allTimes = trials.map((t) => t.responseTimeMs)
  const correctTimes = correctTrials.map((t) => t.responseTimeMs)
  const incorrectTimes = incorrectTrials.map((t) => t.responseTimeMs)

  return {
    totalTrials: trials.length,
    correctTrials: correctTrials.length,
    accuracy: correctTrials.length / trials.length,
    averageResponseTimeMs: mean(allTimes),
    medianResponseTimeMs: median(allTimes),
    responseTimeStdDev: stddev(allTimes),
    correctAvgTime: mean(correctTimes),
    incorrectAvgTime: mean(incorrectTimes),
    fastestCorrectTime: correctTimes.length > 0 ? Math.min(...correctTimes) : 0,
    slowestCorrectTime: correctTimes.length > 0 ? Math.max(...correctTimes) : 0,
    difficultyProgression: trials.map((t) => t.difficultyLevel),
    finalDifficulty: trials[trials.length - 1]?.difficultyLevel ?? 1,
  }
}

/**
 * Composite performance rating from 0 to 100.
 * Weighted: accuracy 40%, speed 30%, difficulty 30%.
 */
export function computePerformanceRating(stats: SessionStats): number {
  const accuracyScore = stats.accuracy * 100

  const speedScore = stats.correctAvgTime > 0
    ? mapRange(stats.correctAvgTime, 2000, 200, 0, 100)
    : 50

  const difficultyScore = (stats.finalDifficulty / 20) * 100

  return Math.round(
    Math.max(0, Math.min(100,
      accuracyScore * 0.4 + speedScore * 0.3 + difficultyScore * 0.3
    ))
  )
}

/**
 * Trend from recent session accuracies.
 */
export function computeTrend(
  recentAccuracies: number[],
): 'improving' | 'stable' | 'declining' {
  if (recentAccuracies.length < 3) return 'stable'

  const slope = linearRegressionSlope(recentAccuracies)
  if (slope > 0.02) return 'improving'
  if (slope < -0.02) return 'declining'
  return 'stable'
}
