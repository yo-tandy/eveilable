import { onCall, HttpsError } from 'firebase-functions/v2/https'
import Anthropic from '@anthropic-ai/sdk'
import { getLanguageProfile, updateLanguageProfile } from './learningProfile.js'
import { callClaudeStructured } from './jsonUtils.js'
import { aiHttpsError } from './aiErrors.js'
import {
  validateLanguage, validateLevel, validateSubLevel, validateArray, coerceArray,
  checkRateLimit, langName, subLevelDescription, scaleName,
} from './validate.js'

function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  })
}

const SECRETS = ['ANTHROPIC_API_KEY'] as const

const MAX_VERBS = 15
const MAX_TENSES = 20
const SENTENCE_COUNTS = [5, 10, 15]

interface TenseInput {
  id: string
  label: string
  description: string
}

function validateVerbs(value: unknown): string[] {
  const raw = validateArray(value, 'verbs', MAX_VERBS)
  const verbs = raw.map((v) => {
    if (typeof v !== 'string' || v.trim().length === 0 || v.length > 40) {
      throw new HttpsError('invalid-argument', 'Invalid verb')
    }
    return v.trim()
  })
  if (verbs.length === 0) {
    throw new HttpsError('invalid-argument', 'At least one verb is required')
  }
  return [...new Set(verbs)]
}

function validateTenses(value: unknown): TenseInput[] {
  const raw = validateArray(value, 'tenses', MAX_TENSES)
  const tenses = raw.map((t) => {
    const { id, label, description } = (t ?? {}) as Record<string, unknown>
    if (
      typeof id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(id) ||
      typeof label !== 'string' || label.length === 0 || label.length > 60 ||
      typeof description !== 'string' || description.length > 200
    ) {
      throw new HttpsError('invalid-argument', 'Invalid tense')
    }
    return { id, label, description }
  })
  if (tenses.length === 0) {
    throw new HttpsError('invalid-argument', 'At least one tense is required')
  }
  return tenses
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Repeat a shuffled pool until it fills `count` slots, so every item appears before any repeats. */
function spread<T>(pool: T[], count: number): T[] {
  const out: T[] = []
  while (out.length < count) out.push(...shuffle(pool))
  return out.slice(0, count)
}

/**
 * Decide each sentence's verb and tense up front instead of leaving it to the
 * model, so every chosen verb and tense is covered evenly.
 */
function buildPlan(verbs: string[], tenses: TenseInput[], count: number) {
  const verbSeq = spread(verbs, count)
  const tenseSeq = spread(tenses, count)
  return verbSeq.map((verb, i) => ({ index: i, verb, tense: tenseSeq[i] }))
}

export const suggestVerbs = onCall(
  { timeoutSeconds: 60, memory: '256MiB', secrets: [...SECRETS] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const uid = request.auth.uid
    const language = validateLanguage(request.data.language)
    const level = validateLevel(request.data.level, language)
    const subLevel = validateSubLevel(request.data.subLevel)
    const exclude = request.data.exclude === undefined
      ? []
      : validateArray(request.data.exclude, 'exclude', MAX_VERBS).filter((v): v is string => typeof v === 'string')
    const count = Math.min(Math.max(Number(request.data.count) || 8, 1), MAX_VERBS)

    await checkRateLimit(uid)

    const levelLabel = subLevelDescription(level, subLevel)
    const langProfile = await getLanguageProfile(uid, language)
    const profileSection = langProfile
      ? `\nLearner profile for ${langName(language)}:\n"${langProfile.summary}"\nLean towards verbs whose conjugation this learner finds hard.\n`
      : ''

    try {
      const result = await callClaudeStructured(
        getClient(),
        `Suggest ${count} verbs for a ${langName(language)} learner to practise conjugating.

- ${scaleName(level)} level: ${levelLabel}
- Pick useful, frequent verbs appropriate to the level, with a mix of regular and irregular conjugation patterns${level.startsWith('A') || level === 'HSK1' || level === 'HSK2' ? '' : ' (include some trickier irregular verbs)'}
- Give each verb in its dictionary form as a learner would look it up (e.g. "go" in English, "aller" in French, "gehen" in German, "andare" in Italian, "ללכת" in Hebrew, "去" in Chinese)
- Each verb must be distinct${exclude.length > 0 ? `\n- Do NOT suggest any of these, the learner already has them: ${exclude.join(', ')}` : ''}
${profileSection}`,
        {
          type: 'object',
          properties: {
            verbs: {
              type: 'array',
              items: { type: 'string', description: 'Verb in dictionary form' },
            },
          },
          required: ['verbs'],
        },
        { maxTokens: 1024 },
      )

      const excluded = new Set(exclude.map((v) => v.trim().toLowerCase()))
      const verbs = (coerceArray(result.verbs, 'verbs') as unknown[])
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 40)
        .map((v) => v.trim())
        .filter((v) => !excluded.has(v.toLowerCase()))
      return { verbs: [...new Set(verbs)].slice(0, count) }
    } catch (error: unknown) {
      if (error instanceof HttpsError) throw error
      throw aiHttpsError(error, 'suggestVerbs', 'Failed to suggest verbs')
    }
  }
)

