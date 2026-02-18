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
    <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}>
      <div className="text-center p-8 max-w-sm">
        <h2 className="text-2xl font-bold mb-2">Checkpoint</h2>
        <p className="text-gray-500 mb-6">
          {trialCount} trials completed &middot; {Math.round(accuracy * 100)}% accuracy
        </p>
        <div className="flex gap-3">
          <button
            onClick={onEnd}
            className="flex-1 py-3 glass rounded-xl font-medium hover:bg-white/50 transition-all"
          >
            {t('common.endSession')}
          </button>
          <button
            onClick={onContinue}
            className="flex-1 py-3 bg-black/75 backdrop-blur-sm text-white rounded-xl font-semibold hover:scale-[1.02] transition-transform"
          >
            {t('common.continue')}
          </button>
        </div>
      </div>
    </div>
  )
}
