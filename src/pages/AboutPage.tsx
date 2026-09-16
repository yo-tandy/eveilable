import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Shield, FileText } from 'lucide-react'
import { CATEGORIES, getGamesByCategory, getCategory } from '../config/games'
import { PuzzleSection } from '../components/common/PuzzleSection'
import { SectionHeader } from '../components/common/SectionHeader'
import { Mascot } from '../components/common/Mascot'

export function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="sticker p-8 sm:p-10 text-center mb-12 relative overflow-hidden">
        <Mascot className="w-24 mx-auto mb-3" animate={false} />
        <h1 className="display text-[38px] leading-tight mb-3">
          {t('about.title')}
        </h1>
        <p className="text-lg font-bold text-ink-2 max-w-xl mx-auto">
          {t('about.description')}
        </p>
      </div>

      {/* Games */}
      <div className="mb-10">
        <h2 className="display text-[30px] mb-6">
          {t('about.ourGames')}
        </h2>

        {CATEGORIES.map((category) => {
          const games = getGamesByCategory(category.key)
          const cat = getCategory(category.key)
          return (
            <div key={category.key} className="mb-8">
              <SectionHeader category={category} as="h3" size="md" />
              <div className="flex flex-col gap-3">
                {games.map((game) => {
                  const Icon = game.icon
                  return (
                    <div key={game.id} className="sticker-flat p-4 flex items-center gap-4">
                      <div className={`art ${cat.art} w-14 h-14 shrink-0`}>
                        <Icon size={26} strokeWidth={2.4} aria-hidden="true" />
                      </div>
                      <div>
                        <h4 className="display text-lg">{t(`games.${game.key}.name`)}</h4>
                        <p className="text-sm text-ink-2">{t(`games.${game.key}.description`)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        <PuzzleSection variant="static" className="mb-6" />
      </div>

      {/* Features */}
      <div className="mb-10">
        <h2 className="display text-[30px] mb-4">
          {t('about.features')}
        </h2>
        <ul className="space-y-2 text-ink-2 font-bold">
          {['feature1', 'feature2', 'feature3', 'feature4'].map((k) => (
            <li key={k} className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-coral border-2 border-ink shrink-0" aria-hidden="true" />
              {t(`about.${k}`)}
            </li>
          ))}
        </ul>
      </div>

      {/* Company */}
      <div className="mb-10 sticker-flat p-6 text-center">
        <p className="text-ink-2 font-bold mb-1">{t('about.createdBy')}</p>
        <p className="display text-2xl">Taveyo SARL</p>
      </div>

      {/* Policy links */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link to="/privacy" className="btn btn-ghost">
          <Shield size={18} aria-hidden="true" />
          {t('about.privacyPolicy')}
        </Link>
        <Link to="/terms" className="btn btn-ghost">
          <FileText size={18} aria-hidden="true" />
          {t('about.termsOfService')}
        </Link>
      </div>
    </div>
  )
}
