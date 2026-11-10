import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuthStore } from '../../../stores/authStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { updateAggregateStats, fetchRecentLanguageScores } from '../../../services/firestoreService'
import { recordSessionPlayed } from '../../../utils/streak'
import { recordLastPlayed } from '../../../utils/lastPlayed'
import { fetchVerbDrill, evaluateVerbDrill } from '../../../services/verbDrillService'
import { checkLevelProgression } from '../../../utils/levelProgression'
import { LanguageGameIntro } from '../../common/LanguageGameIntro'
import { Target } from 'lucide-react'
import { KeyboardCheck } from '../comprehension/KeyboardCheck'
import { SetupPhase, type DrillSetup } from './SetupPhase'
import { PlayingPhase } from './PlayingPhase'
import { VerbDrillResult } from './VerbDrillResult'
import { itemCredit } from '../../../utils/verbDrillCheck'
import { LoadingSpinner } from '../../common/LoadingSpinner'
import type { VerbDrillSentence, VerbDrillAnswer, VerbDrillReview, ScoredItem } from '../../../types/verbDrill'
import type { GameSession } from '../../../types/game'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../../../types/user'

type Phase =
  | 'language-select'
  | 'keyboard-check'
  | 'setup'
  | 'loading'
  | 'playing'
  | 'evaluating'
  | 'results'

function scoreItems(sentences: VerbDrillSentence[], answers: VerbDrillAnswer[], reviews: VerbDrillReview[]): ScoredItem[] {
  return sentences.map((sentence, i) => {
    const answer = answers[i]
    const review = reviews.find(r => r.index === i)
    const status = answer.status === 'correct' ? 'correct'
      : review?.acceptable ? 'accepted'
      : answer.status
    return { sentence, answer, status, review }
  })
}

