import { useTranslation } from 'react-i18next'
import { BookOpen, Timer } from 'lucide-react'

interface ModeSelectorProps {
  onSelect: (mode: 'complete' | 'race') => void
  error: string | null
}

export function ModeSelector({ onSelect, error }: ModeSelectorProps) {
  const { t } = useTranslation()

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="display text-[30px] mb-6 text-center">{t('common.chooseMode')}</h2>

      {error && (
        <div className="mb-4 alert-error" role="alert">
          {error}. {t('common.tapToRetry')}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5">
        <button
          type="button"
          onClick={() => onSelect('complete')}
          className="sticker sticker-lift tilt-a p-6 text-left flex gap-5 items-center"
        >
          <div className="art art-language w-16 h-16 shrink-0">
            <BookOpen size={30} strokeWidth={2.4} aria-hidden="true" />
          </div>
          <div>
            <h3 className="display text-2xl">{t('common.modeComplete')}</h3>
            <p className="text-ink-2 font-bold text-sm mt-1">{t('common.modeCompleteDesc')}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect('race')}
          className="sticker sticker-lift tilt-b p-6 text-left flex gap-5 items-center"
        >
          <div className="art art-attention w-16 h-16 shrink-0">
            <Timer size={30} strokeWidth={2.4} aria-hidden="true" />
          </div>
          <div>
            <h3 className="display text-2xl">{t('common.modeRace')}</h3>
            <p className="text-ink-2 font-bold text-sm mt-1">{t('common.modeRaceDesc')}</p>
          </div>
        </button>
      </div>
    </div>
  )
}
