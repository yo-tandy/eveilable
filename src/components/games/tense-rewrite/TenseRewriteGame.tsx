import { useState, useCallback, useRef } from 'react'
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuthStore } from '../../../stores/authStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { updateAggregateStats } from '../../../services/firestoreService'
import { fetchTenseExercises, submitTenseRewrites } from '../../../services/tenseRewriteService'
import { checkLevelProgression } from '../../../utils/levelProgression'
import { fetchRecentLanguageScores } from '../../../services/firestoreService'
import { LanguageSelector } from '../comprehension/LanguageSelector'
import { KeyboardCheck } from '../comprehension/KeyboardCheck'
import { PlayingPhase } from './PlayingPhase'
import { TenseRewriteResult } from './TenseRewriteResult'
import { LoadingSpinner } from '../../common/LoadingSpinner'
import type { TenseExercise, TenseRewriteEvaluation } from '../../../types/tenseRewrite'
import type { GameSession } from '../../../types/game'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../../../types/user'

type Phase =
  | 'language-select'
  | 'keyboard-check'
  | 'loading'
  | 'playing'
  | 'evaluating'
  | 'results'

export function TenseRewriteGame() {
  const { user } = useAuthStore()
  const { setLanguageLevel } = useSettingsStore()
  const sessionStartRef = useRef<Timestamp | null>(null)
  const [phase, setPhase] = useState<Phase>('language-select')
  const [language, setLanguage] = useState<SupportedLanguage>('en')
  const [level, setLevel] = useState<LanguageLevel>('B1')
  const [subLevel, setSubLevel] = useState<LanguageSubLevel>('well-placed')
  const [exercises, setExercises] = useState<TenseExercise[]>([])
  const [userRewrites, setUserRewrites] = useState<string[]>([])
  const [timesMs, setTimesMs] = useState<number[]>([])
  const [evaluation, setEvaluation] = useState<TenseRewriteEvaluation | null>(null)
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
      loadExercises(lang, lvl, sub)
    }
  }, [setLanguageLevel])

  const loadExercises = useCallback(async (lang: SupportedLanguage, lvl: LanguageLevel, sub: LanguageSubLevel) => {
    setPhase('loading')
    setError(null)
    sessionStartRef.current = Timestamp.now()

    try {
      const result = await fetchTenseExercises(lang, lvl, sub)
      setExercises(result)
      setPhase('playing')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate exercises')
      setPhase('language-select')
    }
  }, [])

  const handleKeyboardConfirm = useCallback(() => {
    loadExercises(language, level, subLevel)
  }, [language, level, subLevel, loadExercises])

  const saveSession = useCallback(async (eval_: TenseRewriteEvaluation, avgTimeMs: number) => {
    if (!user) return
    try {
      const sessionsRef = collection(db, 'users', user.uid, 'sessions')
      const sessionDoc = doc(sessionsRef)

      const correctCount = eval_.sentenceScores.filter((s) => s.correct).length

      const sessionData: GameSession = {
        id: sessionDoc.id,
        gameType: 'tense-rewrite',
        startedAt: sessionStartRef.current ?? Timestamp.now(),
        endedAt: Timestamp.now(),
        totalTrials: 10,
        correctTrials: correctCount,
        accuracy: correctCount / 10,
        averageResponseTimeMs: avgTimeMs,
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
      await updateAggregateStats(user.uid, 'tense-rewrite', sessionData)

      // Check level progression
      try {
        const recentScores = await fetchRecentLanguageScores(user.uid, 'tense-rewrite', language, level, subLevel)
        const result = checkLevelProgression({ cefr: level, sub: subLevel }, recentScores)
        if (result.changed) {
          setLanguageLevel(language, result.newConfig)
          setLevelNotification({
            direction: result.direction!,
            newLabel: `${result.newConfig.cefr} ${result.newConfig.sub}`,
          })
        }
      } catch (err) {
        console.error('[TenseRewrite] Level progression check failed:', err)
      }
    } catch (err) {
      console.error('[TenseRewrite] Failed to save session:', err)
    }
  }, [user, language, level, subLevel, setLanguageLevel])

  const handlePlayingComplete = useCallback(async (rewrites: string[], times: number[]) => {
    setUserRewrites(rewrites)
    setTimesMs(times)
    setPhase('evaluating')

    try {
      const eval_ = await submitTenseRewrites(exercises, rewrites, language, level, subLevel)
      setEvaluation(eval_)

      const avgTimeMs = times.length > 0
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        : 0
      await saveSession(eval_, avgTimeMs)
      setPhase('results')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate rewrites')
      setPhase('playing')
    }
  }, [exercises, language, level, subLevel, saveSession])

  switch (phase) {
    case 'language-select':
      return (
        <div>
          {error && (
            <div className="max-w-lg mx-auto mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}
          <LanguageSelector onSelect={handleLanguageSelected} />
        </div>
      )
    case 'keyboard-check':
      return <KeyboardCheck language={language} onConfirm={handleKeyboardConfirm} />
    case 'loading':
      return <LoadingSpinner message="Generating exercises..." />
    case 'playing':
      return (
        <PlayingPhase
          exercises={exercises}
          language={language}
          onComplete={handlePlayingComplete}
        />
      )
    case 'evaluating':
      return <LoadingSpinner message="Evaluating your rewrites..." />
    case 'results':
      return (
        <TenseRewriteResult
          exercises={exercises}
          userRewrites={userRewrites}
          evaluation={evaluation!}
          timesMs={timesMs}
          language={language}
          levelNotification={levelNotification}
        />
      )
  }
}
