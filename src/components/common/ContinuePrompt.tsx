import { useTranslation } from 'react-i18next'

interface ContinuePromptProps {
  trialCount: number
  accuracy: number
  onContinue: () => void
  onEnd: () => void
}

export function ContinuePrompt({ trialCount, accuracy, onContinue, onEnd }: ContinuePromptProps) {
  const { t } = useTranslation()

  return (
    <div className="overlay">
      <div className="sticker pop-in text-center p-7 max-w-sm mx-4">
        <span className="tag tag-sun mb-3">{t('common.checkpoint')}</span>
        <div className="flex justify-center gap-3 my-4">
          <div className="sticker-sm px-4 py-2">
            <div className="display text-3xl leading-none">{trialCount}</div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-ink-2 mt-1">{t('stats.trials')}</div>
          </div>
          <div className="sticker-sm px-4 py-2">
            <div className="display text-3xl leading-none">{Math.round(accuracy * 100)}%</div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-ink-2 mt-1">{t('stats.accuracy')}</div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onEnd} className="flex-1 btn btn-ghost" type="button">
            {t('common.endSession')}
          </button>
          <button onClick={onContinue} className="flex-1 btn btn-sun" type="button">
            {t('common.continue')}
          </button>
        </div>
      </div>
    </div>
  )
}
