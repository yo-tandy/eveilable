import { useState, useEffect, useRef, useCallback } from 'react'
import { preciseNow } from '../../../utils/timing'
import { Timer } from '../../common/Timer'
import type { Article } from '../../../types/comprehension'
import type { LanguageLevel, LanguageSubLevel } from '../../../types/user'

interface ArticleReaderProps {
  article: Article
  mode: 'complete' | 'race'
  level: LanguageLevel
  subLevel?: LanguageSubLevel
  onDoneReading: (timeSeconds: number) => void
}

const READING_TIME_PER_100_WORDS: Record<string, number> = {
  A1: 120,
  A2: 90,
  B1: 60,
  B2: 45,
  C1: 35,
  C2: 25,
}

const LEVEL_ORDER: LanguageLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function getInterpolatedReadingTime(level: LanguageLevel, subLevel?: LanguageSubLevel): number {
  const baseTime = READING_TIME_PER_100_WORDS[level]
  if (!subLevel || subLevel === 'well-placed') return baseTime

  const idx = LEVEL_ORDER.indexOf(level)
  if (subLevel === 'novice') {
    // 30% toward the easier (higher time) level
    const easierTime = idx > 0 ? READING_TIME_PER_100_WORDS[LEVEL_ORDER[idx - 1]] : baseTime * 1.3
    return Math.round(baseTime + (easierTime - baseTime) * 0.3)
  } else {
    // advanced: 30% toward the harder (lower time) level
    const harderTime = idx < LEVEL_ORDER.length - 1 ? READING_TIME_PER_100_WORDS[LEVEL_ORDER[idx + 1]] : baseTime * 0.7
    return Math.round(baseTime + (harderTime - baseTime) * 0.3)
  }
}

export function ArticleReader({ article, mode, level, subLevel, onDoneReading }: ArticleReaderProps) {
  const startTimeRef = useRef(preciseNow())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const readingTimePer100 = getInterpolatedReadingTime(level, subLevel)
  const timeBudgetSeconds = Math.ceil(
    (article.wordCount / 100) * readingTimePer100
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((preciseNow() - startTimeRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleDone = useCallback(() => {
    const timeSeconds = (preciseNow() - startTimeRef.current) / 1000
    onDoneReading(Math.round(timeSeconds))
  }, [onDoneReading])

  // Auto-advance when time runs out in Race mode
  useEffect(() => {
    if (mode === 'race' && elapsedSeconds >= timeBudgetSeconds) {
      handleDone()
    }
  }, [elapsedSeconds, timeBudgetSeconds, mode, handleDone])

  const dir = article.language === 'he' ? 'rtl' : 'ltr'

  return (
    <div className="max-w-2xl mx-auto p-6">
      {mode === 'race' ? (
        <Timer
          totalSeconds={timeBudgetSeconds}
          elapsedSeconds={elapsedSeconds}
          variant="countdown"
        />
      ) : (
        <div className="text-center text-sm text-gray-400 mb-4">
          {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')} elapsed
        </div>
      )}

      <article dir={dir} className="max-w-none">
        <h1 className="text-2xl font-bold mb-6">{article.title}</h1>
        {article.paragraphs.map((para, i) => (
          <p key={i} className="mb-4 leading-relaxed text-lg">{para}</p>
        ))}
      </article>

      <button
        onClick={handleDone}
        className="mt-8 w-full py-3 bg-black/75 backdrop-blur-sm text-white rounded-xl font-semibold hover:scale-[1.02] transition-transform"
      >
        Done Reading
      </button>
    </div>
  )
}
