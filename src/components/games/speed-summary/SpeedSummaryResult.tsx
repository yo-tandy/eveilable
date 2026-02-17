import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { SummaryScore } from '../../../types/comprehension'

interface SpeedSummaryResultProps {
  summaryScore: SummaryScore
  writingTimeMs: number
}

export function SpeedSummaryResult({ summaryScore, writingTimeMs }: SpeedSummaryResultProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const writingSeconds = Math.round(writingTimeMs / 1000)

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h2 className="text-3xl font-bold text-center">
        {t('games.speedSummary.summaryEvaluation')}
      </h2>

      {/* Writing stats */}
      <div className="bg-gray-50 rounded-2xl p-6 grid grid-cols-2 gap-4 text-center">
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
      <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
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
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-500"
                style={{ width: `${score * 10}%` }}
              />
            </div>
          </div>
        ))}

        <div className="text-center mt-4 pt-4 border-t">
          <div className="text-4xl font-bold text-brand-600">
            {summaryScore.overallScore}/10
          </div>
          <div className="text-sm text-gray-500">{t('games.speedSummary.overallScore')}</div>
        </div>

        {/* Feedback */}
        <div className="mt-4 p-4 bg-brand-50 rounded-xl">
          <p className="text-sm leading-relaxed">{summaryScore.feedback}</p>
        </div>

        {/* Sentence-level issues */}
        {summaryScore.sentenceIssues && summaryScore.sentenceIssues.length > 0 && (
          <div className="mt-4 space-y-3">
            <h4 className="font-medium text-sm text-gray-700">
              {t('games.speedSummary.detailedFeedback')}
            </h4>
            {summaryScore.sentenceIssues.map((issue, i) => (
              <div key={i} className="p-3 bg-white rounded-lg border border-gray-200 text-sm space-y-1.5">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    issue.issueType === 'grammar'
                      ? 'bg-amber-100 text-amber-800'
                      : issue.issueType === 'vocabulary'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
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
          className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50"
        >
          {t('common.playAgain')}
        </button>
        <button
          onClick={() => navigate('/progress')}
          className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700"
        >
          {t('common.viewProgress')}
        </button>
      </div>
    </div>
  )
}
