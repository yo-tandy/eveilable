import { CheckCircle, XCircle } from 'lucide-react'
import type { Trial } from '../../../types/game'

interface FeedbackDisplayProps {
  trial: Trial
}

export function FeedbackDisplay({ trial }: FeedbackDisplayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}>
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
