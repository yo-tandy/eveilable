import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { validateString } from './validate.js'

export const submitContact = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const name = validateString(request.data.name, 'Name', 200)
    const email = validateString(request.data.email, 'Email', 320)
    const message = validateString(request.data.message, 'Message', 5000)

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpsError('invalid-argument', 'Invalid email address')
    }

    const uid = request.auth.uid

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
      if (error instanceof HttpsError) throw error
      console.error('Contact submit error:', error)
      throw new HttpsError('internal', 'Failed to submit message')
    }
  }
)
