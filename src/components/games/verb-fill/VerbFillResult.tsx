import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { VerbFillExercise, VerbFillEvaluation } from '../../../types/verbFill'

interface VerbFillResultProps {
  exercise: VerbFillExercise
  userAnswers: string[]
  evaluation: VerbFillEvaluation
  totalTimeMs: number
  language: string
  levelNotification?: { direction: 'up' | 'down'; newLabel: string } | null
}

export function VerbFillResult({
  exercise,
  userAnswers,
  evaluation,
  totalTimeMs,
  language,
  levelNotification,
}: VerbFillResultProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const isRTL = language === 'he'
  const correctCount = evaluation.verbScores.filter(s => s.correct).length
  const avgTimeSec = exercise.verbCount > 0
    ? Math.round(totalTimeMs / 1000 / exercise.verbCount)
    : 0

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h2 className="display text-[36px] text-center">
        {t('games.verbFill.results')}
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
      <div className="sticker-sm p-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-3xl font-bold">{evaluation.overallScore}/10</div>
          <div className="text-sm text-ink-2">{t('games.verbFill.overallScore')}</div>
        </div>
        <div>
          <div className="text-3xl font-bold">{correctCount}/{exercise.verbCount}</div>
          <div className="text-sm text-ink-2">{t('games.verbFill.correct')}</div>
        </div>
        <div>
          <div className="text-3xl font-bold">{avgTimeSec}s</div>
          <div className="text-sm text-ink-2">{t('games.verbFill.avgTime')}</div>
        </div>
      </div>

      {/* Overall feedback */}
      <div className="sticker-sm p-4">
        <p className="text-sm leading-relaxed">{evaluation.feedback}</p>
      </div>

      {/* Full text with annotated results */}
      <div
        className="sticker-sm p-6 leading-[2.5] text-lg"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {exercise.segments.map((seg, i) => {
          if (seg.type === 'text') {
            return <span key={i}>{seg.content}</span>
          }

          const verbIdx = seg.index!
          const score = evaluation.verbScores.find(v => v.index === verbIdx)

          if (!score) {
            return <span key={i} className="font-medium">{seg.correctForm}</span>
          }

          return (
            <span key={i} className="inline-flex items-baseline gap-0.5 mx-0.5">
              {score.correct ? (
                <span className="px-1.5 py-0.5 bg-green-500/15 text-green-700 rounded font-medium">
                  {userAnswers[verbIdx]}
                </span>
              ) : (
                <>
                  <span className="px-1 py-0.5 bg-red-500/15 text-red-500 rounded line-through text-sm">
                    {userAnswers[verbIdx]}
                  </span>
                  <span className="px-1.5 py-0.5 bg-green-500/15 text-green-700 rounded font-medium">
                    {seg.correctForm}
                  </span>
                </>
              )}
              <span className="text-xs text-ink-3 italic">({seg.infinitive})</span>
            </span>
          )
        })}
      </div>

      {/* Per-verb details (only show incorrect) */}
      {evaluation.verbScores.some(s => !s.correct) && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            {t('games.verbFill.corrections')}
          </h3>
          {evaluation.verbScores
            .filter(s => !s.correct)
            .map(score => {
              const seg = exercise.segments.find(
                s => s.type === 'verb' && s.index === score.index
              )
              return (
                <div key={score.index} className="sticker-sm p-3 text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-2 py-0.5 bg-amber-500/10 text-amber-700 rounded-full text-xs font-medium">
                      {seg?.infinitive}
                    </span>
                    <span className={`text-xs font-bold ${
                      score.score >= 5 ? 'text-amber-600' : 'text-red-500'
                    }`}>
                      {score.score}/10
                    </span>
                  </div>
                  <div dir={isRTL ? 'rtl' : 'ltr'}>
                    <span className="text-red-500 line-through">{score.userAnswer}</span>
                    {' → '}
                    <span className="text-green-700 font-medium">{score.correctForm}</span>
                  </div>
                  <p className="text-ink-2 text-xs">{score.feedback}</p>
                </div>
              )
            })}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="flex-1 btn btn-ghost"
        >
          {t('common.playAgain')}
        </button>
        <button
          onClick={() => navigate('/progress?game=verb-fill')}
          className="flex-1 py-3 btn btn-sun"
        >
          {t('common.viewProgress')}
        </button>
      </div>
    </div>
  )
}
