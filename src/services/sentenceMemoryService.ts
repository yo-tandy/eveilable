import { callFunction, expectArray } from './api'
import type { SentenceMemoryResult, SentenceScore } from '../types/sentenceMemory'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../types/user'

export async function fetchSentences(
  language: SupportedLanguage,
  level: LanguageLevel,
  subLevel?: LanguageSubLevel,
): Promise<string[]> {
  const { sentences } = await callFunction<{ sentences: string[] }>(
    'generateMemorySentences',
    { language, level, subLevel },
  )
  return expectArray<string>(sentences, 'sentences')
}

/** Levenshtein edit distance */
function editDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }
  return dp[m][n]
}

export function evaluateLocally(sentences: string[], userInputs: string[]): SentenceMemoryResult {
  const scores: SentenceScore[] = sentences.map((original, i) => {
    const userInput = userInputs[i] ?? ''
    const origTrimmed = original.trim()
    const userTrimmed = userInput.trim()
    const correct = origTrimmed === userTrimmed
    const maxLen = Math.max(origTrimmed.length, userTrimmed.length)
    const similarity = maxLen === 0 ? 1 : 1 - editDistance(origTrimmed, userTrimmed) / maxLen

    return { correct, similarity, original: origTrimmed, userInput: userTrimmed }
  })

  const correctCount = scores.filter(s => s.correct).length
  const overallScore = Math.round(correctCount / sentences.length * 10)

  return { sentences, userInputs, scores, overallScore, correctCount }
}
