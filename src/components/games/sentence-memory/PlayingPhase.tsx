import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, ArrowRight, Send, Eye, PenLine } from 'lucide-react'
import { preciseNow } from '../../../utils/timing'

interface PlayingPhaseProps {
  sentences: string[]
  language: string
  onComplete: (userInputs: string[], timesMs: number[]) => void
}

type SubPhase = 'memorize' | 'recall'

export function PlayingPhase({ sentences, language, onComplete }: PlayingPhaseProps) {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [subPhase, setSubPhase] = useState<SubPhase>('memorize')
  const [currentInput, setCurrentInput] = useState('')
  const [userInputs, setUserInputs] = useState<string[]>([])
  const [timesMs, setTimesMs] = useState<number[]>([])
  const [elapsedMs, setElapsedMs] = useState(0)
  const recallStartRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isRTL = language === 'he'
  const total = sentences.length
  const isLast = currentIndex === total - 1

  // Timer for current sub-phase
  useEffect(() => {
    const start = preciseNow()
    timerRef.current = setInterval(() => {
      setElapsedMs(preciseNow() - start)
    }, 200)
    return () => clearInterval(timerRef.current)
  }, [currentIndex, subPhase])

  // Focus textarea when entering recall phase
  useEffect(() => {
    if (subPhase === 'recall') {
      textareaRef.current?.focus()
    }
  }, [subPhase])

  const handleContinue = useCallback(() => {
    clearInterval(timerRef.current)
    setElapsedMs(0)
    recallStartRef.current = preciseNow()
    setSubPhase('recall')
  }, [])

  const handleNext = useCallback(() => {
    const recallTime = preciseNow() - recallStartRef.current
    const newInputs = [...userInputs, currentInput]
    const newTimes = [...timesMs, recallTime]

    if (isLast) {
      onComplete(newInputs, newTimes)
      return
    }

    setUserInputs(newInputs)
    setTimesMs(newTimes)
    setCurrentInput('')
    setCurrentIndex(prev => prev + 1)
    setSubPhase('memorize')
    setElapsedMs(0)
  }, [currentInput, userInputs, timesMs, isLast, onComplete])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (currentInput.trim().length > 0) {
        handleNext()
      }
    }
  }, [currentInput, handleNext])

  const elapsedSeconds = Math.floor(elapsedMs / 1000)
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          {subPhase === 'memorize' ? <Eye size={16} /> : <PenLine size={16} />}
          <span className="text-sm font-medium">
            {subPhase === 'memorize'
              ? t('games.sentenceMemory.memorize')
              : t('games.sentenceMemory.typeFromMemory')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-ink-2">
          <Clock size={16} />
          <span className="font-mono text-sm">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {sentences.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i < currentIndex
                ? 'bg-cyan-500'
                : i === currentIndex
                  ? 'bg-cyan-600 ring-2 ring-cyan-300'
                  : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <div className="text-sm text-ink-2 text-center">
        {currentIndex + 1} / {total}
      </div>

      {/* Sentence card */}
      {subPhase === 'memorize' ? (
        <div
          className="sticker-sm p-8 text-center"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <p className="text-xl leading-relaxed font-medium text-ink">
            {sentences[currentIndex]}
          </p>
        </div>
      ) : (
        <div dir={isRTL ? 'rtl' : 'ltr'}>
          <textarea
            ref={textareaRef}
            value={currentInput}
            onChange={e => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="field w-full p-4 rounded-2xl text-lg leading-relaxed resize-none focus:ring-2 focus:ring-cyan-300"
            rows={3}
            placeholder={t('games.sentenceMemory.placeholder')}
            dir={isRTL ? 'rtl' : 'ltr'}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      )}

      {/* Action button */}
      {subPhase === 'memorize' ? (
        <button
          onClick={handleContinue}
          className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 btn btn-sun transition-transform"
        >
          <ArrowRight size={18} />
          {t('common.continue')}
        </button>
      ) : (
        <button
          onClick={handleNext}
          disabled={currentInput.trim().length === 0}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-transform ${
            currentInput.trim().length > 0
              ? 'btn btn-sun'
              : 'bg-white/30 text-ink-3 cursor-not-allowed'
          }`}
        >
          {isLast ? <Send size={18} /> : <ArrowRight size={18} />}
          {isLast ? t('games.sentenceMemory.submitAll') : t('games.sentenceMemory.next')}
        </button>
      )}
    </div>
  )
}
