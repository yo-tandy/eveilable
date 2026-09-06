import { onCall, HttpsError } from 'firebase-functions/v2/https'
import Anthropic from '@anthropic-ai/sdk'
import { getLanguageProfile } from './learningProfile.js'
import { callClaudeStructured } from './jsonUtils.js'
import { aiHttpsError } from './aiErrors.js'
import {
  validateLanguage, validateLevel, validateSubLevel, validateString,
  checkRateLimit, langName, subLevelDescription,
} from './validate.js'

function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  })
}

const SECRETS = ['ANTHROPIC_API_KEY'] as const

export const generateParagraph = onCall(
  { timeoutSeconds: 60, memory: '256MiB', secrets: [...SECRETS] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const uid = request.auth.uid
    const headline = validateString(request.data.headline, 'headline', 500)
    const language = validateLanguage(request.data.language)
    const level = validateLevel(request.data.level)
    const subLevel = validateSubLevel(request.data.subLevel)

    await checkRateLimit(uid)

    const langProfile = await getLanguageProfile(uid, language)

    const profileSection = langProfile
      ? `\nLearner Profile for ${langName(language)}:\n"${langProfile.summary}"\n\nIncorporate vocabulary and sentence structures that gently challenge the learner's known weak areas while remaining at the appropriate CEFR level.\n`
      : ''

    try {
      const result = await callClaudeStructured(
        getClient(),
        `Write a single news paragraph based on this headline: "${headline}"

Requirements:
- Language: ${langName(language)}
- CEFR language level: ${subLevelDescription(level, subLevel)} (adjust vocabulary and sentence complexity accordingly)
- Exactly ONE paragraph, 80-120 words
- Dense and informative — pack in key facts
- The paragraph should be self-contained and understandable without prior knowledge
${profileSection}`,
        {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'The paragraph title' },
            paragraph: { type: 'string', description: 'The news paragraph (80-120 words)' },
          },
          required: ['title', 'paragraph'],
        },
        { maxTokens: 1024 },
      )

      const wordCount = result.paragraph.split(/\s+/).length

      return {
        title: result.title,
        paragraph: result.paragraph,
        wordCount,
        language,
        level,
      }
    } catch (error: unknown) {
      if (error instanceof HttpsError) throw error
      throw aiHttpsError(error, 'generateParagraph', 'Failed to generate paragraph')
    }
  }
)
