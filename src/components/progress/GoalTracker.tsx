import { TrendingUp, Target, ShieldCheck } from 'lucide-react'
import type { AggregateStats } from '../../types/user'

interface GoalTrackerProps {
  stats: AggregateStats
}

export function GoalTracker({ stats }: GoalTrackerProps) {
  const { recentTrend, currentDifficultyLevel, lifetimeAccuracy } = stats

  let icon: React.ReactNode
  let message: string
  let color: string

  if (recentTrend === 'improving') {
    icon = <TrendingUp size={24} />
    color = 'bg-green-50 text-green-700 border-green-200'
    message = `You're on a roll! Try to maintain >${Math.round(lifetimeAccuracy * 100)}% accuracy at Level ${currentDifficultyLevel}.`
  } else if (recentTrend === 'declining') {
    icon = <ShieldCheck size={24} />
    color = 'bg-amber-50 text-amber-700 border-amber-200'
    message = `Focus on accuracy today. Try 20 trials at Level ${Math.max(1, currentDifficultyLevel - 2)} to rebuild confidence.`
  } else {
    icon = <Target size={24} />
    color = 'bg-blue-50 text-blue-700 border-blue-200'
    message = `Solid performance! Try pushing to Level ${Math.min(20, currentDifficultyLevel + 1)} today.`
  }

  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${color}`}>
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <div className="font-bold text-sm mb-1">Today's Goal</div>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  )
}
