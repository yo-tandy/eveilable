import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

export const submitContact = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    const { name, email, message } = request.data as {
      name: string
      email: string
      message: string
    }

    // Validate input
    if (!name || !email || !message) {
      throw new HttpsError('invalid-argument', 'Name, email, and message are required')
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      throw new HttpsError('invalid-argument', 'All fields must be strings')
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpsError('invalid-argument', 'Invalid email address')
    }

    const uid = request.auth?.uid || null

    try {
      const db = getFirestore()
      await db.collection('contactMessages').add({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        uid,
        createdAt: Timestamp.now(),
      })

      return { success: true }
    } catch (error: unknown) {
      console.error('Contact submit error:', error)
      const msg = error instanceof Error ? error.message : 'Unknown error'
      throw new HttpsError('internal', msg)
    }
  }
)
