import { CheckCircle, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Trial } from '../../../types/game'

interface FeedbackDisplayProps {
  trial: Trial
}

export function FeedbackDisplay({ trial }: FeedbackDisplayProps) {
  const { t } = useTranslation()
  const hasSplitFeedback = trial.centralCorrect !== undefined || trial.peripheralCorrect !== undefined

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}>
      <div className="text-center">
        {trial.correct ? (
          <CheckCircle size={64} className="mx-auto text-correct mb-2" />
        ) : (
          <XCircle size={64} className="mx-auto text-incorrect mb-2" />
        )}
        <p className="text-lg font-medium">
          {trial.correct ? t('feedback.correct') : t('feedback.incorrect')}
        </p>

        {hasSplitFeedback && (
          <div className="mt-3 flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600">{t('feedback.central')}</span>
              {trial.centralCorrect ? (
                <CheckCircle size={16} className="text-correct" />
              ) : (
                <XCircle size={16} className="text-incorrect" />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600">{t('feedback.peripheral')}</span>
              {trial.peripheralCorrect ? (
                <CheckCircle size={16} className="text-correct" />
              ) : (
                <XCircle size={16} className="text-incorrect" />
              )}
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500 mt-2">
          {Math.round(trial.responseTimeMs)}ms
        </p>
      </div>
    </div>
  )
}
