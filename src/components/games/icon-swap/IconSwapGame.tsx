import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Shuffle } from 'lucide-react'
import {
  Heart, Star, Sun, Moon, Cloud, Zap, Flame, Droplets,
  Music, Camera, Gift, Key, Lock, Bell, Bookmark, Flag,
  Anchor, Compass, Crown, Feather, Gem, Leaf, Snowflake, Umbrella,
  Apple, Cherry, Fish, Bird, Bug, Cat, Dog, Flower2,
  Plane, Rocket, Ship, Train, Bike, Mountain, TreePine, Waves,
  Lightbulb, Palette, Scissors, Hammer, Wrench, Shield, Trophy, Medal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useGameSession } from '../../../hooks/useGameSession'
import { getDifficultyParams, computeNextLevel } from '../../../utils/adaptive'
import { getStartingDifficulty } from '../../../services/firestoreService'
import { useAuthStore } from '../../../stores/authStore'
import { preciseNow, scheduleAfter } from '../../../utils/timing'
import { randomIndices, randomPick } from '../../../utils/random'
import { CountdownOverlay } from '../../common/CountdownOverlay'
import { ContinuePrompt } from '../../common/ContinuePrompt'
import { FeedbackDisplay } from '../divided-attention/FeedbackDisplay'
import { CardGrid } from './CardGrid'
import type { Trial } from '../../../types/game'

// 48 visually distinct icons, ordered from most distinct (early levels) to more similar (later)
const ICON_POOL: LucideIcon[] = [
  Heart, Star, Sun, Moon, Cloud, Zap, Flame, Droplets,
  Music, Camera, Gift, Key, Lock, Bell, Bookmark, Flag,
  Anchor, Compass, Crown, Feather, Gem, Leaf, Snowflake, Umbrella,
  Apple, Cherry, Fish, Bird, Bug, Cat, Dog, Flower2,
  Plane, Rocket, Ship, Train, Bike, Mountain, TreePine, Waves,
  Lightbulb, Palette, Scissors, Hammer, Wrench, Shield, Trophy, Medal,
]

type Phase =
  | 'idle'
  | 'countdown'
  | 'memorize'
  | 'blink'
  | 'reveal'
  | 'feedback'
  | 'continue-prompt'
  | 'end'

interface Stimulus {
  originalIcons: LucideIcon[]
  modifiedIcons: LucideIcon[]
  swapIndex: number
}

