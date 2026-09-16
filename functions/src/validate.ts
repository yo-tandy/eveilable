import { HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

// --- Input validation helpers ---

const VALID_LANGUAGES = ['en', 'fr', 'zh', 'he', 'de', 'it']
/** CEFR scale, used for every language except Chinese. */
export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
/** HSK 3.0 scale (2021 standard, 2026 exam syllabus), used for Chinese. */
export const HSK_LEVELS = ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'HSK7', 'HSK8', 'HSK9']
const VALID_SUB_LEVELS = ['novice', 'well-placed', 'advanced']

export function isHskLevel(level: string): boolean {
  return HSK_LEVELS.includes(level)
}

/** Which scale a language is graded on. */
export function levelsForLanguage(language: string): string[] {
  return language === 'zh' ? HSK_LEVELS : CEFR_LEVELS
}

/** Human name of the scale a level belongs to, for prompts. */
export function scaleName(level: string): 'HSK' | 'CEFR' {
  return isHskLevel(level) ? 'HSK' : 'CEFR'
}

/**
 * Coarse tier shared by both scales, for prompt branches that only care
 * about beginner / intermediate / advanced. HSK 1-3 are the elementary
 * band, 4-6 intermediate, 7-9 advanced.
 */
export function levelTier(level: string): 'beginner' | 'intermediate' | 'advanced' {
  const i = isHskLevel(level) ? HSK_LEVELS.indexOf(level) : CEFR_LEVELS.indexOf(level)
  const n = isHskLevel(level) ? 9 : 6
  if (i < n / 3) return 'beginner'
  if (i < (2 * n) / 3) return 'intermediate'
  return 'advanced'
}

/**
 * Count words the way a learner would: whitespace-separated tokens, except
 * for Chinese where "words" are Han characters.
 */
export function countWords(text: string, language: string): number {
  if (language === 'zh') {
    return (text.match(/[\u3400-\u4dbf\u4e00-\u9fff]/g) ?? []).length
  }
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function validateLanguage(lang: unknown): string {
  if (typeof lang !== 'string' || !VALID_LANGUAGES.includes(lang)) {
    throw new HttpsError('invalid-argument', 'Invalid language')
  }
  return lang
}

/**
 * Validate a level and, when the language is known, that it belongs to that
 * language's scale (HSK for Chinese, CEFR otherwise).
 */
export function validateLevel(level: unknown, language?: string): string {
  const allowed = language ? levelsForLanguage(language) : [...CEFR_LEVELS, ...HSK_LEVELS]
  if (typeof level !== 'string' || !allowed.includes(level)) {
    throw new HttpsError('invalid-argument', 'Invalid level')
  }
  return level
}

export function validateSubLevel(subLevel: unknown): string | undefined {
  if (subLevel === undefined || subLevel === null) return undefined
  if (typeof subLevel !== 'string' || !VALID_SUB_LEVELS.includes(subLevel)) {
    throw new HttpsError('invalid-argument', 'Invalid sub-level')
  }
  return subLevel
}

export function validateString(value: unknown, name: string, maxLength: number): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpsError('invalid-argument', `${name} is required`)
  }
  if (value.length > maxLength) {
    throw new HttpsError('invalid-argument', `${name} is too long`)
  }
  return value
}

export function validateArray(value: unknown, name: string, maxLength: number): unknown[] {
  if (!Array.isArray(value)) {
    throw new HttpsError('invalid-argument', `${name} must be an array`)
  }
  if (value.length > maxLength) {
    throw new HttpsError('invalid-argument', `${name} has too many items`)
  }
  return value
}

// --- Rate limiting ---

const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX_CALLS = 10 // max AI calls per user per minute

/**
 * Check per-user rate limit using Firestore.
 * Throws HttpsError('resource-exhausted') if rate limit exceeded.
 */
export async function checkRateLimit(uid: string): Promise<void> {
  const db = getFirestore()
  const ref = db.doc(`rateLimits/${uid}`)
  const now = Date.now()

  const snap = await ref.get()
  const data = snap.data() as { timestamps: number[] } | undefined
  const timestamps = data?.timestamps ?? []

  // Filter to only timestamps within the window
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS)

  if (recent.length >= RATE_LIMIT_MAX_CALLS) {
    throw new HttpsError('resource-exhausted', 'Too many requests. Please wait a moment.')
  }

  // Add current timestamp and write back
  recent.push(now)
  await ref.set({ timestamps: recent, updatedAt: Timestamp.now() })
}

// --- Shared constants ---

export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  zh: 'Chinese (Simplified)',
  he: 'Hebrew',
  de: 'German',
  it: 'Italian',
}

export function langName(code: string): string {
  return LANGUAGE_NAMES[code] || 'English'
}

export function subLevelDescription(level: string, subLevel?: string): string {
  if (!subLevel) return level
  const desc = subLevel === 'novice' ? 'lower range' : subLevel === 'advanced' ? 'upper range' : 'mid range'
  return `${level} (${desc})`
}

/**
 * The model occasionally returns an array field as a JSON string or wrapped in
 * an extra object. Unwrap those shapes; reject anything that still is not an
 * array so the client gets a clean error instead of crashing on `.map`.
 */
export function coerceArray(value: unknown, name: string): unknown[] {
  let v = value
  if (typeof v === 'string') {
    try { v = JSON.parse(v) } catch { /* fall through to the shape check */ }
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const arrays = Object.values(v as Record<string, unknown>).filter(Array.isArray)
    if (arrays.length === 1) v = arrays[0]
  }
  if (!Array.isArray(v)) {
    console.error(`coerceArray: ${name} has unexpected shape`, typeof value)
    throw new HttpsError('internal', `The AI returned ${name} in an unexpected shape. Please try again.`)
  }
  return v
}
