/**
 * Seed a test account into the local Auth + Firestore emulators.
 * Run after `firebase emulators:start --config firebase.emulator.local.json`:
 *   node scripts/seed-emulator.mjs
 * Emulator-only: these credentials never exist in production.
 */
const PROJECT_ID = 'eveilable-6bda0'
const AUTH_HOST = '127.0.0.1:9109'
const FIRESTORE_HOST = '127.0.0.1:8180'

export const TEST_USER = {
  email: 'tester@eveilable.test',
  password: 'drill-64173786',
  displayName: 'Test Learner',
}

async function signUpOrSignIn() {
  const base = `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1`
  const body = JSON.stringify({ ...TEST_USER, returnSecureToken: true })
  const headers = { 'Content-Type': 'application/json' }
  let res = await fetch(`${base}/accounts:signUp?key=emulator`, { method: 'POST', headers, body })
  if (!res.ok) {
    // Already seeded: look the account up instead
    res = await fetch(`${base}/accounts:signInWithPassword?key=emulator`, { method: 'POST', headers, body })
  }
  if (!res.ok) throw new Error(`Auth emulator: ${res.status} ${await res.text()}`)
  return (await res.json()).localId
}

async function writeUserDoc(uid) {
  // "Bearer owner" bypasses security rules on the Firestore emulator
  const url = `http://${FIRESTORE_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({
      fields: {
        displayName: { stringValue: TEST_USER.displayName },
        email: { stringValue: TEST_USER.email },
        createdAt: { timestampValue: new Date().toISOString() },
        preferredLanguage: { stringValue: 'en' },
        settings: { mapValue: { fields: {
          reducedMotion: { booleanValue: false },
          uiLanguage: { stringValue: 'en' },
        } } },
      },
    }),
  })
  if (!res.ok) throw new Error(`Firestore emulator: ${res.status} ${await res.text()}`)
}

const uid = await signUpOrSignIn()
await writeUserDoc(uid)
console.log(`Seeded ${TEST_USER.email} (uid ${uid}). Password is in scripts/seed-emulator.mjs.`)
