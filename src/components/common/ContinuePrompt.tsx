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
    <div className="absolute inset-0 flex items-center justify-center bg-white/95 z-10">
      <div className="text-center p-8 max-w-sm">
        <h2 className="text-2xl font-bold mb-2">Checkpoint</h2>
        <p className="text-gray-500 mb-6">
          {trialCount} trials completed &middot; {Math.round(accuracy * 100)}% accuracy
        </p>
        <div className="flex gap-3">
          <button
            onClick={onEnd}
            className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            {t('common.endSession')}
          </button>
          <button
            onClick={onContinue}
            className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
          >
            {t('common.continue')}
          </button>
        </div>
      </div>
    </div>
  )
}
