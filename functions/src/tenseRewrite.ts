import { onCall, HttpsError } from 'firebase-functions/v2/https'
import Anthropic from '@anthropic-ai/sdk'
import { getLanguageProfile, updateLanguageProfile } from './learningProfile.js'
import { callClaudeStructured } from './jsonUtils.js'
import { aiHttpsError } from './aiErrors.js'
import {
  validateLanguage, validateLevel, validateSubLevel, validateArray, coerceArray,
  checkRateLimit, langName, subLevelDescription, levelTier, scaleName,
} from './validate.js'

function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  })
}

const SECRETS = ['ANTHROPIC_API_KEY'] as const

function getTransformationTypes(level: string): string {
  const base = 'future-tense, past-tense, present-tense, negation, question-form'
  if (levelTier(level) === 'beginner') {
    return base
  }
  const intermediate = `${base}, active-voice, passive-voice, conditional, reported-speech`
  if (levelTier(level) === 'intermediate') {
    return intermediate
  }
  // C1, C2
  return `${intermediate}, subjunctive, literary-past`
}

export const generateTenseExercises = onCall(
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

    const allowedTypes = getTransformationTypes(level)
    const levelLabel = subLevelDescription(level, subLevel)
    const langProfile = await getLanguageProfile(uid, language)

    const profileSection = langProfile
      ? `\nLearner Profile for ${langName(language)}:\n"${langProfile.summary}"\n\nTailor the exercises to this learner: include MORE transformation types they struggle with (roughly 60% of exercises), while still including some of their stronger areas (roughly 40%). If they struggle with a specific grammar area, create sentences that naturally require that transformation.\n`
      : ''

    try {
      const result = await callClaudeStructured(
        getClient(),
        `Generate 10 sentence transformation exercises for a language learner.

Requirements:
- Language: ${langName(language)}
- ${scaleName(level)} level: ${levelLabel} (adjust sentence complexity accordingly)
- Each exercise has an original sentence (1-2 lines, about 15-20 words) on a random everyday topic (news, culture, science, daily life, travel, food, technology, etc.)
- Each exercise has a transformation task from this list: ${allowedTypes}
- Use a DIVERSE MIX of transformation types — do NOT repeat the same type more than twice
- The original sentence should be written so the transformation is natural and meaningful
- Include a reference solution showing the correct transformation
- The task description should be a short, clear instruction in ${langName(language)} (e.g., "Rewrite in the future tense", "Rewrite as a question", "Rewrite in the passive voice")
${profileSection}`,
        {
          type: 'object',
          properties: {
            exercises: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  original: { type: 'string', description: 'The original sentence' },
                  taskDescription: { type: 'string', description: 'Short instruction in target language' },
                  transformationType: { type: 'string', description: 'Type of transformation' },
                  referenceSolution: { type: 'string', description: 'The correctly transformed sentence' },
                },
                required: ['original', 'taskDescription', 'transformationType', 'referenceSolution'],
              },
            },
          },
          required: ['exercises'],
        },
        { maxTokens: 4096 },
      )

      return { exercises: coerceArray(result.exercises, 'exercises') }
    } catch (error: unknown) {
      if (error instanceof HttpsError) throw error
      throw aiHttpsError(error, 'generateTenseExercises', 'Failed to generate exercises')
    }
  }
)

export const evaluateTenseRewrites = onCall(
  { timeoutSeconds: 90, memory: '256MiB', secrets: [...SECRETS] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const uid = request.auth.uid
    const language = validateLanguage(request.data.language)
    const level = validateLevel(request.data.level, language)
    const subLevel = validateSubLevel(request.data.subLevel)
    const exercises = validateArray(request.data.exercises, 'exercises', 20) as Array<{
      original: string
      taskDescription: string
      transformationType: string
      referenceSolution: string
    }>
    const userRewrites = validateArray(request.data.userRewrites, 'userRewrites', 20) as string[]

    await checkRateLimit(uid)

    const levelLabel = subLevelDescription(level, subLevel)
    const langProfile = await getLanguageProfile(uid, language)

    const exerciseList = exercises.map((ex, i) => (
      `Exercise ${i + 1}:
Original: "${ex.original}"
Task: ${ex.taskDescription} (${ex.transformationType})
Reference solution: "${ex.referenceSolution}"
User's rewrite: "${userRewrites[i]}"`
    )).join('\n\n')

    const profileContext = langProfile
      ? `\nCurrent learner profile for ${langName(language)} (built over ${langProfile.sessionCount} session${langProfile.sessionCount === 1 ? '' : 's'}):\n"${langProfile.summary}"`
      : `\nNo learner profile exists yet for this user in ${langName(language)}. This is the first session being profiled.`

    try {
      const evaluation = await callClaudeStructured(
        getClient(),
        `Evaluate these 10 sentence transformation exercises.

Language: ${langName(language)}
Expected ${scaleName(level)} level: ${levelLabel}

${exerciseList}

For each exercise, score the user's rewrite from 1-10:
- 9-10: Perfect or near-perfect transformation with correct grammar
- 7-8: Correct transformation with minor issues
- 5-6: Partially correct — the transformation is attempted but has notable errors
- 3-4: Major errors — the transformation is incorrect or incomplete
- 1-2: The rewrite doesn't address the task at all

Consider:
1. Did the user correctly apply the requested transformation?
2. Is the grammar correct in the target language?
3. Is the meaning preserved from the original?
4. REWARD using vocabulary or structures above the expected ${levelLabel} level

For each sentence provide:
- "index": the exercise number (0-based)
- "score": 1-10
- "correct": true if score >= 6
- "feedback": brief explanation of what's right or wrong (1 sentence)
- "suggestion": the best corrected version (can be same as reference if user's is wrong, or user's version if it's correct)

Also provide:
- "overallScore": weighted average of all sentence scores (1-10)
- "feedback": overall constructive feedback (2-3 sentences)

--- LEARNER PROFILE UPDATE ---
${profileContext}

Based on this evaluation session${langProfile ? ' and the existing profile' : ''}, produce an updated learner profile summary for ${langName(language)}. The summary should be 100-180 words describing the learner's strengths, weaknesses, and trends. Focus on grammar patterns, tense usage, transformation abilities, and recurring error types. ${langProfile ? 'Refine and update the existing profile rather than rewriting from scratch — incorporate new observations while preserving past insights that are still relevant.' : 'Create an initial profile based on this first session.'}`,
        {
          type: 'object',
          properties: {
            sentenceScores: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  index: { type: 'integer' },
                  score: { type: 'integer', minimum: 1, maximum: 10 },
                  correct: { type: 'boolean' },
                  feedback: { type: 'string' },
                  suggestion: { type: 'string' },
                },
                required: ['index', 'score', 'correct', 'feedback', 'suggestion'],
              },
            },
            overallScore: { type: 'number', minimum: 1, maximum: 10 },
            feedback: { type: 'string' },
            profileUpdate: { type: 'string', description: 'Updated learner profile summary (100-180 words)' },
          },
          required: ['sentenceScores', 'overallScore', 'feedback', 'profileUpdate'],
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
      throw aiHttpsError(error, 'evaluateTenseRewrites', 'Failed to evaluate rewrites')
    }
  }
)