export const generateVerbDrill = onCall(
  { timeoutSeconds: 90, memory: '256MiB', secrets: [...SECRETS] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const uid = request.auth.uid
    const language = validateLanguage(request.data.language)
    const level = validateLevel(request.data.level, language)
    const subLevel = validateSubLevel(request.data.subLevel)
    const verbs = validateVerbs(request.data.verbs)
    const tenses = validateTenses(request.data.tenses)
    const count = Number(request.data.count)
    if (!SENTENCE_COUNTS.includes(count)) {
      throw new HttpsError('invalid-argument', 'Invalid sentence count')
    }

    await checkRateLimit(uid)

    const levelLabel = subLevelDescription(level, subLevel)
    const plan = buildPlan(verbs, tenses, count)
    const planList = plan
      .map((p) => `Sentence ${p.index}: verb "${p.verb}", tense "${p.tense.label}"${p.tense.description ? ` (${p.tense.description})` : ''}`)
      .join('\n')

    try {
      const result = await callClaudeStructured(
        getClient(),
        `Write ${count} separate sentences in ${langName(language)} for a verb conjugation drill.

${scaleName(level)} level of the learner: ${levelLabel} (match vocabulary and sentence length to this level)

Each sentence must use the given verb conjugated in the given tense:
${planList}

Rules:
- Each sentence stands alone, 6-18 words, on varied everyday topics. Do not reuse the same subject in consecutive sentences; vary person and number (I, you, she, we, they...).
- The learner sees the sentence with the conjugated verb hidden and must type it. The context MUST make the required tense unambiguous: include time markers or clauses that force it (e.g. "yesterday", "since 2019", "if I had known", "by next year", "while ..."). For imperative, make it clearly a command.
- The person, number${language === 'he' ? ', and gender' : ''} of the verb MUST be recoverable from the sentence (an explicit subject or an unambiguous context).${language === 'he' ? ' Write Hebrew without niqqud.' : ''}
- "infinitive": the verb in dictionary form as a learner would look it up. Use the verb given above; if it was misspelled or given in a conjugated form, correct it to the dictionary form. If it is not a real ${langName(language)} verb, use the closest real verb.
- "correctForm": the FULL conjugated verb as it appears in the sentence, including auxiliaries and particles that belong to the tense (e.g. "have been waiting", "suis allée", "hatte gekauft", "sarà partito", "吃了", "在看"). Do not include the subject pronoun, objects, adverbs, or negation. The hidden span must be ONE contiguous run of words: avoid structures that split the verb (questions with inversion, "ne ... pas" between auxiliary and participle, German main clauses like "Ich habe das Buch gelesen", separated prefixes). In German, use a subordinate clause to keep the parts together (e.g. "..., weil ich das Buch gelesen habe").
- "before" and "after": the exact text before and after the hidden verb, including spaces and punctuation, so that before + correctForm + after is the complete sentence.
- "acceptedForms": other spellings of the same answer that are equally correct in this sentence (e.g. contractions like "don't"/"do not", "won't"/"will not", alternative valid spellings). Empty array if none. Never include a different tense.
- The hidden verb must never already appear elsewhere in the sentence.`,
        {
          type: 'object',
          properties: {
            sentences: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  index: { type: 'integer', description: 'Sentence number from the list above' },
                  before: { type: 'string' },
                  correctForm: { type: 'string' },
                  after: { type: 'string' },
                  infinitive: { type: 'string' },
                  acceptedForms: { type: 'array', items: { type: 'string' } },
                },
                required: ['index', 'before', 'correctForm', 'after', 'infinitive', 'acceptedForms'],
              },
            },
          },
          required: ['sentences'],
        },
        { maxTokens: 6000 },
      )

      const raw = coerceArray(result.sentences, 'sentences') as Array<Record<string, unknown>>
      const byIndex = new Map(raw.map((s) => [Number(s.index), s]))
      const sentences = plan.flatMap((p) => {
        const s = byIndex.get(p.index)
        if (!s || typeof s.correctForm !== 'string' || s.correctForm.trim().length === 0) return []
        const before = typeof s.before === 'string' ? s.before : ''
        const after = typeof s.after === 'string' ? s.after : ''
        if (before.trim().length === 0 && after.trim().length === 0) return []
        const accepted = Array.isArray(s.acceptedForms)
          ? s.acceptedForms.filter((a): a is string => typeof a === 'string' && a.trim().length > 0)
          : []
        return [{
          before,
          after,
          correctForm: s.correctForm.trim(),
          acceptedForms: accepted,
          infinitive: typeof s.infinitive === 'string' && s.infinitive.trim() ? s.infinitive.trim() : p.verb,
          tenseId: p.tense.id,
          tenseLabel: p.tense.label,
        }]
      })

      if (sentences.length < Math.ceil(count / 2)) {
        console.error(`generateVerbDrill: only ${sentences.length}/${count} usable sentences`)
        throw new HttpsError('internal', 'The AI returned too few usable sentences. Please try again.')
      }
      if (sentences.length < count) {
        console.warn(`generateVerbDrill: dropped ${count - sentences.length} malformed sentence(s)`)
      }
      return { sentences }
    } catch (error: unknown) {
      if (error instanceof HttpsError) throw error
      throw aiHttpsError(error, 'generateVerbDrill', 'Failed to generate sentences')
    }
  }
)

