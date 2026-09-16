import { onCall, HttpsError } from 'firebase-functions/v2/https'
import Anthropic from '@anthropic-ai/sdk'
import { getLanguageProfile, updateLanguageProfile } from './learningProfile.js'
import { callClaudeStructured } from './jsonUtils.js'
import { aiHttpsError } from './aiErrors.js'
import {
  validateLanguage, validateLevel, validateSubLevel, validateString, validateArray,
  checkRateLimit, langName, subLevelDescription, levelTier, scaleName, coerceArray,
} from './validate.js'

function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  })
}

const SECRETS = ['ANTHROPIC_API_KEY'] as const

function getTenseGuidance(level: string): string {
  if (levelTier(level) === 'beginner') {
    return 'Use mostly present tense, simple past, and near future. Keep sentences short and straightforward.'
  }
  if (levelTier(level) === 'intermediate') {
    return 'Include present, past (simple & compound/imperfect), future, and some conditional forms. Use varied sentence structures.'
  }
  return 'Include subjunctive, pluperfect, passive constructions, literary tenses, and complex compound forms. Use sophisticated syntax.'
}

export const generateVerbFillExercise = onCall(
  { timeoutSeconds: 90, memory: '256MiB', secrets: [...SECRETS] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const uid = request.auth.uid
    const language = validateLanguage(request.data.language)
    const level = validateLevel(request.data.level, language)
    const subLevel = validateSubLevel(request.data.subLevel)

    await checkRateLimit(uid)

    const levelLabel = subLevelDescription(level, subLevel)
    const tenseGuidance = getTenseGuidance(level)
    const langProfile = await getLanguageProfile(uid, language)

    const profileSection = langProfile
      ? `\nLearner Profile for ${langName(language)}:\n"${langProfile.summary}"\n\nTailor the exercise to this learner: include MORE verb tenses and forms they find challenging. If they struggle with certain conjugation patterns, prioritize those in the text. Maintain a mix of roughly 60% challenging verbs and 40% comfortable ones.\n`
      : ''

    try {
      const result = await callClaudeStructured(
        getClient(),
        `Generate a verb conjugation fill-in-the-blank exercise for a language learner.

Requirements:
- Language: ${langName(language)}
- ${scaleName(level)} level: ${levelLabel} (adjust vocabulary and sentence complexity accordingly)
- Write a coherent, natural 2-paragraph text (about 80-120 words total) on a random everyday topic (travel, cooking, daily routine, sports, nature, work, school, hobbies, etc.)
- The text should contain 8-12 conjugated verbs in various tenses
- Tense guidance for this level: ${tenseGuidance}
- Each verb should appear naturally in context
- CRITICAL: Every verb MUST be conjugated in the tense that is grammatically correct for its sentence context. If a sentence uses a past-time marker (e.g., "yesterday", "last week", "hier"), the verb MUST be in past tense. If a sentence uses a future marker, the verb MUST be in future tense. Do NOT use present tense for past events.
- Use a MIX of time contexts (some sentences about the past, some present, some future) to create variety in tenses.
${profileSection}

Return the text as an array of segments alternating between plain text and verb blanks.
For each verb blank, provide:
- "infinitive": the dictionary/infinitive form of the verb whose conjugated form fills the blank in ${langName(language)} (e.g., "aller" in French, "to go" in English, "gehen" in German, "ללכת" in Hebrew). CRITICAL: The infinitive MUST correspond to the word the learner types. For example, in French "ai" comes from "avoir", "est" comes from "être".
- "correctForm": the exact conjugated form as it appears in the text
- "index": sequential number starting from 0

CRITICAL rules for compound verb constructions:
- In periphrastic/compound forms (futur proche, passé composé, etc.), make ONLY ONE word the blank — either the auxiliary OR the main verb, never both.
- For futur proche ("aller + infinitive"): if you blank the infinitive part, the infinitive hint must be THAT verb (e.g., for "je vais organiser", if blanking "organiser", the infinitive hint is "organiser", NOT "aller"). If you blank "vais", the infinitive hint is "aller".
- For passé composé ("avoir/être + past participle"): if blanking the past participle "allé" in "suis allé", the infinitive is "aller". If blanking "suis", the infinitive is "être".
- NEVER create a blank where the correctForm is an infinitive that matches the infinitive hint — that would make it trivially obvious. Prefer blanking conjugated forms.

CRITICAL formatting rules:
- Text segments must include ALL spacing and punctuation
- The segments must reconstruct the complete text when concatenated
- Verb segments replace ONLY a single conjugated verb form (one word), not surrounding spaces or adjacent verbs
- Include spaces in the adjacent text segments`,
        {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'A short title for the text' },
            segments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['text', 'verb'] },
                  content: { type: 'string', description: 'For text segments: the text content' },
                  infinitive: { type: 'string', description: 'For verb segments: dictionary form' },
                  correctForm: { type: 'string', description: 'For verb segments: conjugated form' },
                  index: { type: 'integer', description: 'For verb segments: sequential number' },
                },
                required: ['type'],
              },
            },
            verbCount: { type: 'integer', description: 'Total number of verb blanks' },
          },
          required: ['title', 'segments', 'verbCount'],
        },
        { maxTokens: 4096 },
      )

      return { ...result, segments: coerceArray(result.segments, 'segments') }
    } catch (error: unknown) {
      if (error instanceof HttpsError) throw error
      throw aiHttpsError(error, 'generateVerbFillExercise', 'Failed to generate exercise')
    }
  }
)

