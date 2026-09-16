import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Layers, Check, X } from 'lucide-react'
import { useGameSession } from '../../../hooks/useGameSession'
import { getDifficultyParams, computeNextLevel } from '../../../utils/adaptive'
import { getStartingDifficulty } from '../../../services/firestoreService'
import { useAuthStore } from '../../../stores/authStore'
import { preciseNow, scheduleAfter } from '../../../utils/timing'
import { shuffle } from '../../../utils/random'
import { CountdownOverlay } from '../../common/CountdownOverlay'
import { ContinuePrompt } from '../../common/ContinuePrompt'
import { PlayingCard, SUITS, RANKS } from './PlayingCard'
import type { PlayingCardData } from './PlayingCard'
import type { Trial } from '../../../types/game'

type Phase =
  | 'idle'
  | 'countdown'
  | 'show'
  | 'recall'
  | 'feedback'
  | 'continue-prompt'
  | 'end'

function cardKey(c: PlayingCardData): string {
  return `${c.rank}-${c.suit}`
}

function cardsEqual(a: PlayingCardData, b: PlayingCardData): boolean {
  return a.rank === b.rank && a.suit === b.suit
}

function buildDeck(): PlayingCardData[] {
  return SUITS.flatMap(suit => RANKS.map(rank => ({ suit, rank })))
}

