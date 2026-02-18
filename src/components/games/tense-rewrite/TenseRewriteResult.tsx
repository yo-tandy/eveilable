import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react'
import type { TenseExercise, TenseRewriteEvaluation } from '../../../types/tenseRewrite'

interface TenseRewriteResultProps {
  exercises: TenseExercise[]
  userRewrites: string[]
  evaluation: TenseRewriteEvaluation
  timesMs: number[]
  language: string
  levelNotification?: { direction: 'up' | 'down'; newLabel: string } | null
}

export function TenseRewriteResult({
  exercises,
  userRewrites,
  evaluation,
  timesMs,
  language,
  levelNotification,
}: TenseRewriteResultProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const isRTL = language === 'he'
  const correctCount = evaluation.sentenceScores.filter((s) => s.correct).length
  const avgTimeMs = timesMs.length > 0
    ? Math.round(timesMs.reduce((a, b) => a + b, 0) / timesMs.length)
    : 0
  const avgTimeSec = Math.round(avgTimeMs / 1000)

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h2 className="text-3xl font-bold text-center">
        {t('games.tenseRewrite.results')}
      </h2>

      {/* Level notification */}
      {levelNotification && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 ${
          levelNotification.direction === 'up'
            ? 'bg-green-500/10 border border-green-500/20 text-green-800'
            : 'bg-amber-500/10 border border-amber-500/20 text-amber-800'
        }`}>
          {levelNotification.direction === 'up'
            ? <TrendingUp size={20} />
            : <TrendingDown size={20} />
          }
          <span className="font-medium">
            {levelNotification.direction === 'up'
              ? `Level up! You've advanced to ${levelNotification.newLabel}`
              : `Level adjusted to ${levelNotification.newLabel}`
            }
          </span>
        </div>
      )}

      {/* Summary stats */}
      <div className="glass rounded-2xl p-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-3xl font-bold">{evaluation.overallScore}/10</div>
          <div className="text-sm text-gray-500">{t('games.tenseRewrite.overallScore')}</div>
        </div>
        <div>
          <div className="text-3xl font-bold">{correctCount}/{exercises.length}</div>
          <div className="text-sm text-gray-500">{t('games.tenseRewrite.correct')}</div>
        </div>
        <div>
          <div className="text-3xl font-bold">{avgTimeSec}s</div>
          <div className="text-sm text-gray-500">{t('games.tenseRewrite.avgTime')}</div>
        </div>
      </div>

      {/* Overall feedback */}
      <div className="glass rounded-2xl p-4">
        <p className="text-sm leading-relaxed">{evaluation.feedback}</p>
      </div>

      {/* Per-sentence breakdown */}
      <div className="space-y-4">
        {evaluation.sentenceScores.map((sentScore) => {
          const ex = exercises[sentScore.index]
          const userRewrite = userRewrites[sentScore.index]
          return (
            <div
              key={sentScore.index}
              className="glass rounded-2xl p-4 space-y-3"
            >
              {/* Header: number + score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {sentScore.correct ? (
                    <CheckCircle size={18} className="text-green-600" />
                  ) : (
                    <XCircle size={18} className="text-red-500" />
                  )}
                  <span className="text-sm font-medium text-gray-500">
                    #{sentScore.index + 1}
                  </span>
                </div>
                <span className={`text-sm font-bold ${
                  sentScore.correct ? 'text-green-600' : 'text-red-500'
                }`}>
                  {sentScore.score}/10
                </span>
              </div>

              {/* Original + task */}
              <div dir={isRTL ? 'rtl' : 'ltr'}>
                <p className="text-sm text-gray-500">{ex.original}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-rose-500/10 text-rose-700 rounded-full text-xs font-medium">
                  {ex.taskDescription}
                </span>
              </div>

              {/* User's answer */}
              <div dir={isRTL ? 'rtl' : 'ltr'}>
                <p className="text-xs text-gray-400 mb-0.5">{t('games.tenseRewrite.yourAnswer')}</p>
                <p className={`text-sm ${sentScore.correct ? 'text-gray-800' : 'text-gray-500 line-through'}`}>
                  {userRewrite}
                </p>
              </div>

              {/* Suggestion + feedback (show if incorrect) */}
              {!sentScore.correct && (
                <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-1">
                  <p className="text-xs text-gray-400">{t('games.tenseRewrite.suggestion')}</p>
                  <p className="text-sm text-gray-900">{sentScore.suggestion}</p>
                  <p className="text-xs text-gray-500">{sentScore.feedback}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="flex-1 py-3 glass rounded-xl font-medium hover:bg-white/50 transition-all"
        >
          {t('common.playAgain')}
        </button>
        <button
          onClick={() => navigate('/progress')}
          className="flex-1 py-3 bg-black/75 backdrop-blur-sm text-white rounded-xl font-semibold hover:scale-[1.02] transition-transform"
        >
          {t('common.viewProgress')}
        </button>
      </div>
    </div>
  )
}
