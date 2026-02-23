import { onCall, HttpsError } from 'firebase-functions/v2/https'
import Anthropic from '@anthropic-ai/sdk'
import { getLanguageProfile, updateLanguageProfile } from './learningProfile.js'

function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  })
}

const SECRETS = ['ANTHROPIC_API_KEY'] as const

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  zh: 'Chinese (Simplified)',
  he: 'Hebrew',
  de: 'German',
  it: 'Italian',
}

function langName(code: string): string {
  return LANGUAGE_NAMES[code] || 'English'
}

function subLevelDescription(level: string, subLevel?: string): string {
  if (!subLevel) return level
  const desc = subLevel === 'novice' ? 'lower range' : subLevel === 'advanced' ? 'upper range' : 'mid range'
  return `${level} (${desc})`
}

function extractJSON(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  return match ? match[1].trim() : text.trim()
}

function getTenseGuidance(level: string): string {
  if (level === 'A1' || level === 'A2') {
    return 'Use mostly present tense, simple past, and near future. Keep sentences short and straightforward.'
  }
  if (level === 'B1' || level === 'B2') {
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

    const { language, level, subLevel } = request.data as {
      language: string
      level: string
      subLevel?: string
    }

    const uid = request.auth!.uid
    const levelLabel = subLevelDescription(level, subLevel)
    const tenseGuidance = getTenseGuidance(level)
    const langProfile = await getLanguageProfile(uid, language)

    const profileSection = langProfile
      ? `\nLearner Profile for ${langName(language)}:\n"${langProfile.summary}"\n\nTailor the exercise to this learner: include MORE verb tenses and forms they find challenging. If they struggle with certain conjugation patterns, prioritize those in the text. Maintain a mix of roughly 60% challenging verbs and 40% comfortable ones.\n`
      : ''

    try {
      const response = await getClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `Generate a verb conjugation fill-in-the-blank exercise for a language learner.

Requirements:
- Language: ${langName(language)}
- CEFR level: ${levelLabel} (adjust vocabulary and sentence complexity accordingly)
- Write a coherent, natural 2-paragraph text (about 80-120 words total) on a random everyday topic (travel, cooking, daily routine, sports, nature, work, school, hobbies, etc.)
- The text should contain 8-12 conjugated verbs in various tenses
- Tense guidance for this level: ${tenseGuidance}
- Each verb should appear naturally in context
${profileSection}

Return the text as an array of segments alternating between plain text and verb blanks.
For each verb blank, provide:
- "infinitive": the dictionary/infinitive form in ${langName(language)} (e.g., "aller" in French, "to go" in English, "gehen" in German, "ללכת" in Hebrew)
- "correctForm": the exact conjugated form as it appears in the text
- "index": sequential number starting from 0

CRITICAL formatting rules:
- Text segments must include ALL spacing and punctuation
- The segments must reconstruct the complete text when concatenated
- Verb segments replace ONLY the conjugated verb form, not surrounding spaces
- Include spaces in the adjacent text segments

Return ONLY a JSON object (no markdown, no explanation):
{
  "title": "A short title for the text",
  "segments": [
    { "type": "text", "content": "Yesterday, Marie " },
    { "type": "verb", "infinitive": "to go", "correctForm": "went", "index": 0 },
    { "type": "text", "content": " to the beach. They " },
    { "type": "verb", "infinitive": "to decide", "correctForm": "decided", "index": 1 },
    { "type": "text", "content": " to swim." }
  ],
  "verbCount": 2
}`
        }],
      })

      const raw = response.content[0].type === 'text' ? response.content[0].text : ''
      const result = JSON.parse(extractJSON(raw))
      return result
    } catch (error: unknown) {
      console.error('generateVerbFillExercise error:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new HttpsError('internal', message)
    }
  }
)

export const evaluateVerbFill = onCall(
  { timeoutSeconds: 90, memory: '256MiB', secrets: [...SECRETS] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const { title, segments, userAnswers, language, level, subLevel } = request.data as {
      title: string
      segments: Array<{ type: string; content?: string; infinitive?: string; correctForm?: string; index?: number }>
      userAnswers: string[]
      language: string
      level: string
      subLevel?: string
    }

    const uid = request.auth!.uid
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
      const response = await getClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 5000,
        messages: [{
          role: 'user',
          content: `Evaluate verb conjugation answers for a fill-in-the-blank exercise.

Language: ${langName(language)}
Expected CEFR level: ${levelLabel}
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

Based on this evaluation session${langProfile ? ' and the existing profile' : ''}, produce an updated learner profile summary for ${langName(language)}. The summary should be 100-180 words describing the learner's strengths, weaknesses, and trends. Focus on verb conjugation patterns, tense mastery, spelling/accent accuracy, and which verb types or tenses are problematic. ${langProfile ? 'Refine and update the existing profile rather than rewriting from scratch — incorporate new observations while preserving past insights that are still relevant.' : 'Create an initial profile based on this first session.'}

Return ONLY a JSON object (no markdown, no explanation):
{"verbScores": [{"index": 0, "score": 10, "correct": true, "feedback": "...", "correctForm": "...", "userAnswer": "..."}], "overallScore": 8.5, "feedback": "...", "profileUpdate": "The updated learner profile summary..."}`
        }],
      })

      const raw = response.content[0].type === 'text' ? response.content[0].text : ''
      const evaluation = JSON.parse(extractJSON(raw))

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
      console.error('evaluateVerbFill error:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new HttpsError('internal', message)
    }
  }
)
