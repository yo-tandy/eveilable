import type { Timestamp } from 'firebase/firestore'

export type GameType = 'divided-attention' | 'double-decision' | 'comprehension' | 'speed-summary' | 'icon-swap' | 'tense-rewrite'

export type GamePhase =
  | 'idle'
  | 'countdown'
  | 'stimulus'
  | 'response-central'
  | 'response-peripheral'
  | 'feedback'
  | 'continue-prompt'
  | 'end'

export interface DifficultyParams {
  level: number
  flashDurationMs: number
  peripheralDistance: number
  distractorCount: number
  distractorSimilarity: number
  // icon-swap specific
  memorizeTimeMs?: number
  blinkDurationMs?: number
  cardCount?: number
  iconPoolSize?: number
}

export interface Trial {
  trialNumber: number
  stimulusType: string
  correct: boolean
  centralCorrect?: boolean
  peripheralCorrect?: boolean
  responseTimeMs: number
  difficultyLevel: number
  centralAnswer?: string
  peripheralAnswer?: number
  timestamp: number
}

export interface GameSession {
  id: string
  gameType: GameType
  startedAt: Timestamp
  endedAt?: Timestamp
  totalTrials: number
  correctTrials: number
  accuracy: number
  averageResponseTimeMs: number
  finalDifficulty: number
  difficultyProgression: number[]
  performanceRating: number
  // comprehension-specific
  language?: string
  level?: string
  subLevel?: string
  readingTimeSeconds?: number
  questionsCorrect?: number
  questionsTotal?: number
  summaryScore?: {
    accuracyScore: number
    vocabularyScore: number
    grammarScore: number
    overallScore: number
    feedback: string
  }
}
