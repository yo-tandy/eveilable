import { useTranslation } from 'react-i18next'
import { LanguageSelector } from '../games/comprehension/LanguageSelector'
import type { LucideIcon } from 'lucide-react'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../../types/user'

interface LanguageGameIntroProps {
  gameKey: string
  icon: LucideIcon
  color: string
  error?: string | null
  onSelect: (language: SupportedLanguage, level: LanguageLevel, subLevel: LanguageSubLevel) => void
}

const COLOR_MAP: Record<string, string> = {
  emerald: 'text-emerald-600',
  purple: 'text-purple-600',
  rose: 'text-rose-600',
  amber: 'text-amber-600',
  cyan: 'text-cyan-600',
  sky: 'text-sky-600',
}

export function LanguageGameIntro({ gameKey, icon: Icon, color, error, onSelect }: LanguageGameIntroProps) {
  const { t } = useTranslation()
  const iconColor = COLOR_MAP[color] ?? 'text-indigo-600'

  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="text-center">
        <Icon size={48} className={`mx-auto ${iconColor} mb-4`} />
        <h2 className="text-2xl font-bold mb-2">{t(`games.${gameKey}.name`)}</h2>
        <p className="text-gray-500 mb-6">{t(`games.${gameKey}.description`)}</p>
      </div>

      <div className="glass rounded-xl p-4 text-sm text-gray-600 mb-8 text-left space-y-2">
        <p>{t(`games.${gameKey}.instructions1`)}</p>
        <p>{t(`games.${gameKey}.instructions2`)}</p>
        <p>{t(`games.${gameKey}.instructions3`)}</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      <LanguageSelector onSelect={onSelect} />
    </div>
  )
}
