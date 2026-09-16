import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../../config/firebase'
import { Mascot } from '../common/Mascot'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/games')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      navigate('/games')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full sticker p-8">
        <div className="text-center mb-8">
          <Mascot className="w-24 mx-auto mb-2" />
          <h1 className="display text-[28px]">{t('auth.signIn')}</h1>
        </div>

        {error && (
          <div className="mb-4 alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
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
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 btn btn-sun disabled:opacity-50"
          >
            {t('auth.signIn')}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-ink/15" />
          <span className="text-sm font-bold text-ink-2">{t('common.or')}</span>
          <div className="flex-1 h-px bg-ink/15" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full btn btn-ghost disabled:opacity-50"
        >
          {t('auth.signInWithGoogle')}
        </button>

        <p className="mt-6 text-center text-sm text-ink-2">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-ink font-medium hover:underline">
            {t('auth.signUp')}
          </Link>
        </p>
      </div>
    </div>
  )
}
