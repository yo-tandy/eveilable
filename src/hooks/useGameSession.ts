import { useRef, useCallback } from 'react'
import { collection, doc, setDoc, Timestamp, writeBatch } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuthStore } from '../stores/authStore'
import { updateAggregateStats } from '../services/firestoreService'
import type { GameType, Trial, GameSession } from '../types/game'

export function useGameSession(gameType: GameType) {
  const { user } = useAuthStore()
  const sessionIdRef = useRef<string | null>(null)
  const sessionStartRef = useRef<Timestamp | null>(null)
  const trialBatchRef = useRef<Trial[]>([])

  const startSession = useCallback(async (startLevel: number) => {
    if (!user) return

    const sessionsRef = collection(db, 'users', user.uid, 'sessions')
    const sessionDoc = doc(sessionsRef)
    sessionIdRef.current = sessionDoc.id
    sessionStartRef.current = Timestamp.now()

    await setDoc(sessionDoc, {
      id: sessionDoc.id,
      gameType,
      startedAt: sessionStartRef.current,
      totalTrials: 0,
      correctTrials: 0,
      accuracy: 0,
      averageResponseTimeMs: 0,
      finalDifficulty: startLevel,
      difficultyProgression: [],
      performanceRating: 0,
    })

    return sessionDoc.id
  }, [user, gameType])

  const saveTrial = useCallback(async (trial: Trial) => {
    if (!user || !sessionIdRef.current) return

    trialBatchRef.current.push(trial)

    // Batch write every 10 trials
    if (trialBatchRef.current.length >= 10) {
      await flushTrials()
    }
  }, [user])

  const flushTrials = useCallback(async () => {
    if (!user || !sessionIdRef.current || trialBatchRef.current.length === 0) return

    const batch = writeBatch(db)
    const trialsRef = collection(
      db, 'users', user.uid, 'sessions', sessionIdRef.current, 'trials'
    )

    for (const trial of trialBatchRef.current) {
      const trialDoc = doc(trialsRef)
      batch.set(trialDoc, trial)
    }

    await batch.commit()
    trialBatchRef.current = []
  }, [user])

  const endSession = useCallback(async (
    trials: Trial[],
    finalDifficulty: number,
    performanceRating: number,
  ) => {
    if (!user || !sessionIdRef.current) return

    // Flush remaining trials
    await flushTrials()

    const correctTrials = trials.filter((t) => t.correct).length
    const totalTime = trials.reduce((sum, t) => sum + t.responseTimeMs, 0)
    const accuracy = trials.length > 0 ? correctTrials / trials.length : 0
    const averageResponseTimeMs = trials.length > 0 ? totalTime / trials.length : 0

    const sessionData: GameSession = {
      id: sessionIdRef.current,
      gameType,
      startedAt: sessionStartRef.current ?? Timestamp.now(),
      endedAt: Timestamp.now(),
      totalTrials: trials.length,
      correctTrials,
      accuracy,
      averageResponseTimeMs,
      finalDifficulty,
      difficultyProgression: trials.map((t) => t.difficultyLevel),
      performanceRating,
    }

    const sessionRef = doc(db, 'users', user.uid, 'sessions', sessionIdRef.current)
    await setDoc(sessionRef, sessionData, { merge: true })

    // Update aggregate stats so Progress page has data
    await updateAggregateStats(user.uid, gameType, sessionData)

    sessionIdRef.current = null
    sessionStartRef.current = null
  }, [user, gameType, flushTrials])

  return { startSession, saveTrial, endSession }
}
