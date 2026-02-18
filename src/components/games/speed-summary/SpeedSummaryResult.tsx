import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { SummaryScore } from '../../../types/comprehension'

interface SpeedSummaryResultProps {
  summaryScore: SummaryScore
  writingTimeMs: number
  levelNotification?: { direction: 'up' | 'down'; newLabel: string } | null
}

export function SpeedSummaryResult({ summaryScore, writingTimeMs, levelNotification }: SpeedSummaryResultProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const writingSeconds = Math.round(writingTimeMs / 1000)

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h2 className="text-3xl font-bold text-center">
        {t('games.speedSummary.summaryEvaluation')}
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

      {/* Writing stats */}
      <div className="glass rounded-2xl p-6 grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-3xl font-bold">{writingSeconds}s</div>
          <div className="text-sm text-gray-500">{t('games.speedSummary.writingTime')}</div>
        </div>
        <div>
          <div className="text-3xl font-bold">{summaryScore.wordCount}</div>
          <div className="text-sm text-gray-500">{t('games.speedSummary.words')}</div>
        </div>
      </div>

      {/* Scores */}
      <div className="glass rounded-2xl p-6 space-y-3">
        {[
          { label: t('games.speedSummary.accuracy'), score: summaryScore.accuracyScore },
          { label: t('games.speedSummary.vocabulary'), score: summaryScore.vocabularyScore },
          { label: t('games.speedSummary.grammar'), score: summaryScore.grammarScore },
        ].map(({ label, score }) => (
          <div key={label}>
            <div className="flex justify-between text-sm mb-1">
              <span>{label}</span>
              <span className="font-bold">{score}/10</span>
            </div>
            <div className="h-3 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-black/60 rounded-full transition-all duration-500"
                style={{ width: `${score * 10}%` }}
              />
            </div>
          </div>
        ))}

        <div className="text-center mt-4 pt-4 border-t border-white/30">
          <div className="text-4xl font-bold">
            {summaryScore.overallScore}/10
          </div>
          <div className="text-sm text-gray-500">{t('games.speedSummary.overallScore')}</div>
        </div>

        {/* Feedback */}
        <div className="mt-4 p-4 glass rounded-xl">
          <p className="text-sm leading-relaxed">{summaryScore.feedback}</p>
        </div>

        {/* Sentence-level issues */}
        {summaryScore.sentenceIssues && summaryScore.sentenceIssues.length > 0 && (
          <div className="mt-4 space-y-3">
            <h4 className="font-medium text-sm text-gray-700">
              {t('games.speedSummary.detailedFeedback')}
            </h4>
            {summaryScore.sentenceIssues.map((issue, i) => (
              <div key={i} className="p-3 glass rounded-lg text-sm space-y-1.5">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    issue.issueType === 'grammar'
                      ? 'bg-amber-500/10 text-amber-800'
                      : issue.issueType === 'vocabulary'
                        ? 'bg-blue-500/10 text-blue-800'
                        : 'bg-red-500/10 text-red-800'
                  }`}
                >
                  {issue.issueType}
                </span>
                <p className="text-gray-500 line-through">{issue.sentence}</p>
                <p className="text-gray-900">{issue.suggestion}</p>
                <p className="text-gray-500 text-xs">{issue.explanation}</p>
              </div>
            ))}
          </div>
        )}
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
