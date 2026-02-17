import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Brain, Shield, FileText } from 'lucide-react'
import { CATEGORIES, getGamesByCategory, getGameClasses } from '../config/games'

export function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand-100 to-brand-300 flex items-center justify-center shadow-playful">
          <Brain size={32} className="text-brand-600" />
        </div>
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
          const CatIcon = category.icon
          return (
            <div key={category.key} className="mb-6">
              <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-gradient-to-r ${category.gradientFrom} ${category.gradientTo}`}>
                <CatIcon size={16} className={category.iconColor} />
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  {t(category.i18nKey)}
                </h3>
              </div>
              <div className="space-y-3">
                {games.map((game) => {
                  const cls = getGameClasses(game)
                  const Icon = game.icon
                  return (
                    <div
                      key={game.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border ${cls.border} bg-gradient-to-r ${cls.gradientFrom} to-white shadow-sm`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cls.iconBg} ${cls.iconText} shrink-0`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{t(`games.${game.key}.name`)}</h4>
                        <p className="text-sm text-gray-500">{t(`games.${game.key}.description`)}</p>
                      </div>
                    </div>
                  )
                })}
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
      <div className="mb-10 p-6 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-200 text-center shadow-sm">
        <p className="text-gray-600 mb-1">{t('about.createdBy')}</p>
        <p className="text-lg font-semibold text-gray-900">Taveyo SARL</p>
      </div>

      {/* Policy links */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to="/privacy"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all"
        >
          <Shield size={18} />
          {t('about.privacyPolicy')}
        </Link>
        <Link
          to="/terms"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all"
        >
          <FileText size={18} />
          {t('about.termsOfService')}
        </Link>
      </div>
    </div>
  )
}
