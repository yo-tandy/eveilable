import { useState, useCallback, useRef } from 'react'
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuthStore } from '../../../stores/authStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { updateAggregateStats } from '../../../services/firestoreService'
import { recordSessionPlayed } from '../../../utils/streak'
import { recordLastPlayed } from '../../../utils/lastPlayed'
import { fetchVerbFillExercise, submitVerbFillAnswers } from '../../../services/verbFillService'
import { checkLevelProgression } from '../../../utils/levelProgression'
import { fetchRecentLanguageScores } from '../../../services/firestoreService'
import { LanguageGameIntro } from '../../common/LanguageGameIntro'
import { PenLine } from 'lucide-react'
import { KeyboardCheck } from '../comprehension/KeyboardCheck'
import { PlayingPhase } from './PlayingPhase'
import { VerbFillResult } from './VerbFillResult'
import { LoadingSpinner } from '../../common/LoadingSpinner'
import type { VerbFillExercise, VerbFillEvaluation } from '../../../types/verbFill'
import type { GameSession } from '../../../types/game'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../../../types/user'

type Phase =
  | 'language-select'
  | 'keyboard-check'
  | 'loading'
  | 'playing'
  | 'evaluating'
  | 'results'

export function VerbFillGame() {
  const { user } = useAuthStore()
  const { setLanguageLevel } = useSettingsStore()
  const sessionStartRef = useRef<Timestamp | null>(null)
  const [phase, setPhase] = useState<Phase>('language-select')
  const [language, setLanguage] = useState<SupportedLanguage>('en')
  const [level, setLevel] = useState<LanguageLevel>('B1')
  const [subLevel, setSubLevel] = useState<LanguageSubLevel>('well-placed')
  const [exercise, setExercise] = useState<VerbFillExercise | null>(null)
  const [userAnswers, setUserAnswers] = useState<string[]>([])
  const [totalTimeMs, setTotalTimeMs] = useState(0)
  const [evaluation, setEvaluation] = useState<VerbFillEvaluation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [levelNotification, setLevelNotification] = useState<{ direction: 'up' | 'down'; newLabel: string } | null>(null)

  const handleLanguageSelected = useCallback((lang: SupportedLanguage, lvl: LanguageLevel, sub: LanguageSubLevel) => {
    setLanguage(lang)
    setLevel(lvl)
    setSubLevel(sub)
    setLanguageLevel(lang, { cefr: lvl, sub })
    if (lang === 'zh' || lang === 'he') {
      setPhase('keyboard-check')
    } else {
      loadExercise(lang, lvl, sub)
    }
  }, [setLanguageLevel])

  const loadExercise = useCallback(async (lang: SupportedLanguage, lvl: LanguageLevel, sub: LanguageSubLevel) => {
    setPhase('loading')
    setError(null)
    sessionStartRef.current = Timestamp.now()

    try {
      const result = await fetchVerbFillExercise(lang, lvl, sub)
      setExercise(result)
      setPhase('playing')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate exercise')
      setPhase('language-select')
    }
  }, [])

  const handleKeyboardConfirm = useCallback(() => {
    loadExercise(language, level, subLevel)
  }, [language, level, subLevel, loadExercise])

  const saveSession = useCallback(async (eval_: VerbFillEvaluation, timeMs: number) => {
    if (!user || !exercise) return
    try {
      const sessionsRef = collection(db, 'users', user.uid, 'sessions')
      const sessionDoc = doc(sessionsRef)

      const correctCount = eval_.verbScores.filter(s => s.correct).length
      const verbCount = eval_.verbScores.length

      const sessionData: GameSession = {
        id: sessionDoc.id,
        gameType: 'verb-fill',
        startedAt: sessionStartRef.current ?? Timestamp.now(),
        endedAt: Timestamp.now(),
        totalTrials: verbCount,
        correctTrials: correctCount,
        accuracy: verbCount > 0 ? correctCount / verbCount : 0,
        averageResponseTimeMs: verbCount > 0 ? Math.round(timeMs / verbCount) : 0,
        finalDifficulty: 1,
        difficultyProgression: [],
        performanceRating: eval_.overallScore / 10,
        language,
        level,
        subLevel,
        summaryScore: {
          accuracyScore: eval_.overallScore,
          vocabularyScore: eval_.overallScore,
          grammarScore: eval_.overallScore,
          overallScore: eval_.overallScore,
          feedback: eval_.feedback,
        },
      }

      await setDoc(sessionDoc, sessionData)
      await updateAggregateStats(user.uid, 'verb-fill', sessionData)
      recordSessionPlayed()
      recordLastPlayed('verb-fill', language)

      // Check level progression
      try {
        const recentScores = await fetchRecentLanguageScores(user.uid, 'verb-fill', language, level, subLevel)
        const result = checkLevelProgression({ cefr: level, sub: subLevel }, recentScores)
        if (result.changed) {
          setLanguageLevel(language, result.newConfig)
          setLevelNotification({
            direction: result.direction!,
            newLabel: `${result.newConfig.cefr} ${result.newConfig.sub}`,
          })
        }
      } catch (err) {
        console.error('[VerbFill] Level progression check failed:', err)
      }
    } catch (err) {
      console.error('[VerbFill] Failed to save session:', err)
    }
  }, [user, exercise, language, level, subLevel, setLanguageLevel])

  const handlePlayingComplete = useCallback(async (answers: string[], timeMs: number) => {
    setUserAnswers(answers)
    setTotalTimeMs(timeMs)
    setPhase('evaluating')

    try {
      const eval_ = await submitVerbFillAnswers(
        exercise!.title,
        exercise!.segments,
        answers,
        language,
        level,
        subLevel,
      )
      setEvaluation(eval_)
      await saveSession(eval_, timeMs)
      setPhase('results')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate answers')
      setPhase('playing')
    }
  }, [exercise, language, level, subLevel, saveSession])

  switch (phase) {
    case 'language-select':
      return (
        <LanguageGameIntro
          gameKey="verbFill"
          icon={PenLine}
          color="amber"
          error={error}
          onSelect={handleLanguageSelected}
        />
      )
    case 'keyboard-check':
      return <KeyboardCheck language={language} onConfirm={handleKeyboardConfirm} />
    case 'loading':
      return <LoadingSpinner message="Generating exercise..." />
    case 'playing':
      return (
        <PlayingPhase
          exercise={exercise!}
          language={language}
          onComplete={handlePlayingComplete}
        />
      )
    case 'evaluating':
      return <LoadingSpinner message="Evaluating your answers..." />
    case 'results':
      return (
        <VerbFillResult
          exercise={exercise!}
          userAnswers={userAnswers}
          evaluation={evaluation!}
          totalTimeMs={totalTimeMs}
          language={language}
          levelNotification={levelNotification}
        />
      )
  }
}
