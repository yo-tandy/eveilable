import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Brain, ArrowRight } from 'lucide-react'
import { CATEGORIES, getGamesByCategory, getGameClasses } from '../config/games'

export function HomePage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand-100 to-brand-300 flex items-center justify-center shadow-playful">
          <Brain size={40} className="text-brand-600" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
          {t('home.title')}
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto">
          {t('home.subtitle')}
        </p>
        {user ? (
          <Link
            to="/games"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors shadow-playful"
          >
            {t('nav.games')}
            <ArrowRight size={18} />
          </Link>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors shadow-playful"
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

      {/* Game categories */}
      {CATEGORIES.map((category) => {
        const games = getGamesByCategory(category.key)
        const CatIcon = category.icon
        return (
          <section key={category.key} className="mb-12">
            {/* Category header */}
            <div className={`flex items-center gap-3 mb-6 p-4 rounded-2xl bg-gradient-to-r ${category.gradientFrom} ${category.gradientTo}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${category.labelBg} ${category.labelText}`}>
                <CatIcon size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t(category.i18nKey)}</h2>
                <p className="text-sm text-gray-500">{t(category.descriptionKey)}</p>
              </div>
            </div>

            {/* Game cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {games.map((game) => {
                const cls = getGameClasses(game)
                const Icon = game.icon
                return (
                  <div
                    key={game.id}
                    className={`p-6 rounded-2xl bg-gradient-to-br ${cls.gradientFrom} to-white border ${cls.border} shadow-playful hover:shadow-playful-hover hover:-translate-y-1 transition-all duration-200`}
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${cls.iconBg} ${cls.iconText}`}>
                      <Icon size={28} />
                    </div>
                    <h3 className="font-bold text-lg mb-1">
                      {t(`games.${game.key}.name`)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {t(`games.${game.key}.description`)}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
