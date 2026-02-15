import { onCall, HttpsError } from 'firebase-functions/v2/https'
import Anthropic from '@anthropic-ai/sdk'

// Lazy-initialize: secret is only available at request time, not module load
function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  })
}

const SECRETS = ['ANTHROPIC_API_KEY'] as const

export const generateArticle = onCall(
  { timeoutSeconds: 60, memory: '256MiB', secrets: [...SECRETS] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const { headline, language, level } = request.data as {
      headline: string
      language: string
      level: string
    }

    try {
      const response = await getClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Write a news article based on this headline: "${headline}"

Requirements:
- Language: ${language === 'en' ? 'English' : language === 'fr' ? 'French' : language === 'zh' ? 'Chinese (Simplified)' : 'Hebrew'}
- CEFR language level: ${level} (adjust vocabulary and sentence complexity accordingly)
- Exactly 3 paragraphs
- Approximately 350 words total
- Factual and informative tone
- The article should be self-contained and understandable without prior knowledge

Return ONLY a JSON object with this structure (no markdown, no explanation):
{"title": "...", "paragraphs": ["paragraph1", "paragraph2", "paragraph3"]}`
        }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const article = JSON.parse(text)
      const wordCount = article.paragraphs.join(' ').split(/\s+/).length

      return {
        title: article.title,
        paragraphs: article.paragraphs,
        wordCount,
        language,
        level,
      }
    } catch (error: unknown) {
      console.error('Function error:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new HttpsError('internal', message)
    }
  }
)

export const generateQuestions = onCall(
  { timeoutSeconds: 60, memory: '256MiB', secrets: [...SECRETS] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const { article, language } = request.data as {
      article: string
      language: string
    }

    try {
      const response = await getClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `Based on this article, create 10 multiple-choice questions.

Article:
${article}

Requirements:
- Language: ${language === 'en' ? 'English' : language === 'fr' ? 'French' : language === 'zh' ? 'Chinese' : 'Hebrew'}
- Each question should have exactly 4 options
- All answers must be directly derivable from the text
- Questions should test comprehension, not trivia
- Mix detail questions with inference questions

Return ONLY a JSON array (no markdown, no explanation):
[{"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0}, ...]`
        }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const questions = JSON.parse(text)

      return { questions }
    } catch (error: unknown) {
      console.error('Function error:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new HttpsError('internal', message)
    }
  }
)

export const evaluateSummary = onCall(
  { timeoutSeconds: 60, memory: '256MiB', secrets: [...SECRETS] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const { article, summary, language, level } = request.data as {
      article: string
      summary: string
      language: string
      level: string
    }

    try {
      const response = await getClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `Evaluate this summary of the article below.

Article:
${article}

Summary:
${summary}

Language: ${language === 'en' ? 'English' : language === 'fr' ? 'French' : language === 'zh' ? 'Chinese' : 'Hebrew'}
Expected CEFR level: ${level}

Score each dimension from 1-10:
- accuracy: How well does the summary capture the key points?
- vocabulary: Is the vocabulary appropriate for the ${level} level?
- grammar: Is the grammar correct for the ${level} level?
- overall: Overall quality considering all factors

Provide brief constructive feedback.

Return ONLY a JSON object (no markdown, no explanation):
{"accuracyScore": N, "vocabularyScore": N, "grammarScore": N, "overallScore": N, "feedback": "..."}`
        }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const evaluation = JSON.parse(text)

      return evaluation
    } catch (error: unknown) {
      console.error('Function error:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new HttpsError('internal', message)
    }
  }
)
