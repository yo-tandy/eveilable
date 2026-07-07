import { useState, useCallback, useRef } from 'react'
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuthStore } from '../../../stores/authStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { updateAggregateStats } from '../../../services/firestoreService'
import { recordSessionPlayed } from '../../../utils/streak'
import { fetchSentences, evaluateLocally } from '../../../services/sentenceMemoryService'
import { checkLevelProgression } from '../../../utils/levelProgression'
import { fetchRecentLanguageScores } from '../../../services/firestoreService'
import { LanguageGameIntro } from '../../common/LanguageGameIntro'
import { Type } from 'lucide-react'
import { KeyboardCheck } from '../comprehension/KeyboardCheck'
import { PlayingPhase } from './PlayingPhase'
import { SentenceMemoryResult } from './SentenceMemoryResult'
import { LoadingSpinner } from '../../common/LoadingSpinner'
import type { SentenceMemoryResult as SentenceMemoryResultType } from '../../../types/sentenceMemory'
import type { GameSession } from '../../../types/game'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../../../types/user'

type Phase =
  | 'language-select'
  | 'keyboard-check'
  | 'loading'
  | 'playing'
  | 'results'

export function SentenceMemoryGame() {
  const { user } = useAuthStore()
  const { setLanguageLevel } = useSettingsStore()
  const sessionStartRef = useRef<Timestamp | null>(null)
  const [phase, setPhase] = useState<Phase>('language-select')
  const [language, setLanguage] = useState<SupportedLanguage>('en')
  const [level, setLevel] = useState<LanguageLevel>('B1')
  const [subLevel, setSubLevel] = useState<LanguageSubLevel>('well-placed')
  const [sentences, setSentences] = useState<string[]>([])
  const [result, setResult] = useState<SentenceMemoryResultType | null>(null)
  const [timesMs, setTimesMs] = useState<number[]>([])
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
      loadSentences(lang, lvl, sub)
    }
  }, [setLanguageLevel])

  const loadSentences = useCallback(async (lang: SupportedLanguage, lvl: LanguageLevel, sub: LanguageSubLevel) => {
    setPhase('loading')
    setError(null)
    sessionStartRef.current = Timestamp.now()

    try {
      const fetched = await fetchSentences(lang, lvl, sub)
      setSentences(fetched)
      setPhase('playing')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate sentences')
      setPhase('language-select')
    }
  }, [])

  const handleKeyboardConfirm = useCallback(() => {
    loadSentences(language, level, subLevel)
  }, [language, level, subLevel, loadSentences])

  const saveSession = useCallback(async (eval_: SentenceMemoryResultType, avgTimeMs: number) => {
    if (!user) return
    try {
      const sessionsRef = collection(db, 'users', user.uid, 'sessions')
      const sessionDoc = doc(sessionsRef)

      const sessionData: GameSession = {
        id: sessionDoc.id,
        gameType: 'sentence-memory',
        startedAt: sessionStartRef.current ?? Timestamp.now(),
        endedAt: Timestamp.now(),
        totalTrials: 10,
        correctTrials: eval_.correctCount,
        accuracy: eval_.correctCount / 10,
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
          feedback: `${eval_.correctCount}/10 sentences recalled correctly.`,
        },
      }

      await setDoc(sessionDoc, sessionData)
      await updateAggregateStats(user.uid, 'sentence-memory', sessionData)
      recordSessionPlayed()

      try {
        const recentScores = await fetchRecentLanguageScores(user.uid, 'sentence-memory', language, level, subLevel)
        const progression = checkLevelProgression({ cefr: level, sub: subLevel }, recentScores)
        if (progression.changed) {
          setLanguageLevel(language, progression.newConfig)
          setLevelNotification({
            direction: progression.direction!,
            newLabel: `${progression.newConfig.cefr} ${progression.newConfig.sub}`,
          })
        }
      } catch (err) {
        console.error('[SentenceMemory] Level progression check failed:', err)
      }
    } catch (err) {
      console.error('[SentenceMemory] Failed to save session:', err)
    }
  }, [user, language, level, subLevel, setLanguageLevel])

  const handlePlayingComplete = useCallback(async (userInputs: string[], times: number[]) => {
    setTimesMs(times)

    const eval_ = evaluateLocally(sentences, userInputs)
    setResult(eval_)

    const avgTimeMs = times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : 0
    await saveSession(eval_, avgTimeMs)
    setPhase('results')
  }, [sentences, saveSession])

  switch (phase) {
    case 'language-select':
      return (
        <LanguageGameIntro
          gameKey="sentenceMemory"
          icon={Type}
          color="cyan"
          error={error}
          onSelect={handleLanguageSelected}
        />
      )
    case 'keyboard-check':
      return <KeyboardCheck language={language} onConfirm={handleKeyboardConfirm} />
    case 'loading':
      return <LoadingSpinner message="Generating sentences..." />
    case 'playing':
      return (
        <PlayingPhase
          sentences={sentences}
          language={language}
          onComplete={handlePlayingComplete}
        />
      )
    case 'results':
      return (
        <SentenceMemoryResult
          result={result!}
          timesMs={timesMs}
          language={language}
          levelNotification={levelNotification}
        />
      )
  }
}
