import { callFunction } from './api'
import type { Article, ComprehensionQuestion } from '../types/comprehension'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../types/user'

interface Headline {
  title: string
  description: string
  source: string
}

export async function fetchAndGenerateArticle(
  language: SupportedLanguage,
  level: LanguageLevel,
  subLevel?: LanguageSubLevel,
): Promise<{ article: Article; questions: ComprehensionQuestion[] }> {
  // Step 1: Fetch news headlines
  const { headlines } = await callFunction<{ headlines: Headline[] }>(
    'fetchNews',
    { language }
  )

  if (!headlines || headlines.length === 0) {
    throw new Error('No news articles found')
  }

  // Pick a headline
  const headline = headlines[Math.floor(Math.random() * headlines.length)]

  // Step 2: Generate article
  const article = await callFunction<Article>(
    'generateArticle',
    { headline: headline.title, language, level, subLevel }
  )

  // Step 3: Generate questions
  const articleText = article.paragraphs.join('\n\n')
  const { questions } = await callFunction<{ questions: ComprehensionQuestion[] }>(
    'generateQuestions',
    { article: articleText, language }
  )

  return { article, questions }
}
