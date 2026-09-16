import { callFunction, expectArray } from './api'
import type { VerbFillExercise, VerbFillEvaluation, VerbFillSegment } from '../types/verbFill'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../types/user'

export async function fetchVerbFillExercise(
  language: SupportedLanguage,
  level: LanguageLevel,
  subLevel?: LanguageSubLevel,
): Promise<VerbFillExercise> {
  const result = await callFunction<VerbFillExercise>(
    'generateVerbFillExercise',
    { language, level, subLevel },
  )
  expectArray(result.segments, 'segments')
  return result
}

export async function submitVerbFillAnswers(
  title: string,
  segments: VerbFillSegment[],
  userAnswers: string[],
  language: SupportedLanguage,
  level: LanguageLevel,
  subLevel?: LanguageSubLevel,
): Promise<VerbFillEvaluation> {
  const evaluation = await callFunction<VerbFillEvaluation>(
    'evaluateVerbFill',
    { title, segments, userAnswers, language, level, subLevel },
  )
  return evaluation
}
