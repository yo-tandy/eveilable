import { useTranslation } from 'react-i18next'
import { LanguageSelector } from '../games/comprehension/LanguageSelector'
import type { LucideIcon } from 'lucide-react'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../../types/user'

interface LanguageGameIntroProps {
  gameKey: string
  icon: LucideIcon
  /** Kept for call-site compatibility; colour now comes from the category. */
  color?: string
  error?: string | null
  onSelect: (language: SupportedLanguage, level: LanguageLevel, subLevel: LanguageSubLevel) => void
}

export function LanguageGameIntro({ gameKey, icon: Icon, error, onSelect }: LanguageGameIntroProps) {
  const { t } = useTranslation()

  return (
    <div className="max-w-lg mx-auto py-4">
      <div className="text-center mb-6">
        <div className="art art-language w-20 h-20 mx-auto mb-4 -rotate-3">
          <Icon size={40} strokeWidth={2.4} aria-hidden="true" />
        </div>
        <h2 className="display text-[34px] leading-tight mb-2">{t(`games.${gameKey}.name`)}</h2>
        <p className="text-ink-2 font-bold">{t(`games.${gameKey}.description`)}</p>
      </div>

      <ol className="sticker-flat p-5 text-[15px] text-ink-2 font-bold mb-8 text-left space-y-2 list-decimal list-inside marker:text-coral marker:font-black">
        <li>{t(`games.${gameKey}.instructions1`)}</li>
        <li>{t(`games.${gameKey}.instructions2`)}</li>
        <li>{t(`games.${gameKey}.instructions3`)}</li>
      </ol>

      {error && (
        <div className="mb-4 alert-error" role="alert">
          {error}
        </div>
      )}

      <LanguageSelector onSelect={onSelect} />
    </div>
  )
}
