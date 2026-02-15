import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../../config/firebase'
import { LogIn } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <LogIn size={40} className="mx-auto text-brand-600 mb-3" />
          <h1 className="text-2xl font-bold">{t('auth.signIn')}</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {t('auth.signIn')}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {t('auth.signInWithGoogle')}
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-brand-600 font-medium hover:underline">
            {t('auth.signUp')}
          </Link>
        </p>
      </div>
    </div>
  )
}
