import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Eye, Car, BookOpen, ArrowRight } from 'lucide-react'

const GAMES = [
  {
    id: 'divided-attention',
    key: 'dividedAttention',
    icon: Eye,
    color: 'text-blue-600 bg-blue-50 border-blue-200 hover:border-blue-400',
  },
  {
    id: 'double-decision',
    key: 'doubleDecision',
    icon: Car,
    color: 'text-orange-600 bg-orange-50 border-orange-200 hover:border-orange-400',
  },
  {
    id: 'comprehension',
    key: 'comprehension',
    icon: BookOpen,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:border-emerald-400',
  },
] as const

export function GameSelectPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('games.selectGame')}</h1>

      <div className="space-y-4">
        {GAMES.map(({ id, key, icon: Icon, color }) => (
          <Link
            key={id}
            to={`/games/${id}`}
            className={`block p-6 rounded-2xl border-2 transition-colors ${color}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${color.split(' ').slice(0, 2).join(' ')}`}>
                  <Icon size={28} />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-900">
                    {t(`games.${key}.name`)}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t(`games.${key}.description`)}
                  </p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-400 flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
