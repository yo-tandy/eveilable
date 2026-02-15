import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import type { Article, ComprehensionQuestion, SummaryScore } from '../../../types/comprehension'

interface EvaluationResultProps {
  article: Article
  questions: ComprehensionQuestion[]
  answers: number[]
  questionTimesMs: number[]
  summaryScore: SummaryScore
  readingTimeSeconds: number
  writingTimeMs: number
}

export function EvaluationResult({
  article,
  questions,
  answers,
  questionTimesMs,
  summaryScore,
  readingTimeSeconds,
  writingTimeMs,
}: EvaluationResultProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const questionsCorrect = answers.filter(
    (answer, i) => answer === questions[i].correctIndex
  ).length
  const wpm = Math.round((article.wordCount / readingTimeSeconds) * 60)
  const avgQuestionTimeMs = questionTimesMs.length > 0
    ? questionTimesMs.reduce((a, b) => a + b, 0) / questionTimesMs.length
    : 0
  const longestQuestionTimeMs = questionTimesMs.length > 0
    ? Math.max(...questionTimesMs)
    : 0

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h2 className="text-3xl font-bold text-center">Results</h2>

      {/* Reading stats */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Clock size={20} /> Reading
        </h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold">{readingTimeSeconds}s</div>
            <div className="text-sm text-gray-500">Reading Time</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{wpm}</div>
            <div className="text-sm text-gray-500">Words/Minute</div>
          </div>
        </div>
      </div>

      {/* Question results */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4">
          Questions: {questionsCorrect}/{questions.length} ({Math.round(questionsCorrect / questions.length * 100)}%)
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div>
            <span className="text-gray-500">Avg time per question: </span>
            <span className="font-medium">{Math.round(avgQuestionTimeMs / 1000)}s</span>
          </div>
          <div>
            <span className="text-gray-500">Longest: </span>
            <span className="font-medium">{Math.round(longestQuestionTimeMs / 1000)}s</span>
          </div>
        </div>
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {answers[i] === q.correctIndex
                ? <CheckCircle size={16} className="text-correct flex-shrink-0" />
                : <XCircle size={16} className="text-incorrect flex-shrink-0" />
              }
              <span className="truncate">{q.question}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary evaluation */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-2">Summary Evaluation</h3>
        <p className="text-sm text-gray-500 mb-4">
          Writing time: {Math.round(writingTimeMs / 1000)}s &middot; {summaryScore.wordCount} words
        </p>
        <div className="space-y-3">
          {[
            { label: 'Accuracy', score: summaryScore.accuracyScore },
            { label: 'Vocabulary', score: summaryScore.vocabularyScore },
            { label: 'Grammar', score: summaryScore.grammarScore },
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
            <div className="text-sm text-gray-500">Overall Score</div>
          </div>

          <div className="mt-4 p-4 bg-brand-50 rounded-xl">
            <p className="text-sm leading-relaxed">{summaryScore.feedback}</p>
          </div>
        </div>
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
