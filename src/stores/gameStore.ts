import { create } from 'zustand'
import type { GameType, GamePhase, Trial, DifficultyParams } from '../types/game'
import { getDifficultyParams, computeNextLevel } from '../utils/adaptive'

interface StimulusData {
  centralType: string
  peripheralPosition: number
  distractorPositions: number[]
}

interface GameState {
  gameType: GameType | null
  phase: GamePhase
  trials: Trial[]
  currentTrial: number
  difficultyLevel: number
  difficultyParams: DifficultyParams
  stimulus: StimulusData | null
  responseStartTime: number
  consecutiveCorrect: number
  consecutiveIncorrect: number

  // Actions
  startGame: (gameType: GameType, startLevel?: number) => void
  setPhase: (phase: GamePhase) => void
  setStimulus: (stimulus: StimulusData) => void
  setResponseStartTime: (time: number) => void
  addTrial: (trial: Trial) => void
  resetGame: () => void
}

const initialState = {
  gameType: null as GameType | null,
  phase: 'idle' as GamePhase,
  trials: [] as Trial[],
  currentTrial: 0,
  difficultyLevel: 1,
  difficultyParams: getDifficultyParams(1, 'divided-attention'),
  stimulus: null as StimulusData | null,
  responseStartTime: 0,
  consecutiveCorrect: 0,
  consecutiveIncorrect: 0,
}

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  startGame: (gameType, startLevel = 1) =>
    set({
      ...initialState,
      gameType,
      phase: 'countdown',
      difficultyLevel: startLevel,
      difficultyParams: getDifficultyParams(startLevel, gameType),
    }),

  setPhase: (phase) => set({ phase }),

  setStimulus: (stimulus) => set({ stimulus }),

  setResponseStartTime: (responseStartTime) => set({ responseStartTime }),

  addTrial: (trial) => {
    const state = get()
    const newTrials = [...state.trials, trial]

    let consCorrect = trial.correct ? state.consecutiveCorrect + 1 : 0
    let consIncorrect = trial.correct ? 0 : state.consecutiveIncorrect + 1

    const newLevel = computeNextLevel(
      state.difficultyLevel,
      newTrials,
      consCorrect,
      consIncorrect,
    )

    set({
      trials: newTrials,
      currentTrial: state.currentTrial + 1,
      difficultyLevel: newLevel,
      difficultyParams: getDifficultyParams(newLevel, state.gameType!),
      consecutiveCorrect: consCorrect,
      consecutiveIncorrect: consIncorrect,
    })
  },

  resetGame: () => set(initialState),
}))
