import { onCall, HttpsError } from 'firebase-functions/v2/https'
import Anthropic from '@anthropic-ai/sdk'
import { getLanguageProfile, updateLanguageProfile } from './learningProfile.js'
import { callClaudeStructured } from './jsonUtils.js'
import { aiHttpsError } from './aiErrors.js'
import {
  validateLanguage, validateLevel, validateSubLevel, validateString,
  checkRateLimit, langName, subLevelDescription,
} from './validate.js'
import { CEFR_BANDS, ASSESSED_LEVEL_SCHEMA, levelRubric, levelDrift, retryNote } from './levelRubric.js'

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

    const uid = request.auth.uid
    const headline = validateString(request.data.headline, 'headline', 500)
    const language = validateLanguage(request.data.language)
    const level = validateLevel(request.data.level)
    const subLevel = validateSubLevel(request.data.subLevel)

    await checkRateLimit(uid)

    const langProfile = await getLanguageProfile(uid, language)

    const profileSection = langProfile
      ? `\nLearner Profile for ${langName(language)}:\n"${langProfile.summary}"\n\nIncorporate vocabulary and sentence structures that gently stretch the learner's weak areas, but only within the level constraints above. Use constructions they've been struggling with so they encounter them in reading context.\n`
      : ''

    const isBeginner = level === 'A1' || level === 'A2'
    const toneLine = isBeginner
      ? '- Simple, clear and factual. Tell the 3-4 main facts plainly; leave out secondary details.'
      : '- Factual and informative tone'

    const basePrompt = `Write a news article based on this headline: "${headline}"

Requirements:
- Language: ${langName(language)}
- ${levelRubric(level, subLevel)}
- Exactly 3 paragraphs
- Approximately ${isBeginner ? 250 : 350} words total
${toneLine}
- The article should be self-contained and understandable without prior knowledge
${profileSection}`

    const schema = {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'The article title, obeying the same level constraints' },
        paragraphs: {
          type: 'array',
          items: { type: 'string' },
          minItems: 3,
          maxItems: 3,
          description: 'Exactly 3 paragraphs',
        },
        assessedLevel: ASSESSED_LEVEL_SCHEMA,
      },
      required: ['title', 'paragraphs', 'assessedLevel'],
    }

    try {
      let article = await callClaudeStructured(getClient(), basePrompt, schema, { maxTokens: 2048 })

      // One regeneration if the model's own assessment says the text drifted off-level.
      const drift = levelDrift(article.assessedLevel, level, subLevel)
      if (drift) {
        const previous = extractParagraphs(article.paragraphs).join('\n\n')
        console.info(`generateArticle: assessed ${article.assessedLevel} for target ${subLevelDescription(level, subLevel)} (${drift}); regenerating`)
        article = await callClaudeStructured(
          getClient(),
          basePrompt + retryNote(drift, String(article.assessedLevel), level, subLevel, previous),
          schema,
          { maxTokens: 2048 },
        )
      }

      const paragraphs = extractParagraphs(article.paragraphs)
      const wordCount = paragraphs.join(' ').split(/\s+/).length

      return {
        title: article.title || '',
        paragraphs,
        wordCount,
        language,
        level,
        assessedLevel: CEFR_BANDS.includes(article.assessedLevel) ? article.assessedLevel : null,
      }
    } catch (error: unknown) {
      if (error instanceof HttpsError) throw error
      throw aiHttpsError(error, 'generateArticle', 'Failed to generate article')
    }
  }
)

/** Robust extraction: handle all possible shapes from tool_use. */
function extractParagraphs(rawParas: unknown): string[] {
  let paragraphs: string[]

  if (Array.isArray(rawParas)) {
    paragraphs = rawParas.map((p: unknown) => String(p))
  } else if (typeof rawParas === 'string') {
    // Could be a JSON-stringified array or a plain string with paragraphs
    try {
      const parsed = JSON.parse(rawParas)
      paragraphs = Array.isArray(parsed) ? parsed.map(String) : rawParas.split('\n\n').filter(Boolean)
    } catch {
      paragraphs = rawParas.split('\n\n').filter(Boolean)
    }
  } else {
    // Last resort: stringify and log for debugging
    console.warn('Unexpected paragraphs type:', typeof rawParas, JSON.stringify(rawParas).slice(0, 200))
    paragraphs = [String(rawParas)]
  }

  return paragraphs.length === 0 ? [String(rawParas)] : paragraphs
}

export const generateQuestions = onCall(
  { timeoutSeconds: 60, memory: '256MiB', secrets: [...SECRETS] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const uid = request.auth.uid
    const article = validateString(request.data.article, 'article', 10000)
    const language = validateLanguage(request.data.language)

    await checkRateLimit(uid)

    try {
      const result = await callClaudeStructured(
        getClient(),
        `Based on this article, create 10 multiple-choice questions.

Article:
${article}

Requirements:
- Language: ${langName(language)}
- Each question should have exactly 4 options
- All answers must be directly derivable from the text
- Questions should test comprehension, not trivia
- Mix detail questions with inference questions
- For each question, include a "supportingQuote" field: a short exact quote from the article (1-2 sentences) that directly supports the correct answer`,
        {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  options: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
                  correctIndex: { type: 'integer', minimum: 0, maximum: 3 },
                  supportingQuote: { type: 'string' },
                },
                required: ['question', 'options', 'correctIndex', 'supportingQuote'],
              },
            },
          },
          required: ['questions'],
        },
        { maxTokens: 4096 },
      )

      return { questions: result.questions }
    } catch (error: unknown) {
      if (error instanceof HttpsError) throw error
      throw aiHttpsError(error, 'generateQuestions', 'Failed to generate questions')
    }
  }
)

