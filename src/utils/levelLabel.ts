import type { LanguageSubLevel } from '../types/user'

const SUB_LEVEL_RANGE: Record<LanguageSubLevel, string> = {
  'novice': 'lower range',
  'well-placed': 'mid range',
  'advanced': 'upper range',
}

/**
 * Human-readable target level, e.g. "B1" or "B1 (upper range)".
 * Mirrors subLevelDescription() in functions/src/validate.ts so what the
 * learner sees matches what the model was asked for.
 */
export function formatTargetLevel(level: string, subLevel?: string): string {
  const range = subLevel ? SUB_LEVEL_RANGE[subLevel as LanguageSubLevel] : undefined
  return range ? `${level} (${range})` : level
}

/** BCP-47 locale for formatting dates inside a story written in `language`. */
const STORY_LOCALES: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  zh: 'zh-CN',
  he: 'he-IL',
}

/** Format an ISO date in the story's own language, e.g. "16 sept. 2026". Returns null if unparseable. */
export function formatStoryDate(iso: string | undefined, language: string): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(STORY_LOCALES[language] ?? 'en-US', { dateStyle: 'medium' }).format(date)
}
