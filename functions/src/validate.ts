import { HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

// --- Input validation helpers ---

const VALID_LANGUAGES = ['en', 'fr', 'zh', 'he', 'de', 'it']
const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const VALID_SUB_LEVELS = ['novice', 'well-placed', 'advanced']

export function validateLanguage(lang: unknown): string {
  if (typeof lang !== 'string' || !VALID_LANGUAGES.includes(lang)) {
    throw new HttpsError('invalid-argument', 'Invalid language')
  }
  return lang
}

export function validateLevel(level: unknown): string {
  if (typeof level !== 'string' || !VALID_LEVELS.includes(level)) {
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