export const evaluateVerbFill = onCall(
  { timeoutSeconds: 90, memory: '256MiB', secrets: [...SECRETS] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const uid = request.auth.uid
    const title = validateString(request.data.title, 'title', 500)
    const language = validateLanguage(request.data.language)
    const level = validateLevel(request.data.level, language)
    const subLevel = validateSubLevel(request.data.subLevel)
    const segments = validateArray(request.data.segments, 'segments', 100) as Array<{
      type: string; content?: string; infinitive?: string; correctForm?: string; index?: number
    }>
    const userAnswers = validateArray(request.data.userAnswers, 'userAnswers', 20) as string[]

    await checkRateLimit(uid)

    const levelLabel = subLevelDescription(level, subLevel)
    const langProfile = await getLanguageProfile(uid, language)

    const fullText = segments
      .map(s => s.type === 'text' ? s.content : `[${s.correctForm}]`)
      .join('')

    const verbList = segments
      .filter(s => s.type === 'verb')
      .map(s => (
        `Verb ${s.index! + 1}:
  Infinitive: "${s.infinitive}"
  Expected conjugation: "${s.correctForm}"
  User's answer: "${userAnswers[s.index!]}"`
      ))
      .join('\n\n')

    const profileContext = langProfile
      ? `\nCurrent learner profile for ${langName(language)} (built over ${langProfile.sessionCount} session${langProfile.sessionCount === 1 ? '' : 's'}):\n"${langProfile.summary}"`
      : `\nNo learner profile exists yet for this user in ${langName(language)}. This is the first session being profiled.`

    try {
      const evaluation = await callClaudeStructured(
        getClient(),
        `Evaluate verb conjugation answers for a fill-in-the-blank exercise.

Language: ${langName(language)}
Expected ${scaleName(level)} level: ${levelLabel}
Title: "${title}"

Full text (with correct verbs in brackets):
${fullText}

${verbList}

For each verb, score the user's answer from 0-10:
- 10: Perfect match (correct conjugation, correct spelling, correct accents)
- 8-9: Correct conjugation with very minor issue (e.g., missing accent mark, trivial capitalization)
- 5-7: Partially correct (right tense but wrong person/number, or right root but wrong ending)
- 2-4: Wrong tense or significant conjugation error, but shows some understanding of the verb
- 0-1: Completely wrong, blank, or unrelated word

Consider:
1. Is the conjugated form grammatically correct for the context?
2. Does it match the expected tense, person, and number?
3. Are accents and special characters correct? (minor penalty for missing accents)
4. Give partial credit for answers that show understanding of the verb system

For each verb provide:
- "index": the verb number (0-based)
- "score": 0-10
- "correct": true if score >= 6
- "feedback": brief explanation (1 sentence)
- "correctForm": the expected conjugated form
- "userAnswer": echo of user's input

Also provide:
- "overallScore": average of all verb scores (0-10, rounded to 1 decimal)
- "feedback": overall constructive feedback (2-3 sentences)

--- LEARNER PROFILE UPDATE ---
${profileContext}

Based on this evaluation session${langProfile ? ' and the existing profile' : ''}, produce an updated learner profile summary for ${langName(language)}. The summary should be 100-180 words describing the learner's strengths, weaknesses, and trends. Focus on verb conjugation patterns, tense mastery, spelling/accent accuracy, and which verb types or tenses are problematic. ${langProfile ? 'Refine and update the existing profile rather than rewriting from scratch — incorporate new observations while preserving past insights that are still relevant.' : 'Create an initial profile based on this first session.'}`,
        {
          type: 'object',
          properties: {
            verbScores: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  index: { type: 'integer' },
                  score: { type: 'number', minimum: 0, maximum: 10 },
                  correct: { type: 'boolean' },
                  feedback: { type: 'string' },
                  correctForm: { type: 'string' },
                  userAnswer: { type: 'string' },
                },
                required: ['index', 'score', 'correct', 'feedback', 'correctForm', 'userAnswer'],
              },
            },
            overallScore: { type: 'number', minimum: 0, maximum: 10 },
            feedback: { type: 'string' },
            profileUpdate: { type: 'string', description: 'Updated learner profile summary (100-180 words)' },
          },
          required: ['verbScores', 'overallScore', 'feedback', 'profileUpdate'],
        },
        { maxTokens: 5000 },
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
      throw aiHttpsError(error, 'evaluateVerbFill', 'Failed to evaluate answers')
    }
  }
)
