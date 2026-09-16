import { callFunction } from './api'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../types/user'

import type { StoryMeta } from '../types/comprehension'

interface Headline {
  title: string
  description: string
  source: string
  url?: string
  publishedAt?: string
}

export interface ParagraphResult extends StoryMeta {
  title: string
  paragraph: string
  wordCount: number
  language: string
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

  // Step 2: Generate a single paragraph, then attach where the headline came from
  const generated = await callFunction<ParagraphResult>(
    'generateParagraph',
    { headline: headline.title, language, level, subLevel }
  )

  return {
    ...generated,
    source: headline.source,
    sourceUrl: headline.url,
    publishedAt: headline.publishedAt,
    subLevel,
  }
}
