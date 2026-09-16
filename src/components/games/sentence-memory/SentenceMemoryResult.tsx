import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Check, X, TrendingUp, TrendingDown, BarChart3, RotateCcw } from 'lucide-react'
import type { SentenceMemoryResult as ResultType } from '../../../types/sentenceMemory'

interface SentenceMemoryResultProps {
  result: ResultType
  timesMs: number[]
  language: string
  levelNotification: { direction: 'up' | 'down'; newLabel: string } | null
}

/** Render a character-level diff between original and user input */
function DiffView({ original, userInput }: { original: string; userInput: string }) {
  // Simple character-by-character comparison
  const maxLen = Math.max(original.length, userInput.length)
  const chars: { char: string; match: boolean }[] = []

  for (let i = 0; i < maxLen; i++) {
    const origChar = original[i]
    const userChar = userInput[i]
    if (origChar === userChar) {
      chars.push({ char: origChar, match: true })
    } else if (userChar !== undefined) {
      chars.push({ char: userChar, match: false })
    }
  }

  return (
    <span className="font-mono text-sm break-all">
      {chars.map((c, i) => (
        <span
          key={i}
          className={c.match ? 'text-green-700' : 'text-red-600 bg-red-100 rounded-sm'}
        >
          {c.char}
        </span>
      ))}
      {userInput.length < original.length && (
        <span className="text-red-400 bg-red-50 rounded-sm">
          {'_'.repeat(original.length - userInput.length)}
        </span>
      )}
    </span>
  )
}

export function SentenceMemoryResult({ result, timesMs, language, levelNotification }: SentenceMemoryResultProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isRTL = language === 'he'

  const avgSimilarity = result.scores.length > 0
    ? Math.round(result.scores.reduce((sum, s) => sum + s.similarity, 0) / result.scores.length * 100)
    : 0

  const avgTimeMs = timesMs.length > 0
    ? Math.round(timesMs.reduce((a, b) => a + b, 0) / timesMs.length)
    : 0

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Level notification */}
      {levelNotification && (
        <div className={`p-4 rounded-xl text-center font-medium ${
          levelNotification.direction === 'up'
            ? 'bg-green-500/10 text-green-700 border border-green-500/20'
            : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
        }`}>
          <div className="flex items-center justify-center gap-2">
            {levelNotification.direction === 'up' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            <span>Level {levelNotification.direction === 'up' ? 'up' : 'adjusted'}: {levelNotification.newLabel}</span>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="sticker-sm p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">
          {t('games.sentenceMemory.results')}
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="display text-[28px] text-cyan-600">
              {result.correctCount}/{result.scores.length}
            </div>
            <div className="text-xs text-ink-2">{t('games.sentenceMemory.correct')}</div>
          </div>
          <div>
            <div className="display text-[28px] text-cyan-600">
              {avgSimilarity}%
            </div>
            <div className="text-xs text-ink-2">{t('games.sentenceMemory.avgSimilarity')}</div>
          </div>
          <div>
            <div className="display text-[28px] text-cyan-600">
              {(avgTimeMs / 1000).toFixed(1)}s
            </div>
            <div className="text-xs text-ink-2">{t('games.sentenceMemory.avgTime')}</div>
          </div>
        </div>
      </div>

      {/* Per-sentence breakdown */}
      <div className="space-y-3">
        {result.scores.map((score, i) => (
          <div
            key={i}
            className={`sticker-sm p-4 border-l-4 ${
              score.correct ? 'border-green-500' : 'border-red-400'
            }`}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-full p-1 ${
                score.correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
              }`}>
                {score.correct ? <Check size={14} /> : <X size={14} />}
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                <div>
                  <div className="text-xs text-ink-3 mb-0.5">{t('games.sentenceMemory.original')}</div>
                  <p className="text-sm text-gray-700">{score.original}</p>
                </div>
                {!score.correct && (
                  <div>
                    <div className="text-xs text-ink-3 mb-0.5">{t('games.sentenceMemory.yourInput')}</div>
                    <DiffView original={score.original} userInput={score.userInput} />
                    <div className="text-xs text-ink-3 mt-1">
                      {Math.round(score.similarity * 100)}% match
                    </div>
                  </div>
                )}
              </div>
              <div className="text-xs text-ink-3 whitespace-nowrap">
                {(timesMs[i] / 1000).toFixed(1)}s
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 btn btn-sun transition-transform"
        >
          <RotateCcw size={18} />
          {t('common.playAgain')}
        </button>
        <button
          onClick={() => navigate('/progress?game=sentence-memory')}
          className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 sticker-flat hover:scale-[1.02] transition-transform text-gray-700"
        >
          <BarChart3 size={18} />
          {t('common.viewProgress')}
        </button>
      </div>
    </div>
  )
}
