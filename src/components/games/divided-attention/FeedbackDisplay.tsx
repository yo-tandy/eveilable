import { CheckCircle, XCircle } from 'lucide-react'
import type { Trial } from '../../../types/game'

interface FeedbackDisplayProps {
  trial: Trial
}

export function FeedbackDisplay({ trial }: FeedbackDisplayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
      <div className="text-center">
        {trial.correct ? (
          <CheckCircle size={64} className="mx-auto text-correct mb-2" />
        ) : (
          <XCircle size={64} className="mx-auto text-incorrect mb-2" />
        )}
        <p className="text-lg font-medium">
          {trial.correct ? 'Correct!' : 'Incorrect'}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {Math.round(trial.responseTimeMs)}ms
        </p>
      </div>
    </div>
  )
}
