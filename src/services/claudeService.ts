import { callFunction } from './api'
import type { SummaryScore } from '../types/comprehension'
import type { SupportedLanguage, LanguageLevel } from '../types/user'

export async function evaluateSummary(
  articleText: string,
  summary: string,
  language: SupportedLanguage,
  level: LanguageLevel,
): Promise<SummaryScore> {
  const result = await callFunction<{
    accuracyScore: number
    vocabularyScore: number
    grammarScore: number
    overallScore: number
    feedback: string
  }>('evaluateSummary', {
    article: articleText,
    summary,
    language,
    level,
  })

  return {
    summaryText: summary,
    wordCount: summary.split(/\s+/).filter(Boolean).length,
    accuracyScore: result.accuracyScore,
    vocabularyScore: result.vocabularyScore,
    grammarScore: result.grammarScore,
    overallScore: result.overallScore,
    feedback: result.feedback,
    readingTimeSeconds: 0,
  }
}