export function VerbDrillGame() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { setLanguageLevel } = useSettingsStore()
  const sessionStartRef = useRef<Timestamp | null>(null)
  // Increments per round so a save that finishes late can't touch a newer round
  const roundRef = useRef(0)
  const [phase, setPhase] = useState<Phase>('language-select')
  const [language, setLanguage] = useState<SupportedLanguage>('en')
  const [level, setLevel] = useState<LanguageLevel>('B1')
  const [subLevel, setSubLevel] = useState<LanguageSubLevel>('well-placed')
  const [sentences, setSentences] = useState<VerbDrillSentence[]>([])
  const [items, setItems] = useState<ScoredItem[]>([])
  const [overallScore, setOverallScore] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [levelNotification, setLevelNotification] = useState<{ direction: 'up' | 'down'; newLabel: string } | null>(null)

  const handleLanguageSelected = useCallback((lang: SupportedLanguage, lvl: LanguageLevel, sub: LanguageSubLevel) => {
    setLanguage(lang)
    setLevel(lvl)
    setSubLevel(sub)
    setLanguageLevel(lang, { cefr: lvl, sub })
    setError(null)
    setPhase(lang === 'zh' || lang === 'he' ? 'keyboard-check' : 'setup')
  }, [setLanguageLevel])

  const handleStart = useCallback(async (setup: DrillSetup) => {
    setPhase('loading')
    setError(null)
    roundRef.current += 1
    sessionStartRef.current = Timestamp.now()
    try {
      const result = await fetchVerbDrill(language, level, subLevel, setup.verbs, setup.tenses, setup.count)
      setSentences(result)
      setPhase('playing')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate sentences')
      setPhase('setup')
    }
  }, [language, level, subLevel])

  const saveSession = useCallback(async (scored: ScoredItem[], score: number, feedbackText: string) => {
    if (!user) return
    const round = roundRef.current
    try {
      const sessionsRef = collection(db, 'users', user.uid, 'sessions')
      const sessionDoc = doc(sessionsRef)

      const total = scored.length
      const correctCount = scored.filter(i => i.status === 'correct' || i.status === 'accepted').length
      const totalMs = scored.reduce((sum, i) => sum + i.answer.timeMs, 0)

      const sessionData: GameSession = {
        id: sessionDoc.id,
        gameType: 'verb-drill',
        startedAt: sessionStartRef.current ?? Timestamp.now(),
        endedAt: Timestamp.now(),
        totalTrials: total,
        correctTrials: correctCount,
        accuracy: total > 0 ? correctCount / total : 0,
        averageResponseTimeMs: total > 0 ? Math.round(totalMs / total) : 0,
        finalDifficulty: 1,
        difficultyProgression: [],
        performanceRating: score / 10,
        language,
        level,
        subLevel,
        summaryScore: {
          accuracyScore: score,
          vocabularyScore: score,
          grammarScore: score,
          overallScore: score,
          feedback: feedbackText,
        },
      }

      await setDoc(sessionDoc, sessionData)
      await updateAggregateStats(user.uid, 'verb-drill', sessionData)
      recordSessionPlayed()
      recordLastPlayed('verb-drill', language)

      try {
        const recentScores = await fetchRecentLanguageScores(user.uid, 'verb-drill', language, level, subLevel)
        const result = checkLevelProgression({ cefr: level, sub: subLevel }, recentScores)
        if (result.changed) {
          setLanguageLevel(language, result.newConfig)
          // Keep the next round on the new level, not the one this game started with
          setLevel(result.newConfig.cefr)
          setSubLevel(result.newConfig.sub)
          if (round === roundRef.current) setLevelNotification({
            direction: result.direction!,
            newLabel: `${result.newConfig.cefr} ${result.newConfig.sub}`,
          })
        }
      } catch (err) {
        console.error('[VerbDrill] Level progression check failed:', err)
      }
    } catch (err) {
      console.error('[VerbDrill] Failed to save session:', err)
    }
  }, [user, language, level, subLevel, setLanguageLevel])

  const handlePlayingComplete = useCallback(async (answers: VerbDrillAnswer[]) => {
    setPhase('evaluating')

    // Exact-match grading is already done; the review can only accept
    // alternatives the check missed, so a failed call still leaves valid results.
    let reviews: VerbDrillReview[] = []
    let feedbackText = ''
    try {
      const evaluation = await evaluateVerbDrill(
        language,
        level,
        subLevel,
        sentences.map((s, i) => ({
          sentence: `${s.before}___${s.after}`,
          infinitive: s.infinitive,
          tenseLabel: s.tenseLabel,
          correctForm: s.correctForm,
          userAnswer: answers[i].userAnswer,
          correct: answers[i].status === 'correct',
        })),
      )
      reviews = evaluation.reviews
      feedbackText = evaluation.feedback
    } catch (err) {
      console.error('[VerbDrill] Evaluation failed:', err)
    }

    const scored = scoreItems(sentences, answers, reviews)
    const credit = scored.reduce((sum, i) => sum + itemCredit(i.status), 0)
    const score = scored.length > 0 ? Math.round((credit / scored.length) * 100) / 10 : 0

    setItems(scored)
    setOverallScore(score)
    setFeedback(feedbackText || null)
    setPhase('results')
    // Offline, Firestore holds the write promise until reconnect; results must not wait on it
    void saveSession(scored, score, feedbackText)
  }, [language, level, subLevel, sentences, saveSession])

  const handlePlayAgain = useCallback(() => {
    setSentences([])
    setItems([])
    setFeedback(null)
    setLevelNotification(null)
    setError(null)
    setPhase('setup')
  }, [])

  switch (phase) {
    case 'language-select':
      return (
        <LanguageGameIntro
          gameKey="verbDrill"
          icon={Target}
          error={error}
          onSelect={handleLanguageSelected}
        />
      )
    case 'keyboard-check':
      return <KeyboardCheck language={language} onConfirm={() => setPhase('setup')} />
    case 'setup':
      return (
        <SetupPhase
          language={language}
          level={level}
          subLevel={subLevel}
          error={error}
          onStart={handleStart}
        />
      )
    case 'loading':
      return <LoadingSpinner message={t('games.verbDrill.generating')} />
    case 'playing':
      return (
        <PlayingPhase
          sentences={sentences}
          language={language}
          onComplete={handlePlayingComplete}
        />
      )
    case 'evaluating':
      return <LoadingSpinner message={t('games.verbDrill.evaluating')} />
    case 'results':
      return (
        <VerbDrillResult
          items={items}
          overallScore={overallScore}
          feedback={feedback}
          language={language}
          levelNotification={levelNotification}
          onPlayAgain={handlePlayAgain}
        />
      )
  }
}
