import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions'
import app, { usingEmulators } from '../config/firebase'

const functions = getFunctions(app)

if (usingEmulators) {
  connectFunctionsEmulator(functions, '127.0.0.1', Number(import.meta.env.VITE_FUNCTIONS_EMULATOR_PORT) || 5001)
}

export async function callFunction<T>(name: string, data: Record<string, unknown>): Promise<T> {
  const fn = httpsCallable<Record<string, unknown>, T>(functions, name)
  const result = await fn(data)
  return result.data
}

/**
 * Guard for array fields in function responses. A malformed payload becomes a
 * catchable error (shown with a retry) rather than a render crash on `.map`.
 */
export function expectArray<T>(value: unknown, name: string): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`Unexpected response: ${name} is missing. Please try again.`)
  }
  return value as T[]
}
