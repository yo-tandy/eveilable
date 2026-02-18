import { doc, getDoc, setDoc, collection, query, where, limit, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { computeTrend } from './statsService'
import type { GameType, GameSession } from '../types/game'
import type { AggregateStats, RecentSessionSummary } from '../types/user'

function createEmptyAggregateStats(gameType: GameType): AggregateStats {
  return {
    gameType,
    totalSessions: 0,
    totalTrials: 0,
    lifetimeAccuracy: 0,
    bestAccuracy: 0,
    bestSessionId: '',
    averageResponseTimeMs: 0,
    currentDifficultyLevel: 1,
    recentTrend: 'stable',
    lastPlayedAt: Timestamp.now(),
    recentSessions: [],
  }
}

export async function getAggregateStats(
  uid: string,
  gameType: GameType,
): Promise<AggregateStats | null> {
  const ref = doc(db, 'users', uid, 'aggregateStats', gameType)
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data() as AggregateStats) : null
}

export async function updateAggregateStats(
  uid: string,
  gameType: GameType,
  session: GameSession,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'aggregateStats', gameType)
  const snap = await getDoc(ref)
  const existing = snap.exists()
    ? (snap.data() as AggregateStats)
    : createEmptyAggregateStats(gameType)

  const newTotalTrials = existing.totalTrials + session.totalTrials
  const newTotalSessions = existing.totalSessions + 1

  const newLifetimeAccuracy = newTotalTrials > 0
    ? (existing.lifetimeAccuracy * existing.totalTrials + session.accuracy * session.totalTrials)
      / newTotalTrials
    : 0

  const newAvgResponseTime = newTotalTrials > 0
    ? (existing.averageResponseTimeMs * existing.totalTrials +
       session.averageResponseTimeMs * session.totalTrials)
      / newTotalTrials
    : 0

  const newRecent: RecentSessionSummary = {
    sessionId: session.id,
    accuracy: session.accuracy,
    avgResponseTime: session.averageResponseTimeMs,
    finalDifficulty: session.finalDifficulty,
    performanceRating: session.performanceRating,
    date: Timestamp.now(),
  }
  const recentSessions = [...existing.recentSessions.slice(-9), newRecent]

  const updated: AggregateStats = {
    gameType,
    totalSessions: newTotalSessions,
    totalTrials: newTotalTrials,
    lifetimeAccuracy: newLifetimeAccuracy,
    bestAccuracy: Math.max(existing.bestAccuracy, session.accuracy),
    bestSessionId: session.accuracy > existing.bestAccuracy ? session.id : existing.bestSessionId,
    averageResponseTimeMs: newAvgResponseTime,
    currentDifficultyLevel: session.finalDifficulty,
    recentTrend: computeTrend(recentSessions.map((s) => s.accuracy)),
    lastPlayedAt: Timestamp.now(),
    recentSessions,
  }

  await setDoc(ref, updated)
}

export async function getStartingDifficulty(uid: string, gameType: GameType): Promise<number> {
  const ref = doc(db, 'users', uid, 'aggregateStats', gameType)
  const snap = await getDoc(ref)
  if (!snap.exists()) return 1
  const stats = snap.data() as AggregateStats
  return Math.max(1, stats.currentDifficultyLevel - 1)
}

export async function fetchRecentLanguageScores(
  uid: string,
  gameType: GameType,
  language: string,
  level: string,
  subLevel: string,
  maxResults: number = 5,
): Promise<number[]> {
  const sessionsRef = collection(db, 'users', uid, 'sessions')
  const q = query(
    sessionsRef,
    where('gameType', '==', gameType),
    limit(50),
  )
  const snap = await getDocs(q)
  const sessions = snap.docs
    .map((d) => d.data() as GameSession)
    .filter((s) => s.language === language && s.level === level && s.subLevel === subLevel)
    .sort((a, b) => b.startedAt.toMillis() - a.startedAt.toMillis())
    .slice(0, maxResults)

  // Return oldest-first so slice(-N) on the caller side gives most recent
  return sessions
    .map((s) => s.summaryScore?.overallScore ?? 0)
    .reverse()
}

export async function fetchSessionHistory(
  uid: string,
  gameType: GameType,
  maxResults: number = 30,
): Promise<GameSession[]> {
  const sessionsRef = collection(db, 'users', uid, 'sessions')
  // Simple where-only query avoids needing a composite index
  const q = query(
    sessionsRef,
    where('gameType', '==', gameType),
    limit(maxResults),
  )
  const snap = await getDocs(q)
  const sessions = snap.docs.map((d) => d.data() as GameSession)
  // Sort in memory instead of via Firestore orderBy
  return sessions.sort((a, b) => b.startedAt.toMillis() - a.startedAt.toMillis())
}
