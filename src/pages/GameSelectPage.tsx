import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CATEGORIES, getGamesByCategory } from '../config/games'

export function GameSelectPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">{t('games.selectGame')}</h1>

      {CATEGORIES.map((category) => {
        const games = getGamesByCategory(category.key)
        return (
          <section key={category.key} className="mb-8">
            {/* Category pill */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
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

            <div className="space-y-3">
              {games.map((game) => (
                <Link
                  key={game.id}
                  to={`/games/${game.id}`}
                  className="block rounded-2xl p-5 text-white hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 card-glow"
                  style={{ background: game.cardGradient }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{game.emoji}</span>
                      <div>
                        <h2 className="font-bold text-lg">
                          {t(`games.${game.key}.name`)}
                        </h2>
                        <p className="text-sm text-white/80">
                          {t(`games.${game.key}.description`)}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
