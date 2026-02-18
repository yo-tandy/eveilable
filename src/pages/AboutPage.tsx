import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Shield, FileText } from 'lucide-react'
import { CATEGORIES, getGamesByCategory } from '../config/games'

export function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="glass-strong rounded-3xl p-10 text-center mb-12 specular-top">
        <div className="text-5xl mb-4">🧠</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {t('about.title')}
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          {t('about.description')}
        </p>
      </div>

      {/* Games */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {t('about.ourGames')}
        </h2>

        {CATEGORIES.map((category) => {
          const games = getGamesByCategory(category.key)
          return (
            <div key={category.key} className="mb-6">
              {/* Category pill */}
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3"
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
                  <div
                    key={game.id}
                    className="glass rounded-xl p-4 flex items-start gap-4"
                  >
                    <span className="text-3xl shrink-0">{game.emoji}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{t(`games.${game.key}.name`)}</h4>
                      <p className="text-sm text-gray-500">{t(`games.${game.key}.description`)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Features */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {t('about.features')}
        </h2>
        <ul className="space-y-2 text-gray-600">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
            {t('about.feature1')}
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
            {t('about.feature2')}
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
            {t('about.feature3')}
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
            {t('about.feature4')}
          </li>
        </ul>
      </div>

      {/* Company */}
      <div className="mb-10 glass rounded-2xl p-6 text-center">
        <p className="text-gray-600 mb-1">{t('about.createdBy')}</p>
        <p className="text-lg font-semibold text-gray-900">Taveyo SARL</p>
      </div>

      {/* Policy links */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to="/privacy"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass text-gray-700 hover:bg-white/50 transition-all"
        >
          <Shield size={18} />
          {t('about.privacyPolicy')}
        </Link>
        <Link
          to="/terms"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass text-gray-700 hover:bg-white/50 transition-all"
        >
          <FileText size={18} />
          {t('about.termsOfService')}
        </Link>
      </div>
    </div>
  )
}
