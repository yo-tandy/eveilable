/**
 * Concrete, enforceable level constraints for text generation prompts.
 *
 * A bare "A2 (lower range)" label leaves the model free to drift upward,
 * especially on news topics whose vocabulary is intrinsically B1+. These
 * rubrics spell out what each band allows so the model has something to
 * obey, and `levelDrift` lets callers detect drift in either direction from
 * the model's own self-assessment and regenerate once.
 *
 * Two scales are supported: CEFR (A1-C2) for every language except Chinese,
 * and HSK 3.0 (HSK1-HSK9) for Chinese. The HSK figures follow the 2026 exam
 * syllabus, which is lower than the widely quoted 2021 framework counts.
 */

import { CEFR_LEVELS, HSK_LEVELS, isHskLevel, scaleName, subLevelDescription } from './validate.js'

/** Bands with lower/upper modifiers for a given level's scale: A1-, A1, A1+, ... or HSK1-, HSK1, HSK1+, ... */
export function bandsFor(level: string): string[] {
  const base = isHskLevel(level) ? HSK_LEVELS : CEFR_LEVELS
  return base.flatMap(b => [`${b}-`, b, `${b}+`])
}

const CEFR_RULES: Record<string, string> = {
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

/**
 * HSK 3.0 bands. Cumulative counts are from the 2026 exam syllabus:
 * words 300 / 500 / 1000 / 2000 / 3600 / 5400 / 11000 (7-9 combined),
 * characters 246 / 371 / 655 / 1096 / 1527 / 1940 / 3088.
 * Levels 1-3 are the elementary band, 4-6 intermediate, 7-9 advanced.
 */
const HSK_RULES: Record<string, string> = {
  HSK1: `- Scope (HSK 1, elementary band): ~300 words and ~250 characters. Only the most basic everyday words: greetings, self-introduction, family, numbers, time, weather, food, prices, simple places and actions.
- Grammar: HSK 1 grammar points only: subject-verb-object, 是 / 有 / 在, 吗 questions, basic question words (谁, 什么, 哪儿, 几), 不 negation, simple adjectival predicates, 的 possession, basic measure words (个). No 了 aspect, no 把, no 被, no complements, no comparatives.
- Sentences: at most 8 characters, one clause each, one idea per sentence.
- No idioms, no 成语, no written/formal register, no abbreviations.
- Do not quote anyone verbatim. Report what people say in one plain sentence (他说这个很好。).
- Institutions, technical terms and abstract concepts must be replaced by a plain description using HSK 1 words (e.g. "很多人" instead of an organisation's name).
- Repeat the same key nouns instead of using synonyms or pronouns that could be ambiguous.
- Simplified characters only.`,

  HSK2: `- Scope (HSK 2, elementary band): ~500 words and ~370 characters. Everyday topics: shopping, ordering food, asking prices, daily routine, family, study, simple directions.
- Grammar: HSK 1-2 grammar points only: 了 for completed action, 在 progressive, 过 experience, simple 比 comparison, basic resultative complements (好, 完), 要 / 想 / 会 / 可以 modal verbs, 因为...所以, 虽然...但是. No 把, no 被, no directional or potential complements.
- Sentences: at most 12 characters, at most one subordinate clause.
- No idioms, no 成语, no written/formal register, even inside quotes.
- Do not quote anyone verbatim. Paraphrase every quotation into plain language.
- Names of institutions, technical or political terms and abstract nouns must be explained in HSK 2 words the first time, or replaced by a plain description. Prefer concrete words over abstract ones.
- Repeat key nouns rather than using synonyms.
- Prefer fewer facts told simply over many facts told densely. Drop secondary details rather than express them with harder language.
- Simplified characters only.`,

  HSK3: `- Scope (HSK 3, elementary band): ~1000 words and ~650 characters. Daily affairs, work, study, simple stories, plans, opinions on familiar things.
- Grammar: HSK 1-3 grammar points: 把 sentences, 被 passive, directional complements (进来, 出去), 得 degree complements, 一边...一边, 越来越, 又...又, 如果...就, 不但...而且. No 成语, no literary constructions.
- Sentences: at most 16 characters, at most one subordinate clause.
- No idioms or 成语. Colloquial register only.
- Paraphrase quotations into plain language unless they already use HSK 3 words.
- Explain institutions and technical terms in simple words the first time they appear, or replace them with a plain description.
- Prefer fewer facts told simply over many facts told densely.
- Simplified characters only.`,

  HSK4: `- Scope (HSK 4, intermediate band): ~2000 words and ~1100 characters. Broader everyday and light-news topics: culture, places, famous people, travel, health, simple social issues.
- Grammar: HSK 1-4 grammar points, including potential complements (看得懂), 是...的 emphasis, 既...又, 不管...都, 只要...就, 无论, 尽管. Occasional written-style connectors are acceptable.
- Sentences: at most 20 characters, at most two clauses.
- At most one very common 成语 or set phrase, and only if its meaning is obvious from context.
- Quotations may be kept verbatim only when plain; otherwise paraphrase.
- Give brief context for institutions and technical terms the first time they appear.
- Simplified characters only.`,

  HSK5: `- Scope (HSK 5, intermediate band): ~3600 words and ~1500 characters. Social news, environment, economy, history and culture at the level of a simplified newspaper.
- Grammar: HSK 1-5 grammar points. Standard written-news structures and connectors (然而, 因此, 此外, 随着, 对于...来说) are allowed.
- Sentences: varied, up to about 25 characters, at most two clauses.
- A few common 成语 are allowed when natural. No literary or classical constructions.
- Quotations may be kept verbatim if clear; paraphrase slang or highly idiomatic ones.
- Simplified characters only.`,

  HSK6: `- Scope (HSK 6, intermediate band): ~5400 words and ~1900 characters. Business, management, economics, science and complex social topics at the level of a mainstream newspaper.
- Grammar: full HSK 1-6 grammar, including formal written constructions (以, 而, 即, 并, 从而, 与其...不如).
- Sentences: varied, up to about 30 characters, multiple clauses where useful.
- 成语 and set expressions allowed. Quotations may be kept verbatim.
- Simplified characters only.`,

  HSK7: `- Scope (HSK 7, advanced band): the ~11000-word advanced vocabulary and ~3000 characters. Write at the level of an authentic article in a serious Chinese newspaper.
- Grammar: no restrictions. Formal written register, nominalisation, 成语 and 书面语 are welcome.
- ELEVATE the language above the source: even if the headline is mundane, write it as an editorial in a quality newspaper would, with analysis, precise terminology and varied sentence rhythm. A plain, simplified text is a failure at this level.
- Simplified characters only.`,

  HSK8: `- Scope (HSK 8, advanced band): the ~11000-word advanced vocabulary and ~3000 characters. Write at the level of an authentic commentary or feature in a serious Chinese newspaper or magazine.
- Grammar: no restrictions. Dense formal written register, 成语, allusions and rhetorical structure are expected.
- ELEVATE the language above the source: include argument, nuance and precise low-frequency vocabulary. Anything an HSK 6 learner could read comfortably is a failure at this level.
- Simplified characters only.`,

  HSK9: `- Scope (HSK 9, advanced band): native-level. Write as a well-edited piece from a serious Chinese newspaper, journal or literary magazine, with no simplification of any kind.
- ELEVATE the language above the source: use rare and precise vocabulary, classical allusions and 成语, subtle nuance, irony and complex syntax. The text should challenge an educated native reader; anything an HSK 7 learner could read comfortably is a failure at this level.
- Simplified characters only.`,
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
  const rules = (isHskLevel(level) ? HSK_RULES[level] : CEFR_RULES[level]) ?? CEFR_RULES.B1
  const sub = subLevel && SUB_LEVEL_RULES[subLevel] ? `\n${SUB_LEVEL_RULES[subLevel](level)}` : ''
  return `${scaleName(level)} language level: ${subLevelDescription(level, subLevel)}.
These level constraints take precedence over every other instruction, including the learner profile and the wish to be informative:
${rules}${sub}`
}

/** Schema fragment for the model's honest self-assessment of what it wrote, on the level's scale. */
export function assessedLevelSchema(level: string) {
  const scale = scaleName(level)
  const example = scale === 'HSK' ? '"HSK2+", "HSK4", "HSK7-"' : '"A2+", "B1", "C1-"'
  return {
    type: 'string',
    enum: bandsFor(level),
    description: `Honest ${scale} level of the text you actually wrote, judged as a strict examiner would, weighing vocabulary above grammar. "+" = upper part of the band, "-" = lower part, e.g. ${example}. Do not simply repeat the requested level.`,
  }
}

/** Rank the caller asked for: novice -> "A2-", well-placed -> "A2", advanced -> "A2+". */
function targetRank(level: string, subLevel: string | undefined, scale: string[]): number {
  const mod = subLevel === 'novice' ? '-' : subLevel === 'advanced' ? '+' : ''
  return scale.indexOf(`${level}${mod}`)
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
  const scale = bandsFor(level)
  const a = scale.indexOf(assessed)
  if (a < 0) return null
  const t = targetRank(level, subLevel, scale)
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
