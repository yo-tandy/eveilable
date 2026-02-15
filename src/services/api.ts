import { getFunctions, httpsCallable } from 'firebase/functions'
import app from '../config/firebase'

const functions = getFunctions(app)

export async function callFunction<T>(name: string, data: Record<string, unknown>): Promise<T> {
  const fn = httpsCallable<Record<string, unknown>, T>(functions, name)
  const result = await fn(data)
  return result.data
}
