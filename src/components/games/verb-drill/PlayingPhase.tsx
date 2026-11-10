import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ArrowRight, Flag, Eye } from 'lucide-react'
import type { VerbDrillSentence, VerbDrillAnswer, AnswerStatus } from '../../../types/verbDrill'
import { checkAnswer } from '../../../utils/verbDrillCheck'
import { preciseNow } from '../../../utils/timing'

interface PlayingPhaseProps {
  sentences: VerbDrillSentence[]
  language: string
  onComplete: (answers: VerbDrillAnswer[]) => void
}

const STATUS_STYLE: Record<AnswerStatus, string> = {
  correct: 'bg-green-500/15 text-green-700',
  accent: 'bg-amber-500/15 text-amber-700',
  wrong: 'bg-red-500/15 text-red-600 line-through',
}

export function PlayingPhase({ sentences, language, onComplete }: PlayingPhaseProps) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<AnswerStatus | null>(null)
  const [tenseRevealed, setTenseRevealed] = useState(false)
  const [answers, setAnswers] = useState<VerbDrillAnswer[]>([])
  const startRef = useRef(preciseNow())
  const inputRef = useRef<HTMLInputElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  const isRTL = language === 'he'
  const sentence = sentences[index]
  const isLast = index === sentences.length - 1
  const correctSoFar = answers.filter(a => a.status === 'correct').length

  useEffect(() => {
    startRef.current = preciseNow()
    inputRef.current?.focus()
  }, [index])

  useEffect(() => {
    if (status) nextRef.current?.focus()
  }, [status])

  const grade = useCallback((answer: string) => {
    if (status) return
    const result = answer.trim() ? checkAnswer(answer, sentence, language) : 'wrong'
    setStatus(result)
    setAnswers(prev => [...prev, {
      userAnswer: answer.trim(),
      status: result,
      timeMs: preciseNow() - startRef.current,
      tenseRevealed,
    }])
  }, [status, sentence, language, tenseRevealed])

  const handleNext = useCallback(() => {
    if (!status) return
    if (isLast) {
      onComplete(answers)
      return
    }
    setIndex(i => i + 1)
    setInput('')
    setStatus(null)
    setTenseRevealed(false)
  }, [status, isLast, answers, onComplete])

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm font-bold text-ink-2">
        <span>{t('games.verbDrill.progress', { current: index + 1, total: sentences.length })}</span>
        <span className="flex items-center gap-1.5">
          <Check size={16} aria-hidden="true" />
          {correctSoFar}
        </span>
      </div>
      <div className="flex gap-1" aria-hidden="true">
        {sentences.map((_, i) => {
          const a = answers[i]
          const color = !a ? (i === index ? 'bg-ink/40' : 'bg-ink/10')
            : a.status === 'correct' ? 'bg-green-500'
            : a.status === 'accent' ? 'bg-amber-400' : 'bg-red-400'
          return <div key={i} className={`h-2 flex-1 rounded-full ${color}`} />
        })}
      </div>

      {/* Sentence with the hidden verb */}
      <div className="sticker-sm p-6 sm:p-8 text-xl leading-[2.4]" dir={isRTL ? 'rtl' : 'ltr'}>
        <span>{sentence.before}</span>
        {status ? (
          <span className="inline-flex flex-wrap items-baseline gap-1 mx-0.5">
            {status !== 'correct' && input.trim() && (
              <span className={`px-1.5 rounded font-bold ${STATUS_STYLE[status]}`}>{input.trim()}</span>
            )}
            <span className={`px-1.5 rounded font-extrabold ${STATUS_STYLE.correct}`}>{sentence.correctForm}</span>
          </span>
        ) : (
          <span className="inline-flex items-baseline gap-1.5 mx-0.5">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && input.trim()) {
                  e.preventDefault()
                  grade(input)
                }
              }}
              className="field px-2 py-0.5 text-xl text-center"
              style={{ width: `${Math.max(sentence.correctForm.length * 1.1 + 2, 7)}ch` }}
              dir={isRTL ? 'rtl' : 'ltr'}
              aria-label={t('games.verbDrill.answerLabel', { verb: sentence.infinitive })}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <span className="text-base text-ink-2 font-bold italic whitespace-nowrap">({sentence.infinitive})</span>
          </span>
        )}
        <span>{sentence.after}</span>
      </div>

      {/* Tense hint / feedback */}
      <div className="min-h-[44px] flex flex-wrap items-center justify-center gap-3 text-center" aria-live="polite">
        {status === 'correct' && (
          <span className="chip bg-green-100">{t('games.verbDrill.correctFeedback')}</span>
        )}
        {status === 'accent' && (
          <span className="chip bg-amber-100">{t('games.verbDrill.accentFeedback')}</span>
        )}
        {status === 'wrong' && (
          <span className="chip bg-red-100">{t('games.verbDrill.wrongFeedback')}</span>
        )}
        {status || tenseRevealed ? (
          <span className="chip" dir="auto">{sentence.tenseLabel}</span>
        ) : (
          <button type="button" className="chip chip-muted" onClick={() => setTenseRevealed(true)}>
            <Eye size={14} aria-hidden="true" />
            {t('games.verbDrill.showTense')}
          </button>
        )}
      </div>

      {/* Actions */}
      {status ? (
        <button ref={nextRef} type="button" onClick={handleNext} className="w-full btn btn-sun">
          {isLast ? t('games.verbDrill.finish') : t('games.verbDrill.next')}
          <ArrowRight size={18} aria-hidden="true" className="rtl:rotate-180" />
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => grade('')}
            className="btn btn-ghost"
          >
            <Flag size={16} aria-hidden="true" />
            {t('games.verbDrill.giveUp')}
          </button>
          <button
            type="button"
            onClick={() => grade(input)}
            disabled={!input.trim()}
            className="flex-1 btn btn-sun"
          >
            <Check size={18} aria-hidden="true" />
            {t('games.verbDrill.check')}
          </button>
        </div>
      )}
    </div>
  )
}
