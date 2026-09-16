import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, BarChart3, RotateCcw } from 'lucide-react'
import type { DictationResult, WordDiff } from '../../../services/dictationService'

interface OralWritingResultProps {
  result: DictationResult
  elapsedMs: number
  language: string
  levelNotification: { direction: 'up' | 'down'; newLabel: string } | null
}

/** Word-level diff display */
function WordDiffView({ diffs }: { diffs: WordDiff[] }) {
  return (
    <span className="text-sm leading-relaxed">
      {diffs.map((d, i) => {
        if (d.match) {
          // Correct word
          return (
            <span key={i} className="text-green-700">
              {d.userWord}{' '}
            </span>
          )
        }
        if (d.extra) {
          // Extra word the user added
          return (
            <span key={i} className="text-red-600 bg-red-100 rounded-sm line-through">
              {d.userWord}{' '}
            </span>
          )
        }
        if (!d.userWord) {
          // User missed this word
          return (
            <span key={i} className="text-red-400 bg-red-50 rounded-sm italic">
              [{d.original}]{' '}
            </span>
          )
        }
        // Wrong word (substitution)
        return (
          <span key={i}>
            <span className="text-red-600 bg-red-100 rounded-sm">{d.userWord}</span>
            <span className="text-ink-3 text-xs mx-0.5">→{d.original}</span>
            {' '}
          </span>
        )
      })}
    </span>
  )
}

export function OralWritingResult({ result, elapsedMs, language, levelNotification }: OralWritingResultProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isRTL = language === 'he'
  const similarity = Math.round(result.score.similarity * 100)

  const getScoreColor = (pct: number) => {
    if (pct >= 90) return 'text-green-600'
    if (pct >= 70) return 'text-sky-600'
    if (pct >= 50) return 'text-amber-600'
    return 'text-red-600'
  }

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

      {/* Score summary */}
      <div className="sticker-sm p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {t('games.oralWriting.results')}
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className={`text-3xl font-bold ${getScoreColor(similarity)}`}>
              {similarity}%
            </div>
            <div className="text-xs text-ink-2">{t('games.oralWriting.similarity')}</div>
          </div>
          <div>
            <div className={`display text-[28px] ${getScoreColor(similarity)}`}>
              {result.score.correctWords}/{result.score.totalWords}
            </div>
            <div className="text-xs text-ink-2">{t('games.oralWriting.wordsCorrect')}</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-sky-600">
              {(elapsedMs / 1000).toFixed(0)}s
            </div>
            <div className="text-xs text-ink-2">{t('games.oralWriting.timeTaken')}</div>
          </div>
        </div>
      </div>

      {/* Original text */}
      <div className="sticker-sm p-5" dir={isRTL ? 'rtl' : 'ltr'}>
        <h3 className="text-sm font-medium text-ink-2 mb-2">
          {t('games.oralWriting.originalText')}
        </h3>
        <p className="text-ink leading-relaxed">{result.score.original}</p>
      </div>

      {/* Word-level diff */}
      {!result.score.correct && (
        <div className="sticker-sm p-5" dir={isRTL ? 'rtl' : 'ltr'}>
          <h3 className="text-sm font-medium text-ink-2 mb-2">
            {t('games.oralWriting.yourInput')}
          </h3>
          <WordDiffView diffs={result.score.wordDiffs} />
        </div>
      )}

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
          onClick={() => navigate('/progress?game=oral-writing')}
          className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 sticker-flat hover:scale-[1.02] transition-transform text-gray-700"
        >
          <BarChart3 size={18} />
          {t('common.viewProgress')}
        </button>
      </div>
    </div>
  )
}
