import { onCall, HttpsError } from 'firebase-functions/v2/https'
import Anthropic from '@anthropic-ai/sdk'
import { callClaudeStructured } from './jsonUtils.js'
import { aiHttpsError } from './aiErrors.js'
import {
  validateLanguage, validateLevel, validateSubLevel,
  checkRateLimit, langName, subLevelDescription,
} from './validate.js'

function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  })
}

const SECRETS = ['ANTHROPIC_API_KEY'] as const

function getSentenceLengthGuidance(level: string): string {
  if (level === 'A1' || level === 'A2') {
    return '5-8 words per sentence. Use simple, everyday vocabulary and basic sentence structures (subject-verb-object).'
  }
  if (level === 'B1' || level === 'B2') {
    return '8-14 words per sentence. Use varied vocabulary and moderately complex structures (subordinate clauses, connectors).'
  }
  return '14-22 words per sentence. Use sophisticated vocabulary, complex grammar, and multi-clause structures.'
}

export const generateMemorySentences = onCall(
  { timeoutSeconds: 60, memory: '256MiB', secrets: [...SECRETS] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const uid = request.auth.uid
    const language = validateLanguage(request.data.language)
    const level = validateLevel(request.data.level)
    const subLevel = validateSubLevel(request.data.subLevel)

    await checkRateLimit(uid)

    const levelLabel = subLevelDescription(level, subLevel)
    const lengthGuidance = getSentenceLengthGuidance(level)

    try {
      const result = await callClaudeStructured(
        getClient(),
        `Generate exactly 10 sentences for a sentence memorization exercise.

Requirements:
- Language: ${langName(language)}
- CEFR level: ${levelLabel}
- Sentence length: ${lengthGuidance}
- Each sentence should be on a DIFFERENT everyday topic (travel, food, family, work, weather, hobbies, nature, technology, health, culture, etc.)
- Sentences must be grammatically perfect with correct punctuation and accents
- Use natural, idiomatic language — not textbook-sounding
- Include proper punctuation (periods, commas, question marks, exclamation marks as appropriate)
- Mix sentence types: statements, questions, exclamations
- For languages with accents/diacritics (French, German, etc.), include words with accents naturally`,
        {
          type: 'object',
          properties: {
            sentences: {
              type: 'array',
              items: { type: 'string' },
              minItems: 10,
              maxItems: 10,
              description: 'Exactly 10 sentences',
            },
          },
          required: ['sentences'],
        },
        { maxTokens: 1024 },
      )

      return { sentences: result.sentences }
    } catch (error: unknown) {
      if (error instanceof HttpsError) throw error
      throw aiHttpsError(error, 'generateMemorySentences', 'Failed to generate sentences')
    }
  }
)
