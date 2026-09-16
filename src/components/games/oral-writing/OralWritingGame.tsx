import { useState, useCallback, useRef } from 'react'
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuthStore } from '../../../stores/authStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { updateAggregateStats } from '../../../services/firestoreService'
import { recordSessionPlayed } from '../../../utils/streak'
import { recordLastPlayed } from '../../../utils/lastPlayed'
import { fetchDictationText, evaluateDictation } from '../../../services/dictationService'
import { checkLevelProgression } from '../../../utils/levelProgression'
import { fetchRecentLanguageScores } from '../../../services/firestoreService'
import { LanguageGameIntro } from '../../common/LanguageGameIntro'
import { Headphones } from 'lucide-react'
import { KeyboardCheck } from '../comprehension/KeyboardCheck'
import { PlayingPhase } from './PlayingPhase'
import { OralWritingResult } from './OralWritingResult'
import { LoadingSpinner } from '../../common/LoadingSpinner'
import type { DictationResult } from '../../../services/dictationService'
import type { GameSession } from '../../../types/game'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../../../types/user'

type Phase =
  | 'language-select'
  | 'keyboard-check'
  | 'loading'
  | 'playing'
  | 'results'

export function OralWritingGame() {
  const { user } = useAuthStore()
  const { setLanguageLevel } = useSettingsStore()
  const sessionStartRef = useRef<Timestamp | null>(null)
  const [phase, setPhase] = useState<Phase>('language-select')
  const [language, setLanguage] = useState<SupportedLanguage>('en')
  const [level, setLevel] = useState<LanguageLevel>('B1')
  const [subLevel, setSubLevel] = useState<LanguageSubLevel>('well-placed')
  const [text, setText] = useState('')
  const [result, setResult] = useState<DictationResult | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
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
      loadText(lang, lvl, sub)
    }
  }, [setLanguageLevel])

  const loadText = useCallback(async (lang: SupportedLanguage, lvl: LanguageLevel, sub: LanguageSubLevel) => {
    setPhase('loading')
    setError(null)
    sessionStartRef.current = Timestamp.now()

    try {
      const data = await fetchDictationText(lang, lvl, sub)
      setText(data.text)
      setPhase('playing')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate dictation text')
      setPhase('language-select')
    }
  }, [])

  const handleKeyboardConfirm = useCallback(() => {
    loadText(language, level, subLevel)
  }, [language, level, subLevel, loadText])

  const saveSession = useCallback(async (eval_: DictationResult, timeMs: number) => {
    if (!user) return
    try {
      const sessionsRef = collection(db, 'users', user.uid, 'sessions')
      const sessionDoc = doc(sessionsRef)

      const sessionData: GameSession = {
        id: sessionDoc.id,
        gameType: 'oral-writing',
        startedAt: sessionStartRef.current ?? Timestamp.now(),
        endedAt: Timestamp.now(),
        totalTrials: 1,
        correctTrials: eval_.score.correct ? 1 : 0,
        accuracy: eval_.score.similarity,
        averageResponseTimeMs: timeMs,
        finalDifficulty: 1,
        difficultyProgression: [],
        performanceRating: eval_.score.similarity,
        language,
        level,
        subLevel,
        summaryScore: {
          accuracyScore: eval_.overallScore,
          vocabularyScore: eval_.overallScore,
          grammarScore: eval_.overallScore,
          overallScore: eval_.overallScore,
          feedback: `${Math.round(eval_.score.similarity * 100)}% accuracy on dictation.`,
        },
      }

      await setDoc(sessionDoc, sessionData)
      await updateAggregateStats(user.uid, 'oral-writing', sessionData)
      recordSessionPlayed()
      recordLastPlayed('oral-writing', language)

      try {
        const recentScores = await fetchRecentLanguageScores(user.uid, 'oral-writing', language, level, subLevel)
        const progression = checkLevelProgression({ cefr: level, sub: subLevel }, recentScores)
        if (progression.changed) {
          setLanguageLevel(language, progression.newConfig)
          setLevelNotification({
            direction: progression.direction!,
            newLabel: `${progression.newConfig.cefr} ${progression.newConfig.sub}`,
          })
        }
      } catch (err) {
        console.error('[OralWriting] Level progression check failed:', err)
      }
    } catch (err) {
      console.error('[OralWriting] Failed to save session:', err)
    }
  }, [user, language, level, subLevel, setLanguageLevel])

  const handleComplete = useCallback(async (userInput: string, timeMs: number) => {
    setElapsedMs(timeMs)

    const eval_ = evaluateDictation(text, userInput)
    setResult(eval_)

    await saveSession(eval_, timeMs)
    setPhase('results')
  }, [text, saveSession])

  switch (phase) {
    case 'language-select':
      return (
        <LanguageGameIntro
          gameKey="oralWriting"
          icon={Headphones}
          color="sky"
          error={error}
          onSelect={handleLanguageSelected}
        />
      )
    case 'keyboard-check':
      return <KeyboardCheck language={language} onConfirm={handleKeyboardConfirm} />
    case 'loading':
      return <LoadingSpinner message="Generating dictation..." />
    case 'playing':
      return (
        <PlayingPhase
          text={text}
          language={language}
          onComplete={handleComplete}
        />
      )
    case 'results':
      return (
        <OralWritingResult
          result={result!}
          elapsedMs={elapsedMs}
          language={language}
          levelNotification={levelNotification}
        />
      )
  }
}
