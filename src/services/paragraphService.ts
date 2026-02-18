import { callFunction } from './api'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../types/user'

interface Headline {
  title: string
  description: string
  source: string
}

export interface ParagraphResult {
  title: string
  paragraph: string
  wordCount: number
  language: string
  level: string
}

export async function fetchAndGenerateParagraph(
  language: SupportedLanguage,
  level: LanguageLevel,
  subLevel?: LanguageSubLevel,
): Promise<ParagraphResult> {
  // Step 1: Fetch news headlines
  const { headlines } = await callFunction<{ headlines: Headline[] }>(
    'fetchNews',
    { language }
  )

  if (!headlines || headlines.length === 0) {
    throw new Error('No news articles found')
  }

  // Pick a random headline
  const headline = headlines[Math.floor(Math.random() * headlines.length)]

  // Step 2: Generate a single paragraph
  const result = await callFunction<ParagraphResult>(
    'generateParagraph',
    { headline: headline.title, language, level, subLevel }
  )

  return result
}
