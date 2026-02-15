import { useState, useCallback } from 'react'
import { fetchAndGenerateArticle } from '../../../services/newsService'
import { evaluateSummary } from '../../../services/claudeService'
import { LanguageSelector } from './LanguageSelector'
import { ModeSelector } from './ModeSelector'
import { KeyboardCheck } from './KeyboardCheck'
import { ArticleReader } from './ArticleReader'
import { QuestionPanel } from './QuestionPanel'
import { SummaryWriter } from './SummaryWriter'
import { EvaluationResult } from './EvaluationResult'
import { LoadingSpinner } from '../../common/LoadingSpinner'
import type { Article, ComprehensionQuestion, SummaryScore } from '../../../types/comprehension'
import type { SupportedLanguage, LanguageLevel } from '../../../types/user'

type Phase =
  | 'language-select'
  | 'mode-select'
  | 'keyboard-check'
  | 'loading'
  | 'reading'
  | 'questions'
  | 'summary'
  | 'evaluating'
  | 'results'

export function ComprehensionGame() {
  const [phase, setPhase] = useState<Phase>('language-select')
  const [language, setLanguage] = useState<SupportedLanguage>('en')
  const [level, setLevel] = useState<LanguageLevel>('B1')
  const [mode, setMode] = useState<'complete' | 'race'>('complete')
  const [article, setArticle] = useState<Article | null>(null)
  const [questions, setQuestions] = useState<ComprehensionQuestion[]>([])
  const [questionAnswers, setQuestionAnswers] = useState<number[]>([])
  const [questionTimesMs, setQuestionTimesMs] = useState<number[]>([])
  const [readingTimeSeconds, setReadingTimeSeconds] = useState(0)
  const [writingTimeMs, setWritingTimeMs] = useState(0)
  const [summaryEvaluation, setSummaryEvaluation] = useState<SummaryScore | null>(null)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleLanguageSelected = useCallback((lang: SupportedLanguage, lvl: LanguageLevel) => {
    setLanguage(lang)
    setLevel(lvl)
    if (lang === 'zh' || lang === 'he') {
      setPhase('keyboard-check')
    } else {
      setPhase('mode-select')
    }
  }, [])

  const handleModeSelected = useCallback(async (selectedMode: 'complete' | 'race') => {
    setMode(selectedMode)
    setPhase('loading')
    setError(null)

    try {
      setLoadingMessage('Fetching news and preparing your article...')
      const { article: fetchedArticle, questions: fetchedQuestions } =
        await fetchAndGenerateArticle(language, level)

      setArticle(fetchedArticle)
      setQuestions(fetchedQuestions)
      setPhase('reading')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to prepare article')
      setPhase('mode-select')
    }
  }, [language, level])

  const handleDoneReading = useCallback((timeSeconds: number) => {
    setReadingTimeSeconds(timeSeconds)
    setPhase('questions')
  }, [])

  const handleQuestionsComplete = useCallback((answers: number[], timesMs: number[]) => {
    setQuestionAnswers(answers)
    setQuestionTimesMs(timesMs)
    setPhase('summary')
  }, [])

  const handleSummarySubmit = useCallback(async (summaryText: string, summaryWritingTimeMs: number) => {
    setWritingTimeMs(summaryWritingTimeMs)
    setPhase('evaluating')
    try {
      const articleText = article!.paragraphs.join('\n\n')
      const evaluation = await evaluateSummary(articleText, summaryText, language, level)
      evaluation.readingTimeSeconds = readingTimeSeconds
      setSummaryEvaluation(evaluation)
      setPhase('results')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate summary')
      setPhase('summary')
    }
  }, [article, language, level, readingTimeSeconds])

  switch (phase) {
    case 'language-select':
      return <LanguageSelector onSelect={handleLanguageSelected} />
    case 'keyboard-check':
      return <KeyboardCheck language={language} onConfirm={() => setPhase('mode-select')} />
    case 'mode-select':
      return <ModeSelector onSelect={handleModeSelected} error={error} />
    case 'loading':
      return <LoadingSpinner message={loadingMessage} />
    case 'reading':
      return (
        <ArticleReader
          article={article!}
          mode={mode}
          level={level}
          onDoneReading={handleDoneReading}
        />
      )
    case 'questions':
      return (
        <QuestionPanel
          questions={questions}
          mode={mode}
          onComplete={handleQuestionsComplete}
        />
      )
    case 'summary':
      return (
        <SummaryWriter
          mode={mode}
          language={language}
          onSubmit={handleSummarySubmit}
          error={error}
        />
      )
    case 'evaluating':
      return <LoadingSpinner message="Evaluating your summary..." />
    case 'results':
      return (
        <EvaluationResult
          article={article!}
          questions={questions}
          answers={questionAnswers}
          questionTimesMs={questionTimesMs}
          summaryScore={summaryEvaluation!}
          readingTimeSeconds={readingTimeSeconds}
          writingTimeMs={writingTimeMs}
        />
      )
  }
}
