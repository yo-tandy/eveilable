import { onCall, HttpsError } from 'firebase-functions/v2/https'
import Anthropic from '@anthropic-ai/sdk'

// Lazy-initialize: secret is only available at request time, not module load
function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  })
}

const SECRETS = ['ANTHROPIC_API_KEY'] as const

/** Strip markdown code fences that Claude sometimes wraps around JSON */
function extractJSON(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  return match ? match[1].trim() : text.trim()
}

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

      const raw = response.content[0].type === 'text' ? response.content[0].text : ''
      const article = JSON.parse(extractJSON(raw))
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
- For each question, include a "supportingQuote" field: a short exact quote from the article (1-2 sentences) that directly supports the correct answer

Return ONLY a JSON array (no markdown, no explanation):
[{"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "supportingQuote": "exact text from article"}, ...]`
        }],
      })

      const raw = response.content[0].type === 'text' ? response.content[0].text : ''
      const questions = JSON.parse(extractJSON(raw))

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

    const { article, summary, language, level, wordLimit } = request.data as {
      article: string
      summary: string
      language: string
      level: string
      wordLimit?: { min: number; max: number }
    }

    const wl = wordLimit ?? { min: 10, max: 100 }

    try {
      const response = await getClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1536,
        messages: [{
          role: 'user',
          content: `Evaluate this summary of the article below.

Article:
${article}

Summary:
${summary}

Language: ${language === 'en' ? 'English' : language === 'fr' ? 'French' : language === 'zh' ? 'Chinese' : 'Hebrew'}
Expected CEFR level: ${level}
Word limit: ${wl.min}–${wl.max} words

IMPORTANT SCORING GUIDELINES:

Score each dimension from 1-10:

- accuracy: Does the summary capture the MAIN IDEA or central message of the article? The summary is constrained to only ${wl.min}–${wl.max} words, so it is IMPOSSIBLE to include every detail. Do NOT penalize for omitting specific details like names, cities, statistics, lists, or secondary points. A summary that correctly conveys the core message in ${wl.min}–${wl.max} words should score 8-10 for accuracy.

- vocabulary: REWARD the use of vocabulary that is MORE ADVANCED than the expected ${level} level. Using words above the expected CEFR level demonstrates strong language skills and should INCREASE the score (8-10). Only lower the score if the vocabulary is significantly BELOW the expected level or if words are used incorrectly. Do NOT penalize for using advanced words correctly.

- grammar: REWARD sophisticated sentence structures (complex sentences, varied syntax, subordinate clauses) that go beyond the expected ${level} level. Only flag actual grammatical ERRORS (wrong tense, subject-verb disagreement, missing articles, etc.). Correct but advanced grammar should INCREASE the score, not decrease it.

- overall: Overall quality considering all factors above, with emphasis on main-idea capture and language sophistication.

Provide brief constructive feedback in the "feedback" field. Focus on what the student did well and any genuine errors. Do not suggest adding details that would exceed the word limit.

Additionally, identify specific sentences that have genuine issues. For each problematic sentence, provide:
- "sentence": the exact sentence from the summary
- "issueType": one of "grammar", "vocabulary", or "accuracy"
- "explanation": a brief explanation of the actual error (1 sentence)
- "suggestion": the corrected version

ONLY flag genuine errors (wrong grammar, incorrect word usage, factual inaccuracies). Do NOT flag:
- Advanced vocabulary used correctly (this is a positive, not an issue)
- Missing details that couldn't fit within the word limit
- Sophisticated grammar structures that are correct

If the summary has no genuine issues, return an empty sentenceIssues array.

Return ONLY a JSON object (no markdown, no explanation):
{"accuracyScore": N, "vocabularyScore": N, "grammarScore": N, "overallScore": N, "feedback": "...", "sentenceIssues": [{"sentence": "...", "issueType": "grammar|vocabulary|accuracy", "explanation": "...", "suggestion": "..."}]}`
        }],
      })

      const raw = response.content[0].type === 'text' ? response.content[0].text : ''
      const evaluation = JSON.parse(extractJSON(raw))

      return evaluation
    } catch (error: unknown) {
      console.error('Function error:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new HttpsError('internal', message)
    }
  }
)
