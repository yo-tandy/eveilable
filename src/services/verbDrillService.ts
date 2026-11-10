import { callFunction, expectArray } from './api'
import type { TenseOption, VerbDrillSentence, VerbDrillEvaluation } from '../types/verbDrill'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../types/user'

export async function suggestVerbs(
  language: SupportedLanguage,
  level: LanguageLevel,
  subLevel: LanguageSubLevel,
  count: number,
  exclude: string[],
): Promise<string[]> {
  const result = await callFunction<{ verbs: string[] }>(
    'suggestVerbs',
    { language, level, subLevel, count, exclude },
  )
  return expectArray<string>(result.verbs, 'verbs')
}

export async function fetchVerbDrill(
  language: SupportedLanguage,
  level: LanguageLevel,
  subLevel: LanguageSubLevel,
  verbs: string[],
  tenses: TenseOption[],
  count: number,
): Promise<VerbDrillSentence[]> {
  const result = await callFunction<{ sentences: VerbDrillSentence[] }>(
    'generateVerbDrill',
    {
      language, level, subLevel, verbs, count,
      tenses: tenses.map(({ id, label, description }) => ({ id, label, description })),
    },
  )
  return expectArray<VerbDrillSentence>(result.sentences, 'sentences')
}

export async function evaluateVerbDrill(
  language: SupportedLanguage,
  level: LanguageLevel,
  subLevel: LanguageSubLevel,
  items: Array<{
    sentence: string
    infinitive: string
    tenseLabel: string
    correctForm: string
    userAnswer: string
    correct: boolean
  }>,
): Promise<VerbDrillEvaluation> {
  const result = await callFunction<VerbDrillEvaluation>(
    'evaluateVerbDrill',
    { language, level, subLevel, items },
  )
  return { reviews: expectArray(result.reviews, 'reviews'), feedback: result.feedback ?? '' }
}
