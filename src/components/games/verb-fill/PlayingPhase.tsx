import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, Send } from 'lucide-react'
import type { VerbFillExercise } from '../../../types/verbFill'
import { preciseNow } from '../../../utils/timing'

interface PlayingPhaseProps {
  exercise: VerbFillExercise
  language: string
  onComplete: (userAnswers: string[], totalTimeMs: number) => void
}

export function PlayingPhase({ exercise, language, onComplete }: PlayingPhaseProps) {
  const { t } = useTranslation()
  const [answers, setAnswers] = useState<string[]>(() =>
    Array(exercise.verbCount).fill('')
  )
  const [elapsedMs, setElapsedMs] = useState(0)
  const startRef = useRef(preciseNow())
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const isRTL = language === 'he'
  const filledCount = answers.filter(a => a.trim().length > 0).length
  const allFilled = filledCount === exercise.verbCount

  useEffect(() => {
    startRef.current = preciseNow()
    timerRef.current = setInterval(() => {
      setElapsedMs(preciseNow() - startRef.current)
    }, 200)
    return () => clearInterval(timerRef.current)
  }, [])

  const handleInputChange = useCallback((verbIdx: number, value: string) => {
    setAnswers(prev => {
      const next = [...prev]
      next[verbIdx] = value
      return next
    })
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, verbIdx: number) => {
    if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault()
      const nextIdx = verbIdx + 1
      if (nextIdx < exercise.verbCount) {
        inputRefs.current[nextIdx]?.focus()
      }
    }
  }, [exercise.verbCount])

  const handleSubmit = useCallback(() => {
    if (!allFilled) return
    clearInterval(timerRef.current)
    const totalTime = preciseNow() - startRef.current
    onComplete(answers.map(a => a.trim()), totalTime)
  }, [allFilled, answers, onComplete])

  const elapsedSeconds = Math.floor(elapsedMs / 1000)
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header: title + timer */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-700">{exercise.title}</h2>
        <div className="flex items-center gap-2 text-ink-2">
          <Clock size={16} />
          <span className="font-mono text-sm">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="text-sm text-ink-2 text-center">
        {filledCount} / {exercise.verbCount} {t('games.verbFill.filled')}
      </div>

      {/* Cloze text with inline inputs */}
      <div
        className="sticker-sm p-6 leading-[2.5] text-lg"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {exercise.segments.map((seg, i) => {
          if (seg.type === 'text') {
            return <span key={i}>{seg.content}</span>
          }

          const verbIdx = seg.index!
          return (
            <span key={i} className="inline-flex items-baseline gap-1 mx-0.5">
              <input
                ref={el => { inputRefs.current[verbIdx] = el }}
                type="text"
                value={answers[verbIdx]}
                onChange={e => handleInputChange(verbIdx, e.target.value)}
                onKeyDown={e => handleKeyDown(e, verbIdx)}
                className="field px-2 py-0.5 rounded-lg text-lg font-medium text-center border-b-2 border-amber-400/50 focus:border-amber-500"
                style={{ width: `${Math.max(seg.correctForm!.length * 1.2, 5)}ch` }}
                dir={isRTL ? 'rtl' : 'ltr'}
                autoFocus={verbIdx === 0}
                autoComplete="off"
                spellCheck={false}
              />
              <span className="text-xs text-ink-3 italic whitespace-nowrap">
                ({seg.infinitive})
              </span>
            </span>
          )
        })}
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!allFilled}
        className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-transform ${
          allFilled
            ? 'btn btn-sun'
            : 'bg-white/30 text-ink-3 cursor-not-allowed'
        }`}
      >
        <Send size={18} />
        {t('games.verbFill.submitAll')}
      </button>
    </div>
  )
}