export function IconSwapGame() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { startSession, saveTrial, endSession } = useGameSession('icon-swap')

  const [phase, setPhase] = useState<Phase>('idle')
  const [stimulus, setStimulus] = useState<Stimulus | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [lastTrial, setLastTrial] = useState<Trial | null>(null)

  // Refs for game state (avoid stale closures)
  const trialsRef = useRef<Trial[]>([])
  const trialCountRef = useRef(0)
  const levelRef = useRef(1)
  const consecutiveCorrectRef = useRef(0)
  const consecutiveIncorrectRef = useRef(0)
  const responseStartRef = useRef(0)
  const cancelTimerRef = useRef<(() => void) | null>(null)

  // Cleanup timers on unmount
  useEffect(() => {
    return () => cancelTimerRef.current?.()
  }, [])

  const beginGame = useCallback(async () => {
    trialsRef.current = []
    trialCountRef.current = 0
    consecutiveCorrectRef.current = 0
    consecutiveIncorrectRef.current = 0

    // Get starting difficulty from previous sessions
    if (user) {
      const startLevel = await getStartingDifficulty(user.uid, 'icon-swap')
      levelRef.current = startLevel
    } else {
      levelRef.current = 1
    }

    await startSession(levelRef.current)
    setPhase('countdown')
  }, [user, startSession])

  const generateStimulus = useCallback((): Stimulus => {
    const params = getDifficultyParams(levelRef.current, 'icon-swap')
    const cardCount = params.cardCount ?? 4
    const poolSize = params.iconPoolSize ?? 12

    // Use only the first poolSize icons from the pool
    const available = ICON_POOL.slice(0, Math.min(poolSize, ICON_POOL.length))

    // Pick cardCount unique random icons
    const indices = randomIndices(available.length, cardCount)
    const originalIcons = indices.map(i => available[i])

    // Pick which card to swap
    const swapIndex = Math.floor(Math.random() * cardCount)

    // Pick a replacement icon not in the original set
    const usedSet = new Set(indices)
    const unusedIcons = available.filter((_, i) => !usedSet.has(i))

    let newIcon: LucideIcon
    if (unusedIcons.length > 0) {
      newIcon = randomPick(unusedIcons)
    } else {
      // Fallback: if pool is too small, pick any different icon from the full pool
      const fallback = ICON_POOL.filter(ic => ic !== originalIcons[swapIndex])
      newIcon = randomPick(fallback)
    }

    const modifiedIcons = [...originalIcons]
    modifiedIcons[swapIndex] = newIcon

    return { originalIcons, modifiedIcons, swapIndex }
  }, [])

  const startTrial = useCallback(() => {
    const stim = generateStimulus()
    setStimulus(stim)
    setSelectedIndex(null)
    setLastTrial(null)
    setPhase('memorize')

    const params = getDifficultyParams(levelRef.current, 'icon-swap')
    const memorizeTime = params.memorizeTimeMs ?? 3000
    const blinkTime = params.blinkDurationMs ?? 400

    // After memorize time, blink
    cancelTimerRef.current = scheduleAfter(memorizeTime, () => {
      setPhase('blink')
      // After blink duration, reveal modified cards
      cancelTimerRef.current = scheduleAfter(blinkTime, () => {
        setPhase('reveal')
        responseStartRef.current = preciseNow()
      })
    })
  }, [generateStimulus])

  const handleCardClick = useCallback((index: number) => {
    if (phase !== 'reveal' || !stimulus) return

    const responseTimeMs = preciseNow() - responseStartRef.current
    const correct = index === stimulus.swapIndex

    // Update consecutive counters
    if (correct) {
      consecutiveCorrectRef.current += 1
      consecutiveIncorrectRef.current = 0
    } else {
      consecutiveCorrectRef.current = 0
      consecutiveIncorrectRef.current += 1
    }

    trialCountRef.current += 1

    const trial: Trial = {
      trialNumber: trialCountRef.current,
      stimulusType: 'icon-swap',
      correct,
      responseTimeMs,
      difficultyLevel: levelRef.current,
      peripheralAnswer: index,
      timestamp: Date.now(),
    }

    trialsRef.current.push(trial)
    setLastTrial(trial)
    setSelectedIndex(index)
    setPhase('feedback')

    // Save trial to Firestore
    saveTrial(trial)

    // Compute next difficulty level
    const nextLevel = computeNextLevel(
      levelRef.current,
      trialsRef.current,
      consecutiveCorrectRef.current,
      consecutiveIncorrectRef.current,
    )
    levelRef.current = nextLevel

    // After feedback, move to next trial or continue-prompt
    cancelTimerRef.current = scheduleAfter(600, () => {
      if (trialCountRef.current % 10 === 0) {
        setPhase('continue-prompt')
      } else {
        startTrial()
      }
    })
  }, [phase, stimulus, saveTrial, startTrial])

  const handleContinue = useCallback(() => {
    startTrial()
  }, [startTrial])

  const handleEnd = useCallback(async () => {
    cancelTimerRef.current?.()
    setPhase('end')

    const trials = trialsRef.current
    const accuracy = trials.length > 0
      ? trials.filter(t => t.correct).length / trials.length
      : 0

    await endSession(trials, levelRef.current, accuracy)
  }, [endSession])

  const resetGame = useCallback(() => {
    cancelTimerRef.current?.()
    setPhase('idle')
    setStimulus(null)
    setSelectedIndex(null)
    setLastTrial(null)
    trialsRef.current = []
    trialCountRef.current = 0
  }, [])

  // --- Render ---

  if (phase === 'idle') {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <Shuffle size={48} className="mx-auto text-teal-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('games.iconSwap.name')}</h2>
        <p className="text-gray-500 mb-6">{t('games.iconSwap.description')}</p>
        <div className="glass rounded-xl p-4 text-sm text-gray-600 mb-6 text-left space-y-2">
          <p>{t('games.iconSwap.instructions1')}</p>
          <p>{t('games.iconSwap.instructions2')}</p>
          <p>{t('games.iconSwap.instructions3')}</p>
          <p>{t('games.iconSwap.instructions4')}</p>
        </div>
        <button
          onClick={beginGame}
          className="px-8 py-3 bg-black/75 backdrop-blur-sm text-white rounded-xl font-semibold hover:scale-[1.02] transition-transform"
        >
          {t('common.startGame')}
        </button>
      </div>
    )
  }

  if (phase === 'end') {
    const trials = trialsRef.current
    const accuracy = trials.length > 0
      ? trials.filter(t => t.correct).length / trials.length
      : 0
    const avgTime = trials.length > 0
      ? Math.round(trials.reduce((s, t) => s + t.responseTimeMs, 0) / trials.length)
      : 0

    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">{t('stats.sessionComplete')}</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass rounded-xl p-4">
            <div className="text-3xl font-bold">{trials.length}</div>
            <div className="text-sm text-gray-500">{t('stats.trials')}</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-3xl font-bold">{Math.round(accuracy * 100)}%</div>
            <div className="text-sm text-gray-500">{t('stats.accuracy')}</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-3xl font-bold">{avgTime}</div>
            <div className="text-sm text-gray-500">ms avg</div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={resetGame}
            className="px-6 py-2.5 glass rounded-xl font-medium hover:bg-white/50 transition-all"
          >
            {t('common.playAgain')}
          </button>
        </div>
      </div>
    )
  }

  // Active game phases
  const currentAccuracy = trialsRef.current.length > 0
    ? trialsRef.current.filter(t => t.correct).length / trialsRef.current.length
    : 0

  // Determine which icons to show based on phase
  const displayIcons =
    phase === 'memorize' ? stimulus?.originalIcons :
    phase === 'blink' ? stimulus?.modifiedIcons :  // icons don't matter during blink (hidden)
    stimulus?.modifiedIcons

  return (
    <div className="relative max-w-lg mx-auto">
      {/* Trial counter + level */}
      <div className="flex justify-between text-xs text-gray-400 mb-4 px-1">
        <span>Trial {trialCountRef.current + (phase === 'feedback' ? 0 : 1)}</span>
        <span>Level {levelRef.current}</span>
      </div>

      {/* Card grid */}
      {stimulus && displayIcons && (
        <CardGrid
          icons={displayIcons}
          phase={
            phase === 'memorize' ? 'memorize' :
            phase === 'blink' ? 'blink' :
            phase === 'feedback' ? 'feedback' :
            'reveal'
          }
          onCardClick={handleCardClick}
          correctIndex={phase === 'feedback' ? stimulus.swapIndex : undefined}
          selectedIndex={phase === 'feedback' && selectedIndex !== null ? selectedIndex : undefined}
        />
      )}

      {/* Overlays */}
      {phase === 'countdown' && (
        <CountdownOverlay onComplete={startTrial} />
      )}

      {phase === 'feedback' && lastTrial && (
        <div className="mt-6">
          <FeedbackDisplay trial={lastTrial} />
        </div>
      )}

      {phase === 'continue-prompt' && (
        <ContinuePrompt
          trialCount={trialCountRef.current}
          accuracy={currentAccuracy}
          onContinue={handleContinue}
          onEnd={handleEnd}
        />
      )}
    </div>
  )
}
