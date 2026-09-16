import type { Timestamp } from 'firebase/firestore'
import type { GameType } from './game'

export type SupportedLanguage = 'en' | 'fr' | 'zh' | 'he' | 'de' | 'it'
/** CEFR band for most languages; HSK 3.0 band for Chinese. */
export type LanguageLevel =
  | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  | 'HSK1' | 'HSK2' | 'HSK3' | 'HSK4' | 'HSK5' | 'HSK6' | 'HSK7' | 'HSK8' | 'HSK9'
export type LanguageSubLevel = 'novice' | 'well-placed' | 'advanced'

export interface LanguageLevelConfig {
  /** Main level on the language's scale (CEFR or HSK). Field name kept for stored-settings compatibility. */
  cefr: LanguageLevel
  sub: LanguageSubLevel
}

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
