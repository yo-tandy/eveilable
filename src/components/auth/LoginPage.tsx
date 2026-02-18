import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../../config/firebase'

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
      <div className="max-w-sm w-full glass-strong rounded-3xl p-8 specular-top">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🧠</div>
          <h1 className="text-2xl font-bold">{t('auth.signIn')}</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-sm">
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
              className="glass-input w-full px-4 py-2.5 rounded-xl"
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
              className="glass-input w-full px-4 py-2.5 rounded-xl"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-black/75 backdrop-blur-sm text-white rounded-xl font-semibold hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {t('auth.signIn')}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-white/40" />
          <span className="text-sm text-gray-400">or</span>
          <div className="flex-1 h-px bg-white/40" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 glass rounded-xl font-medium hover:bg-white/50 transition-all disabled:opacity-50"
        >
          {t('auth.signInWithGoogle')}
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-gray-800 font-medium hover:underline">
            {t('auth.signUp')}
          </Link>
        </p>
      </div>
    </div>
  )
}
