import { onCall, HttpsError } from 'firebase-functions/v2/https'
import Anthropic from '@anthropic-ai/sdk'
import { getLanguageProfile } from './learningProfile.js'
import { callClaudeStructured } from './jsonUtils.js'
import { aiHttpsError } from './aiErrors.js'
import {
  validateLanguage, validateLevel, validateSubLevel, validateString,
  checkRateLimit, langName, subLevelDescription,
} from './validate.js'
import { CEFR_BANDS, ASSESSED_LEVEL_SCHEMA, levelRubric, levelDrift, retryNote } from './levelRubric.js'

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
      ? `\nLearner Profile for ${langName(language)}:\n"${langProfile.summary}"\n\nIncorporate vocabulary and sentence structures that gently challenge the learner's known weak areas, but only within the level constraints above.\n`
      : ''

    const isBeginner = level === 'A1' || level === 'A2'
    const densityLine = isBeginner
      ? '- Cover only the 2-3 main facts, each told plainly'
      : '- Dense and informative — pack in key facts'

    const basePrompt = `Write a single news paragraph based on this headline: "${headline}"

Requirements:
- Language: ${langName(language)}
- ${levelRubric(level, subLevel)}
- Exactly ONE paragraph, 80-120 words
${densityLine}
- The paragraph should be self-contained and understandable without prior knowledge
${profileSection}`

    const schema = {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'The paragraph title, obeying the same level constraints' },
        paragraph: { type: 'string', description: 'The news paragraph (80-120 words)' },
        assessedLevel: ASSESSED_LEVEL_SCHEMA,
      },
      required: ['title', 'paragraph', 'assessedLevel'],
    }

    try {
      let result = await callClaudeStructured(getClient(), basePrompt, schema, { maxTokens: 1024 })

      // One regeneration if the model's own assessment says the text drifted off-level.
      const drift = levelDrift(result.assessedLevel, level, subLevel)
      if (drift) {
        console.info(`generateParagraph: assessed ${result.assessedLevel} for target ${subLevelDescription(level, subLevel)} (${drift}); regenerating`)
        result = await callClaudeStructured(
          getClient(),
          basePrompt + retryNote(drift, String(result.assessedLevel), level, subLevel, String(result.paragraph)),
          schema,
          { maxTokens: 1024 },
        )
      }

      const paragraph = String(result.paragraph)
      const wordCount = paragraph.split(/\s+/).length

      return {
        title: result.title,
        paragraph,
        wordCount,
        language,
        level,
        assessedLevel: CEFR_BANDS.includes(result.assessedLevel) ? result.assessedLevel : null,
      }
    } catch (error: unknown) {
      if (error instanceof HttpsError) throw error
      throw aiHttpsError(error, 'generateParagraph', 'Failed to generate paragraph')
    }
  }
)
