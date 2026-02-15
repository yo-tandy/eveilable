import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Brain, Eye, Car, BookOpen, ArrowRight } from 'lucide-react'

const GAME_CARDS = [
  {
    key: 'dividedAttention',
    icon: Eye,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    key: 'doubleDecision',
    icon: Car,
    color: 'text-orange-600 bg-orange-50',
  },
  {
    key: 'comprehension',
    icon: BookOpen,
    color: 'text-emerald-600 bg-emerald-50',
  },
] as const

export function HomePage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <Brain size={64} className="mx-auto text-brand-600 mb-4" />
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
          {t('home.title')}
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto">
          {t('home.subtitle')}
        </p>
        {user ? (
          <Link
            to="/games"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
          >
            {t('nav.games')}
            <ArrowRight size={18} />
          </Link>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
            >
              {t('home.getStarted')}
              <ArrowRight size={18} />
            </Link>
            <span className="text-gray-400">
              {t('home.loginPrompt')}{' '}
              <Link to="/login" className="text-brand-600 font-medium hover:underline">
                {t('nav.login')}
              </Link>
            </span>
          </div>
        )}
      </div>

      {/* Game cards preview */}
      <div className="grid sm:grid-cols-3 gap-6">
        {GAME_CARDS.map(({ key, icon: Icon, color }) => (
          <div
            key={key}
            className="p-6 rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
              <Icon size={24} />
            </div>
            <h3 className="font-bold text-lg mb-1">
              {t(`games.${key}.name`)}
            </h3>
            <p className="text-sm text-gray-500">
              {t(`games.${key}.description`)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
