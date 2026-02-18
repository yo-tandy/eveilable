import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, ArrowRight, Send } from 'lucide-react'
import type { TenseExercise } from '../../../types/tenseRewrite'
import { preciseNow } from '../../../utils/timing'

interface PlayingPhaseProps {
  exercises: TenseExercise[]
  language: string
  onComplete: (userRewrites: string[], timesMs: number[]) => void
}

export function PlayingPhase({ exercises, language, onComplete }: PlayingPhaseProps) {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [rewrites, setRewrites] = useState<string[]>([])
  const [timesMs, setTimesMs] = useState<number[]>([])
  const [elapsedMs, setElapsedMs] = useState(0)
  const sentenceStartRef = useRef(preciseNow())
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const isRTL = language === 'he'
  const exercise = exercises[currentIndex]
  const isLast = currentIndex === exercises.length - 1
  const wordCount = currentText.trim().split(/\s+/).filter(Boolean).length
  const canSubmit = wordCount >= 3

  // Timer per sentence
  useEffect(() => {
    sentenceStartRef.current = preciseNow()
    setElapsedMs(0)
    timerRef.current = setInterval(() => {
      setElapsedMs(preciseNow() - sentenceStartRef.current)
    }, 200)
    return () => clearInterval(timerRef.current)
  }, [currentIndex])

  const handleNext = useCallback(() => {
    if (!canSubmit) return
    clearInterval(timerRef.current)

    const elapsed = preciseNow() - sentenceStartRef.current
    const newRewrites = [...rewrites, currentText.trim()]
    const newTimes = [...timesMs, elapsed]

    if (isLast) {
      onComplete(newRewrites, newTimes)
    } else {
      setRewrites(newRewrites)
      setTimesMs(newTimes)
      setCurrentText('')
      setCurrentIndex((prev) => prev + 1)
    }
  }, [canSubmit, currentText, rewrites, timesMs, isLast, onComplete])

  const elapsedSeconds = Math.floor(elapsedMs / 1000)
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header: progress + timer */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {currentIndex + 1} {t('games.tenseRewrite.of')} {exercises.length}
        </span>
        <div className="flex items-center gap-2 text-gray-500">
          <Clock size={16} />
          <span className="font-mono text-sm">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1 justify-center">
        {exercises.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full ${
              i < currentIndex ? 'bg-black/60' :
              i === currentIndex ? 'bg-black/30' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Original sentence */}
      <div className="glass rounded-2xl p-6">
        <p
          className="text-lg leading-relaxed text-gray-800"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {exercise.original}
        </p>
      </div>

      {/* Task instruction */}
      <div className="text-center">
        <span className="inline-block px-4 py-2 bg-rose-500/10 text-rose-700 rounded-full text-sm font-medium">
          {exercise.taskDescription}
        </span>
      </div>

      {/* Rewrite input */}
      <div>
        <textarea
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          dir={isRTL ? 'rtl' : 'ltr'}
          rows={3}
          className="glass-input w-full px-4 py-3 rounded-xl resize-none text-lg"
          placeholder={t('games.tenseRewrite.yourRewrite')}
          autoFocus
        />
      </div>

      {/* Next / Submit button */}
      <button
        onClick={handleNext}
        disabled={!canSubmit}
        className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-transform ${
          canSubmit
            ? 'bg-black/75 backdrop-blur-sm text-white hover:scale-[1.02]'
            : 'bg-white/30 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isLast ? (
          <>
            <Send size={18} />
            {t('games.tenseRewrite.submitAll')}
          </>
        ) : (
          <>
            <ArrowRight size={18} />
            {t('games.tenseRewrite.next')}
          </>
        )}
      </button>
    </div>
  )
}
