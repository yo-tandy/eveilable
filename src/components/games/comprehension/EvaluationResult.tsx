import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set())

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

  const toggleQuestion = (index: number) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

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
          {questions.map((q, i) => {
            const isCorrect = answers[i] === q.correctIndex
            const isExpanded = expandedQuestions.has(i)

            if (isCorrect) {
              return (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle size={16} className="text-correct flex-shrink-0" />
                  <span className="truncate">{q.question}</span>
                </div>
              )
            }

            return (
              <div key={i}>
                <button
                  onClick={() => toggleQuestion(i)}
                  className="flex items-center gap-2 text-sm w-full text-left hover:bg-gray-100 rounded-lg p-1 -m-1 transition-colors"
                >
                  <XCircle size={16} className="text-incorrect flex-shrink-0" />
                  <span className="truncate flex-1">{q.question}</span>
                  {isExpanded
                    ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                    : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                  }
                </button>
                {isExpanded && (
                  <div className="ml-7 mt-2 mb-3 space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <XCircle size={14} className="text-incorrect mt-0.5 flex-shrink-0" />
                      <span>
                        <span className="text-gray-500">{t('games.comprehension.results.yourAnswer')}: </span>
                        {q.options[answers[i]]}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-correct mt-0.5 flex-shrink-0" />
                      <span>
                        <span className="text-gray-500">{t('games.comprehension.results.correctAnswer')}: </span>
                        <span className="font-medium">{q.options[q.correctIndex]}</span>
                      </span>
                    </div>
                    {q.supportingQuote && (
                      <blockquote className="border-l-2 border-brand-300 pl-3 text-gray-600 italic">
                        <span className="text-gray-400 text-xs block mb-1">{t('games.comprehension.results.fromArticle')}:</span>
                        &ldquo;{q.supportingQuote}&rdquo;
                      </blockquote>
                    )}
                  </div>
                )}
              </div>
            )
          })}
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

          {/* Sentence-level feedback */}
          {summaryScore.sentenceIssues && summaryScore.sentenceIssues.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="font-medium text-sm text-gray-700">
                {t('games.comprehension.results.detailedFeedback')}
              </h4>
              {summaryScore.sentenceIssues.map((issue, i) => (
                <div key={i} className="p-3 bg-white rounded-lg border border-gray-200 text-sm space-y-1.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    issue.issueType === 'grammar' ? 'bg-amber-100 text-amber-800' :
                    issue.issueType === 'vocabulary' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
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
