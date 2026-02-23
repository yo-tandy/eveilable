import { getFirestore, Timestamp } from 'firebase-admin/firestore'

export interface LanguageProfile {
  summary: string
  lastUpdated: Timestamp
  sessionCount: number
}

export interface LearningProfile {
  updatedAt: Timestamp
  languages: Record<string, LanguageProfile>
}

/**
 * Read the learning profile for a specific language.
 * Returns null if no profile or no entry for the language exists.
 */
export async function getLanguageProfile(
  uid: string,
  language: string,
): Promise<LanguageProfile | null> {
  const db = getFirestore()
  const ref = db.doc(`users/${uid}/profile/learningProfile`)
  const snap = await ref.get()
  if (!snap.exists) return null
  const data = snap.data() as LearningProfile
  return data.languages?.[language] ?? null
}

/**
 * Write an updated profile summary for a specific language.
 * Uses set with merge so other languages are not affected.
 */
export async function updateLanguageProfile(
  uid: string,
  language: string,
  summary: string,
  currentSessionCount: number,
): Promise<void> {
  const db = getFirestore()
  const ref = db.doc(`users/${uid}/profile/learningProfile`)
  await ref.set({
    updatedAt: Timestamp.now(),
    languages: {
      [language]: {
        summary,
        lastUpdated: Timestamp.now(),
        sessionCount: currentSessionCount + 1,
      },
    },
  }, { merge: true })
}