export const evaluateSummary = onCall(
  { timeoutSeconds: 60, memory: '256MiB', secrets: [...SECRETS] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const uid = request.auth.uid
    const article = validateString(request.data.article, 'article', 10000)
    const summary = validateString(request.data.summary, 'summary', 1000)
    const language = validateLanguage(request.data.language)
    const level = validateLevel(request.data.level)
    const subLevel = validateSubLevel(request.data.subLevel)

    await checkRateLimit(uid)

    const wl = request.data.wordLimit ?? { min: 10, max: 100 }
    const levelLabel = subLevelDescription(level, subLevel)
    const langProfile = await getLanguageProfile(uid, language)

    const profileContext = langProfile
      ? `\nCurrent learner profile for ${langName(language)} (built over ${langProfile.sessionCount} session${langProfile.sessionCount === 1 ? '' : 's'}):\n"${langProfile.summary}"`
      : `\nNo learner profile exists yet for this user in ${langName(language)}. This is the first session being profiled.`

    try {
      const evaluation = await callClaudeStructured(
        getClient(),
        `Evaluate this summary of the article below.

Article:
${article}

Summary:
${summary}

Language: ${langName(language)}
Expected CEFR level: ${levelLabel}
Word limit: ${wl.min}–${wl.max} words
Actual word count: ${summary.trim().split(/\s+/).filter(Boolean).length} words (use this count; do not count words independently)

IMPORTANT SCORING GUIDELINES:

Score each dimension from 1-10:

- accuracy: Does the summary capture the MAIN IDEA or central message of the article? The summary is constrained to only ${wl.min}–${wl.max} words, so it is IMPOSSIBLE to include every detail. Do NOT penalize for omitting specific details like names, cities, statistics, lists, or secondary points. A summary that correctly conveys the core message in ${wl.min}–${wl.max} words should score 8-10 for accuracy.

- vocabulary: REWARD the use of vocabulary that is MORE ADVANCED than the expected ${levelLabel} level. Using words above the expected CEFR level demonstrates strong language skills and should INCREASE the score (8-10). Only lower the score if the vocabulary is significantly BELOW the expected level or if words are used incorrectly. Do NOT penalize for using advanced words correctly.

- grammar: REWARD sophisticated sentence structures (complex sentences, varied syntax, subordinate clauses) that go beyond the expected ${levelLabel} level. Only flag actual grammatical ERRORS (wrong tense, subject-verb disagreement, missing articles, etc.). Correct but advanced grammar should INCREASE the score, not decrease it.

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

--- LEVEL ASSESSMENT ---

Independently of the expected level, assess the CEFR level the summary itself demonstrates, based on its vocabulary range, grammatical complexity and control, and cohesion. Report it in "assessedLevel" as a CEFR band with an optional modifier: "+" means solidly in the upper part of the band, approaching the next one; "-" means the lower part of the band. Examples: "A2+", "B1", "C1-". Judge only what is on the page; a short summary can still show C1 control, and a long one can still be A2.

--- LEARNER PROFILE UPDATE ---
${profileContext}

Based on this evaluation session${langProfile ? ' and the existing profile' : ''}, produce an updated learner profile summary for ${langName(language)}. The summary should be 100-180 words describing the learner's strengths, weaknesses, and trends. Focus on writing ability: grammar accuracy, vocabulary range, summarization skill, sentence structure quality, and common error patterns. ${langProfile ? 'Refine and update the existing profile rather than rewriting from scratch — incorporate new observations while preserving past insights that are still relevant.' : 'Create an initial profile based on this first session.'}`,
        {
          type: 'object',
          properties: {
            accuracyScore: { type: 'integer', minimum: 1, maximum: 10 },
            vocabularyScore: { type: 'integer', minimum: 1, maximum: 10 },
            grammarScore: { type: 'integer', minimum: 1, maximum: 10 },
            overallScore: { type: 'integer', minimum: 1, maximum: 10 },
            feedback: { type: 'string' },
            sentenceIssues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sentence: { type: 'string' },
                  issueType: { type: 'string', enum: ['grammar', 'vocabulary', 'accuracy'] },
                  explanation: { type: 'string' },
                  suggestion: { type: 'string' },
                },
                required: ['sentence', 'issueType', 'explanation', 'suggestion'],
              },
            },
            assessedLevel: {
              type: 'string',
              enum: CEFR_BANDS,
              description: 'CEFR level demonstrated by the summary, e.g. "A2+", "B1", "C1-"',
            },
            profileUpdate: { type: 'string', description: 'Updated learner profile summary (100-180 words)' },
          },
          required: ['accuracyScore', 'vocabularyScore', 'grammarScore', 'overallScore', 'feedback', 'sentenceIssues', 'assessedLevel', 'profileUpdate'],
        },
        { maxTokens: 2048 },
      )

      // Fire-and-forget: write the updated profile to Firestore
      if (evaluation.profileUpdate) {
        updateLanguageProfile(
          uid,
          language,
          evaluation.profileUpdate,
          langProfile?.sessionCount ?? 0,
        ).catch(err => console.error('Profile update failed:', err))
      }

      // Strip profileUpdate from the response sent to the frontend
      const { profileUpdate: _, ...clientEvaluation } = evaluation
      return clientEvaluation
    } catch (error: unknown) {
      if (error instanceof HttpsError) throw error
      throw aiHttpsError(error, 'evaluateSummary', 'Failed to evaluate summary')
    }
  }
)
