import { callFunction } from './api'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../types/user'

export interface DictationText {
  title: string
  text: string
  wordCount: number
  language: string
  level: string
}

export interface WordDiff {
  original: string    // original word (with punctuation)
  userWord: string    // user's word (with punctuation), empty if missing
  match: boolean      // true if the stripped words match
  extra?: boolean     // true if this is an extra word the user added
}

export interface DictationScore {
  correct: boolean
  similarity: number
  original: string
  userInput: string
  wordDiffs: WordDiff[]
  correctWords: number
  totalWords: number
}

export interface DictationResult {
  score: DictationScore
  overallScore: number
}

export async function fetchDictationText(
  language: SupportedLanguage,
  level: LanguageLevel,
  subLevel?: LanguageSubLevel,
): Promise<DictationText> {
  return callFunction<DictationText>('generateDictationText', { language, level, subLevel })
}

/** Strip punctuation and delimiters, keeping only letters, digits, and accented characters */
function stripPunctuation(word: string): string {
  return word.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase()
}

/** Split text into words (whitespace-separated tokens) */
function tokenize(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean)
}

/** Word-level edit distance returning alignment for diff display */
function wordEditDistance(a: string[], b: string[]): number {
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

/** Align two word arrays and produce a diff, comparing stripped (no punctuation) forms */
function alignWords(origTokens: string[], userTokens: string[]): WordDiff[] {
  const origStripped = origTokens.map(stripPunctuation)
  const userStripped = userTokens.map(stripPunctuation)

  const m = origStripped.length
  const n = userStripped.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origStripped[i - 1] === userStripped[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  // Backtrack to build alignment
  const diffs: WordDiff[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origStripped[i - 1] === userStripped[j - 1]) {
      // Match
      diffs.push({ original: origTokens[i - 1], userWord: userTokens[j - 1], match: true })
      i--; j--
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      // Substitution (wrong word)
      diffs.push({ original: origTokens[i - 1], userWord: userTokens[j - 1], match: false })
      i--; j--
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      // Insertion (extra word from user)
      diffs.push({ original: '', userWord: userTokens[j - 1], match: false, extra: true })
      j--
    } else {
      // Deletion (user missed a word)
      diffs.push({ original: origTokens[i - 1], userWord: '', match: false })
      i--
    }
  }

  return diffs.reverse()
}

export function evaluateDictation(original: string, userInput: string): DictationResult {
  const origTrimmed = original.trim()
  const userTrimmed = userInput.trim()

  const origTokens = tokenize(origTrimmed)
  const userTokens = tokenize(userTrimmed)

  // Compare stripped (no punctuation/spaces) word forms
  const origStripped = origTokens.map(stripPunctuation)
  const userStripped = userTokens.map(stripPunctuation)

  const dist = wordEditDistance(origStripped, userStripped)
  const maxWords = Math.max(origStripped.length, userStripped.length)
  const similarity = maxWords === 0 ? 1 : 1 - dist / maxWords
  const correct = dist === 0

  const wordDiffs = alignWords(origTokens, userTokens)
  const correctWords = wordDiffs.filter(d => d.match).length
  const totalWords = origTokens.length

  const score: DictationScore = {
    correct,
    similarity,
    original: origTrimmed,
    userInput: userTrimmed,
    wordDiffs,
    correctWords,
    totalWords,
  }
  const overallScore = Math.round(similarity * 10)

  return { score, overallScore }
}
