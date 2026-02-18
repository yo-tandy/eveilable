import { callFunction } from './api'
import type { TenseExercise, TenseRewriteEvaluation } from '../types/tenseRewrite'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../types/user'

export async function fetchTenseExercises(
  language: SupportedLanguage,
  level: LanguageLevel,
  subLevel?: LanguageSubLevel,
): Promise<TenseExercise[]> {
  const { exercises } = await callFunction<{ exercises: TenseExercise[] }>(
    'generateTenseExercises',
    { language, level, subLevel },
  )
  return exercises
}

export async function submitTenseRewrites(
  exercises: TenseExercise[],
  userRewrites: string[],
  language: SupportedLanguage,
  level: LanguageLevel,
  subLevel?: LanguageSubLevel,
): Promise<TenseRewriteEvaluation> {
  const evaluation = await callFunction<TenseRewriteEvaluation>(
    'evaluateTenseRewrites',
    { exercises, userRewrites, language, level, subLevel },
  )
  return evaluation
}