export const evaluateVerbDrill = onCall(
  { timeoutSeconds: 90, memory: '256MiB', secrets: [...SECRETS] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const uid = request.auth.uid
    const language = validateLanguage(request.data.language)
    const level = validateLevel(request.data.level, language)
    const subLevel = validateSubLevel(request.data.subLevel)
    const items = validateArray(request.data.items, 'items', 20) as Array<{
      sentence: string
      infinitive: string
      tenseLabel: string
      correctForm: string
      userAnswer: string
      correct: boolean
    }>

    await checkRateLimit(uid)

    const levelLabel = subLevelDescription(level, subLevel)
    const langProfile = await getLanguageProfile(uid, language)

    const itemList = items.map((it, i) => (
      `Item ${i}: ${it.correct ? 'CORRECT' : 'MARKED WRONG'}
  Sentence: "${String(it.sentence).slice(0, 400)}"
  Verb: "${String(it.infinitive).slice(0, 40)}", tense: ${String(it.tenseLabel).slice(0, 60)}
  Expected: "${String(it.correctForm).slice(0, 80)}"
  Learner typed: "${String(it.userAnswer).slice(0, 80)}"`
    )).join('\n\n')

    const profileContext = langProfile
      ? `\nCurrent learner profile for ${langName(language)} (built over ${langProfile.sessionCount} session${langProfile.sessionCount === 1 ? '' : 's'}):\n"${langProfile.summary}"`
      : `\nNo learner profile exists yet for this user in ${langName(language)}. This is the first session being profiled.`

    try {
      const evaluation = await callClaudeStructured(
        getClient(),
        `A ${langName(language)} learner (${scaleName(level)} ${levelLabel}) just did a verb conjugation drill. In each sentence the conjugated verb (shown as ___) was hidden and they typed it. Answers were checked by exact match against the expected form.

${itemList}

1. For every item MARKED WRONG, decide whether the learner's answer is in fact an equally correct conjugation for that sentence and the required tense (e.g. a valid alternative spelling, contraction, or word order). Set "acceptable" true only in that case — a different tense, person, or a misspelling is NOT acceptable. Give a short "note" (1 sentence, in English) explaining the mistake or why it is accepted.
2. Write "feedback": 2-3 sentences of constructive feedback on which tenses and verb patterns were solid and which need work.

--- LEARNER PROFILE UPDATE ---
${profileContext}

Based on this session${langProfile ? ' and the existing profile' : ''}, produce an updated learner profile summary for ${langName(language)} (100-180 words) describing strengths, weaknesses, and trends, focusing on verb conjugation, tense mastery and spelling. ${langProfile ? 'Refine the existing profile rather than rewriting it from scratch.' : 'Create an initial profile based on this first session.'}`,
        {
          type: 'object',
          properties: {
            reviews: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  index: { type: 'integer' },
                  acceptable: { type: 'boolean' },
                  note: { type: 'string' },
                },
                required: ['index', 'acceptable', 'note'],
              },
            },
            feedback: { type: 'string' },
            profileUpdate: { type: 'string', description: 'Updated learner profile summary (100-180 words)' },
          },
          required: ['reviews', 'feedback', 'profileUpdate'],
        },
        { maxTokens: 3000 },
      )

      if (evaluation.profileUpdate) {
        updateLanguageProfile(
          uid,
          language,
          evaluation.profileUpdate,
          langProfile?.sessionCount ?? 0,
        ).catch(err => console.error('Profile update failed:', err))
      }

      // Only items the exact-match check rejected can be overturned
      const reviews = (coerceArray(evaluation.reviews, 'reviews') as Array<{ index: number; acceptable: boolean; note: string }>)
        .filter((r) => items[r.index] && !items[r.index].correct)
      return { reviews, feedback: evaluation.feedback ?? '' }
    } catch (error: unknown) {
      if (error instanceof HttpsError) throw error
      throw aiHttpsError(error, 'evaluateVerbDrill', 'Failed to evaluate answers')
    }
  }
)
