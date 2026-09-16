/**
 * Concrete, enforceable CEFR constraints for text generation prompts.
 *
 * A bare "A2 (lower range)" label leaves the model free to drift upward,
 * especially on news topics whose vocabulary is intrinsically B1+. These
 * rubrics spell out what each band allows so the model has something to
 * obey, and `levelDrift` lets callers detect drift in either direction from
 * the model's own self-assessment and regenerate once.
 */

import { subLevelDescription } from './validate.js'

/** CEFR bands with lower/upper modifiers: A1-, A1, A1+, ... C2+. */
export const CEFR_BANDS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].flatMap(b => [`${b}-`, b, `${b}+`])

const BAND_RULES: Record<string, string> = {
  A1: `- Vocabulary: only the ~500 most frequent words of the language (everyday nouns, basic verbs, numbers, days, family, food, places).
- Grammar: present tense only. One clause per sentence. No passive voice.
- Sentences: at most 8 words.
- No idioms, no slang, no figurative language, no abbreviations.
- Do not quote anyone verbatim. Report what people say as one plain sentence ("The minister says the plan is good.").
- Any institution, technical term or abstract concept must be replaced by a plain description ("the parliament" instead of its official name; "people who protect nature" instead of "environmental defenders").
- Repeat the same key nouns instead of using synonyms or pronouns that could be ambiguous.`,

  A2: `- Vocabulary: only the ~1200 most frequent words of the language. If a word would not appear in a beginner's first-year textbook, replace it with a simpler word or a short plain description.
- Grammar: present tense, one simple past tense (e.g. passé composé / Perfekt / simple past), and near future ("is going to"). No conditional, no subjunctive, no passive voice, no past perfect.
- Sentences: at most 12 words, with at most one subordinate clause introduced by "because", "when", "that" or "if".
- No idioms, no slang, no figurative or informal expressions, even inside quotes.
- Do not quote anyone verbatim. Paraphrase every quotation into plain language ("He says the decision hurt the economy.").
- Names of institutions, technical or political terms and abstract nouns must be explained in simple words the first time or replaced by a plain description. Prefer concrete words over abstract ones.
- Repeat key nouns rather than using synonyms.
- Prefer fewer facts told simply over many facts told densely. Drop secondary details rather than express them with harder language.`,

  B1: `- Vocabulary: common everyday and general-news vocabulary (~2500 most frequent words). Topic-specific terms are allowed if the surrounding sentence makes their meaning clear.
- Grammar: all common tenses including imperfect and simple conditional. Passive voice only occasionally.
- Sentences: at most 18 words, at most two clauses.
- Simple, transparent idioms are allowed. No slang or strongly informal expressions.
- Quotations may be kept verbatim only when they are in plain language; otherwise paraphrase them.
- Give brief context for institutions and technical terms the first time they appear.`,

  B2: `- Vocabulary: broad general vocabulary and standard news register, including abstract nouns and topic-specific terms.
- Grammar: full range of tenses and moods, including passive and subjunctive where natural.
- Sentences: varied length, up to about 25 words, with multiple clauses where useful.
- Idioms and set expressions are allowed. Quotations may be kept verbatim, including informal ones, if their meaning is inferable from context.`,

  C1: `- Vocabulary: wide and precise, including low-frequency words, nuance and register shifts as a quality newspaper would use.
- Grammar: no restrictions. Complex sentence structure, inversion and nominalisation are welcome.
- Idioms, irony and verbatim quotations are allowed without explanation.
- ELEVATE the language above the source: even if the headline is mundane, write it as an editorial in a quality newspaper would, with analysis, precise terminology and varied sentence rhythm. A plain, simplified text is a failure at this level.`,

  C2: `- Write as an authentic, well-edited piece from a serious national newspaper or literary magazine. No simplification of any kind.
- ELEVATE the language above the source: use rare and precise vocabulary, subtle nuance, allusion, irony and complex syntax. The text should challenge an educated native reader; anything a B2 learner could read comfortably is a failure at this level.`,
}

const SUB_LEVEL_RULES: Record<string, (level: string) => string> = {
  novice: level => `- Aim for the LOWER edge of ${level}. Whenever you hesitate between two options, choose the simpler one. The text must feel easy to a learner who has only just reached ${level}.`,
  'well-placed': level => `- Aim for the middle of ${level}: comfortable for a typical ${level} learner, neither easy nor challenging.`,
  advanced: level => `- Aim for the UPPER edge of ${level}. The text may occasionally touch the next band, but must remain readable by a strong ${level} learner without a dictionary.`,
}

/**
 * Full level block for a generation prompt: the label, the band's concrete
 * rules and the sub-level nudge.
 */
export function levelRubric(level: string, subLevel?: string): string {
  const rules = BAND_RULES[level] ?? BAND_RULES.B1
  const sub = subLevel && SUB_LEVEL_RULES[subLevel] ? `\n${SUB_LEVEL_RULES[subLevel](level)}` : ''
  return `CEFR language level: ${subLevelDescription(level, subLevel)}.
These level constraints take precedence over every other instruction, including the learner profile and the wish to be informative:
${rules}${sub}`
}

/** Schema fragment for the model's honest self-assessment of what it wrote. */
export const ASSESSED_LEVEL_SCHEMA = {
  type: 'string',
  enum: CEFR_BANDS,
  description: 'Honest CEFR level of the text you actually wrote, judged as a strict examiner would, weighing vocabulary above grammar. "+" = upper part of the band, "-" = lower part. Do not simply repeat the requested level.',
}

/** A2+ -> 4, B1- -> 6, etc. Unknown strings map to -1. */
function bandRank(band: string): number {
  return CEFR_BANDS.indexOf(band)
}

/** Rank the caller asked for: novice -> "A2-", well-placed -> "A2", advanced -> "A2+". */
function targetRank(level: string, subLevel?: string): number {
  const mod = subLevel === 'novice' ? '-' : subLevel === 'advanced' ? '+' : ''
  return bandRank(`${level}${mod}`)
}

/**
 * 'above' when the self-assessed level is more than one notch above the
 * target, 'below' when more than one notch below, null when acceptable.
 * One notch of slack is allowed because the self-assessment is itself
 * approximate. Either direction means the text should be regenerated once:
 * low targets drift upward on news topics, high targets drift downward when
 * the model simply reports a plain headline.
 */
export function levelDrift(assessed: unknown, level: string, subLevel?: string): 'above' | 'below' | null {
  if (typeof assessed !== 'string') return null
  const a = bandRank(assessed)
  if (a < 0) return null
  const t = targetRank(level, subLevel)
  if (a > t + 1) return 'above'
  if (a < t - 1) return 'below'
  return null
}

/** Extra instruction for the single retry after a text came back off-level. */
export function retryNote(
  drift: 'above' | 'below',
  assessed: string,
  level: string,
  subLevel: string | undefined,
  previousText: string,
): string {
  const target = subLevelDescription(level, subLevel)
  const fix = drift === 'above'
    ? `Rewrite it so that it clearly meets the level constraints. Replace every word outside the allowed vocabulary, shorten every long sentence, paraphrase every quotation, and drop secondary facts rather than keep them in hard language.`
    : `Rewrite it so that it clearly meets the level constraints. Raise the register: use more precise and less frequent vocabulary, more complex and varied sentence structure, and add analysis, nuance and context rather than merely reporting the headline.`
  return `
A previous attempt at this task was assessed at ${assessed}, which is too ${drift === 'above' ? 'hard' : 'easy'} for the target ${target}. Here it is:
"""
${previousText}
"""
${fix}`
}
