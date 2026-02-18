import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { ArrowRight } from 'lucide-react'
import { CATEGORIES, getGamesByCategory } from '../config/games'

export function HomePage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="glass-strong rounded-3xl p-10 sm:p-14 text-center mb-16 specular-top">
        <div className="text-6xl mb-5 animate-[float_3s_ease-in-out_infinite]">🧠</div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
          {t('home.title')}
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto">
          {t('home.subtitle')}
        </p>
        {user ? (
          <Link
            to="/games"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-black/75 backdrop-blur-sm text-white rounded-2xl font-semibold hover:scale-[1.04] transition-transform shadow-lg"
          >
            {t('nav.games')}
            <ArrowRight size={18} />
          </Link>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-black/75 backdrop-blur-sm text-white rounded-2xl font-semibold hover:scale-[1.04] transition-transform shadow-lg"
            >
              {t('home.getStarted')}
              <ArrowRight size={18} />
            </Link>
            <span className="text-gray-400">
              {t('home.loginPrompt')}{' '}
              <Link to="/login" className="text-gray-700 font-medium hover:underline">
                {t('nav.login')}
              </Link>
            </span>
          </div>
        )}
      </div>

      {/* Game categories */}
      {CATEGORIES.map((category) => {
        const games = getGamesByCategory(category.key)
        return (
          <section key={category.key} className="mb-12">
            {/* Category pill */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                background: category.pillBg,
                border: `1px solid ${category.pillBorder}`,
              }}
            >
              <span className="text-base">{category.emoji}</span>
              <span className="text-sm font-semibold" style={{ color: category.pillText }}>
                {t(category.i18nKey)}
              </span>
            </div>

            {/* Game cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {games.map((game) => (
                <Link
                  key={game.id}
                  to={user ? `/games/${game.id}` : '/login'}
                  className="card-glow rounded-2xl p-6 text-white hover:-translate-y-1.5 hover:shadow-xl transition-all duration-200 block"
                  style={{ background: game.cardGradient }}
                >
                  <span className="text-4xl block mb-3">{game.emoji}</span>
                  <span className="glass-chip mb-2">{game.skillLabel}</span>
                  <h3 className="font-bold text-lg mb-1 mt-2">
                    {t(`games.${game.key}.name`)}
                  </h3>
                  <p className="text-sm text-white/80">
                    {t(`games.${game.key}.description`)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
