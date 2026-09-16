/**
 * Proficiency scales. Every language is graded on CEFR (A1-C2) except
 * Chinese, which uses HSK 3.0 (HSK1-HSK9). Both scales share the same three
 * sub-levels (novice / well-placed / advanced) and the same progression rules.
 */

import type { LanguageLevel, SupportedLanguage } from '../types/user'

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export const HSK_LEVELS = ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'HSK7', 'HSK8', 'HSK9'] as const

export type CefrLevel = (typeof CEFR_LEVELS)[number]
export type HskLevel = (typeof HSK_LEVELS)[number]

export function isHskLevel(level: string): level is HskLevel {
  return (HSK_LEVELS as readonly string[]).includes(level)
}

/** The ordered scale a language is graded on. */
export function levelsForLanguage(language: SupportedLanguage): readonly LanguageLevel[] {
  return language === 'zh' ? HSK_LEVELS : CEFR_LEVELS
}

/** The ordered scale a given level belongs to. */
export function levelOrderOf(level: LanguageLevel): readonly LanguageLevel[] {
  return isHskLevel(level) ? HSK_LEVELS : CEFR_LEVELS
}

/** Whether a saved level is valid for a language (guards old CEFR settings on Chinese). */
export function isLevelForLanguage(level: string, language: SupportedLanguage): level is LanguageLevel {
  return (levelsForLanguage(language) as readonly string[]).includes(level)
}

/** Short English descriptor shown under each level button. */
export const LEVEL_DESCRIPTIONS: Record<LanguageLevel, string> = {
  A1: 'Beginner',
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper Intermediate',
  C1: 'Advanced',
  C2: 'Proficient',
  HSK1: 'Elementary I',
  HSK2: 'Elementary II',
  HSK3: 'Elementary III',
  HSK4: 'Intermediate I',
  HSK5: 'Intermediate II',
  HSK6: 'Intermediate III',
  HSK7: 'Advanced I',
  HSK8: 'Advanced II',
  HSK9: 'Advanced III',
}

/**
 * Count "words" the way the learner experiences them: whitespace tokens,
 * except Chinese where the unit is the Han character. Matches the server.
 */
export function countWords(text: string, language: string): number {
  if (language === 'zh') {
    return (text.match(/[㐀-䶿一-鿿]/g) ?? []).length
  }
  return text.trim().split(/\s+/).filter(Boolean).length
}

/** Unit label for length counts. */
export function lengthUnit(language: string): 'words' | 'characters' {
  return language === 'zh' ? 'characters' : 'words'
}

/**
 * Summary length limits per game. Chinese limits are in characters and
 * sized to carry roughly the same content as the word limits.
 */
export function summaryLimits(language: string, game: 'comprehension' | 'speedSummary'): { min: number; max: number } {
  if (language === 'zh') {
    return game === 'comprehension' ? { min: 50, max: 110 } : { min: 15, max: 35 }
  }
  return game === 'comprehension' ? { min: 30, max: 60 } : { min: 10, max: 20 }
}
