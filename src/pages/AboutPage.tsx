import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Brain, Eye, Car, BookOpen, Shield, FileText } from 'lucide-react'

export function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <Brain size={48} className="mx-auto text-brand-600 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {t('about.title')}
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          {t('about.description')}
        </p>
      </div>

      {/* Games */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t('about.ourGames')}
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-200">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-blue-600 bg-blue-50 shrink-0">
              <Eye size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{t('games.dividedAttention.name')}</h3>
              <p className="text-sm text-gray-500">{t('games.dividedAttention.description')}</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-200">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-orange-600 bg-orange-50 shrink-0">
              <Car size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{t('games.doubleDecision.name')}</h3>
              <p className="text-sm text-gray-500">{t('games.doubleDecision.description')}</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-200">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-emerald-600 bg-emerald-50 shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{t('games.comprehension.name')}</h3>
              <p className="text-sm text-gray-500">{t('games.comprehension.description')}</p>
            </div>
          </div>
        </div>
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
      <div className="mb-10 p-6 rounded-2xl bg-gray-50 border border-gray-200 text-center">
        <p className="text-gray-600 mb-1">{t('about.createdBy')}</p>
        <p className="text-lg font-semibold text-gray-900">Taveyo SARL</p>
      </div>

      {/* Policy links */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to="/privacy"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Shield size={18} />
          {t('about.privacyPolicy')}
        </Link>
        <Link
          to="/terms"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FileText size={18} />
          {t('about.termsOfService')}
        </Link>
      </div>
    </div>
  )
}
