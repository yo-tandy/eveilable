import { useState, useCallback, useRef } from 'react'
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuthStore } from '../../../stores/authStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { updateAggregateStats } from '../../../services/firestoreService'
import { fetchAndGenerateArticle } from '../../../services/newsService'
import { evaluateSummary } from '../../../services/claudeService'
import { checkLevelProgression } from '../../../utils/levelProgression'
import { fetchRecentLanguageScores } from '../../../services/firestoreService'
import { LanguageSelector } from './LanguageSelector'
import { ModeSelector } from './ModeSelector'
import { KeyboardCheck } from './KeyboardCheck'
import { ArticleReader } from './ArticleReader'
import { QuestionPanel } from './QuestionPanel'
import { SummaryWriter } from './SummaryWriter'
import { EvaluationResult } from './EvaluationResult'
import { LoadingSpinner } from '../../common/LoadingSpinner'
import type { Article, ComprehensionQuestion, SummaryScore } from '../../../types/comprehension'
import type { GameSession } from '../../../types/game'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../../../types/user'

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
  const { user } = useAuthStore()
  const { setLanguageLevel } = useSettingsStore()
  const sessionStartRef = useRef<Timestamp | null>(null)
  const [phase, setPhase] = useState<Phase>('language-select')
  const [language, setLanguage] = useState<SupportedLanguage>('en')
  const [level, setLevel] = useState<LanguageLevel>('B1')
  const [subLevel, setSubLevel] = useState<LanguageSubLevel>('well-placed')
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
  const [levelNotification, setLevelNotification] = useState<{ direction: 'up' | 'down'; newLabel: string } | null>(null)

  const handleLanguageSelected = useCallback((lang: SupportedLanguage, lvl: LanguageLevel, sub: LanguageSubLevel) => {
    setLanguage(lang)
    setLevel(lvl)
    setSubLevel(sub)
    // Persist to settings store
    setLanguageLevel(lang, { cefr: lvl, sub })
    if (lang === 'zh' || lang === 'he') {
      setPhase('keyboard-check')
    } else {
      setPhase('mode-select')
    }
  }, [setLanguageLevel])

  const handleModeSelected = useCallback(async (selectedMode: 'complete' | 'race') => {
    setMode(selectedMode)
    setPhase('loading')
    setError(null)
    sessionStartRef.current = Timestamp.now()

    try {
      setLoadingMessage('Fetching news and preparing your article...')
      const { article: fetchedArticle, questions: fetchedQuestions } =
        await fetchAndGenerateArticle(language, level, subLevel)

      setArticle(fetchedArticle)
      setQuestions(fetchedQuestions)
      setPhase('reading')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to prepare article')
      setPhase('mode-select')
    }
  }, [language, level, subLevel])

  const handleDoneReading = useCallback((timeSeconds: number) => {
    setReadingTimeSeconds(timeSeconds)
    setPhase('questions')
  }, [])

  const handleQuestionsComplete = useCallback((answers: number[], timesMs: number[]) => {
    setQuestionAnswers(answers)
    setQuestionTimesMs(timesMs)
    setPhase('summary')
  }, [])

  const saveSession = useCallback(async (
    evaluation: SummaryScore,
    answers: number[],
    timesMs: number[],
  ) => {
    if (!user) {
      console.warn('[Comprehension] saveSession: no user, skipping')
      return
    }
    try {
      console.log('[Comprehension] saveSession: starting, uid=', user.uid, 'answers=', answers.length, 'questions=', questions.length)
      const correctTrials = answers.filter((a, i) => a === questions[i]?.correctIndex).length
      const totalTrials = questions.length
      const accuracy = totalTrials > 0 ? correctTrials / totalTrials : 0
      const avgResponseTimeMs = timesMs.length > 0
        ? timesMs.reduce((sum, t) => sum + t, 0) / timesMs.length
        : 0

      const sessionsRef = collection(db, 'users', user.uid, 'sessions')
      const sessionDoc = doc(sessionsRef)

      const sessionData: GameSession = {
        id: sessionDoc.id,
        gameType: 'comprehension',
        startedAt: sessionStartRef.current ?? Timestamp.now(),
        endedAt: Timestamp.now(),
        totalTrials,
        correctTrials,
        accuracy,
        averageResponseTimeMs: avgResponseTimeMs,
        finalDifficulty: 1,
        difficultyProgression: [],
        performanceRating: evaluation.overallScore / 10,
        language,
        level,
        subLevel,
        readingTimeSeconds,
        questionsCorrect: correctTrials,
        questionsTotal: totalTrials,
        summaryScore: {
          accuracyScore: evaluation.accuracyScore,
          vocabularyScore: evaluation.vocabularyScore,
          grammarScore: evaluation.grammarScore,
          overallScore: evaluation.overallScore,
          feedback: evaluation.feedback,
        },
      }

      console.log('[Comprehension] saveSession: writing to Firestore...')
      await setDoc(sessionDoc, sessionData)
      console.log('[Comprehension] saveSession: session saved, updating aggregate stats...')
      await updateAggregateStats(user.uid, 'comprehension', sessionData)
      console.log('[Comprehension] saveSession: done!')

      // Check level progression
      try {
        const recentScores = await fetchRecentLanguageScores(user.uid, 'comprehension', language, level, subLevel)
        const result = checkLevelProgression({ cefr: level, sub: subLevel }, recentScores)
        if (result.changed) {
          setLanguageLevel(language, result.newConfig)
          setLevelNotification({
            direction: result.direction!,
            newLabel: `${result.newConfig.cefr} ${result.newConfig.sub}`,
          })
        }
      } catch (err) {
        console.error('[Comprehension] Level progression check failed:', err)
      }
    } catch (err) {
      console.error('[Comprehension] Failed to save session:', err)
    }
  }, [user, questions, language, level, subLevel, readingTimeSeconds, setLanguageLevel])

  const handleSummarySubmit = useCallback(async (summaryText: string, summaryWritingTimeMs: number) => {
    setWritingTimeMs(summaryWritingTimeMs)
    setPhase('evaluating')
    try {
      const articleText = article!.paragraphs.join('\n\n')
      const evaluation = await evaluateSummary(articleText, summaryText, language, level, { min: 30, max: 60 }, subLevel)
      evaluation.readingTimeSeconds = readingTimeSeconds
      setSummaryEvaluation(evaluation)
      console.log('[Comprehension] handleSummarySubmit: calling saveSession with', questionAnswers.length, 'answers')
      await saveSession(evaluation, questionAnswers, questionTimesMs)
      console.log('[Comprehension] handleSummarySubmit: saveSession complete')
      setPhase('results')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate summary')
      setPhase('summary')
    }
  }, [article, language, level, subLevel, readingTimeSeconds, saveSession, questionAnswers, questionTimesMs])

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
          subLevel={subLevel}
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
          levelNotification={levelNotification}
        />
      )
  }
}
