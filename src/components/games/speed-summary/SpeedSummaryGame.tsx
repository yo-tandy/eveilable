import { useState, useCallback, useRef } from 'react'
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuthStore } from '../../../stores/authStore'
import { updateAggregateStats } from '../../../services/firestoreService'
import { fetchAndGenerateParagraph } from '../../../services/paragraphService'
import type { ParagraphResult } from '../../../services/paragraphService'
import { evaluateSummary } from '../../../services/claudeService'
import { LanguageSelector } from '../comprehension/LanguageSelector'
import { KeyboardCheck } from '../comprehension/KeyboardCheck'
import { PlayingPhase } from './PlayingPhase'
import { SpeedSummaryResult } from './SpeedSummaryResult'
import { LoadingSpinner } from '../../common/LoadingSpinner'
import type { SummaryScore } from '../../../types/comprehension'
import type { GameSession } from '../../../types/game'
import type { SupportedLanguage, LanguageLevel } from '../../../types/user'

type Phase =
  | 'language-select'
  | 'keyboard-check'
  | 'loading'
  | 'playing'
  | 'evaluating'
  | 'results'

export function SpeedSummaryGame() {
  const { user } = useAuthStore()
  const sessionStartRef = useRef<Timestamp | null>(null)
  const [phase, setPhase] = useState<Phase>('language-select')
  const [language, setLanguage] = useState<SupportedLanguage>('en')
  const [level, setLevel] = useState<LanguageLevel>('B1')
  const [paragraph, setParagraph] = useState<ParagraphResult | null>(null)
  const [writingTimeMs, setWritingTimeMs] = useState(0)
  const [summaryEvaluation, setSummaryEvaluation] = useState<SummaryScore | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleLanguageSelected = useCallback((lang: SupportedLanguage, lvl: LanguageLevel) => {
    setLanguage(lang)
    setLevel(lvl)
    if (lang === 'zh' || lang === 'he') {
      setPhase('keyboard-check')
    } else {
      loadParagraph(lang, lvl)
    }
  }, [])

  const loadParagraph = useCallback(async (lang: SupportedLanguage, lvl: LanguageLevel) => {
    setPhase('loading')
    setError(null)
    sessionStartRef.current = Timestamp.now()

    try {
      const result = await fetchAndGenerateParagraph(lang, lvl)
      setParagraph(result)
      setPhase('playing')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load paragraph')
      setPhase('language-select')
    }
  }, [])

  const handleKeyboardConfirm = useCallback(() => {
    loadParagraph(language, level)
  }, [language, level, loadParagraph])

  const saveSession = useCallback(async (evaluation: SummaryScore, totalWritingTimeMs: number) => {
    if (!user) return
    try {
      const sessionsRef = collection(db, 'users', user.uid, 'sessions')
      const sessionDoc = doc(sessionsRef)

      const sessionData: GameSession = {
        id: sessionDoc.id,
        gameType: 'speed-summary',
        startedAt: sessionStartRef.current ?? Timestamp.now(),
        endedAt: Timestamp.now(),
        totalTrials: 1,
        correctTrials: evaluation.overallScore >= 5 ? 1 : 0,
        accuracy: evaluation.overallScore / 10,
        averageResponseTimeMs: totalWritingTimeMs,
        finalDifficulty: 1,
        difficultyProgression: [],
        performanceRating: evaluation.overallScore / 10,
        language,
        level,
        summaryScore: {
          accuracyScore: evaluation.accuracyScore,
          vocabularyScore: evaluation.vocabularyScore,
          grammarScore: evaluation.grammarScore,
          overallScore: evaluation.overallScore,
          feedback: evaluation.feedback,
        },
      }

      await setDoc(sessionDoc, sessionData)
      await updateAggregateStats(user.uid, 'speed-summary', sessionData)
    } catch (err) {
      console.error('[SpeedSummary] Failed to save session:', err)
    }
  }, [user, language, level])

  const handleSummarySubmit = useCallback(async (summaryText: string, summaryWritingTimeMs: number) => {
    setWritingTimeMs(summaryWritingTimeMs)
    setPhase('evaluating')
    try {
      const evaluation = await evaluateSummary(
        paragraph!.paragraph,
        summaryText,
        language,
        level,
        { min: 10, max: 20 },
      )
      setSummaryEvaluation(evaluation)
      await saveSession(evaluation, summaryWritingTimeMs)
      setPhase('results')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate summary')
      setPhase('playing')
    }
  }, [paragraph, language, level, saveSession])

  switch (phase) {
    case 'language-select':
      return (
        <div>
          {error && (
            <div className="max-w-lg mx-auto mb-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}
          <LanguageSelector onSelect={handleLanguageSelected} />
        </div>
      )
    case 'keyboard-check':
      return <KeyboardCheck language={language} onConfirm={handleKeyboardConfirm} />
    case 'loading':
      return <LoadingSpinner message="Fetching news and generating paragraph..." />
    case 'playing':
      return (
        <PlayingPhase
          paragraph={paragraph!}
          language={language}
          onSubmit={handleSummarySubmit}
        />
      )
    case 'evaluating':
      return <LoadingSpinner message="Evaluating your summary..." />
    case 'results':
      return (
        <SpeedSummaryResult
          summaryScore={summaryEvaluation!}
          writingTimeMs={writingTimeMs}
        />
      )
  }
}
