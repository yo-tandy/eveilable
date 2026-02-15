import type { Timestamp } from 'firebase/firestore'
import type { GameType } from './game'

export type SupportedLanguage = 'en' | 'fr' | 'zh' | 'he'
export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  createdAt: Timestamp
  preferredLanguage: SupportedLanguage
  settings: UserSettings
}

export interface UserSettings {
  reducedMotion: boolean
  uiLanguage: SupportedLanguage
}

export interface RecentSessionSummary {
  sessionId: string
  accuracy: number
  avgResponseTime: number
  finalDifficulty: number
  performanceRating: number
  date: Timestamp
}

export interface AggregateStats {
  gameType: GameType
  totalSessions: number
  totalTrials: number
  lifetimeAccuracy: number
  bestAccuracy: number
  bestSessionId: string
  averageResponseTimeMs: number
  currentDifficultyLevel: number
  recentTrend: 'improving' | 'stable' | 'declining'
  lastPlayedAt: Timestamp
  recentSessions: RecentSessionSummary[]
}
