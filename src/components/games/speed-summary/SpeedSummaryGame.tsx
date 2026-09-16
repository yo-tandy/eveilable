import { useState, useCallback, useRef } from 'react'
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuthStore } from '../../../stores/authStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { updateAggregateStats } from '../../../services/firestoreService'
import { recordSessionPlayed } from '../../../utils/streak'
import { recordLastPlayed } from '../../../utils/lastPlayed'
import { fetchAndGenerateParagraph } from '../../../services/paragraphService'
import type { ParagraphResult } from '../../../services/paragraphService'
import { evaluateSummary } from '../../../services/claudeService'
import { checkLevelProgression } from '../../../utils/levelProgression'
import { fetchRecentLanguageScores } from '../../../services/firestoreService'
import { LanguageGameIntro } from '../../common/LanguageGameIntro'
import { Zap } from 'lucide-react'
import { KeyboardCheck } from '../comprehension/KeyboardCheck'
import { PlayingPhase } from './PlayingPhase'
import { summaryLimits } from '../../../utils/levelScale'
import { SpeedSummaryResult } from './SpeedSummaryResult'
import { LoadingSpinner } from '../../common/LoadingSpinner'
import type { SummaryScore } from '../../../types/comprehension'
import type { GameSession } from '../../../types/game'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../../../types/user'

type Phase =
  | 'language-select'
  | 'keyboard-check'
  | 'loading'
  | 'playing'
  | 'evaluating'
  | 'results'

export function SpeedSummaryGame() {
  const { user } = useAuthStore()
  const { setLanguageLevel } = useSettingsStore()
  const sessionStartRef = useRef<Timestamp | null>(null)
  const [phase, setPhase] = useState<Phase>('language-select')
  const [language, setLanguage] = useState<SupportedLanguage>('en')
  const [level, setLevel] = useState<LanguageLevel>('B1')
  const [subLevel, setSubLevel] = useState<LanguageSubLevel>('well-placed')
  const [paragraph, setParagraph] = useState<ParagraphResult | null>(null)
  const [writingTimeMs, setWritingTimeMs] = useState(0)
  const [summaryEvaluation, setSummaryEvaluation] = useState<SummaryScore | null>(null)
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
      loadParagraph(lang, lvl, sub)
    }
  }, [setLanguageLevel])

  const loadParagraph = useCallback(async (lang: SupportedLanguage, lvl: LanguageLevel, sub: LanguageSubLevel) => {
    setPhase('loading')
    setError(null)
    sessionStartRef.current = Timestamp.now()

    try {
      const result = await fetchAndGenerateParagraph(lang, lvl, sub)
      setParagraph(result)
      setPhase('playing')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load paragraph')
      setPhase('language-select')
    }
  }, [])

  const handleKeyboardConfirm = useCallback(() => {
    loadParagraph(language, level, subLevel)
  }, [language, level, subLevel, loadParagraph])

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
        subLevel,
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
      recordSessionPlayed()
      recordLastPlayed('speed-summary', language)

      // Check level progression
      try {
        const recentScores = await fetchRecentLanguageScores(user.uid, 'speed-summary', language, level, subLevel)
        const result = checkLevelProgression({ cefr: level, sub: subLevel }, recentScores)
        if (result.changed) {
          setLanguageLevel(language, result.newConfig)
          setLevelNotification({
            direction: result.direction!,
            newLabel: `${result.newConfig.cefr} ${result.newConfig.sub}`,
          })
        }
      } catch (err) {
        console.error('[SpeedSummary] Level progression check failed:', err)
      }
    } catch (err) {
      console.error('[SpeedSummary] Failed to save session:', err)
    }
  }, [user, language, level, subLevel, setLanguageLevel])

  const handleSummarySubmit = useCallback(async (summaryText: string, summaryWritingTimeMs: number) => {
    setWritingTimeMs(summaryWritingTimeMs)
    setPhase('evaluating')
    try {
      const evaluation = await evaluateSummary(
        paragraph!.paragraph,
        summaryText,
        language,
        level,
        summaryLimits(language, 'speedSummary'),
        subLevel,
      )
      setSummaryEvaluation(evaluation)
      await saveSession(evaluation, summaryWritingTimeMs)
      setPhase('results')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate summary')
      setPhase('playing')
    }
  }, [paragraph, language, level, subLevel, saveSession])

  switch (phase) {
    case 'language-select':
      return (
        <LanguageGameIntro
          gameKey="speedSummary"
          icon={Zap}
          color="purple"
          error={error}
          onSelect={handleLanguageSelected}
        />
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
          paragraph={paragraph!}
          summaryScore={summaryEvaluation!}
          writingTimeMs={writingTimeMs}
          levelNotification={levelNotification}
        />
      )
  }
}
