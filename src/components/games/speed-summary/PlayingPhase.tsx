import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, Send } from 'lucide-react'
import type { ParagraphResult } from '../../../services/paragraphService'

interface PlayingPhaseProps {
  paragraph: ParagraphResult
  language: string
  onSubmit: (summaryText: string, writingTimeMs: number) => void
}

export function PlayingPhase({ paragraph, language, onSubmit }: PlayingPhaseProps) {
  const { t } = useTranslation()
  const [summary, setSummary] = useState('')
  const [elapsedMs, setElapsedMs] = useState(0)
  const startTimeRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const isRTL = language === 'he'
  const wordCount = summary.trim().split(/\s+/).filter(Boolean).length
  const isValid = wordCount >= 10 && wordCount <= 20

  useEffect(() => {
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current)
    }, 200)
    return () => clearInterval(timerRef.current)
  }, [])

  const handleSubmit = () => {
    if (!isValid) return
    clearInterval(timerRef.current)
    const totalMs = Date.now() - startTimeRef.current
    onSubmit(summary.trim(), totalMs)
  }

  const elapsedSeconds = Math.floor(elapsedMs / 1000)
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Timer */}
      <div className="flex items-center justify-center gap-2 text-gray-500">
        <Clock size={18} />
        <span className="font-mono text-lg">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Paragraph */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-3">{paragraph.title}</h3>
        <p
          className="text-gray-700 leading-relaxed text-lg"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {paragraph.paragraph}
        </p>
      </div>

      {/* Summary input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('games.speedSummary.writeSummary')}
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          dir={isRTL ? 'rtl' : 'ltr'}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none resize-none text-lg"
          autoFocus
        />

        {/* Word counter */}
        <div className="flex items-center justify-between mt-2">
          <span
            className={`text-sm font-medium ${
              wordCount === 0
                ? 'text-gray-400'
                : wordCount < 10
                  ? 'text-amber-600'
                  : wordCount > 20
                    ? 'text-red-600'
                    : 'text-green-600'
            }`}
          >
            {wordCount} {t('games.speedSummary.words')}
            {wordCount > 0 && wordCount < 10 && ` — ${t('games.speedSummary.tooFew')}`}
            {wordCount > 20 && ` — ${t('games.speedSummary.tooMany')}`}
          </span>
          <span className="text-xs text-gray-400">10–20</span>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!isValid}
        className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
          isValid
            ? 'bg-brand-600 text-white hover:bg-brand-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Send size={18} />
        {t('games.speedSummary.submit')}
      </button>
    </div>
  )
}
