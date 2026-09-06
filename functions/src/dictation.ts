import { onCall, HttpsError } from 'firebase-functions/v2/https'
import Anthropic from '@anthropic-ai/sdk'
import { getLanguageProfile } from './learningProfile.js'
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

function getComplexityGuidance(level: string): string {
  if (level === 'A1' || level === 'A2') {
    return 'Use simple, everyday vocabulary and short sentences. Basic punctuation (periods, commas, question marks). Include common words with accents/diacritics for the language.'
  }
  if (level === 'B1' || level === 'B2') {
    return 'Use varied vocabulary with moderately complex sentences. Include semicolons, colons, dashes, and parentheses occasionally. Use words with accents/diacritics naturally throughout.'
  }
  return 'Use sophisticated vocabulary and complex sentence structures. Include varied punctuation (semicolons, colons, em-dashes, quotation marks). Use literary or formal register with rich diacritics.'
}

export const generateDictationText = onCall(
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
    const complexityGuidance = getComplexityGuidance(level)
    const langProfile = await getLanguageProfile(uid, language)

    const profileSection = langProfile
      ? `\nLearner Profile for ${langName(language)}:\n"${langProfile.summary}"\n\nInclude spelling patterns and vocabulary that challenge this learner's known weak areas. Mix roughly 60% challenging words and 40% comfortable ones.\n`
      : ''

    try {
      const result = await callClaudeStructured(
        getClient(),
        `Generate a short dictation text for a language learner.

Requirements:
- Language: ${langName(language)}
- CEFR level: ${levelLabel}
- Write a coherent, natural text of approximately 50 words (45-55 words) on a random everyday topic (travel, cooking, daily routine, sports, nature, work, school, hobbies, weather, culture, technology, etc.)
- The text should be 2-4 sentences long
- ${complexityGuidance}
- Sentences must be grammatically perfect with correct punctuation and accents/diacritics
- Use natural, idiomatic language — not textbook-sounding
- Include varied punctuation: commas, periods, and at least one question mark OR exclamation mark
- For languages with accents/diacritics (French, German, Italian, etc.), deliberately include common words with accents (e.g., French: été, première, à, où; German: über, schön, für; Italian: perché, più, città)
- The text must be suitable for being read aloud — no abbreviations, no bullet points, no special formatting
${profileSection}`,
        {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'A short title for the text (2-5 words)' },
            text: { type: 'string', description: 'The dictation text (~50 words)' },
            wordCount: { type: 'integer', description: 'Actual word count of the text' },
          },
          required: ['title', 'text', 'wordCount'],
        },
        { maxTokens: 512 },
      )

      return {
        title: result.title,
        text: result.text,
        wordCount: result.wordCount,
        language,
        level,
      }
    } catch (error: unknown) {
      if (error instanceof HttpsError) throw error
      throw aiHttpsError(error, 'generateDictationText', 'Failed to generate dictation text')
    }
  }
)
