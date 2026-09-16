import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mascot } from '../common/Mascot'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { auth, db } from '../../config/firebase'

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGoogleSignUp = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      navigate('/games')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-up failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(credential.user, { displayName })

      await setDoc(doc(db, 'users', credential.user.uid), {
        displayName,
        email,
        createdAt: Timestamp.now(),
        preferredLanguage: 'en',
        settings: {
          reducedMotion: false,
          uiLanguage: 'en',
        },
      })

      navigate('/games')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full sticker p-8">
        <div className="text-center mb-8">
          <Mascot className="w-24 mx-auto mb-2" />
          <h1 className="display text-[28px]">{t('auth.signUp')}</h1>
        </div>

        {error && (
          <div className="mb-4 alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.displayName')}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="field w-full px-4 py-2.5 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="field w-full px-4 py-2.5 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="field w-full px-4 py-2.5 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.confirmPassword')}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="field w-full px-4 py-2.5 rounded-xl"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 btn btn-sun disabled:opacity-50"
          >
            {t('auth.signUp')}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-ink/15" />
          <span className="text-sm font-bold text-ink-2">{t('common.or')}</span>
          <div className="flex-1 h-px bg-ink/15" />
        </div>

        <button
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="w-full btn btn-ghost disabled:opacity-50"
        >
          {t('auth.signUpWithGoogle')}
        </button>

        <p className="mt-6 text-center text-sm text-ink-2">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-ink font-medium hover:underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
