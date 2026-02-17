import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CATEGORIES, getGamesByCategory, getGameClasses } from '../config/games'

export function GameSelectPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">{t('games.selectGame')}</h1>

      {CATEGORIES.map((category) => {
        const games = getGamesByCategory(category.key)
        const CatIcon = category.icon
        return (
          <section key={category.key} className="mb-8">
            {/* Category header */}
            <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-gradient-to-r ${category.gradientFrom} ${category.gradientTo}`}>
              <CatIcon size={18} className={category.iconColor} />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {t(category.i18nKey)}
              </h2>
            </div>

            <div className="space-y-3">
              {games.map((game) => {
                const cls = getGameClasses(game)
                const Icon = game.icon
                return (
                  <Link
                    key={game.id}
                    to={`/games/${game.id}`}
                    className={`block p-5 rounded-2xl bg-gradient-to-r ${cls.gradientFrom} to-white border ${cls.border} shadow-playful hover:shadow-playful-hover hover:-translate-y-0.5 transition-all duration-200`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${cls.iconBg} ${cls.iconText}`}>
                          <Icon size={28} />
                        </div>
                        <div>
                          <h2 className="font-bold text-lg text-gray-900">
                            {t(`games.${game.key}.name`)}
                          </h2>
                          <p className="text-sm text-gray-500">
                            {t(`games.${game.key}.description`)}
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-gray-400 flex-shrink-0" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