export function CardRecallGame() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { startSession, saveTrial, endSession } = useGameSession('card-recall')

  const [phase, setPhase] = useState<Phase>('idle')
  const [sequence, setSequence] = useState<PlayingCardData[]>([])
  const [showIndex, setShowIndex] = useState(0)
  const [recallOptions, setRecallOptions] = useState<PlayingCardData[]>([])
  const [userSelections, setUserSelections] = useState<PlayingCardData[]>([])
  const [positionResults, setPositionResults] = useState<boolean[] | null>(null)
  const [lastTrial, setLastTrial] = useState<Trial | null>(null)

  // Refs for mutable game state
  const trialsRef = useRef<Trial[]>([])
  const trialCountRef = useRef(0)
  const levelRef = useRef(1)
  const consecutiveCorrectRef = useRef(0)
  const consecutiveIncorrectRef = useRef(0)
  const responseStartRef = useRef(0)
  const cancelTimersRef = useRef<Array<() => void>>([])
  const sequenceRef = useRef<PlayingCardData[]>([])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => cancelTimersRef.current.forEach(fn => fn())
  }, [])

  const clearTimers = useCallback(() => {
    cancelTimersRef.current.forEach(fn => fn())
    cancelTimersRef.current = []
  }, [])

  const addTimer = useCallback((cancel: () => void) => {
    cancelTimersRef.current.push(cancel)
  }, [])

  const beginGame = useCallback(async () => {
    trialsRef.current = []
    trialCountRef.current = 0
    consecutiveCorrectRef.current = 0
    consecutiveIncorrectRef.current = 0

    if (user) {
      const startLevel = await getStartingDifficulty(user.uid, 'card-recall')
      levelRef.current = startLevel
    } else {
      levelRef.current = 1
    }

    await startSession(levelRef.current)
    setPhase('countdown')
  }, [user, startSession])

  const startTrial = useCallback(() => {
    clearTimers()
    setUserSelections([])
    setPositionResults(null)
    setLastTrial(null)

    const params = getDifficultyParams(levelRef.current, 'card-recall')
    const seqLen = params.sequenceLength ?? 2
    const distractorCount = params.distractorCardCount ?? 4
    const displayTime = params.cardDisplayTimeMs ?? 3000

    // Generate sequence and options
    const deck = shuffle(buildDeck())
    const seq = deck.slice(0, seqLen)
    const distractors = deck.slice(seqLen, seqLen + distractorCount)
    const options = shuffle([...seq, ...distractors])

    sequenceRef.current = seq
    setSequence(seq)
    setRecallOptions(options)
    setShowIndex(0)
    setPhase('show')

    // Chain timers to show each card
    let delay = 0
    for (let i = 0; i < seqLen; i++) {
      const idx = i
      // Show card at this index
      delay += (i === 0 ? 0 : displayTime + 300) // 300ms gap between cards
      const showCancel = scheduleAfter(delay, () => {
        setShowIndex(idx)
      })
      addTimer(showCancel)
    }

    // After last card displayed for displayTime, transition to recall
    delay += displayTime
    const recallCancel = scheduleAfter(delay, () => {
      setPhase('recall')
      responseStartRef.current = preciseNow()
    })
    addTimer(recallCancel)
  }, [clearTimers, addTimer])

  const handleCardSelect = useCallback((card: PlayingCardData) => {
    if (phase !== 'recall') return

    setUserSelections(prev => {
      // Check if card is already selected
      const existingIndex = prev.findIndex(c => cardsEqual(c, card))
      if (existingIndex >= 0) {
        // Deselect it and everything after
        return prev.slice(0, existingIndex)
      }
      // Check if we've already selected enough
      const maxLen = sequenceRef.current.length
      if (prev.length >= maxLen) return prev
      return [...prev, card]
    })
  }, [phase])

  const handleSubmit = useCallback(() => {
    if (phase !== 'recall') return

    const responseTimeMs = preciseNow() - responseStartRef.current
    const reversed = [...sequenceRef.current].reverse()
    const results = reversed.map((card, i) =>
      i < userSelections.length && cardsEqual(userSelections[i], card)
    )
    const allCorrect = results.every(Boolean)

    // Update consecutive counters
    if (allCorrect) {
      consecutiveCorrectRef.current += 1
      consecutiveIncorrectRef.current = 0
    } else {
      consecutiveCorrectRef.current = 0
      consecutiveIncorrectRef.current += 1
    }

    trialCountRef.current += 1

    const correctCount = results.filter(Boolean).length
    const trial: Trial = {
      trialNumber: trialCountRef.current,
      stimulusType: 'card-recall',
      correct: allCorrect,
      responseTimeMs,
      difficultyLevel: levelRef.current,
      centralAnswer: `${correctCount}/${reversed.length}`,
      timestamp: Date.now(),
    }

    trialsRef.current.push(trial)
    setLastTrial(trial)
    setPositionResults(results)
    setPhase('feedback')

    saveTrial(trial)

    // Compute next difficulty
    const nextLevel = computeNextLevel(
      levelRef.current,
      trialsRef.current,
      consecutiveCorrectRef.current,
      consecutiveIncorrectRef.current,
    )
    levelRef.current = nextLevel

    // After feedback delay, continue
    const cancel = scheduleAfter(2500, () => {
      if (trialCountRef.current % 5 === 0) {
        setPhase('continue-prompt')
      } else {
        startTrial()
      }
    })
    cancelTimersRef.current = [cancel]
  }, [phase, userSelections, saveTrial, startTrial])

  const handleContinue = useCallback(() => {
    startTrial()
  }, [startTrial])

  const handleEnd = useCallback(async () => {
    clearTimers()
    setPhase('end')

    const trials = trialsRef.current
    const accuracy = trials.length > 0
      ? trials.filter(t => t.correct).length / trials.length
      : 0

    await endSession(trials, levelRef.current, accuracy)
  }, [clearTimers, endSession])

  const resetGame = useCallback(() => {
    clearTimers()
    setPhase('idle')
    setSequence([])
    setRecallOptions([])
    setUserSelections([])
    setPositionResults(null)
    setLastTrial(null)
    trialsRef.current = []
    trialCountRef.current = 0
  }, [clearTimers])

  // --- Render ---

  if (phase === 'idle') {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="art art-attention w-20 h-20 mx-auto mb-4 -rotate-3"><Layers size={40} strokeWidth={2.4} aria-hidden="true" /></div>
        <h2 className="display text-[30px] leading-tight mb-2">{t('games.cardRecall.name')}</h2>
        <p className="text-ink-2 font-bold mb-6">{t('games.cardRecall.description')}</p>
        <div className="sticker-flat p-5 text-[15px] text-ink-2 font-bold mb-6 text-left space-y-2">
          <p>{t('games.cardRecall.instructions1')}</p>
          <p>{t('games.cardRecall.instructions2')}</p>
          <p>{t('games.cardRecall.instructions3')}</p>
          <p>{t('games.cardRecall.instructions4')}</p>
        </div>
        <button
          onClick={beginGame}
          className="btn btn-sun"
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
        <div className="flex items-center justify-center gap-3 mb-6"><h2 className="display text-[36px]">{t('stats.niceOne')}</h2><span className="tag tag-sun">{t('stats.sessionComplete')}</span></div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="sticker-sm p-4">
            <div className="display text-3xl leading-none">{trials.length}</div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-ink-2 mt-1">{t('stats.trials')}</div>
          </div>
          <div className="sticker-sm p-4">
            <div className="display text-3xl leading-none">{Math.round(accuracy * 100)}%</div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-ink-2 mt-1">{t('stats.accuracy')}</div>
          </div>
          <div className="sticker-sm p-4">
            <div className="display text-3xl leading-none">{(avgTime / 1000).toFixed(1)}s</div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-ink-2 mt-1">{t('stats.responseTime')}</div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={resetGame}
            className="btn btn-blue"
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

  return (
    <div className="relative max-w-lg mx-auto">
      {/* Trial counter + level */}
      <div className="flex justify-between text-xs text-ink-3 mb-4 px-1">
        <span>Trial {trialCountRef.current + (phase === 'feedback' ? 0 : 1)}</span>
        <span>Level {levelRef.current}</span>
      </div>

      {/* Show phase: one card at a time */}
      {phase === 'show' && (
        <div className="flex flex-col items-center py-8">
          <div className="text-sm text-ink-2 mb-4">
            Card {showIndex + 1} of {sequence.length}
          </div>
          <div key={showIndex} className="card-enter">
            <PlayingCard
              card={sequence[showIndex]}
              size="lg"
            />
          </div>
          <div className="flex gap-1.5 mt-6">
            {sequence.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i <= showIndex ? 'bg-violet-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recall phase: grid of options */}
      {phase === 'recall' && (
        <div className="flex flex-col items-center">
          <div className="text-sm text-ink-2 mb-1">
            Recall in <span className="font-semibold text-violet-600">reverse</span> order
          </div>
          <div className="text-xs text-ink-3 mb-4">
            {userSelections.length} / {sequence.length} selected
          </div>
          <div className={`grid gap-3 mb-6 ${
            recallOptions.length <= 6 ? 'grid-cols-3' :
            recallOptions.length <= 8 ? 'grid-cols-4' :
            'grid-cols-4 sm:grid-cols-5'
          }`}>
            {recallOptions.map((card) => {
              const selIdx = userSelections.findIndex(c => cardsEqual(c, card))
              return (
                <PlayingCard
                  key={cardKey(card)}
                  card={card}
                  size="sm"
                  selected={selIdx >= 0}
                  selectionOrder={selIdx >= 0 ? selIdx + 1 : undefined}
                  onClick={() => handleCardSelect(card)}
                />
              )
            })}
          </div>
          <button
            onClick={handleSubmit}
            disabled={userSelections.length < sequence.length}
            className={`px-8 py-3 rounded-xl font-semibold transition-all ${
              userSelections.length >= sequence.length
                ? 'bg-violet-600 text-white hover:scale-[1.02] shadow-lg'
                : 'bg-gray-200 text-ink-3 cursor-not-allowed'
            }`}
          >
            Submit
          </button>
        </div>
      )}

      {/* Feedback phase */}
      {phase === 'feedback' && positionResults && (
        <div className="flex flex-col items-center py-4">
          <div className={`text-lg font-bold mb-4 ${lastTrial?.correct ? 'text-green-600' : 'text-red-500'}`}>
            {lastTrial?.correct ? 'Perfect!' : `${positionResults.filter(Boolean).length} / ${positionResults.length} correct`}
          </div>

          {/* Correct reverse sequence */}
          <div className="text-xs text-ink-3 mb-2">Correct (reverse)</div>
          <div className="flex gap-2 mb-4">
            {[...sequence].reverse().map((card, i) => (
              <PlayingCard
                key={`correct-${cardKey(card)}`}
                card={card}
                size="sm"
                correct={positionResults[i]}
              />
            ))}
          </div>

          {/* User's selections */}
          <div className="text-xs text-ink-3 mb-2">Your answer</div>
          <div className="flex gap-2">
            {userSelections.map((card, i) => (
              <div key={`user-${i}`} className="flex flex-col items-center gap-1">
                <PlayingCard
                  card={card}
                  size="sm"
                />
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  positionResults[i] ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {positionResults[i] ? <Check size={12} /> : <X size={12} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overlays */}
      {phase === 'countdown' && (
        <CountdownOverlay onComplete={startTrial} />
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
