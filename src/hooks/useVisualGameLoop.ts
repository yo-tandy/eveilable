import { useCallback, useRef, useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useGameSession } from './useGameSession'
import { preciseNow, scheduleAfter } from '../utils/timing'
import type { GameType, Trial } from '../types/game'

interface StimulusConfig {
  centralType: string
  peripheralPosition: number
  distractorPositions: number[]
}

interface UseVisualGameLoopOptions {
  gameType: GameType
  generateStimulus: (difficultyLevel: number, distractorCount: number) => StimulusConfig
}

export function useVisualGameLoop({ gameType, generateStimulus }: UseVisualGameLoopOptions) {
  const store = useGameStore()
  const { startSession, saveTrial, endSession } = useGameSession(gameType)
  const cancelTimerRef = useRef<(() => void) | null>(null)
  const responseStartRef = useRef(0)
  const centralAnswerRef = useRef<string | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelTimerRef.current?.()
    }
  }, [])

  const beginGame = useCallback(async (startLevel = 1) => {
    store.startGame(gameType, startLevel)
    await startSession(startLevel)
  }, [gameType, startSession, store])

  const startTrial = useCallback(() => {
    const { difficultyLevel, difficultyParams } = useGameStore.getState()

    // Generate stimulus
    const stimulus = generateStimulus(difficultyLevel, difficultyParams.distractorCount)
    store.setStimulus(stimulus)
    store.setPhase('stimulus')

    // Schedule stimulus removal after flash duration
    cancelTimerRef.current = scheduleAfter(difficultyParams.flashDurationMs, () => {
      store.setPhase('response-central')
      responseStartRef.current = preciseNow()
      centralAnswerRef.current = null
    })
  }, [generateStimulus, store])

  const handleCentralResponse = useCallback((answer: string) => {
    centralAnswerRef.current = answer
    store.setPhase('response-peripheral')
    // Reset timer for peripheral response measurement
    responseStartRef.current = preciseNow()
  }, [store])

  const handlePeripheralResponse = useCallback((positionIndex: number) => {
    const responseTimeMs = preciseNow() - responseStartRef.current
    const state = useGameStore.getState()
    const stimulus = state.stimulus
    if (!stimulus) return

    const centralCorrect = centralAnswerRef.current === stimulus.centralType
    const peripheralCorrect = positionIndex === stimulus.peripheralPosition
    const correct = centralCorrect && peripheralCorrect

    const trial: Trial = {
      trialNumber: state.currentTrial + 1,
      stimulusType: stimulus.centralType,
      correct,
      centralCorrect,
      peripheralCorrect,
      responseTimeMs,
      difficultyLevel: state.difficultyLevel,
      centralAnswer: centralAnswerRef.current ?? undefined,
      peripheralAnswer: positionIndex,
      timestamp: Date.now(),
    }

    store.addTrial(trial)
    saveTrial(trial)
    store.setPhase('feedback')

    // Show feedback briefly, then decide next step
    cancelTimerRef.current = scheduleAfter(600, () => {
      const updated = useGameStore.getState()
      // Every 10 trials, show continue prompt
      if (updated.currentTrial > 0 && updated.currentTrial % 10 === 0) {
        store.setPhase('continue-prompt')
      } else {
        startTrial()
      }
    })
  }, [store, saveTrial, startTrial])

  const handleContinue = useCallback(() => {
    startTrial()
  }, [startTrial])

  const handleEnd = useCallback(async () => {
    const state = useGameStore.getState()
    store.setPhase('end')
    cancelTimerRef.current?.()

    // Compute a quick performance rating
    const accuracy = state.trials.length > 0
      ? state.trials.filter((t) => t.correct).length / state.trials.length
      : 0
    const rating = Math.round(accuracy * 100)

    await endSession(state.trials, state.difficultyLevel, rating)
  }, [store, endSession])

  const countdownComplete = useCallback(() => {
    startTrial()
  }, [startTrial])

  return {
    phase: store.phase,
    trials: store.trials,
    stimulus: store.stimulus,
    currentTrial: store.currentTrial,
    difficultyLevel: store.difficultyLevel,
    difficultyParams: store.difficultyParams,
    beginGame,
    countdownComplete,
    handleCentralResponse,
    handlePeripheralResponse,
    handleContinue,
    handleEnd,
    resetGame: store.resetGame,
  }
}
